import { useEffect, useRef, useState } from 'react';
import { voiceSocket, getSharedAudioContext } from '../lib/socket';

// Ultra-stable real-time audio jitter buffer & linear resampler
class SmoothAudioPlayer {
  private queue: Float32Array = new Float32Array(0);
  private isBuffering: boolean = true;

  public push(data: Float32Array) {
    const MAX_QUEUE_SAMPLES = 800; // ~50ms buffer limit to instantly catch up
    if (this.queue.length > MAX_QUEUE_SAMPLES) {
      // Trim to the latest 160 samples (~10ms) to catch up instantly
      this.queue = this.queue.slice(this.queue.length - 160);
      this.isBuffering = false; 
    }

    const nextQueue = new Float32Array(this.queue.length + data.length);
    nextQueue.set(this.queue, 0);
    nextQueue.set(data, this.queue.length);
    this.queue = nextQueue;

    // If we were buffering and accumulated at least 240 samples (~15ms), resume play
    if (this.isBuffering && this.queue.length >= 240) {
      this.isBuffering = false;
    }
  }

  public consume(out: Float32Array, outSampleRate: number, inSampleRate: number) {
    if (this.isBuffering) {
      out.fill(0);
      return;
    }

    const ratio = inSampleRate / outSampleRate;
    const neededInSamples = out.length * ratio;

    // Underflow: If the queue was drained, trigger buffering and play silence
    if (this.queue.length < neededInSamples) {
      this.isBuffering = true;
      out.fill(0);
      return;
    }

    // High performance linear-interpolation resampler
    for (let i = 0; i < out.length; i++) {
      const srcIdx = i * ratio;
      const idx1 = Math.floor(srcIdx);
      const idx2 = Math.min(this.queue.length - 1, idx1 + 1);
      const t = srcIdx - idx1;
      const s1 = this.queue[idx1];
      const s2 = this.queue[idx2];
      out[i] = s1 + t * (s2 - s1);
    }

    // Cleanly advance slice queue
    const consumedCount = Math.floor(neededInSamples);
    this.queue = this.queue.slice(consumedCount);
  }

