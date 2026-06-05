import React, { useEffect, useRef } from "react";
import { getSharedAudioContext } from "../../lib/socket";

interface RemoteAudioPlayerProps {
 stream: MediaStream;
 onVolumeChange: (vol: number) => void;
 volumeLevel: number;
 outputDeviceId?: string;
 isMusicBot?: boolean;
}

export const RemoteAudioPlayer: React.FC<RemoteAudioPlayerProps> = ({ stream, onVolumeChange, volumeLevel, outputDeviceId, isMusicBot }) => {
 const audioRef = useRef<HTMLAudioElement | null>(null);
 const volumeAnimationRef = useRef<number | null>(null);
 const currentVolumeRef = useRef<number>(1);

 useEffect(() => {
  if (audioRef.current && stream) {
   if (audioRef.current.srcObject !== stream) {
    audioRef.current.srcObject = stream;
   }
   
   const attemptPlay = () => {
    if (audioRef.current) {
     audioRef.current.play().catch(e => console.warn("AutoPlay blocked, waiting for interaction..."));
    }
   };
   
   attemptPlay();
   
   const handleInteraction = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === "suspended") {
     ctx.resume().catch(() => {});
    }
    if (audioRef.current && audioRef.current.paused) {
     audioRef.current.play().catch(() => {});
    }
    document.removeEventListener("click", handleInteraction);
    document.removeEventListener("touchstart", handleInteraction);
   };
   
   document.addEventListener("click", handleInteraction);
   document.addEventListener("touchstart", handleInteraction);
   
   return () => {
    document.removeEventListener("click", handleInteraction);
    document.removeEventListener("touchstart", handleInteraction);
    onVolumeChange(0);
   };
  }
 }, [stream]);

 useEffect(() => {
  if (audioRef.current && outputDeviceId) {
   const audioEl = audioRef.current as any;
   if (typeof audioEl.setSinkId === "function") {
    audioEl.setSinkId(outputDeviceId === "default" ? "" : outputDeviceId)
     .catch((e: any) => console.error("Failed to set audio output device target (SinkID):", e));
   }
  }
  const audioCtx = getSharedAudioContext() as any;
  if (audioCtx && typeof audioCtx.setSinkId === "function" && outputDeviceId) {
   audioCtx.setSinkId(outputDeviceId === "default" ? "" : outputDeviceId)
    .catch((e: any) => console.error("Failed to set AudioContext output device (SinkID):", e));
  }
 }, [outputDeviceId]);

 useEffect(() => {
  const volumeRatio = Math.min(Math.max(volumeLevel / 100, 0), 1);
  const audioEl = audioRef.current;
  const gainNode = stream && (stream as any).gainNode;
  const isBot = isMusicBot || stream.id.startsWith("music-bot-") || (stream as any).isMusicBot;

  if (isBot) {
   const audioCtx = getSharedAudioContext();
   if (gainNode && audioCtx) {
    try {
     const currentGain = gainNode.gain.value;
     const isDucking = volumeRatio < currentGain;
     const timeConstant = isDucking ? 0.08 : 0.25;
     gainNode.gain.setTargetAtTime(volumeRatio, audioCtx.currentTime, timeConstant);
    } catch (e) {
     console.warn("Could not set direct gain node value:", e);
    }
   }

   if (audioEl) {
    if (volumeAnimationRef.current) cancelAnimationFrame(volumeAnimationRef.current);
    const start = currentVolumeRef.current;
    const duration = volumeRatio < start ? 150 : 350;
    const startTime = performance.now();

    const anim = (now: number) => {
     const elapsed = now - startTime;
     const progress = Math.min(1, elapsed / duration);
     const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
     const current = start + (volumeRatio - start) * ease;
     audioEl.volume = current;
     currentVolumeRef.current = current;
     if (progress < 1) {
      volumeAnimationRef.current = requestAnimationFrame(anim);
     }
    };
    volumeAnimationRef.current = requestAnimationFrame(anim);
   }
  } else {
   if (audioEl) {
    audioEl.volume = volumeRatio;
    currentVolumeRef.current = volumeRatio;
   }
   if (gainNode) {
    try {
     const audioCtx = getSharedAudioContext();
     gainNode.gain.setValueAtTime(volumeRatio, audioCtx ? audioCtx.currentTime : 0);
    } catch (e) {}
   }
  }

  return () => {
   if (volumeAnimationRef.current) cancelAnimationFrame(volumeAnimationRef.current);
  };
 }, [stream, volumeLevel, isMusicBot]);

 useEffect(() => {
  let analyzer: AnalyserNode;
  let microphone: MediaStreamAudioSourceNode;
  let rafId: number;
  let sharedAudioContext: AudioContext;

  const isBot = isMusicBot || stream.id.startsWith("music-bot-") || (stream as any).isMusicBot;
  if (isBot) {
   return;
  }

  if (stream && stream.getAudioTracks().length > 0) {
   try {
    sharedAudioContext = getSharedAudioContext();
    analyzer = sharedAudioContext.createAnalyser();
    microphone = sharedAudioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyzer);
    
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let lastVol = 0;
    let lastAnalysisTime = 0;
    const analyzeVoice = (timestamp: number) => {
     const now = timestamp || performance.now();
     if (now - lastAnalysisTime >= 100) {
      lastAnalysisTime = now;
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0 && tracks[0].enabled) {
       analyzer.getByteFrequencyData(dataArray);
       let sum = 0;
       for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
       }
       const avg = sum / bufferLength;
       const currentVol = Math.min(100, Math.round(avg * 2.5));
       
       if (Math.abs(currentVol - lastVol) > 15 || (currentVol === 0 && lastVol !== 0) || (currentVol > 10 && lastVol === 0)) {
        lastVol = currentVol;
        onVolumeChange(currentVol);
       }
      } else if (lastVol !== 0) {
       lastVol = 0;
       onVolumeChange(0);
      }
     }
     rafId = requestAnimationFrame(analyzeVoice);
    };
    rafId = requestAnimationFrame(analyzeVoice);
   } catch (err) {
    console.error("Remote voice analyzer error:", err);
   }
  }

  return () => {
   if (rafId) cancelAnimationFrame(rafId);
   try {
    if (microphone) microphone.disconnect();
    if (analyzer) analyzer.disconnect();
   } catch (e) {}
  };
 }, [stream, onVolumeChange]);

 return <audio ref={audioRef} muted={false} autoPlay playsInline style={{ position: 'fixed', top: -1000, left: -1000, opacity: 0, width: 1, height: 1 }} />;
};
