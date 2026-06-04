import React, { useEffect, useRef } from "react";
import { getSharedAudioContext } from "../../lib/socket";

interface RemoteAudioPlayerProps {
 stream: MediaStream;
 onVolumeChange: (vol: number) => void;
 volumeLevel: number;
 outputDeviceId?: string;
}

export const RemoteAudioPlayer: React.FC<RemoteAudioPlayerProps> = ({ stream, onVolumeChange, volumeLevel, outputDeviceId }) => {
 const audioRef = useRef<HTMLAudioElement | null>(null);

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
 
 // If AutoPlay is blocked, user interacting with the page usually unlocks it.
 const handleInteraction = () => {
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
 // Set output destination sinkId on the underlying AudioContext itself if supported natively
 const audioCtx = getSharedAudioContext() as any;
 if (audioCtx && typeof audioCtx.setSinkId === "function" && outputDeviceId) {
 audioCtx.setSinkId(outputDeviceId === "default" ? "" : outputDeviceId)
 .catch((e: any) => console.error("Failed to set AudioContext output device (SinkID):", e));
 }
 }, [outputDeviceId]);

 useEffect(() => {
 const volumeRatio = Math.min(Math.max(volumeLevel / 100, 0), 1);
 
 // Safety backup to set internal audio volume
 if (audioRef.current) {
 audioRef.current.volume = volumeRatio;
 }

 // Direct low-latency volume gain alteration via browser Web Audio API GainNode routing
 if (stream && (stream as any).gainNode) {
 try {
  const audioCtx = getSharedAudioContext();
  const isMusicBot = stream.id.startsWith("music-bot-") || (stream as any).isMusicBot;
  if (isMusicBot) {
   const currentGain = (stream as any).gainNode.gain.value;
   const isDucking = volumeRatio < currentGain;
   const timeConstant = isDucking ? 0.12 : 0.30;
   (stream as any).gainNode.gain.setTargetAtTime(volumeRatio, audioCtx.currentTime, timeConstant);
  } else {
   (stream as any).gainNode.gain.setValueAtTime(volumeRatio, audioCtx.currentTime);
  }
 } catch (e) {
  console.warn("Could not set direct gain node value:", e);
 }
 }
 }, [stream, volumeLevel]);

 useEffect(() => {
 let analyzer: AnalyserNode;
 let microphone: MediaStreamAudioSourceNode;
 let rafId: number;
 let sharedAudioContext: AudioContext;

 if (stream && stream.getAudioTracks().length > 0) {
 try {
 sharedAudioContext = getSharedAudioContext();
 analyzer = sharedAudioContext.createAnalyser();
 microphone = sharedAudioContext.createMediaStreamSource(stream);
 
 // Connect for analysis only, output is handled via <audio> element due to Browser media stream auto-routing features
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

 return <audio ref={audioRef} muted={true} autoPlay playsInline style={{ position: 'fixed', top: -1000, left: -1000, opacity: 0, width: 1, height: 1 }} />;
};
