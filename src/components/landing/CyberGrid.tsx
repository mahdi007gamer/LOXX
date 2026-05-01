import React from "react";
import { motion } from "motion/react";

export const CyberGrid = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Grid Layer - cyan primary */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      >
        <motion.div
          animate={{ 
            y: [0, 80],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-[-160px]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </motion.div>

      {/* Secondary Ambient Grid - pink accents */}
      <motion.div
        animate={{ 
          y: [0, -160],
          x: [0, -40]
        }}
        transition={{ 
          duration: 35, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-[-200px] opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 0, 153, 0.12) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(255, 0, 153, 0.12) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '240px 240px',
        }}
      />

      {/* Hero Focal Point Glow - Highlighting the title area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[600px] w-[600px] rounded-full bg-neon-blue/25 blur-[120px] animate-pulse opacity-60" />
        <div className="absolute h-[900px] w-[900px] rounded-full bg-neon-purple/10 blur-[180px] opacity-40" />
      </div>

      {/* Radial fade to edges - essential for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,8,0.7) 70%, rgba(5,5,8,0.9) 100%)]" />

      {/* Very subtle Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_50%,transparent_50%)] bg-[length:100%_4px] opacity-20" />
    </div>
  );
};
