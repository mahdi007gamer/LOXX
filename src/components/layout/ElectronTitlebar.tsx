import React, { useState, useEffect } from "react";
import { Minus, Square, Copy, X, ShieldAlert } from "lucide-react";

export const ElectronTitlebar = () => {
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);

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
      className="h-10 w-full bg-[#07070c] border-b border-white/5 flex items-center justify-between px-4 select-none fixed top-0 left-0 right-0 z-[99999] shrink-0 titlebar-drag relative overflow-hidden"
      dir="rtl"
    >
      {/* Sleek Neon Accent Reflection Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-neon-pink/70 via-neon-blue/60 to-transparent opacity-80" />
      
      {/* Back glow decoration */}
      <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-80 h-10 bg-neon-pink/5 blur-xl pointer-events-none rounded-full" />

      {/* App Branding & Logo */}
      <div className="flex items-center gap-2.5 pointer-events-none select-none relative z-10 animate-fade-in">
        <div className="h-5 w-5 bg-gradient-to-tr from-neon-pink to-neon-blue rounded-lg flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(255,0,153,0.35)]">
          <img src="/logo.png" className="h-full w-auto object-contain" alt="L" />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 uppercase font-sans leading-none">
            LOXX CLIENT
          </span>
          <span className="text-[7.5px] text-gray-500 font-bold tracking-wider uppercase font-sans mt-0.5">
            کلاینت اختصاصی لوکس
          </span>
        </div>
        <span className="text-[8px] bg-neon-pink/10 text-neon-pink border border-neon-pink/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1.5">
          ELITE LAUNCHER
        </span>
      </div>

      {/* Client Status Info (Subtle decorative middle element) */}
      <div className="hidden md:flex items-center gap-2 pointer-events-none select-none text-[9px] text-gray-400 font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-full relative z-10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
        <span>بستر امن چت صوتی و لابی بازی</span>
      </div>

      {/* Windows Style Control Buttons */}
      <div className="flex items-center titlebar-nodrag shrink-0 relative z-10" dir="ltr">
        {/* Minimize */}
        <button 
          onClick={handleMinimize} 
          className="h-10 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all duration-150"
          title="کمینه کردن (Minimize)"
        >
          <Minus size={13} className="stroke-[2.5]" />
        </button>

        {/* Maximize / Restore */}
        <button 
          onClick={handleMaximize} 
          className="h-10 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all duration-150"
          title={isMaximized ? "بازگردانی پنجره (Restore)" : "بزرگنمایی (Maximize)"}
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
          className="h-10 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 hover:shadow-[inset_0_0_8px_rgba(255,255,255,0.2)] transition-all duration-150 cursor-pointer"
          title="بستن (Close)"
        >
          <X size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
