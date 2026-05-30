import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, MicOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const ScreenSharePresenter = ({
  stream,
  presenterName,
  isLocal,
  isWarningActive
}: {
  stream: MediaStream;
  presenterName: string;
  isLocal: boolean;
  isWarningActive?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to handle fullscreen: ", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, height: 0 }}
      animate={{ opacity: 1, scale: 1, height: 'auto' }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      className="w-full mb-6"
    >
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full rounded-3xl overflow-hidden bg-black border shadow-2xl flex flex-col group",
          isWarningActive ? "border-yellow-500/50 shadow-yellow-500/20" : "border-neon-blue/30 lg:h-[600px] md:h-[400px] h-[250px]",
          isFullscreen ? "h-screen rounded-none border-none" : ""
        )}
      >
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted // If local, we don't want to hear our own desktop audio again, if remote, it might have audio track
          className="w-full h-full object-contain"
        />
        
        {/* Presenter info overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm">
                اسکرین شیر: {isLocal ? "شما" : presenterName}
              </span>
              <span className="text-neon-blue text-[10px] font-black uppercase tracking-widest">
                LIVE
              </span>
            </div>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto opacity-0 group-hover:opacity-100"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Warning Banner */}
        {isWarningActive && isLocal && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-xl backdrop-blur-md border border-yellow-400">
            <AlertCircle size={16} />
            شبکه شما ناپایدار است. ممکن است اسکرین شیر متوقف شود.
          </div>
        )}
      </div>
    </motion.div>
  );
};
