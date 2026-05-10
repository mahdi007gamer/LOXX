import React from "react";
import { motion } from "motion/react";
import { MessageSquare, Users, Gamepad2, Target, Trophy } from "lucide-react";

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0 }: { icon: any, delay?: number, x: number, y: number }) => {
  // Use pseudo-random duration based on coordinates and delay to avoid synchronous flashing
  const duration = 10 + (x % 5) + (y % 5);
  return (
    <motion.div
      initial={{ opacity: 0.1, filter: "drop-shadow(0px 0px 0px rgba(0,229,255,0))" }}
      animate={{ 
        opacity: [0.1, 0.25, 0.1],
        filter: [
          "drop-shadow(0px 0px 0px rgba(0,229,255,0))", 
          "drop-shadow(0px 0px 15px rgba(0,229,255,0.6))", 
          "drop-shadow(0px 0px 0px rgba(0,229,255,0))"
        ],
        y: [0, -20, 0], // Reduced movement for a more subtle effect
        rotate: [0, 4, -4, 0]
      }}
      transition={{ 
        duration, 
        delay, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute text-neon-blue -translate-x-1/2 -translate-y-1/2"
    >
      <Icon size={120} strokeWidth={0.5} />
    </motion.div>
  );
};

export const CyberGrid = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050508]">
      {/* Base Grid Layer - extremely subtle and focused */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 85%)'
        }}
      >
        <motion.div
          animate={{ 
            y: [0, 120],
          }}
          transition={{ 
            duration: 50, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-[-240px]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px',
          }}
        />
      </motion.div>

      {/* Floating Concepts - Minimal silhouettes */}
      <div className="absolute inset-0">
        <FloatingIcon icon={MessageSquare} x={10} y={20} delay={0} />
        <FloatingIcon icon={Users} x={80} y={15} delay={4} />
        <FloatingIcon icon={Gamepad2} x={20} y={70} delay={2} />
        <FloatingIcon icon={Target} x={85} y={65} delay={6} />
        <FloatingIcon icon={Trophy} x={50} y={85} delay={10} />
      </div>

      {/* Atmospheric Glows - Large scale, soft center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[800px] w-[800px] rounded-full bg-neon-blue/5 blur-[180px] animate-pulse" />
        <div className="absolute h-[1100px] w-[1100px] rounded-full bg-neon-purple/5 blur-[220px]" />
      </div>

      {/* Deep Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,8,1) 100%)]" />
      
      {/* Edge refinement into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#050508] to-transparent" />
    </div>
  );
};
