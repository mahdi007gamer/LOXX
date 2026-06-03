import { useEffect, useRef, useState } from 'react';
import { voiceSocket, getSharedAudioContext } from '../lib/socket';

// Ultra-stable real-time audio jitter buffer & linear resampler
class SmoothAudioPlayer {
  private queue: Float32Array = new Float32Array(0);
  private isBuffering: boolean = true;

  public push(data: Float32Array) {
    const MAX_QUEUE_SAMPLES = 800; // ~50ms buffer ceiling for ultra-low latency response
    if (this.queue.length > MAX_QUEUE_SAMPLES) {
      // Trim to 160 samples (~10ms) to securely catch up instantly and maintain 0 delay
      this.queue = this.queue.slice(this.queue.length - 160);
      this.isBuffering = false; 
    }

    const nextQueue = new Float32Array(this.queue.length + data.length);
    nextQueue.set(this.queue, 0);
    nextQueue.set(data, this.queue.length);
    this.queue = nextQueue;

    // Accumulate at least 120 samples (~7.5ms) before playing to cushion network jitter
    if (this.isBuffering && this.queue.length >= 120) {
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

export const useWebRTC = (
  roomId: string | null,
  localStream: MediaStream | null,
  userId: string | undefined,
  screenStream: MediaStream | null = null
) => {
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
      
      // Use 512 buffer size for stable playback processing while maintaining ultra-low latency
      const node = audioContext.createScriptProcessor(512, 0, 1);
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

  // --- WebRTC Screensharing Mesh Pipeline ---
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const candidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    if (!roomId || !userId) return;

    // Get the video track if any is present in screenStream
    const videoTrack = screenStream ? screenStream.getVideoTracks()[0] : null;

    const closePC = (peerId: string) => {
      const pc = pcsRef.current.get(peerId);
      if (pc) {
        try {
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.onconnectionstatechange = null;
          pc.close();
        } catch (e) {}
        pcsRef.current.delete(peerId);
      }
      candidateQueuesRef.current.delete(peerId);
    };

    const flushCandidates = async (peerId: string, pc: RTCPeerConnection) => {
      const queue = candidateQueuesRef.current.get(peerId);
      if (queue && queue.length > 0) {
        console.log(`[WebRTC Screenshare] Flushing ${queue.length} queued ICE candidates for peer ${peerId}`);
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn(`[WebRTC Screenshare] Failed to add queued ICE candidate for peer ${peerId}:`, e);
          }
        }
        candidateQueuesRef.current.delete(peerId);
      }
    };

    const getOrCreatePC = (peerId: string) => {
      if (pcsRef.current.has(peerId)) {
        return pcsRef.current.get(peerId)!;
      }

      console.log(`[WebRTC Screenshare] Creating RTCPeerConnection for peer ${peerId}`);
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.iranserver.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.sipgate.net:3478" },
          { urls: "stun:stun.voipbuster.com:3478" },
          { urls: "stun:stun.turnserver.cl:3478" }
        ]
      });

      // Handle ice candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          voiceSocket.emit("voice.signal", {
            targetUserId: peerId,
            signal: { type: "candidate", candidate: event.candidate }
          });
        }
      };

      // Handle remote video tracks
      pc.ontrack = (event) => {
        if (event.track.kind === "video") {
          console.log(`[WebRTC Screenshare] Received remote video track from ${peerId}`);
          setRemoteStreams((prev) => {
            const nextMap = new Map<string, MediaStream>(prev);
            let stream = nextMap.get(peerId) as MediaStream | undefined;
            if (!stream) {
              stream = new MediaStream();
            }
            // Remove any existing video track and add the new one
            stream.getVideoTracks().forEach(t => stream.removeTrack(t));
            stream.addTrack(event.track);

            // Re-create MediaStream container to force re-render in react
            nextMap.set(peerId, new MediaStream(stream.getTracks()));
            return nextMap;
          });

          event.track.onended = () => {
            console.log(`[WebRTC Screenshare] Remote track ended for ${peerId}`);
            setRemoteStreams((prev) => {
              const nextMap = new Map<string, MediaStream>(prev);
              const stream = nextMap.get(peerId) as MediaStream | undefined;
              if (stream) {
                stream.getVideoTracks().forEach(t => stream.removeTrack(t));
                nextMap.set(peerId, new MediaStream(stream.getTracks()));
              }
              return nextMap;
            });
          };
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Screenshare] Connection state with ${peerId}: ${pc.connectionState}`);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          closePC(peerId);
        }
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    };

    // If we are sharing screen, we must attach our video track to peer connections
    const addMyVideoTrack = async (peerId: string) => {
      if (!videoTrack) return;
      try {
        const pc = getOrCreatePC(peerId);
        
        // Remove existing video sender to avoid duplicates
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        } else {
          pc.addTrack(videoTrack, screenStream!);
        }

        console.log(`[WebRTC Screenshare] Added video track for ${peerId}, initiating offer`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        voiceSocket.emit("voice.signal", {
          targetUserId: peerId,
          signal: { type: "offer", offer }
        });
      } catch (err) {
        console.error(`[WebRTC Screenshare] Error sending offer to ${peerId}:`, err);
      }
    };

    // If we are sharing, broadcast to all existing users or when someone joins
    if (videoTrack) {
      // Find all remote players and initiate offer sharing
      remotePlayersRef.current.forEach((_, otherId) => {
        addMyVideoTrack(otherId);
      });
    }

    // Handle incoming webrtc signaling
    const handleVoiceSignal = async (data: { fromUserId: string; signal: any }) => {
      const { fromUserId, signal } = data;
      if (fromUserId === userId) return;

      try {
        if (signal.type === "offer") {
          console.log(`[WebRTC Screenshare] Received offer from ${fromUserId}`);
          const pc = getOrCreatePC(fromUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          await flushCandidates(fromUserId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          voiceSocket.emit("voice.signal", {
            targetUserId: fromUserId,
            signal: { type: "answer", answer }
          });
        } 
        else if (signal.type === "answer") {
          console.log(`[WebRTC Screenshare] Received answer from ${fromUserId}`);
          const pc = pcsRef.current.get(fromUserId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            await flushCandidates(fromUserId, pc);
          }
        } 
        else if (signal.type === "candidate") {
          const pc = pcsRef.current.get(fromUserId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn(`[WebRTC Screenshare] Error adding ICE candidate directly:`, e);
            }
          } else {
            // Queue candidate until PC is ready and setRemoteDescription completes
            let q = candidateQueuesRef.current.get(fromUserId);
            if (!q) {
              q = [];
              candidateQueuesRef.current.set(fromUserId, q);
            }
            q.push(signal.candidate);
          }
        }
        else if (signal.type === "stop-share") {
          console.log(`[WebRTC Screenshare] Received stop-share signal from ${fromUserId}`);
          setRemoteStreams((prev) => {
            const nextMap = new Map<string, MediaStream>(prev);
            const stream = nextMap.get(fromUserId) as MediaStream | undefined;
            if (stream) {
              stream.getVideoTracks().forEach(t => stream.removeTrack(t));
              nextMap.set(fromUserId, new MediaStream(stream.getTracks()));
            }
            return nextMap;
          });
          closePC(fromUserId);
        }
      } catch (err) {
        console.error(`[WebRTC Screenshare] Error handling signal from ${fromUserId}:`, err);
      }
    };

    const handleUserJoinedMesh = ({ userId: otherId }: { userId: string }) => {
      if (otherId === userId) return;
      if (videoTrack) {
        // We are sharing and a new user joined, send them our screenshare
        setTimeout(() => {
          addMyVideoTrack(otherId);
        }, 800); // Give socket room a tiny moment to settle
      }
    };

    const handleUserLeftMesh = ({ userId: otherId }: { userId: string }) => {
      closePC(otherId);
    };

    voiceSocket.on("voice.signal", handleVoiceSignal);
    voiceSocket.on("voice.user_joined", handleUserJoinedMesh);
    voiceSocket.on("voice.user_left", handleUserLeftMesh);

    // If we stop sharing, send a stop-share signal to everyone
    return () => {
      voiceSocket.off("voice.signal", handleVoiceSignal);
      voiceSocket.off("voice.user_joined", handleUserJoinedMesh);
      voiceSocket.off("voice.user_left", handleUserLeftMesh);

      if (videoTrack) {
        remotePlayersRef.current.forEach((_, otherId) => {
          voiceSocket.emit("voice.signal", {
            targetUserId: otherId,
            signal: { type: "stop-share" }
          });
        });
      }

      pcsRef.current.forEach((_, otherId) => {
        closePC(otherId);
      });
    };
  }, [roomId, userId, screenStream]);

  return { remoteStreams };
};
