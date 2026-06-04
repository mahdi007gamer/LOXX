import { useEffect, useRef, useState } from "react";
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
  lobbySocket,
  botVolume = 1.0,
  isSomeoneElseSpeaking = false
}: {
  roomId: string;
  isHost: boolean;
  botState: MusicBotState | null;
  voiceSocket: any;
  lobbySocket: any;
  botVolume?: number;
  isSomeoneElseSpeaking?: boolean;
}) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<any>(null);
  const destNodeRef = useRef<any>(null);
  const [botStream, setBotStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // If not host or bot is inactive or paused/empty, release all resources
    if (!isHost || !roomId || !botState || !botState.active || !botState.isPlaying || !botState.currentTrackUrl) {
      cleanup();
      return;
    }

    const trackUrl = botState.currentTrackUrl;

    try {
      const audioCtx = getSharedAudioContext();
      if (!audioCtx) return;

      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      cleanup(); // Clean up current play instance

      console.log(`[MusicBot Transmitter] Starting WebRTC streaming for track: ${botState.currentTrackName}`);
      
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

      // Extract to a WebRTC compatible MediaStream
      const dest = audioCtx.createMediaStreamDestination();
      destNodeRef.current = dest;
      source.connect(dest);
      
      setBotStream(dest.stream);

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
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      if (destNodeRef.current) {
        try { destNodeRef.current.disconnect(); } catch (e) {}
        destNodeRef.current = null;
      }
      setBotStream(null);
    }
  }, [roomId, isHost, botState?.isPlaying, botState?.currentTrackUrl, botState?.queueIndex, botState?.active, voiceSocket, lobbySocket]);

  return botStream;
}
