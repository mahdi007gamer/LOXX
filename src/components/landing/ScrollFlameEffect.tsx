import React from "react";
import { useScroll, useTransform, motion } from "motion/react";

export const ScrollFlameEffect = () => {
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to opacity/scale/position of flame lines
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const dashOffset = useTransform(scrollYProgress, [0, 1], [1000, 0]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <motion.div style={{ opacity }} className="h-full w-full">
        {/* Right Edge Flame */}
        <div className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-neon-pink to-transparent">
          <div className="h-full w-full shadow-[0_0_15px_rgba(255,0,153,0.8),0_0_30px_rgba(255,0,153,0.4)]" />
        </div>
        
        {/* Left Edge Flame */}
        <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-neon-blue to-transparent">
          <div className="h-full w-full shadow-[0_0_15px_rgba(0,229,255,0.8),0_0_30px_rgba(0,229,255,0.4)]" />
        </div>

        {/* Moving plasma particles along edges */}
        <motion.div 
          animate={{ y: ["0%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute right-0 top-0 h-32 w-1 bg-white blur-sm opacity-50" 
        />
        <motion.div 
          animate={{ y: ["100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 top-0 h-32 w-1 bg-white blur-sm opacity-50" 
        />
      </motion.div>
    </div>
  );
};
