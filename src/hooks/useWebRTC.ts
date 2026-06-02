import { useEffect, useRef, useState } from 'react';
import { voiceSocket, getSharedAudioContext } from '../lib/socket';

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, userId: string | undefined) => {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // SFU states and instances
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const remotePlayersRef = useRef<Map<string, { dest: MediaStreamAudioDestinationNode; nextPlayTime: number }>>(new Map());

  // Handle local microphone volume & capture
  useEffect(() => {
    if (!roomId || !userId || !localStream) {
      if (processorNodeRef.current) {
        try {
          processorNodeRef.current.disconnect();
        } catch (e) {}
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
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

    // Create stream source & script processor for recording
    try {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
      }
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
      }

      // Ensure that there is an active audio track
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      sourceNodeRef.current = audioContext.createMediaStreamSource(localStream);
      
      // Use standard 4096 buffer size for maximum stability across mobile and desktop browsers
      processorNodeRef.current = audioContext.createScriptProcessor(4096, 1, 1);

      sourceNodeRef.current.connect(processorNodeRef.current);
      
      // Connect to destination purely to run the audio context pump loop
      // We keep absolute silence to prevent user hearing their own voice in their headset (local loopback)
      const silentGainNode = audioContext.createGain();
      silentGainNode.gain.value = 0;
      processorNodeRef.current.connect(silentGainNode);
      silentGainNode.connect(audioContext.destination);

      // Downsampling logic from source sample rate to 16000Hz (perfect voice bandwidth)
      const downsampleBuffer = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) => {
        if (outputSampleRate === inputSampleRate) return new Float32Array(buffer);
        const ratio = inputSampleRate / outputSampleRate;
        const newLength = Math.round(buffer.length / ratio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
          let accum = 0;
          let count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
          }
          result[offsetResult] = count > 0 ? accum / count : 0;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
        }
        return result;
      };

      // Convert Float32Array PCM values to high-efficiency compact Int16Array (16-bit PCM buffer)
      const float32ToInt16 = (buffer: Float32Array) => {
        const l = buffer.length;
        const buf = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          const s = Math.max(-1, Math.min(1, buffer[i]));
          buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buf.buffer;
      };

      processorNodeRef.current.onaudioprocess = (event) => {
        const tracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : [];
        if (tracks.length > 0 && tracks[0].enabled) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Downsample block to 16kHz
          const downsampled = downsampleBuffer(inputData, event.inputBuffer.sampleRate, 16000);
          
          // Compress block to 16-bit PCM integer buffers
          const compressedPCM = float32ToInt16(downsampled);
          
          // Stream block securely via WebSocket channel to the Lobby server
          voiceSocket.emit("voice.audio_chunk", {
            roomId: roomId,
            chunk: compressedPCM
          });
        }
      };

      console.log("WebSocket SFU: Local audio capture initialized successfully.");
    } catch (err) {
      console.error("WebSocket SFU: Error setting up microphone loop", err);
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

  // Handle incoming subscriber audio chunks in the lobby room
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

      console.log(`WebSocket SFU: Generating dynamic output stream destination for peer ${targetId}`);
      const dest = audioContext.createMediaStreamDestination();
      
      const player = {
        dest: dest,
        nextPlayTime: audioContext.currentTime
      };
      
      remotePlayersRef.current.set(targetId, player);
      
      setRemoteStreams((prev) => {
        const nextMap = new Map(prev);
        nextMap.set(targetId, dest.stream);
        return nextMap;
      });

      return player;
    };

    // Socket response sync
    const handleJoinResponse = (response?: { users: string[] }) => {
      if (response && response.users) {
        response.users.forEach((otherId) => {
          if (otherId !== userId) {
            getOrCreateRemotePlayer(otherId);
          }
        });
      }
    };

    // Initial Join Emit
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
      if (remotePlayersRef.current.has(otherId)) {
        remotePlayersRef.current.delete(otherId);
      }
      setRemoteStreams((prev) => {
        const nextMap = new Map(prev);
        nextMap.delete(otherId);
        return nextMap;
      });
    };

    const handleAudioChunk = ({ userId: senderId, chunk }: { userId: string, chunk: ArrayBuffer }) => {
      if (senderId === userId) return;

      try {
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }

        const player = getOrCreateRemotePlayer(senderId);
        const floatData = int16ToFloat32(chunk);
        
        // Schedule continuous audio playback safely
        const audioBuffer = audioContext.createBuffer(1, floatData.length, 16000);
        audioBuffer.getChannelData(0).set(floatData);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect buffer output node directly to user's remote stream destination
        source.connect(player.dest);

        const now = audioContext.currentTime;
        if (player.nextPlayTime < now) {
          player.nextPlayTime = now + 0.05; // 50ms safety buffer
        }

        source.start(player.nextPlayTime);
        player.nextPlayTime += audioBuffer.duration;
      } catch (err) {
        console.error("WebSocket SFU: Playback assembly error", err);
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

      // Reset players
      remotePlayersRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, userId]);

  return { remoteStreams };
};
