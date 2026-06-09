
import { useEffect, useRef, useState } from 'react';
import { voiceSocket, mainPlatformVoiceSocket, getSharedAudioContext } from '../lib/socket';
import { Device } from 'mediasoup-client';

// Keep the stable custom PCM linear resampler & jitter buffer for the robust fallback pipeline.
class SmoothAudioPlayer {
  private queue: Float32Array = new Float32Array(0);
  private currentGain: number = 0;
  private isBuffering: boolean = true;
  private consecutiveUnderflows: number = 0;
  private phase: number = 0;

  public push(data: Float32Array) {
    // Prevent buffer bloating and maintain sub-100ms real-time delay
    const MAX_QUEUE_SAMPLES = 8000; 
    if (this.queue.length > MAX_QUEUE_SAMPLES) {
      this.queue = this.queue.slice(this.queue.length - 4000);
    }
    const nextQueue = new Float32Array(this.queue.length + data.length);
    nextQueue.set(this.queue, 0);
    nextQueue.set(data, this.queue.length);
    this.queue = nextQueue;
    
    // Begin playing with a safe 100ms cushion (1200 samples at 16kHz)
    if (this.isBuffering && this.queue.length >= 2400) {
      this.isBuffering = false;
      this.consecutiveUnderflows = 0;
    }
  }

  public consume(out: Float32Array, outSampleRate: number, inSampleRate: number) {
    if (this.isBuffering) {
      for (let i = 0; i < out.length; i++) {
        this.currentGain = Math.max(0, this.currentGain - 0.1);
        out[i] = 0;
      }
      return;
    }

    const ratio = inSampleRate / outSampleRate;
    
    // If the buffer runs too dry, enter buffering cycle to preserve sync
    if (this.queue.length < 600) {
      this.consecutiveUnderflows++;
      if (this.consecutiveUnderflows > 8) {
        this.isBuffering = true;
      }
      for (let i = 0; i < out.length; i++) {
        this.currentGain = Math.max(0, this.currentGain - 0.1);
        out[i] = 0;
      }
      return;
    }

    this.consecutiveUnderflows = 0;

    // Dynamically adjust playout rate to smoothly handle network queue drifts without clicks
    //const playableRatio = Math.min(ratio, this.queue.length / out.length);
    const targetBuffer = 2400;
    const drift = this.queue.length - targetBuffer;

    let adaptiveRatio = ratio;

    // smooth drift correction
    if (Math.abs(drift) > 400) {
    adaptiveRatio = ratio * (1 + drift * 0.000002);
    }

    const playableRatio = Math.min(adaptiveRatio, this.queue.length / out.length);

    let srcIdx = 0;

    for (let i = 0; i < out.length; i++) {
      const idx1 = Math.floor(srcIdx);
      const idx2 = Math.min(this.queue.length - 1, idx1 + 1);
      const t = srcIdx - idx1;
      const s1 = (idx1 >= 0 && idx1 < this.queue.length) ? this.queue[idx1] : 0;
      const s2 = (idx2 >= 0 && idx2 < this.queue.length) ? this.queue[idx2] : 0;
      const rawSample = s1 + t * (s2 - s1);
      
      if (this.currentGain < 1) {
        this.currentGain = Math.min(1.0, this.currentGain + 0.05);
      }
      out[i] = rawSample * this.currentGain;
      srcIdx += playableRatio;
    }

    const consumedCount = Math.min(this.queue.length, Math.floor(srcIdx));
    this.queue = this.queue.slice(consumedCount);
  }

  public clear() {
    this.queue = new Float32Array(0);
    this.isBuffering = true;
    this.consecutiveUnderflows = 0;
    this.currentGain = 0;
    this.phase = 0;
  }
}

