import { useEffect, useRef, useState } from 'react';
import { voiceSocket, mainPlatformVoiceSocket, getSharedAudioContext } from '../lib/socket';
import { Device } from 'mediasoup-client';

// Keep the stable custom PCM linear resampler & jitter buffer for the robust fallback pipeline.
class SmoothAudioPlayer {
  private queue: Float32Array = new Float32Array(0);
  private currentGain: number = 0;
  private isBuffering: boolean = true;
  private consecutiveUnderflows: number = 0;

  public push(data: Float32Array) {
    const MAX_QUEUE_SAMPLES = 1920; 
    if (this.queue.length > MAX_QUEUE_SAMPLES) {
      this.queue = this.queue.slice(this.queue.length - 320);
    }
    const nextQueue = new Float32Array(this.queue.length + data.length);
    nextQueue.set(this.queue, 0);
    nextQueue.set(data, this.queue.length);
    this.queue = nextQueue;
    this.consecutiveUnderflows = 0;
    if (this.isBuffering && this.queue.length >= 170) {
      this.isBuffering = false;
    }
  }

  public consume(out: Float32Array, outSampleRate: number, inSampleRate: number) {
    const ratio = inSampleRate / outSampleRate;
    const neededInSamples = out.length * ratio;
    if (this.queue.length < neededInSamples) {
      this.consecutiveUnderflows++;
      if (this.consecutiveUnderflows > 3) {
        this.isBuffering = true;
      }
      for (let i = 0; i < out.length; i++) {
        this.currentGain = Math.max(0, this.currentGain - 0.1);
        out[i] = 0;
      }
      return;
    }
    for (let i = 0; i < out.length; i++) {
      const srcIdx = i * ratio;
      const idx1 = Math.floor(srcIdx);
      const idx2 = Math.min(this.queue.length - 1, idx1 + 1);
      const t = srcIdx - idx1;
      const s1 = (idx1 >= 0 && idx1 < this.queue.length) ? this.queue[idx1] : 0;
      const s2 = (idx2 >= 0 && idx2 < this.queue.length) ? this.queue[idx2] : 0;
      const rawSample = s1 + t * (s2 - s1);
      if (this.currentGain < 1) {
        this.currentGain = Math.min(1.0, this.currentGain + 0.1);
      }
      out[i] = rawSample * this.currentGain;
    }
    const consumedCount = Math.floor(neededInSamples);
    this.queue = this.queue.slice(consumedCount);
  }

  public clear() {
    this.queue = new Float32Array(0);
    this.isBuffering = true;
    this.consecutiveUnderflows = 0;
    this.currentGain = 0;
  }
}

