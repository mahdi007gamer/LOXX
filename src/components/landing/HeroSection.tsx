import React from "react";
import { motion } from "motion/react";
import { Play, Zap, Gamepad2 } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { Link } from "react-router-dom";

import { CyberGrid } from "./CyberGrid";

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center lg:py-32">
      <CyberGrid />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="container relative z-10 mx-auto max-w-5xl"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-6 py-2 text-sm font-black text-neon-blue shadow-[0_0_30px_rgba(0,229,255,0.2)] backdrop-blur-md"
        >
          <Zap size={18} className="animate-pulse" />
          <span className="tracking-widest uppercase">درگاه ورود به لوکس باز شد</span>
        </motion.div>
        
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="mb-8 flex flex-col items-center relative"
        >
          {/* Subtle Lightning / Power Effect */}
          <motion.div 
            animate={{ opacity: [0, 0.2, 0.5, 0, 0.1, 0] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.2, 0.25, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-transparent via-white to-transparent blur-[40px] opacity-0 mix-blend-overlay -rotate-12 pointer-events-none z-0"
          />
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-neon-blue/20 rounded-full blur-[80px] pointer-events-none z-0 mix-blend-screen"
          />
          
          <img 
            src="/logo.png" 
            alt="LOXX Logo" 
            className="relative z-10 w-full max-w-[300px] md:max-w-[500px] drop-shadow-[0_0_50px_rgba(0,229,255,0.4)] mb-4"
          />
          <h1 className="text-7xl font-black leading-[1.1] tracking-tighter text-white sm:text-8xl md:text-9xl lg:text-[11rem] hidden">
            <span className="block drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">لوکس</span>
            <span className="neon-text-blue block drop-shadow-[0_0_60px_rgba(0,229,255,0.9)]">LOXX</span>
          </h1>
        </motion.div>

        <div className="relative mx-auto mb-12 max-w-2xl px-4 py-6">
           {/* Cyberpunk brackets */}
           <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-neon-pink" />
           <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-neon-pink" />
           <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-neon-pink" />
           <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-neon-pink" />

           <p className="text-xl font-medium text-gray-300 md:text-2xl">
             به پیشرفته‌ترین پلتفرم گیمینگ فارسی خوش آمدید.
             <br />
             جایی که قهرمان‌ها متولد می‌شوند.
           </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link to="/auth">
            <GlowButton variant="pink" size="lg" className="group relative min-w-[200px] overflow-hidden !rounded-2xl">
              <span className="relative z-10 flex items-center gap-3">
                <Play size={20} fill="currentColor" />
                <span className="text-lg">همین حالا شروع کنید</span>
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </GlowButton>
          </Link>
          <Link to="/rooms">
            <GlowButton variant="blue" size="lg" className="group min-w-[200px] !rounded-2xl text-lg backdrop-blur-md">
              <Gamepad2 size={24} className="ml-2 group-hover:rotate-12 transition-transform" />
              <span>اتاق‌های بازی</span>
            </GlowButton>
          </Link>
        </div>
      </motion.div>

      {/* Floating Particles or Circuits (Simulated) removed in favor of CyberGrid */}
    </section>
  );
};
