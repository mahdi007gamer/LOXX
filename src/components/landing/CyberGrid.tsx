import React from "react";
import { motion } from "motion/react";

export const CyberGrid = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 3D Looking Grid */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 229, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 229, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          perspective: '1000px',
          transform: 'rotateX(60deg) translateY(-200px)',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <motion.div 
          animate={{ backgroundPositionY: [0, 40] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 229, 255, 0.15) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, rgba(0, 229, 255, 0.15) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-neon-blue"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              opacity: Math.random() * 0.5
            }}
            animate={{ 
              y: [null, "-20%"],
              opacity: [0, 0.8, 0] 
            }}
            transition={{ 
              duration: Math.random() * 10 + 5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Radial overlay for focal point */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,15,0.8)_80%)]" />
    </div>
  );
};
