import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, MicOff, AlertCircle, Eye, MonitorPlay } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GlowButton } from './ui/GlowButton';
import { useLanguage } from '../context/LanguageContext';

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
 const { language, t } = useLanguage();
 const isRtl = language === "fa";
 const videoRef = useRef<HTMLVideoElement>(null);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [isWatching, setIsWatching] = useState(isLocal); // Default local shares to auto-watched, remote demands action
 const containerRef = useRef<HTMLDivElement>(null);

 // Reset watching state when stream or isLocal changes to ensure fresh button prompt for new presenters
 useEffect(() => {
   setIsWatching(isLocal);
 }, [presenterName, isLocal]);

 // Bind media stream only if the user has opted in to watch (demand-driven active loading)
useEffect(() => {
  const video = videoRef.current;
  if (video && stream && isWatching) {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      const visualStream = new MediaStream(videoTracks);
      video.srcObject = visualStream;
    } else {
      video.srcObject = stream;
    }
    
    // Ensure absolute maximum mobile browser compatibility with explicit props
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("autoplay", "true");
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn("ScreenSharePresenter: Auto-play blocked. Adding touch fallbacks:", err);
        const forcePlay = () => {
          video.play().catch(e => console.warn("touch recovery fail", e));
          document.removeEventListener("click", forcePlay);
          document.removeEventListener("touchstart", forcePlay);
        };
        document.addEventListener("click", forcePlay);
        document.addEventListener("touchstart", forcePlay);
      });
    }

    // Smoothly scroll the screen share into view to focus on it
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [stream, isWatching]);

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
 "relative w-full rounded-2xl overflow-hidden bg-[#07070c] border shadow-2xl flex flex-col group transition-all duration-300",
 isWarningActive ? "border-yellow-500/50 shadow-yellow-500/10" : "border-white/5 hover:border-neon-pink/20 lg:min-h-[480px] md:min-h-[380px] min-h-[250px]",
 isFullscreen ? "h-screen rounded-none border-none" : ""
 )}
 >
 {isWatching ? (
 <>
 <video 
 ref={videoRef}
 autoPlay 
 playsInline
 muted // Prevent echoing local microphone sounds back into player
 className="w-full h-full xl:min-h-[480px] md:min-h-[380px] object-contain bg-black"
 />
 
 {/* Presenter info overlay */}
 <div className={cn("absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none", isRtl ? "flex-row-reverse" : "flex-row")}>
 <div className="flex items-center gap-3 bg-black/75 px-4 py-2 rounded-xl border border-white/10 pointer-events-auto select-none">
 <div className={isRtl ? "flex flex-col text-right" : "flex flex-col text-left"}>
 <span className="text-white font-bold text-xs">
 {isRtl ? `اسکرین شیر: ${isLocal ? t("host") : presenterName}` : `Screen Share: ${isLocal ? t("host") : presenterName}`}
 </span>
 <span className="text-neon-pink text-[9px] font-black uppercase mt-0.5 animate-pulse">
 LIVE
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 pointer-events-auto">
 {/* Option to stop watching and save bandwidth */}
 {!isLocal && (
 <button 
 onClick={() => setIsWatching(false)}
 className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 rounded-xl text-[10px] transition-colors cursor-pointer"
 dir={isRtl ? "rtl" : "ltr"}
 >
 {t("stopViewStream")}
 </button>
 )}
 <button 
 onClick={toggleFullscreen}
 className="p-2.5 bg-black/75 rounded-xl border border-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
 >
 {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
 </button>
 </div>
 </div>
 </>
 ) : (
 /* Sleek optimized preview placeholder (Demand-Based Loading) */
 <div className="flex flex-col items-center justify-center p-8 min-h-[350px] text-center space-y-5 relative my-auto">
 <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-tr from-[#ff007f]/5 via-transparent to-transparent opacity-80 pointer-events-none" />
 
 <div className="relative">
 <div className="absolute inset-0 bg-neon-pink/20 rounded-full blur-xl scale-125 animate-pulse" />
 <div className="h-16 w-16 bg-gradient-to-tr from-neon-pink to-pink-500 rounded-3xl flex items-center justify-center border border-neon-pink/30 relative z-10 text-white shadow-lg shadow-neon-pink/20">
 <MonitorPlay size={28} className="animate-pulse animate-bounce" />
 </div>
 </div>

 <div className="space-y-2 max-w-md relative z-10" dir={isRtl ? "rtl" : "ltr"}>
 <h3 className="text-sm font-black text-white">
 {isRtl ? `${presenterName} در حال اشتراک‌گذاری صفحه است` : `${presenterName} is sharing screen`}
 </h3>
 <p className="text-[11px] text-gray-400 leading-relaxed px-4">
 {isRtl 
 ? "برای کاهش مصرف حجم اینترنت، صرفه‌جویی در پهنای باند و حفظ پایداری کامل پینگ بازی، دریافت استریم فقط در صورت درخواست شما لود خواهد شد."
 : "To conserve bandwidth and preserve latency / game ping, stream content is only loaded when watched."}
 </p>
 </div>

 <div className="relative z-10">
 <GlowButton 
 variant="pink" 
 onClick={() => setIsWatching(true)}
 className="px-6 h-10 text-xs font-black flex items-center gap-2 rounded-xl font-mono uppercase "
 >
 <Eye size={14} className="shrink-0 animate-pulse" />
 <span>{t("viewLiveStream")}</span>
 </GlowButton>
 </div>
 </div>
 )}

 {/* Warning Banner */}
 {isWarningActive && isLocal && (
 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-1.5 rounded-xl font-bold flex items-center gap-2 text-xs shadow-xl border border-yellow-400 z-15" dir={isRtl ? "rtl" : "ltr"}>
 <AlertCircle size={14} className="shrink-0" />
 {t("streamWarningActive")}
 </div>
 )}
 </div>
 </motion.div>
 );
};
