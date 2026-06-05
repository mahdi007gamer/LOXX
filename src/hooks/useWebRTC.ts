import { useEffect, useRef, useState } from 'react';
import { voiceSocket, mainPlatformVoiceSocket, getSharedAudioContext } from '../lib/socket';
import { Device } from 'mediasoup-client';

// Keep the stable custom PCM linear resampler & jitter buffer for the robust fallback pipeline.
export class SmoothAudioPlayer {
  private queue: Float32Array = new Float32Array(0);
  private currentGain: number = 0;
  private isBuffering: boolean = true;
  private consecutiveUnderflows: number = 0;
  private phase: number = 0;

  public push(data: Float32Array) {
    // Prevent buffer bloating and maintain dual-mode real-time delay under high network spikes.
    const MAX_QUEUE_SAMPLES = 8000; // Supports up to 500ms of accumulated network jitter spikes before safety prune
    if (this.queue.length > MAX_QUEUE_SAMPLES) {
      this.queue = this.queue.slice(this.queue.length - 2400); // Reset smoothly to safety target cushion (150ms)
    }
    const nextQueue = new Float32Array(this.queue.length + data.length);
    nextQueue.set(this.queue, 0);
    nextQueue.set(data, this.queue.length);
    this.queue = nextQueue;
    
    // Begin playing with a very stable 150ms buffering cushion (2400 samples at 16kHz) matching Discord-style standards
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
    
    // Safety Threshold (Underflow prevention): If queue size is critically low (< 600 samples), buffer up to avoid digital clicks
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

    // Adaptive playout rate adjustment (Ultra-smooth synchronization target: 100ms - 200ms Jitter Buffer)
    // Target buffer size: 1600 - 3200 samples (100ms - 200ms).
    // If queue is larger, play faster to catch up; if smaller, play slower to permit buffering.
    let adaptiveRatio = ratio;
    if (this.queue.length > 3200) {
      const excessive = Math.min(2000, this.queue.length - 3200);
      adaptiveRatio = ratio * (1 + 0.15 * (excessive / 2000));
    } else if (this.queue.length < 1600) {
      const shortage = 1600 - this.queue.length;
      adaptiveRatio = ratio * (1 - 0.12 * (shortage / 1600));
    }

    const playableRatio = adaptiveRatio;
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

// Global caching references for the registered AudioWorklet URL to prevent multiple registrations
let workletLoadedPromise: Promise<void> | null = null;

export const loadAudioWorklet = async (audioContext: AudioContext): Promise<void> => {
  if (workletLoadedPromise) return workletLoadedPromise;

  workletLoadedPromise = (async () => {
    if (!audioContext.audioWorklet) {
      throw new Error("AudioWorklet is not supported on this browser context.");
    }

    const code = `
      class FallbackAudioInputProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input[0]) {
            const samples = input[0];
            // Post direct Float32Array clone back to main thread
            this.port.postMessage({ samples: new Float32Array(samples) });
          }
          return true;
        }
      }
      registerProcessor('fallback-audio-input-processor', FallbackAudioInputProcessor);

      class FallbackAudioOutputProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.queue = new Float32Array(0);
          this.isBuffering = true;
          this.currentGain = 0;
          this.consecutiveUnderflows = 0;

          this.port.onmessage = (e) => {
            if (e.data.type === 'push') {
              const data = e.data.data;
              const MAX_QUEUE_SAMPLES = 8000;
              if (this.queue.length > MAX_QUEUE_SAMPLES) {
                this.queue = this.queue.slice(this.queue.length - 2400);
              }
              const nextQueue = new Float32Array(this.queue.length + data.length);
              nextQueue.set(this.queue, 0);
              nextQueue.set(data, this.queue.length);
              this.queue = nextQueue;

              if (this.isBuffering && this.queue.length >= 2400) {
                this.isBuffering = false;
                this.consecutiveUnderflows = 0;
              }
            } else if (e.data.type === 'clear') {
              this.queue = new Float32Array(0);
              this.isBuffering = true;
              this.consecutiveUnderflows = 0;
              this.currentGain = 0;
            }
          };
        }

        process(inputs, outputs, parameters) {
          const output = outputs[0];
          if (!output || !output[0]) return true;
          const out = output[0];
          const len = out.length;

          if (this.isBuffering) {
            for (let i = 0; i < len; i++) {
              this.currentGain = Math.max(0, this.currentGain - 0.1);
              out[i] = 0;
            }
            return true;
          }

          const ratio = 16000 / sampleRate;

          if (this.queue.length < 600) {
            this.consecutiveUnderflows++;
            if (this.consecutiveUnderflows > 8) {
              this.isBuffering = true;
            }
            for (let i = 0; i < len; i++) {
              this.currentGain = Math.max(0, this.currentGain - 0.1);
              out[i] = 0;
            }
            return true;
          }

          this.consecutiveUnderflows = 0;
          
          let adaptiveRatio = ratio;
          if (this.queue.length > 3200) {
            const excessive = Math.min(2000, this.queue.length - 3200);
            adaptiveRatio = ratio * (1 + 0.15 * (excessive / 2000));
          } else if (this.queue.length < 1600) {
            const shortage = 1600 - this.queue.length;
            adaptiveRatio = ratio * (1 - 0.12 * (shortage / 1600));
          }

          const playableRatio = adaptiveRatio;
          let srcIdx = 0;

          for (let i = 0; i < len; i++) {
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

          return true;
        }
      }
      registerProcessor('fallback-audio-output-processor', FallbackAudioOutputProcessor);
    `;

    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(url);
    console.log("[AudioWorklet] Fallback Audio Worklet processors injected and registered.");
  })();

  return workletLoadedPromise;
};

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

  // References for fallback PCM handler (Requested Point 6: use AudioWorkletNode | ScriptProcessorNode)
  const processorNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const fallbackPlayersRef = useRef<Map<string, { 
    dest: MediaStreamAudioDestinationNode; 
    player?: SmoothAudioPlayer; 
    node: AudioWorkletNode | ScriptProcessorNode;
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

            // 3. Create Send Transport
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
            const audioTrack = (localStream && typeof localStream.getAudioTracks === "function") 
              ? localStream.getAudioTracks()[0] 
              : null;
            if (audioTrack) {
              const audioProducer = await sendTransport.produce({ 
                track: audioTrack,
                appData: { userId },
                encodings: [
                  { networkPriority: "high", maxBitrate: 96000 }
                ],
                codecOptions: {
                  opusDtx: true,
                  opusFec: true,
                  opusStereo: true
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
            encodings: [ { networkPriority: "medium" } ]
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

          // Requested Points 2 & 3: Reduced maxBitrate to 96000 and keep opusStereo to true for rich music
          const audioProducer = await sendTransportRef.current.produce({
            track: botAudioTrack,
            appData: { type: "bot", userId: `music-bot-${roomId}` },
            encodings: [{ networkPriority: "high", maxBitrate: 96000 }],
            codecOptions: { opusDtx: false, opusFec: true, opusStereo: true }
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

  // Handle Local audio stream updates (e.g. from hot-swapping mics or resuming)
  useEffect(() => {
    if (!roomId || !userId || voiceMethod !== 'mediasoup' || !audioProducerRef.current || !localStream) return;
    const updateAudioTrack = async () => {
      try {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack && audioProducerRef.current.track !== audioTrack) {
          console.log(`[LOXX SFU Mediasoup] Replacing audio track dynamically...`);
          await audioProducerRef.current.replaceTrack({ track: audioTrack });
        }
      } catch (e) {
        console.error("[LOXX SFU Mediasoup] Failed replacing audio track:", e);
      }
    };
    updateAudioTrack();
  }, [localStream, voiceMethod]);

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

    // Pre-register fallback audio processors
    const preloadPromise = loadAudioWorklet(audioContext).catch(e => {
      console.warn("[AudioWorklet] Registration error, using fallback ScriptProcessorNode:", e);
    });

    const setupScriptProcessorInput = () => {
      try {
        sourceNodeRef.current = audioContext.createMediaStreamSource(localStream!);
        const scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        processorNodeRef.current = scriptNode;
        sourceNodeRef.current.connect(scriptNode);

        const silentGainNode = audioContext.createGain();
        silentGainNode.gain.value = 0;
        scriptNode.connect(silentGainNode);
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
        const CHUNK_ACC_COUNT = 1;

        scriptNode.onaudioprocess = (event) => {
          const micEnabled = localStream?.getAudioTracks()[0]?.enabled;
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
    };

    // Capture Local Microphone Audio Chunks using AudioWorkletNode
    const initWorkletInput = async () => {
      try {
        await preloadPromise;
        const workletNode = new AudioWorkletNode(audioContext, 'fallback-audio-input-processor');
        processorNodeRef.current = workletNode;
        
        sourceNodeRef.current = audioContext.createMediaStreamSource(localStream!);
        sourceNodeRef.current.connect(workletNode);
        
        const silentGainNode = audioContext.createGain();
        silentGainNode.gain.value = 0;
        workletNode.connect(silentGainNode);
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
        const CHUNK_ACC_COUNT = 1;

        workletNode.port.onmessage = (event) => {
          const micEnabled = localStream?.getAudioTracks()[0]?.enabled;
          if (micEnabled && !isMicTestOn && event.data.samples) {
            const inputData = event.data.samples;
            const compressed = downsampleAndToInt16(inputData, audioContext.sampleRate, 16000);
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
        console.warn("[AudioWorklet] Input initialization failed, falling back to ScriptProcessorNode:", err);
        setupScriptProcessorInput();
      }
    };

    if (localStream && localStream.getAudioTracks().length > 0) {
      if (typeof AudioWorkletNode !== "undefined" && audioContext.audioWorklet) {
        initWorkletInput();
      } else {
        setupScriptProcessorInput();
      }
    }

    // Remote Peer Playback Setup using AudioWorklet (Requested Point 6)
    const getOrCreateRemotePlayer = async (targetId: string) => {
      const existing = fallbackPlayersRef.current.get(targetId);
      if (existing) return existing;

      console.log(`VoIP Fallback: Registering smooth audio pipeline for remote peer: ${targetId}`);
      const dest = audioContext.createMediaStreamDestination();
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 1.0; // Volume managed inside RemoteAudioPlayer

      let node: AudioWorkletNode | ScriptProcessorNode;
      let playerInstance: SmoothAudioPlayer | undefined;

      let useWorklet = false;
      if (typeof AudioWorkletNode !== "undefined" && audioContext.audioWorklet) {
        try {
          await preloadPromise;
          useWorklet = true;
        } catch (e) {
          console.warn("[AudioWorklet] Fallback output preload failed:", e);
        }
      }

      if (useWorklet) {
        const workletNode = new AudioWorkletNode(audioContext, 'fallback-audio-output-processor');
        node = workletNode;
        node.connect(silentGain);
        silentGain.connect(dest);
      } else {
        const scriptNode = audioContext.createScriptProcessor(2048, 0, 1);
        node = scriptNode;
        playerInstance = new SmoothAudioPlayer();
        scriptNode.onaudioprocess = (event) => {
          const out = event.outputBuffer.getChannelData(0);
          playerInstance!.consume(out, event.outputBuffer.sampleRate, 16000);
        };
        node.connect(silentGain);
        silentGain.connect(dest);
      }

      const stream = dest.stream;
      (stream as any).gainNode = silentGain;

      const newEntry = { dest, player: playerInstance, node, silentGainNode: silentGain };
      fallbackPlayersRef.current.set(targetId, newEntry);

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(targetId, stream);
        return next;
      });

      return newEntry;
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

    const handleJoinResponse = async (response?: { users: string[] }) => {
      if (response && response.users) {
        for (const otherId of response.users) {
          if (otherId !== userId) {
            await getOrCreateRemotePlayer(otherId);
          }
        }
      }
    };

    mainPlatformVoiceSocket.emit("voice.join", { roomId }, (resp?: any) => {
      handleJoinResponse(resp);
    });

    const handleExistingUsers = async ({ users }: { users: string[] }) => {
      for (const otherId of users) {
        if (otherId !== userId) {
          await getOrCreateRemotePlayer(otherId);
        }
      }
    };

    const handleUserJoined = async ({ userId: otherId }: { userId: string }) => {
      if (otherId !== userId) {
        await getOrCreateRemotePlayer(otherId);
      }
    };

    const handleUserLeft = ({ userId: otherId }: { userId: string }) => {
      destroyRemotePlayer(otherId);
    };

    const handleAudioChunk = async ({ userId: senderId, chunk }: { userId: string, chunk: ArrayBuffer }) => {
      if (senderId === userId) return;
      try {
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        const entry = await getOrCreateRemotePlayer(senderId);
        const floatData = int16ToFloat32(chunk);
        
        if (entry.node instanceof AudioWorkletNode) {
          entry.node.port.postMessage({ type: 'push', data: floatData });
        } else if (entry.player) {
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

  }, [roomId, userId, voiceMethod]);

  // Dedicated Music Bot receiver effect so it works independently of Mediasoup/Fallback settings
  useEffect(() => {
    if (!roomId || !userId) return;

    const handleBotAudioChunk = async (data: { userId: string, chunk: ArrayBuffer }) => {
      return; // Bypassed: high-fidelity local HTML5 playback runs synchronously in LobbyRoomPage instead of degraded 16kHz WebSocket voice buffers.
    };

    mainPlatformVoiceSocket.on('voice.audio_chunk', handleBotAudioChunk);

    return () => {
      mainPlatformVoiceSocket.off('voice.audio_chunk', handleBotAudioChunk);
      
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
