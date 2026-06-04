import { useEffect, useRef } from "react";
import { getSharedAudioContext } from "../lib/socket";

interface Track {
  name: string;
  url: string;
}

interface MusicBotState {
  active: boolean;
  isPlaying: boolean;
  currentTrackName: string;
  currentTrackUrl: string;
  currentCategory: string;
  queue: Track[];
  queueIndex: number;
}

export function useMusicBotTransmitter({
  roomId,
  isHost,
  botState,
  voiceSocket,
  lobbySocket
}: {
  roomId: string;
  isHost: boolean;
  botState: MusicBotState | null;
  voiceSocket: any;
  lobbySocket: any;
}) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<any>(null);
  const processorNodeRef = useRef<any>(null);
  const silentGainRef = useRef<any>(null);

  useEffect(() => {
    // If not host or bot is inactive or paused/empty, release all resources
    if (!isHost || !roomId || !botState || !botState.active || !botState.isPlaying || !botState.currentTrackUrl) {
      cleanup();
      return;
    }

    const trackUrl = botState.currentTrackUrl;
    
    // Low-level downsampling and resampling to 16kHz
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

    try {
      const audioCtx = getSharedAudioContext();
      if (!audioCtx) return;

      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      cleanup(); // Clean up current play instance

      console.log(`[MusicBot Transmitter] Starting streaming for track: ${botState.currentTrackName}`);
      
      const audioEl = new Audio(trackUrl);
      audioEl.crossOrigin = "anonymous";
      audioElRef.current = audioEl;

      // Handle Automatic Queue Advancement when track ends
      audioEl.onended = () => {
        if (botState.queue && botState.queue.length > 0) {
          const nextIndex = (botState.queueIndex + 1) % botState.queue.length;
          const nextTrack = botState.queue[nextIndex];
          
          console.log(`[MusicBot Transmitter] Track ended. Auto-skipping to queue index: ${nextIndex}`);
          
          lobbySocket?.emit("lobby.musicbot.control", {
            lobbyId: roomId,
            action: "update-queue",
            queue: botState.queue,
            queueIndex: nextIndex,
            trackUrl: nextTrack.url,
            trackName: nextTrack.name,
            category: botState.currentCategory,
            isPlaying: true
          });
        }
      };

      // Set up routing
      const source = audioCtx.createMediaElementSource(audioEl);
      sourceNodeRef.current = source;

      // Create a script processor representing our sampling block
      const processor = audioCtx.createScriptProcessor(1024, 1, 1);
      processorNodeRef.current = processor;

      source.connect(processor);

      // Create silent terminal destination to fulfill web assembly / web audio pipeline specs
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;
      
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      // Stream frames during the onaudioprocess interval
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const compressed = downsampleAndToInt16(inputData, event.inputBuffer.sampleRate, 16000);
        
        // Broadcast under the virtual music bot profile ID
        voiceSocket?.emit("voice.audio_chunk", {
          roomId,
          userId: `music-bot-${roomId}`,
          chunk: compressed
        });
      };

      audioEl.play().catch(e => {
        console.warn("[MusicBot Transmitter] AutoPlay prevented track playback start:", e);
      });

    } catch (err) {
      console.error("[MusicBot Transmitter] Failed to initialize Audio Element capture flow:", err);
    }

    return () => {
      cleanup();
    };

    function cleanup() {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.onended = null;
        audioElRef.current = null;
      }
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch (e) {}
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (silentGainRef.current) {
        try { silentGainRef.current.disconnect(); } catch (e) {}
        silentGainRef.current = null;
      }
    }
  }, [roomId, isHost, botState?.isPlaying, botState?.currentTrackUrl, botState?.queueIndex, botState?.active, voiceSocket, lobbySocket]);
}