export const useWebRTC = (
  roomId: string | null,
  localStream: MediaStream | null,
  userId: string | undefined,
  screenStream: MediaStream | null = null
) => {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [voiceMethod, setVoiceMethod] = useState<'mediasoup' | 'fallback_pcm'>('mediasoup');

  // References for Mediasoup
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const audioProducerRef = useRef<any>(null);
  const videoProducerRef = useRef<any>(null);
  const consumersRef = useRef<Map<string, any>>(new Map()); // consumerId -> consumer
  const peerStreamsRef = useRef<Map<string, MediaStream>>(new Map()); // userId -> MediaStream

  // References for fallback PCM handler
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const fallbackPlayersRef = useRef<Map<string, { 
    dest: MediaStreamAudioDestinationNode; 
    player: SmoothAudioPlayer; 
    node: ScriptProcessorNode;
    silentGainNode: GainNode;
  }>>(new Map());

  // Helper: Int16 to Float32 conversion for fallback playback
  const int16ToFloat32 = (buffer: ArrayBuffer) => {
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] < 0 ? int16[i] / 0x8000 : int16[i] / 0x7FFF;
    }
    return float32;
  };

  // --------------------------------------------------
  // PART A: MAIN MEDIASOUP SFU PIPELINE
  // --------------------------------------------------
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'mediasoup') return;

    let active = true;

    const startMediasoupSFU = async () => {
      try {
        console.log(`[LOXX SFU Mediasoup] Initiating WebRTC Handshake with Dedicated VPS server...`);
        
        // Ensure voiceSocket is connected
        if (!voiceSocket.connected) {
          voiceSocket.connect();
        }

        // Wait a tiny moment for socket connection
        await new Promise<void>((resolve, reject) => {
          if (voiceSocket.connected) return resolve();
          let count = 0;
          const check = setInterval(() => {
            if (voiceSocket.connected) {
              clearInterval(check);
              resolve();
            } else if (++count > 40) { // 4 seconds timeout
              clearInterval(check);
              reject(new Error("Voice signaling socket timeout"));
            }
          }, 100);
        });

        // 1. Join room and get Router RTP capabilities
        voiceSocket.emit("join", { roomId, userId }, async (ack: any) => {
          if (!active) return;
          if (!ack || !ack.success) {
            console.warn(`[LOXX SFU Mediasoup] Failed to join mediasoup router room: ${ack?.error || "Unknown"}`);
            setVoiceMethod('fallback_pcm'); // Fallback immediately
            return;
          }

          try {
            // 2. Initialize Mediasoup Device
            const device = new Device();
            await device.load({ routerRtpCapabilities: ack.routerRtpCapabilities });
            deviceRef.current = device;
            console.log(`[LOXX SFU Mediasoup] Mediasoup Device loaded successfully inside client frame.`);

            // 3. Create Send Transport (if mic input present)
            if (localStream && localStream.getAudioTracks().length > 0) {
              await setupSendTransport(device);
            }

            // 4. Create Receive Transport
            await setupRecvTransport(device);

            // 5. Query active producers already inside the room
            voiceSocket.emit("getProducers", async (prodAck: any) => {
              if (prodAck && prodAck.success && prodAck.producers) {
                for (const prod of prodAck.producers) {
                  if (prod.userId !== userId) {
                    await consumeTrack(prod.producerId, prod.userId, prod.kind);
                  }
                }
              }
            });

          } catch (deviceError: any) {
            console.error(`[LOXX SFU Mediasoup] Device setup/handshake error:`, deviceError);
            setVoiceMethod('fallback_pcm');
          }
        });

      } catch (err) {
        console.warn(`[LOXX SFU Mediasoup] VPS Voice Connection failed. Triaging fallback...`, err);
        setVoiceMethod('fallback_pcm');
      }
    };

    // --- SETUP SEND TRANSPORT ---
    const setupSendTransport = async (device: Device) => {
      return new Promise<void>((resolve) => {
        voiceSocket.emit("createWebRtcTransport", { direction: "send" }, async (resp: any) => {
          if (!active) return resolve();
          if (!resp || !resp.success) {
            console.error("[LOXX SFU Mediasoup] Failed to create send transport:", resp?.error);
            return resolve();
          }

          try {
            const sendTransport = device.createSendTransport(resp.params);
            sendTransportRef.current = sendTransport;

            sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
              voiceSocket.emit("connectWebRtcTransport", { transportId: sendTransport.id, dtlsParameters }, (connectAck: any) => {
                if (connectAck && connectAck.success) callback();
                else errback(connectAck?.error || new Error("Connection failed"));
              });
            });

            sendTransport.on("produce", ({ kind, rtpParameters, appData }, callback, errback) => {
              voiceSocket.emit("produce", { transportId: sendTransport.id, kind, rtpParameters, appData }, (produceAck: any) => {
                if (produceAck && produceAck.success) {
                  callback({ id: produceAck.id });
                } else {
                  errback(produceAck?.error || new Error("Production failed"));
                }
              });
            });

            // Start producing microphone track immediately
            const audioTrack = localStream!.getAudioTracks()[0];
            if (audioTrack) {
              const audioProducer = await sendTransport.produce({ 
                track: audioTrack,
                appData: { userId }
              });
              audioProducerRef.current = audioProducer;
              console.log(`[LOXX SFU Mediasoup] Microphones produced stream over RTP [ID: ${audioProducer.id}]`);
            }
            resolve();
          } catch (err) {
            console.error("[LOXX SFU Mediasoup] Error building send transport producing track:", err);
            resolve();
          }
        });
      });
    };

    // --- SETUP RECV TRANSPORT ---
    const setupRecvTransport = async (device: Device) => {
      return new Promise<void>((resolve) => {
        voiceSocket.emit("createWebRtcTransport", { direction: "recv" }, async (resp: any) => {
          if (!active) return resolve();
          if (!resp || !resp.success) {
            console.error("[LOXX SFU Mediasoup] Failed to create recv transport:", resp?.error);
            return resolve();
          }

          try {
            const recvTransport = device.createRecvTransport(resp.params);
            recvTransportRef.current = recvTransport;

            recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
              voiceSocket.emit("connectWebRtcTransport", { transportId: recvTransport.id, dtlsParameters }, (connectAck: any) => {
                if (connectAck && connectAck.success) callback();
                else errback(connectAck?.error || new Error("Connection failed"));
              });
            });

            resolve();
          } catch (err) {
            console.error("[LOXX SFU Mediasoup] Error building receive transport:", err);
            resolve();
          }
        });
      });
    };

    // --- CONSUME TRACK ---
    const consumeTrack = async (producerId: string, peerUserId: string, kind: "audio" | "video") => {
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;
      if (!device || !recvTransport) return;

      voiceSocket.emit("consume", {
        rtpCapabilities: device.rtpCapabilities,
        producerId,
        transportId: recvTransport.id
      }, async (resp: any) => {
        if (!active) return;
        if (!resp || !resp.success) {
          console.warn(`[LOXX SFU Mediasoup] Failed to consume track from ${peerUserId}:`, resp?.error);
          return;
        }

        try {
          const consumer = await recvTransport.consume(resp.params);
          consumersRef.current.set(consumer.id, consumer);

          // Resume consumer playing state on server
          voiceSocket.emit("resumeConsumer", { consumerId: consumer.id });

          const newTrack = consumer.track;
          
          setRemoteStreams((prev) => {
            const nextMap = new Map<string, MediaStream>(prev);
            let userStream = nextMap.get(peerUserId) as MediaStream | undefined;
            if (!userStream) {
              userStream = new MediaStream();
            }

            if (kind === "audio") {
              userStream.getAudioTracks().forEach(t => userStream?.removeTrack(t));
              userStream.addTrack(newTrack);
              
              // Attach custom GainNode for client master-volume handling
              try {
                const audioCtx = getSharedAudioContext();
                const source = audioCtx.createMediaStreamSource(userStream);
                const gainNode = audioCtx.createGain();
                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                (userStream as any).gainNode = gainNode;
              } catch (e) {
                console.warn("[LOXX SFU Mediasoup] Direct AudioContext gain node routing not supported:", e);
              }
            } else {
              userStream.getVideoTracks().forEach(t => userStream?.removeTrack(t));
              userStream.addTrack(newTrack);
            }

            nextMap.set(peerUserId, new MediaStream(userStream.getTracks()));
            return nextMap;
          });

          // Watch consumer ending triggers
          consumer.on("transportclose", () => {
            closeSpecificConsumer(consumer.id, peerUserId, kind);
          });
          consumer.on("trackended", () => {
            closeSpecificConsumer(consumer.id, peerUserId, kind);
          });

          console.log(`[LOXX SFU Mediasoup] Subscribed successfully to peer ${peerUserId} track [${kind}]`);
        } catch (err) {
          console.error(`[LOXX SFU Mediasoup] Error consuming track internally:`, err);
        }
      });
    };

    const closeSpecificConsumer = (consumerId: string, peerUserId: string, kind: "audio" | "video") => {
      const consumer = consumersRef.current.get(consumerId);
      if (consumer) {
        try { consumer.close(); } catch (e) {}
        consumersRef.current.delete(consumerId);
      }

      setRemoteStreams((prev) => {
        const nextMap = new Map<string, MediaStream>(prev);
        const userStream = nextMap.get(peerUserId) as MediaStream | undefined;
        if (userStream) {
          if (kind === "audio") {
            userStream.getAudioTracks().forEach(t => userStream?.removeTrack(t));
          } else {
            userStream.getVideoTracks().forEach(t => userStream?.removeTrack(t));
          }
          if (userStream.getTracks().length === 0) {
            nextMap.delete(peerUserId);
          } else {
            nextMap.set(peerUserId, new MediaStream(userStream.getTracks()));
          }
        }
        return nextMap;
      });
    };

    // --- REALTIME EVENT LISTENERS FROM Dedicated VPS ---
    const handleNewProducer = async (data: { producerId: string; userId: string; kind: "audio" | "video"; appData?: any }) => {
      if (data.userId === userId) return;
      console.log(`[LOXX SFU Mediasoup] Remote peer started publishing: ${data.userId} kind: ${data.kind}`);
      await consumeTrack(data.producerId, data.userId, data.kind);
    };

    const handleProducerClosed = ({ producerId }: { producerId: string }) => {
      // Clean up local consumers subscribing to this producer
      consumersRef.current.forEach((consumer, consumerId) => {
        if (consumer.producerId === producerId) {
          // Identify associated peer
          let targetPeerUserId = "";
          remoteStreams.forEach((stream, peerId) => {
            // Find which peer possesses this stream
            targetPeerUserId = peerId;
          });
          closeSpecificConsumer(consumerId, targetPeerUserId, consumer.kind);
        }
      });
    };

    const handleConsumerClosed = ({ consumerId }: { consumerId: string }) => {
      let targetPeerUserId = "";
      remoteStreams.forEach((stream, peerId) => { targetPeerUserId = peerId; });
      closeSpecificConsumer(consumerId, targetPeerUserId, "audio");
    };

    voiceSocket.on("newProducer", handleNewProducer);
    voiceSocket.on("producerClosed", handleProducerClosed);
    voiceSocket.on("consumerClosed", handleConsumerClosed);

    startMediasoupSFU();

    return () => {
      active = false;
      
      voiceSocket.off("newProducer", handleNewProducer);
      voiceSocket.off("producerClosed", handleProducerClosed);
      voiceSocket.off("consumerClosed", handleConsumerClosed);

      // Tell signaling server we are leaving
      voiceSocket.emit("leave");

      // Tear down producers/transports
      try {
        if (audioProducerRef.current) {
          audioProducerRef.current.close();
          audioProducerRef.current = null;
        }
        if (videoProducerRef.current) {
          videoProducerRef.current.close();
          videoProducerRef.current = null;
        }
        consumersRef.current.forEach(c => c.close());
        consumersRef.current.clear();

        if (sendTransportRef.current) {
          sendTransportRef.current.close();
          sendTransportRef.current = null;
        }
        if (recvTransportRef.current) {
          recvTransportRef.current.close();
          recvTransportRef.current = null;
        }
      } catch (err) {}
      
      deviceRef.current = null;
      setRemoteStreams(new Map());
    };

  }, [roomId, userId, voiceMethod]);

  // Handle dynamic Screen sharing track publication via Mediasoup Send Transport
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'mediasoup' || !sendTransportRef.current) return;

    const screenVideoTrack = screenStream ? screenStream.getVideoTracks()[0] : null;

    const updateScreenShare = async () => {
      try {
        if (screenVideoTrack) {
          console.log("[LOXX SFU Mediasoup] Producing Local Screenshare track to Media Server...");
          
          // Close old screenshare if existing
          if (videoProducerRef.current) {
            try {
              voiceSocket.emit("closeProducer", { producerId: videoProducerRef.current.id });
              videoProducerRef.current.close();
            } catch (e) {}
          }

          const videoProducer = await sendTransportRef.current.produce({
            track: screenVideoTrack,
            appData: { type: "screen", userId }
          });
          videoProducerRef.current = videoProducer;

          // Listen if the screen share track ends mechanically
          screenVideoTrack.onended = () => {
            if (videoProducerRef.current) {
              voiceSocket.emit("closeProducer", { producerId: videoProducerRef.current.id });
              try { videoProducerRef.current.close(); } catch (e) {}
              videoProducerRef.current = null;
            }
          };

        } else {
          // Track removed or screenshare stopped
          if (videoProducerRef.current) {
            console.log("[LOXX SFU Mediasoup] Screenshare stopped. Releasing producer.");
            voiceSocket.emit("closeProducer", { producerId: videoProducerRef.current.id });
            try { videoProducerRef.current.close(); } catch(e) {}
            videoProducerRef.current = null;
          }
        }
      } catch (e) {
        console.error("[LOXX SFU Mediasoup] Failed producing Screenshare video track:", e);
      }
    };

    updateScreenShare();

  }, [screenStream, voiceMethod]);

  // --------------------------------------------------
  // PART B: SECURE PCM OVER WEBSOCKET FALLBACK SYSTEM
  // --------------------------------------------------
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'fallback_pcm') return;

    console.warn(`[LOXX VOICE PIPELINE] ⚠️ Mediasoup SFU unavailable or failed. Switching to reliable high stability PCM fallback over primary server!`);
    
    let audioContext: AudioContext;
    try {
      audioContext = getSharedAudioContext();
      if (!audioContext) return;
    } catch (e) {
      console.error("VoiP Fallback: AudioContext lookup error", e);
      return;
    }

    if (!mainPlatformVoiceSocket.connected) {
      mainPlatformVoiceSocket.connect();
    }

    // Capture Local Microphone Audio Chunks
    if (localStream && localStream.getAudioTracks().length > 0) {
      try {
        sourceNodeRef.current = audioContext.createMediaStreamSource(localStream);
        
        // 512 samples buffer for crisp low delay transmission
        processorNodeRef.current = audioContext.createScriptProcessor(512, 1, 1);
        sourceNodeRef.current.connect(processorNodeRef.current);

        const silentGainNode = audioContext.createGain();
        silentGainNode.gain.value = 0;
        processorNodeRef.current.connect(silentGainNode);
        silentGainNode.connect(audioContext.destination);

        const downsampleAndToInt16 = (buffer: Float32Array, inputSR: number, outputSR: number) => {
          const ratio = inputSR / outputSR;
          const newLength = Math.floor(buffer.length / ratio);
          const result = new Int16Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const start = Math.floor(i * ratio);
            const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
            let s = 0, count = 0;
            for (let j = start; j < end; j++) {
              if (j < buffer.length) { s += buffer[j]; count++; }
            }
            const sample = count > 0 ? s / count : 0;
            const capped = Math.max(-1, Math.min(1, sample));
            result[i] = capped < 0 ? capped * 0x8000 : capped * 0x7FFF;
          }
          return result.buffer;
        };

        const chunkBuffer: Int16Array[] = [];
        const CHUNK_ACC_COUNT = 2; // Pack bundles into ~20ms frames

        processorNodeRef.current.onaudioprocess = (event) => {
          const micEnabled = localStream.getAudioTracks()[0]?.enabled;
          if (micEnabled) {
            const inputData = event.inputBuffer.getChannelData(0);
            const compressed = downsampleAndToInt16(inputData, event.inputBuffer.sampleRate, 16000);
            chunkBuffer.push(new Int16Array(compressed));

            if (chunkBuffer.length >= CHUNK_ACC_COUNT) {
              let totalLen = 0;
              for (const c of chunkBuffer) totalLen += c.length;
              const merged = new Int16Array(totalLen);
              let offset = 0;
              for (const c of chunkBuffer) {
                merged.set(c, offset);
                offset += c.length;
              }
              chunkBuffer.length = 0;

              mainPlatformVoiceSocket.emit("voice.audio_chunk", {
                roomId,
                chunk: merged.buffer
              });
            }
          }
        };

      } catch (err) {
        console.error("VoIP Fallback local capture initialization error:", err);
      }
    }

    // Remote Peer Playback Setup
    const getOrCreateRemotePlayer = (targetId: string) => {
      const existing = fallbackPlayersRef.current.get(targetId);
      if (existing) return existing;

      console.log(`VoIP Fallback: Registering smooth audio pipeline for remote peer: ${targetId}`);
      const player = new SmoothAudioPlayer();
      const dest = audioContext.createMediaStreamDestination();
      const node = audioContext.createScriptProcessor(1024, 0, 1);

      // Playback consumer logic
      node.onaudioprocess = (event) => {
        const out = event.outputBuffer.getChannelData(0);
        player.consume(out, event.outputBuffer.sampleRate, 16000);
      };

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 1.0; // Volume managed inside RemoteAudioPlayer

      node.connect(silentGain);
      silentGain.connect(dest);
      silentGain.connect(audioContext.destination);

      const stream = dest.stream;
      (stream as any).gainNode = silentGain;

      fallbackPlayersRef.current.set(targetId, { dest, player, node, silentGainNode: silentGain });

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(targetId, stream);
        return next;
      });

      return { dest, player, node, silentGainNode: silentGain };
    };

    const destroyRemotePlayer = (targetId: string) => {
      const entry = fallbackPlayersRef.current.get(targetId);
      if (entry) {
        try { entry.node.disconnect(); } catch (e) {}
        try { entry.silentGainNode.disconnect(); } catch (e) {}
        fallbackPlayersRef.current.delete(targetId);
      }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(targetId);
        return next;
      });
    };

    const handleJoinResponse = (response?: { users: string[] }) => {
      if (response && response.users) {
        response.users.forEach((otherId) => {
          if (otherId !== userId) getOrCreateRemotePlayer(otherId);
        });
      }
    };

    mainPlatformVoiceSocket.emit("voice.join", { roomId }, (resp?: any) => {
      handleJoinResponse(resp);
    });

    const handleExistingUsers = ({ users }: { users: string[] }) => {
      users.forEach((otherId) => {
        if (otherId !== userId) getOrCreateRemotePlayer(otherId);
      });
    };

    const handleUserJoined = ({ userId: otherId }: { userId: string }) => {
      if (otherId !== userId) getOrCreateRemotePlayer(otherId);
    };

    const handleUserLeft = ({ userId: otherId }: { userId: string }) => {
      destroyRemotePlayer(otherId);
    };

    const handleAudioChunk = ({ userId: senderId, chunk }: { userId: string, chunk: ArrayBuffer }) => {
      if (senderId === userId) return;
      try {
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        const entry = getOrCreateRemotePlayer(senderId);
        const floatData = int16ToFloat32(chunk);
        entry.player.push(floatData);
      } catch (err) {
        console.error("VoIP Fallback play ingest error:", err);
      }
    };

    mainPlatformVoiceSocket.on('voice.user_joined', handleUserJoined);
    mainPlatformVoiceSocket.on('voice.existing_users', handleExistingUsers);
    mainPlatformVoiceSocket.on('voice.user_left', handleUserLeft);
    mainPlatformVoiceSocket.on('voice.audio_chunk', handleAudioChunk);

    return () => {
      mainPlatformVoiceSocket.emit('voice.leave', { roomId });
      mainPlatformVoiceSocket.off('voice.user_joined', handleUserJoined);
      mainPlatformVoiceSocket.off('voice.existing_users', handleExistingUsers);
      mainPlatformVoiceSocket.off('voice.user_left', handleUserLeft);
      mainPlatformVoiceSocket.off('voice.audio_chunk', handleAudioChunk);

      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }

      fallbackPlayersRef.current.forEach((entry) => {
        try { entry.node.disconnect(); } catch (e) {}
        try { entry.silentGainNode.disconnect(); } catch (e) {}
      });
      fallbackPlayersRef.current.clear();
      setRemoteStreams(new Map());
    };

  }, [roomId, userId, voiceMethod]);

  return { remoteStreams, isMediasoupSFU: voiceMethod === 'mediasoup' };
};
