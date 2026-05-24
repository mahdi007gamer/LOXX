import React, { useState, useEffect } from "react";
import { Minus, Square, X, RefreshCw } from "lucide-react";

export const ElectronTitlebar = () => {
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

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
      className="h-10 w-full bg-[#07070a] border-b border-white/5 flex items-center justify-between px-4 select-none fixed top-0 left-0 right-0 z-[99999] shrink-0"
      style={{ WebkitAppRegion: "drag" } as any}
      dir="rtl"
    >
      {/* App Branding & Logo */}
      <div className="flex items-center gap-2 pointer-events-none select-none">
        <div className="h-5 w-5 bg-gradient-to-tr from-neon-pink to-neon-blue rounded-lg flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(255,0,127,0.3)]">
          <img src="/logo.png" className="h-full w-auto object-contain" alt="L" />
        </div>
        <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 uppercase font-sans">
          LOXX LAUNCHER
        </span>
        <span className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-md border border-white/5 font-mono">
          v1.0.0
        </span>
      </div>

      {/* Windows Style Control Buttons */}
      <div className="flex items-center" style={{ WebkitAppRegion: "no-drag" } as any}>
        {/* Minimize */}
        <button 
          onClick={handleMinimize} 
          className="h-10 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="کمینه کردن (Minimize)"
        >
          <Minus size={14} />
        </button>

        {/* Maximize */}
        <button 
          onClick={handleMaximize} 
          className="h-10 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="بزرگنمایی (Maximize)"
        >
          <Square size={12} />
        </button>

        {/* Close (Standard Red Close indicator) */}
        <button 
          onClick={handleClose} 
          className="h-10 w-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/95 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
          title="بستن (Close)"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
