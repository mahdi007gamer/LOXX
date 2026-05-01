import React from "react";
import { motion } from "motion/react";

export const CyberGrid = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Grid Layer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(160, 32, 240, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      >
        <motion.div
          animate={{ 
            y: [0, 100],
            x: [0, 50]
          }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-[-200px]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </motion.div>

      {/* Secondary Accent Grid */}
      <motion.div
        animate={{ 
          y: [0, -160],
          x: [0, -80]
        }}
        transition={{ 
          duration: 45, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-[-200px] opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 0, 153, 0.05) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(255, 0, 153, 0.05) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Hero Focal Point Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-neon-blue/10 blur-[120px] animate-pulse" />
        <div className="absolute h-[800px] w-[800px] rounded-full bg-neon-purple/5 blur-[160px]" />
      </div>

      {/* Radial fade to edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(5,5,8,0.8)_100%)]" />

      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,229,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] opacity-20" />
    </div>
  );
};