  public clear() {
    this.queue = new Float32Array(0);
    this.isBuffering = true;
  }
}

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Audio nodes and references for capture
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const remotePlayersRef = useRef<Map<string, { 
    dest: MediaStreamAudioDestinationNode; 
    player: SmoothAudioPlayer; 
    node: ScriptProcessorNode;
    silentGainNode: GainNode;
  }>>(new Map());

  // Handle local microphone capture & compression
  useEffect(() => {
    if (!roomId || !userId || !localStream) {
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      return;
    }

    localStreamRef.current = localStream;

    let audioContext: AudioContext;
    try {
      audioContext = getSharedAudioContext();
      if (!audioContext) return;
    } catch (e) {
      console.error("WebSocket SFU: Could not retrieve shared AudioContext", e);
      return;
    }

    try {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
      }
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
      }

      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      sourceNodeRef.current = audioContext.createMediaStreamSource(localStream);
      
      // Use standard 512 buffer size for ultra low-latency capture (~11ms delay)
      processorNodeRef.current = audioContext.createScriptProcessor(512, 1, 1);

      sourceNodeRef.current.connect(processorNodeRef.current);
      
      // Silent destination route to maintain execution in modern desktop frames
      const silentGainNode = audioContext.createGain();
      silentGainNode.gain.value = 0;
      processorNodeRef.current.connect(silentGainNode);
      silentGainNode.connect(audioContext.destination);

      // Ultra-efficient single-pass downsampler + Int16 compressor (takes < 0.1ms to prevent frame lag)
      const downsampleAndToInt16 = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) => {
        const ratio = inputSampleRate / outputSampleRate;
        const newLength = Math.floor(buffer.length / ratio);
        const result = new Int16Array(newLength);
        for (let i = 0; i < newLength; i++) {
          const sample = buffer[Math.floor(i * ratio)];
          const s = Math.max(-1, Math.min(1, sample));
          result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return result.buffer;
      };

      processorNodeRef.current.onaudioprocess = (event) => {
        const tracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : [];
        if (tracks.length > 0 && tracks[0].enabled) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Downsample and Compress in a single contiguous step (Native 16kHz)
          const compressedPCM = downsampleAndToInt16(inputData, event.inputBuffer.sampleRate, 16000);
          
          // Broadcast to Lobby server securely
          voiceSocket.emit("voice.audio_chunk", {
            roomId: roomId,
            chunk: compressedPCM
          });
        }
      };

      console.log("WebSocket SFU: Local low-latency mic capture active.");
    } catch (err) {
      console.error("WebSocket SFU: Local flow capture error", err);
    }

    return () => {
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
    };
  }, [roomId, userId, localStream]);

  // Handle incoming voice subscriber chunks with low-latency resampler queue
  useEffect(() => {
    if (!roomId || !userId) return;

    let audioContext: AudioContext;
    try {
      audioContext = getSharedAudioContext();
    } catch (e) {
      console.error("WebSocket SFU: Receiver context error:", e);
      return;
    }

    // Convert high-efficiency 16-bit PCM back to Float32 sample blocks
    const int16ToFloat32 = (buffer: ArrayBuffer) => {
      const src = new Int16Array(buffer);
      const dest = new Float32Array(src.length);
      for (let i = 0; i < src.length; i++) {
        dest[i] = src[i] < 0 ? src[i] / 0x8000 : src[i] / 0x7FFF;
      }
      return dest;
    };

    const getOrCreateRemotePlayer = (targetId: string) => {
      if (remotePlayersRef.current.has(targetId)) {
        return remotePlayersRef.current.get(targetId)!;
      }

      console.log(`WebSocket SFU: Generating dynamic low-latency output for peer ${targetId}`);
      const dest = audioContext.createMediaStreamDestination();
      const player = new SmoothAudioPlayer();
      
      // Use 256 buffer size for fast playback processing (~16ms latency at 16kHz)
      const node = audioContext.createScriptProcessor(256, 0, 1);
      node.onaudioprocess = (e) => {
        const channel = e.outputBuffer.getChannelData(0);
        player.consume(channel, e.outputBuffer.sampleRate, 16000);
      };
      
      node.connect(dest);
      
      // Connect to silent output purely to keep Audio graph pump running in the background tab/windows
      const silentGainNode = audioContext.createGain();
      silentGainNode.gain.value = 0;
      node.connect(silentGainNode);
      silentGainNode.connect(audioContext.destination);

      const entry = { dest, player, node, silentGainNode };
      remotePlayersRef.current.set(targetId, entry);

      setRemoteStreams((prev) => {
        const nextMap = new Map(prev);
        nextMap.set(targetId, dest.stream);
        return nextMap;
      });

      return entry;
    };

    const destroyRemotePlayer = (targetId: string) => {
      const entry = remotePlayersRef.current.get(targetId);
      if (entry) {
        try { entry.node.disconnect(); } catch (e) {}
        try { entry.silentGainNode.disconnect(); } catch (e) {}
        remotePlayersRef.current.delete(targetId);
      }
      setRemoteStreams((prev) => {
        const nextMap = new Map(prev);
        nextMap.delete(targetId);
        return nextMap;
      });
    };

    const handleJoinResponse = (response?: { users: string[] }) => {
      if (response && response.users) {
        response.users.forEach((otherId) => {
          if (otherId !== userId) {
            getOrCreateRemotePlayer(otherId);
          }
        });
      }
    };

    voiceSocket.emit('voice.join', { roomId }, (resp?: any) => {
      handleJoinResponse(resp);
    });

    const handleExistingUsers = ({ users }: { users: string[] }) => {
      users.forEach((otherId) => {
        if (otherId !== userId) {
          getOrCreateRemotePlayer(otherId);
        }
      });
    };

    const handleUserJoined = ({ userId: otherId }: { userId: string }) => {
      if (otherId !== userId) {
        getOrCreateRemotePlayer(otherId);
      }
    };

    const handleUserLeft = ({ userId: otherId }: { userId: string }) => {
      console.log(`WebSocket SFU: Cleaning up memory of removed user ${otherId}`);
      destroyRemotePlayer(otherId);
    };

    const handleAudioChunk = ({ userId: senderId, chunk }: { userId: string, chunk: ArrayBuffer }) => {
      if (senderId === userId) return;

      try {
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }

        const playerEntry = getOrCreateRemotePlayer(senderId);
        const floatData = int16ToFloat32(chunk);
        
        // Push incoming samples straight into the smooth resampler queue
        playerEntry.player.push(floatData);
      } catch (err) {
        console.error("WebSocket SFU: Playback ingestion error", err);
      }
    };

    voiceSocket.on('voice.user_joined', handleUserJoined);
    voiceSocket.on('voice.existing_users', handleExistingUsers);
    voiceSocket.on('voice.user_left', handleUserLeft);
    voiceSocket.on('voice.audio_chunk', handleAudioChunk);

    return () => {
      voiceSocket.emit('voice.leave', { roomId });
      voiceSocket.off('voice.user_joined', handleUserJoined);
      voiceSocket.off('voice.existing_users', handleExistingUsers);
      voiceSocket.off('voice.user_left', handleUserLeft);
      voiceSocket.off('voice.audio_chunk', handleAudioChunk);

      // Total cleanup to release resources
      remotePlayersRef.current.forEach((entry, targetId) => {
        try { entry.node.disconnect(); } catch (e) {}
        try { entry.silentGainNode.disconnect(); } catch (e) {}
      });
      remotePlayersRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
