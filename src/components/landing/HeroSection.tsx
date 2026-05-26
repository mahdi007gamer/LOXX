import React from "react";
import { motion } from "motion/react";
import { Play, Zap, Gamepad2, Download } from "lucide-react";
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

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row mb-6 mt-12 w-full max-w-lg mx-auto whitespace-nowrap flex-nowrap">
          <Link to="/auth" className="w-full sm:w-1/2 shrink-0 whitespace-nowrap flex-nowrap">
            <GlowButton variant="pink" size="lg" className="group relative w-full overflow-hidden !rounded-2xl justify-center whitespace-nowrap flex-nowrap shrink-0">
              <span className="relative z-10 flex items-center gap-3 whitespace-nowrap flex-nowrap shrink-0">
                <Play size={20} fill="currentColor" className="shrink-0" />
                <span className="text-lg whitespace-nowrap shrink-0">همین حالا شروع کنید</span>
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </GlowButton>
          </Link>
          <Link to="/lobbies" className="w-full sm:w-1/2 shrink-0 whitespace-nowrap flex-nowrap">
            <GlowButton variant="blue" size="lg" className="group w-full !rounded-2xl text-lg backdrop-blur-md justify-center mt-4 sm:mt-0 whitespace-nowrap flex-nowrap shrink-0">
              <Gamepad2 size={24} className="ml-2 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="whitespace-nowrap shrink-0">اتاق‌های بازی</span>
            </GlowButton>
          </Link>
        </div>

        <div className="w-full max-w-lg mx-auto px-4 sm:px-0 mt-2">
          <Link to="/download" className="block w-full group">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
               <div className="relative w-full py-4 px-6 rounded-2xl bg-[#090b14]/90 border border-neon-blue/40 text-white font-black text-lg flex items-center justify-center gap-3 shadow-[0_4px_30px_rgba(0,229,255,0.15)] hover:shadow-[0_4px_45px_rgba(0,229,255,0.35)] hover:border-neon-pink transition-all duration-300 overflow-hidden">
                  {/* Glowing subtle ambient behind button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 via-transparent to-neon-blue/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Shiny Sweep Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.8,
                      ease: "linear"
                    }}
                  />

                  <Download size={20} className="text-neon-blue animate-bounce group-hover:text-neon-pink transition-colors duration-300" />
                  
                  <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent group-hover:from-neon-blue group-hover:to-teal-300 transition-all duration-500">
                    دریافت و دانلود اپلیکیشن لوکس
                  </span>
                  
                  <span className="text-[10px] bg-neon-blue/15 border border-neon-blue/30 text-neon-blue px-2 py-0.5 rounded-md font-bold group-hover:bg-neon-pink/15 group-hover:border-neon-pink/30 group-hover:text-neon-pink transition-colors">
                    آخرین نسخه
                  </span>
               </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Floating Particles or Circuits (Simulated) removed in favor of CyberGrid */}
    </section>
  );
};