export const useWebRTC = (
  roomId: string | null,
  localStream: MediaStream | null,
  userId: string | undefined,
  screenStream: MediaStream | null = null,
  isMicTestOn: boolean = false,
  botStream: MediaStream | null = null
) => {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [voiceMethod, setVoiceMethod] = useState<'mediasoup' | 'fallback_pcm'>('mediasoup');
  const [isSendTransportReady, setIsSendTransportReady] = useState<boolean>(false);

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
  // SHARED FALLBACK PLAYER HELPERS
  // --------------------------------------------------
  const destroyRemotePlayer = (targetId: string) => {
    const entry = fallbackPlayersRef.current.get(targetId);
    if (entry) {
      try { entry.node.disconnect(); } catch (e) {}
      try { entry.silentGainNode.disconnect(); } catch (e) {}
      fallbackPlayersRef.current.delete(targetId);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      const currentStream = next.get(targetId);
      if (currentStream && entry && currentStream === entry.dest.stream) {
        next.delete(targetId);
      }
      return next;
    });
  };

  const getOrCreateRemotePlayer = (targetId: string) => {
    const existing = fallbackPlayersRef.current.get(targetId);
    if (existing) return existing;

    console.log(`VoIP Fallback: Registering smooth audio pipeline for remote peer: ${targetId}`);
    let audioContext: AudioContext;
    try {
      audioContext = getSharedAudioContext();
      if (!audioContext) return null;
    } catch (e) {
      console.error("VoiP Fallback: AudioContext lookup error", e);
      return null;
    }

    const player = new SmoothAudioPlayer();
    const dest = audioContext.createMediaStreamDestination();
    const node = audioContext.createScriptProcessor(2048, 0, 1);

    node.onaudioprocess = (event) => {
      const out = event.outputBuffer.getChannelData(0);
      player.consume(out, event.outputBuffer.sampleRate, 16000);
    };

    const silentGain = audioContext.createGain();
    silentGain.gain.value = 1.0;

    node.connect(silentGain);
    silentGain.connect(dest);

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

  // Helper to mark voice fallback flag
  const triggerVoiceFallbackUI = () => {
    setVoiceMethod('fallback_pcm');
    if (typeof window !== "undefined") {
      (window as any).loxxVoiceFallbackActive = true;
      localStorage.setItem("loxx_voice_fallback_active", "true");
    }
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
            triggerVoiceFallbackUI();
            return;
          }

          try {
            // 2. Initialize Mediasoup Device
            const device = new Device();
            await device.load({ routerRtpCapabilities: ack.routerRtpCapabilities });
            deviceRef.current = device;
            console.log(`[LOXX SFU Mediasoup] Mediasoup Device loaded successfully inside client frame.`);

            // 3. Create Send Transport (always create send transport so mic unmuting or music bot triggers immediately)
            await setupSendTransport(device);

            // 4. Create Receive Transport
            await setupRecvTransport(device);

            // 5. Query active producers already inside the room
            voiceSocket.emit("getProducers", async (prodAck: any) => {
              if (prodAck && prodAck.success && prodAck.producers) {
                for (const prod of prodAck.producers) {
                  if (prod.userId !== userId) {
                    const targetUserId = (prod.appData && prod.appData.type === "bot")
                      ? `music-bot-${roomId}`
                      : prod.userId;
                    await consumeTrack(prod.producerId, targetUserId, prod.kind);
                  }
                }
              }
            });

          } catch (deviceError: any) {
            console.error(`[LOXX SFU Mediasoup] Device setup/handshake error:`, deviceError);
            triggerVoiceFallbackUI();
          }
        });

      } catch (err) {
        console.warn(`[LOXX SFU Mediasoup] VPS Voice Connection failed. Triaging fallback...`, err);
        triggerVoiceFallbackUI();
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

            sendTransport.on("connectionstatechange", (state) => {
              console.log(`[LOXX SFU Mediasoup] Send WebRTC Transport state change: ${state}`);
              if (state === "failed") {
                console.warn(`[LOXX SFU Mediasoup] Send WebRTC Transport connection failed (possibly blocked UDP). Falling back to PCM...`);
                setVoiceMethod('fallback_pcm');
              }
            });

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
            const audioTrack = (localStream && typeof localStream.getAudioTracks === "function") 
              ? localStream.getAudioTracks()[0] 
              : null;
            if (audioTrack) {
              const audioProducer = await sendTransport.produce({ 
                track: audioTrack,
                appData: { userId },
                encodings: [
                  { networkPriority: "medium", maxBitrate: 32000 } // Gamer-optimized: ultra-efficient, prevents ping spikes
                ],
                codecOptions: {
                  opusDtx: true,  // Enabled DTX to stop transmission during silence and save tons of bandwidth
                  opusFec: true,  // Keep Forward Error Correction to recover lost packets
                  opusStereo: false
                }
              });
              audioProducerRef.current = audioProducer;
              console.log(`[LOXX SFU Mediasoup] Microphones produced stream over RTP [ID: ${audioProducer.id}]`);
            }
            setIsSendTransportReady(true);
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

            recvTransport.on("connectionstatechange", (state) => {
              console.log(`[LOXX SFU Mediasoup] Recv WebRTC Transport state change: ${state}`);
              if (state === "failed") {
                console.warn(`[LOXX SFU Mediasoup] Recv WebRTC Transport connection failed (possibly blocked UDP). Falling back to PCM...`);
                setVoiceMethod('fallback_pcm');
              }
            });

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
          if (kind === "audio") {
            destroyRemotePlayer(peerUserId);
          }
          const consumer = await recvTransport.consume(resp.params);
          (consumer as any).peerUserId = peerUserId;
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
      const targetUserId = (data.appData && data.appData.type === "bot")
        ? `music-bot-${roomId}`
        : data.userId;
      await consumeTrack(data.producerId, targetUserId, data.kind);
    };

    const handleProducerClosed = ({ producerId }: { producerId: string }) => {
      // Clean up local consumers subscribing to this producer
      consumersRef.current.forEach((consumer, consumerId) => {
        if (consumer.producerId === producerId) {
          const targetPeerUserId = (consumer as any).peerUserId || "";
          closeSpecificConsumer(consumerId, targetPeerUserId, consumer.kind);
        }
      });
    };

    const handleConsumerClosed = ({ consumerId }: { consumerId: string }) => {
      const consumer = consumersRef.current.get(consumerId);
      const targetPeerUserId = consumer ? ((consumer as any).peerUserId || "") : "";
      closeSpecificConsumer(consumerId, targetPeerUserId, consumer ? consumer.kind : "audio");
    };

    voiceSocket.on("newProducer", handleNewProducer);
    voiceSocket.on("producerClosed", handleProducerClosed);
    voiceSocket.on("consumerClosed", handleConsumerClosed);

    startMediasoupSFU();

    return () => {
      active = false;
      setIsSendTransportReady(false);
      
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
    if (!roomId || !userId || voiceMethod !== 'mediasoup' || !sendTransportRef.current || !isSendTransportReady) return;

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
            appData: { type: "screen", userId },
            encodings: [ { networkPriority: "low", maxBitrate: 800000, maxFramerate: 15 } ] // Gamer-optimized: cap screen share bitrate/FPS to prevent gaming ping spikes
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

  }, [screenStream, voiceMethod, isSendTransportReady]);

  const botProducerRef = useRef<any>(null);

  // Handle dynamic Music Bot audio track publication via Mediasoup Send Transport
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'mediasoup' || !sendTransportRef.current || !isSendTransportReady) return;

    const botAudioTrack = botStream ? botStream.getAudioTracks()[0] : null;

    const updateBotShare = async () => {
      try {
        if (botAudioTrack) {
          console.log("[LOXX SFU Mediasoup] Producing Local Music Bot track to Media Server...");
          
          if (botProducerRef.current) {
            try {
              voiceSocket.emit("closeProducer", { producerId: botProducerRef.current.id });
              botProducerRef.current.close();
            } catch (e) {}
          }

          const audioProducer = await sendTransportRef.current.produce({
            track: botAudioTrack,
            appData: { type: "bot", userId: `music-bot-${roomId}` },
            encodings: [{ networkPriority: "medium", maxBitrate: 64000 }], // Optimized music bot bitrate for gaming rooms
            codecOptions: { opusDtx: true, opusFec: true, opusStereo: false }
          });
          botProducerRef.current = audioProducer;

          botAudioTrack.onended = () => {
            if (botProducerRef.current) {
              voiceSocket.emit("closeProducer", { producerId: botProducerRef.current.id });
              try { botProducerRef.current.close(); } catch (e) {}
              botProducerRef.current = null;
            }
          };
        } else {
          if (botProducerRef.current) {
            console.log("[LOXX SFU Mediasoup] Music Bot stopped. Releasing producer.");
            voiceSocket.emit("closeProducer", { producerId: botProducerRef.current.id });
            try { botProducerRef.current.close(); } catch(e) {}
            botProducerRef.current = null;
          }
        }
      } catch (e) {
        console.error("[LOXX SFU Mediasoup] Failed producing Bot audio track:", e);
      }
    };

    updateBotShare();

  }, [botStream, voiceMethod, isSendTransportReady]);

  // Handle Local audio stream updates (e.g. from hot-swapping mics, resuming, or late-granting permissions)
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'mediasoup' || !localStream) return;

    const updateOrCreateAudioProducer = async () => {
      try {
        const audioTrack = localStream.getAudioTracks()[0];
        if (!audioTrack) return;

        if (audioProducerRef.current) {
          if (audioProducerRef.current.track !== audioTrack) {
            console.log(`[LOXX SFU Mediasoup] Replacing audio track dynamically...`);
            await audioProducerRef.current.replaceTrack({ track: audioTrack });
          }
        } else if (sendTransportRef.current && isSendTransportReady) {
          console.log(`[LOXX SFU Mediasoup] Creating audio producer dynamically since it didn't exist...`);
          const audioProducer = await sendTransportRef.current.produce({
            track: audioTrack,
            appData: { userId },
            encodings: [
              { networkPriority: "medium", maxBitrate: 32000 } // Gamer-optimized: ultra-efficient, prevents ping spikes
            ],
            codecOptions: {
              opusDtx: true,   // Enabled DTX to stop transmission during silence and save tons of bandwidth
              opusFec: true,   // Keep Forward Error Correction to recover lost packets
              opusStereo: false
            }
          });
          audioProducerRef.current = audioProducer;
          console.log(`[LOXX SFU Mediasoup] Microphone produced stream over RTP dynamically [ID: ${audioProducer.id}]`);
        }
      } catch (e) {
        console.error("[LOXX SFU Mediasoup] Failed preparing/replacing audio track:", e);
      }
    };
    updateOrCreateAudioProducer();
  }, [localStream, voiceMethod, isSendTransportReady, roomId, userId]);

  // Handle Mic Test logic -> pause the Mediasoup producer so others don't hear
  useEffect(() => {
    if (voiceMethod !== 'mediasoup' || !audioProducerRef.current) return;
    
    if (isMicTestOn) {
      if (!audioProducerRef.current.paused) {
        audioProducerRef.current.pause();
        voiceSocket.emit("pauseProducer", { producerId: audioProducerRef.current.id });
      }
    } else {
      if (audioProducerRef.current.paused) {
        audioProducerRef.current.resume();
        voiceSocket.emit("resumeProducer", { producerId: audioProducerRef.current.id });
      }
    }
  }, [isMicTestOn, voiceMethod]);

  // --------------------------------------------------
  // PART B: SECURE PCM OVER WEBSOCKET FALLBACK SYSTEM
  // --------------------------------------------------
  useEffect(() => {
    if (!roomId || !userId) return;

    console.log(`[LOXX VOICE PIPELINE] Registering main socket PCM voice handlers (active in background/bridge mode)...`);
    
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

    // Capture Local Microphone Audio Chunks and broadcast to fallback socket
    if (localStream && localStream.getAudioTracks().length > 0) {
      try {
        sourceNodeRef.current = audioContext.createMediaStreamSource(localStream);
        
        // 2048 samples buffer for lower CPU callback load and stutter prevention
        processorNodeRef.current = audioContext.createScriptProcessor(2048, 1, 1);
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
        const CHUNK_ACC_COUNT = 1; // Send each 2048-sample block (at 48kHz, ~42ms of audio) instantly to avoid callback CPU bloat and queuing latency

        processorNodeRef.current.onaudioprocess = (event) => {
          if (voiceMethod !== "fallback_pcm") return; // Gamer optimization: Absolutely skip raw PCM websocket transmission when using high-efficiency Mediasoup WebRTC!
          const micEnabled = localStream.getAudioTracks()[0]?.enabled;
          if (micEnabled && !isMicTestOn) {
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

    const handleJoinResponse = (response?: { users: string[] }) => {
      if (response && response.users) {
        response.users.forEach((otherId) => {
          if (otherId !== userId) {
            const isMediasoupPeer = Array.from(consumersRef.current.values()).some(
              (c: any) => c.peerUserId === otherId && c.kind === "audio"
            );
            if (!isMediasoupPeer || voiceMethod === "fallback_pcm") {
              getOrCreateRemotePlayer(otherId);
            }
          }
        });
      }
    };

    mainPlatformVoiceSocket.emit("voice.join", { roomId }, (resp?: any) => {
      handleJoinResponse(resp);
    });

    const handleExistingUsers = ({ users }: { users: string[] }) => {
      users.forEach((otherId) => {
        if (otherId !== userId) {
          const isMediasoupPeer = Array.from(consumersRef.current.values()).some(
            (c: any) => c.peerUserId === otherId && c.kind === "audio"
          );
          if (!isMediasoupPeer || voiceMethod === "fallback_pcm") {
            getOrCreateRemotePlayer(otherId);
          }
        }
      });
    };

    const handleUserJoined = ({ userId: otherId }: { userId: string }) => {
      if (otherId !== userId) {
        const isMediasoupPeer = Array.from(consumersRef.current.values()).some(
          (c: any) => c.peerUserId === otherId && c.kind === "audio"
        );
        if (!isMediasoupPeer || voiceMethod === "fallback_pcm") {
          getOrCreateRemotePlayer(otherId);
        }
      }
    };

    const handleUserLeft = ({ userId: otherId }: { userId: string }) => {
      destroyRemotePlayer(otherId);
    };

    const handleAudioChunk = ({ userId: senderId, chunk }: { userId: string, chunk: ArrayBuffer }) => {
      if (senderId === userId) return;
      try {
        if (audioContext && audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        
        // Echo double audio avoidance check:
        // If we are already receiving high-fidelity Mediasoup audio from this peer, 
        // skip playing their fallback low-bandwidth PCM chunks.
        const isMediasoupPeer = Array.from(consumersRef.current.values()).some(
          (c: any) => c.peerUserId === senderId && c.kind === "audio"
        );
        if (isMediasoupPeer && voiceMethod === "mediasoup") {
          return;
        }

        const entry = getOrCreateRemotePlayer(senderId);
        if (entry) {
          const floatData = int16ToFloat32(chunk);
          entry.player.push(floatData);
        }
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

  }, [roomId, userId, voiceMethod, localStream, isMicTestOn]);

  // Dedicated Music Bot receiver effect so it works independently of Mediasoup/Fallback settings
  useEffect(() => {
    if (!roomId || !userId) return;

    const handleBotAudioChunk = (data: { userId: string, chunk: ArrayBuffer }) => {
      return; // Bypassed: high-fidelity local HTML5 playback runs synchronously in LobbyRoomPage instead of degraded 16kHz WebSocket voice buffers.
      const senderId = data.userId;
      if (!senderId || !senderId.startsWith("music-bot-")) return;

      try {
        const audioCtx = getSharedAudioContext();
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }

        let entry = fallbackPlayersRef.current.get(senderId);
        if (!entry) {
          console.log(`[MusicBot Receiver EFFECT] Starting dynamic play pipeline for: ${senderId}`);
          const player = new SmoothAudioPlayer();
          const dest = audioCtx.createMediaStreamDestination();
          const node = audioCtx.createScriptProcessor(1024, 0, 1);

          node.onaudioprocess = (event) => {
            const out = event.outputBuffer.getChannelData(0);
            player.consume(out, event.outputBuffer.sampleRate, 16000);
          };

          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 1.0;

          node.connect(silentGain);
          silentGain.connect(dest);

          const stream = dest.stream;
          (stream as any).gainNode = silentGain;

          fallbackPlayersRef.current.set(senderId, { dest, player, node, silentGainNode: silentGain });

          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(senderId, stream);
            return next;
          });

          entry = { dest, player, node, silentGainNode: silentGain };
        }

        const floatData = int16ToFloat32(data.chunk);
        entry.player.push(floatData);
      } catch (err) {
        console.error("MusicBot chunk playing error:", err);
      }
    };

    mainPlatformVoiceSocket.on('voice.audio_chunk', handleBotAudioChunk);

    return () => {
      mainPlatformVoiceSocket.off('voice.audio_chunk', handleBotAudioChunk);
      
      // Clean up bot entries specifically when leaving room
      const botKey = `music-bot-${roomId}`;
      const entry = fallbackPlayersRef.current.get(botKey);
      if (entry) {
        try { entry.node.disconnect(); } catch (e) {}
        try { entry.silentGainNode.disconnect(); } catch (e) {}
        fallbackPlayersRef.current.delete(botKey);
      }
    };
  }, [roomId, userId]);

  return { remoteStreams, isMediasoupSFU: voiceMethod === 'mediasoup' };
};