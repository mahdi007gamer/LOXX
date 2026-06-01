import React, { useState, useEffect } from "react";
import { Minus, Square, Copy, X, ShieldAlert } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const ElectronTitlebar = () => {
 const { language, direction } = useLanguage();
 const isRtl = language === "fa";
 const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
 const [isMaximized, setIsMaximized] = useState(false);
   const [fps, setFps] = useState<number>(60);
  const [showFps, setShowFps] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loxx_show_fps") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "loxx_show_fps" && e.newValue !== null) {
        setShowFps(e.newValue === "true");
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

 useEffect(() => {
 let lastTime = performance.now();
 let frameCount = 0;
 let animationFrameId: number;

 const calcFps = (time: number) => {
 frameCount++;
 const now = time || performance.now();
 if (now >= lastTime + 1000) {
 const measuredFps = Math.round((frameCount * 1000) / (now - lastTime));
 setFps(measuredFps);
 frameCount = 0;
 lastTime = now;
 }
 animationFrameId = requestAnimationFrame(calcFps);
 };

 animationFrameId = requestAnimationFrame(calcFps);
 return () => {
 cancelAnimationFrame(animationFrameId);
 };
 }, []);

 useEffect(() => {
 if (!isElectron) return;
 const api = (window as any).electronAPI;

 if (api.onMaximizeStatusChange) {
 const unsubscribe = api.onMaximizeStatusChange((maximized: boolean) => {
 setIsMaximized(maximized);
 });
 return () => {
 if (unsubscribe) unsubscribe();
 };
 }
 }, [isElectron]);

 if (!isElectron) return null;

 const api = (window as any).electronAPI;

 const handleMinimize = () => {
 if (api.minimizeWindow) api.minimizeWindow();
 };

 const handleMaximize = () => {
 if (api.maximizeWindow) api.maximizeWindow();
 };

 const handleClose = () => {
 if (api.closeWindow) api.closeWindow();
 };

 return (
 <div 
 className="h-9 w-full bg-[#07070c] border-b border-white/5 fixed top-0 left-0 right-0 z-[99999] shrink-0 titlebar-drag select-none overflow-hidden"
 dir="ltr"
 >
 {/* Sleek Neon Accent Reflection Line */}
 <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-neon-pink/70 via-neon-blue/60 to-transparent opacity-80" />
 
 {/* Back glow decoration */}
 <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-80 h-12 bg-neon-pink/5 blur-xl pointer-events-none rounded-full" />

 {/* App Branding & Logo (Absolute Left for reliable Windows style integration) */}
 <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5 pointer-events-none select-none z-10 animate-fade-in">
 <div className="h-5 w-5 bg-gradient-to-tr from-neon-pink to-neon-blue rounded-lg flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(255,0,153,0.35)]">
 <img src="/logo.png" className="h-full w-auto object-contain" alt="L" />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 uppercase font-sans leading-none">
 LOXX CLIENT
 </span>
 <span className="text-[7px] text-gray-500 font-bold uppercase font-sans mt-0.5">
 {isRtl ? "کلاینت اختصاصی لوکس" : "Official Desktop Client"}
 </span>
 </div>
 <span className="text-[8px] bg-neon-pink/10 text-neon-pink border border-neon-pink/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1">
 ELITE LAUNCHER | Beta
 </span>
 <span className="text-[8px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1">
 v1.2.23
 </span>
 <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-md font-sans font-bold ml-1 animate-pulse">
 {isRtl ? "Beta | آزمایشی" : "Beta Edition"}
 </span>
 <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1 flex items-center gap-1">
 <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
 <span>{fps} FPS</span>
 </span>
 </div>

 {/* Client Status Info (Absolute Center - fully centered on Windows) */}
 <div 
 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none select-none text-[9px] text-gray-400 font-normal bg-white/5 border border-white/5 px-3 py-1 rounded-full z-10 shadow-[0_0_12px_rgba(255,0,127,0.03)]"
 dir={isRtl ? "rtl" : "ltr"}
 >
 <span className="h-1 w-1 rounded-full bg-orange-500 animate-pulse shrink-0" />
 <span className="text-white/90 font-normal">
 {isRtl 
 ? "لوکس | اولین پلتفرم پیشرفته گیمینگ فارسی " 
 : "LOXX | First Advanced Gaming Platform "}
 <span className="text-orange-400 font-extrabold mr-1 text-[8px] bg-orange-500/10 px-1 py-0.2 rounded border border-orange-500/10">BETA</span>
 </span>
 </div>

 {/* Windows Style Control Buttons (Absolute Right for standard Windows positioning) */}
 <div className="absolute right-0 top-0 h-full flex items-center titlebar-nodrag z-10">
 {/* Minimize */}
 <button 
 onClick={handleMinimize} 
 className="h-9 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all duration-150"
 title={isRtl ? "کمینه کردن (Minimize)" : "Minimize"}
 >
 <Minus size={13} className="stroke-[2.5]" />
 </button>

 {/* Maximize / Restore */}
 <button 
 onClick={handleMaximize} 
 className="h-9 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all duration-150"
 title={isMaximized 
 ? (isRtl ? "بازگردانی پنجره (Restore)" : "Restore Down") 
 : (isRtl ? "بزرگنمایی (Maximize)" : "Maximize")}
 >
 {isMaximized ? (
 <Copy size={11} className="stroke-[2.5] transform rotate-180" />
 ) : (
 <Square size={11} className="stroke-[2.5]" />
 )}
 </button>

 {/* Close */}
 <button 
 onClick={handleClose} 
 className="h-9 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 hover:shadow-[inset_0_0_8px_rgba(255,255,255,0.2)] transition-all duration-150 cursor-pointer"
 title={isRtl ? "بستن (Close)" : "Close"}
 >
 <X size={14} className="stroke-[2.5]" />
 </button>
 </div>
 </div>
 );
};
