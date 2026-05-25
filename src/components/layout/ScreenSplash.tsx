import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export const ScreenSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.2");

  useEffect(() => {
    // Determine live launcher version dynamically in desktop mode
    const win = window as any;
    if (win.electronAPI && typeof win.electronAPI.getAppVersion === 'function') {
      win.electronAPI.getAppVersion()
        .then((ver: string) => {
          if (ver) {
            setAppVersion(ver);
          }
        })
        .catch((err: any) => console.log("Failed to fetch launcher version:", err));
    }
  }, []);

  useEffect(() => {
    let hasUpdated = false;
    const handleUpdate = (e: Event) => {
      setIsUpdating(true);
      hasUpdated = true;
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.update) {
        setTimeout(() => customEvent.detail.update(), 1000);
      }
    };
    window.addEventListener('app-update-available', handleUpdate);

    // Animate progress bar smoothly over 2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Slightly random steps for realistic loading feel
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + step, 100);
      });
    }, 80);

    // Fade out splash screen after progress completes
    const timeout = setTimeout(() => {
      if (!hasUpdated) {
        onComplete();
      }
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('app-update-available', handleUpdate);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 bg-[#040408] z-[999999] flex flex-col items-center justify-center select-none overflow-hidden"
      dir="rtl"
    >
      {/* Visual background decorations */}
      <div className="absolute top-[20%] left-[-10%] w-[45%] h-[45%] bg-neon-blue/15 rounded-full blur-[130px]" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-neon-pink/15 rounded-full blur-[130px]" />
      
      {/* Subtle scanline overlay for retro-futuristic arcade vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Glowing Logo Frame with custom entry animations */}
        <motion.div 
          initial={{ scale: 0.75, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            delay: 0.1
          }}
          className="relative mb-8"
        >
          {/* Intense back glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-pink rounded-3xl blur-2xl opacity-45 scale-110 animate-pulse" />
          
          <div className="relative h-28 w-28 bg-[#0a0a14] border border-white/10 p-4 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex items-center justify-center">
            <img 
              src="/logo.png" 
              className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,0,127,0.6)] animate-pulse" 
              alt="Loxx Logo" 
            />
          </div>
        </motion.div>

        {/* Branding Titles */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-2 mb-10"
        >
          <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 uppercase leading-none font-sans">
            LOXX CLIENT
          </h1>
          <p className="text-sm font-black text-neon-blue tracking-wider uppercase font-sans">
            لوکس | اولین پلتفرم پیشرفته گیمینگ فارسی
          </p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            بستر امن چت صوتی و لابی بازی‌ها
          </p>
        </motion.div>

        {/* Progress bar structure */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-48 space-y-2.5"
        >
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className="h-full bg-gradient-to-l from-neon-blue to-neon-pink shadow-[0_0_12px_rgba(0,229,255,0.8)] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[9px] text-gray-400 font-black font-sans uppercase">
            <span className={isUpdating ? "text-neon-blue animate-pulse" : "text-neon-pink"}>{isUpdating ? "UPDATING" : `${progress}%`}</span>
            <span className="animate-pulse">{isUpdating ? "در حال دریافت آپدیت جدید لوکس..." : "در حال اتصال به شبکه لوکس..."}</span>
          </div>
        </motion.div>
      </div>

      {/* Decorative absolute corner codes for geeky look */}
      <div className="absolute bottom-4 right-6 text-[8px] text-gray-600 font-mono select-none pointer-events-none">
        CONNECTING GATEWAY: LIVE
      </div>
      <div className="absolute bottom-4 left-6 text-[8px] text-gray-600 font-mono select-none pointer-events-none">
        VERSION {appVersion} (ELITE)
      </div>
    </div>
  );
};
