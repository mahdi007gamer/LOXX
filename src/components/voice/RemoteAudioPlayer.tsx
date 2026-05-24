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
      audioRef.current.play().catch(e => console.warn("AutoPlay blocked:", e));
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
  }, [outputDeviceId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(volumeLevel / 100, 0), 1);
    }
  }, [volumeLevel]);

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
        const analyzeVoice = () => {
          const tracks = stream.getAudioTracks();
          if (tracks.length > 0 && tracks[0].enabled) {
            analyzer.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            const currentVol = Math.min(100, Math.round(avg * 2.5));
            
            if (Math.abs(currentVol - lastVol) > 25 || (currentVol === 0 && lastVol !== 0) || (currentVol > 10 && lastVol === 0)) {
              lastVol = currentVol;
              onVolumeChange(currentVol);
            }
          } else if (lastVol !== 0) {
            lastVol = 0;
            onVolumeChange(0);
          }
          rafId = requestAnimationFrame(analyzeVoice);
        };
        analyzeVoice();
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

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
};
