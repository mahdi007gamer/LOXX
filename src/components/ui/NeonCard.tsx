import React, { useRef, useState } from "react";
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "blue" | "pink" | "purple";
  hover?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key | null;
}

export const NeonCard = ({
  className,
  variant = "blue",
  hover = true,
  children,
  ...props
}: NeonCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    blue: "border-neon-blue/20 shadow-[0_0_15px_rgba(0,229,255,0.05)] bg-slate-950/40",
    pink: "border-neon-pink/20 shadow-[0_0_15px_rgba(255,0,153,0.05)] bg-slate-950/40",
    purple: "border-neon-purple/20 shadow-[0_0_15px_rgba(160,32,240,0.05)] bg-slate-950/40",
  };

  const glowColors = {
    blue: "border-neon-blue/50 shadow-[0_0_30px_rgba(0,229,255,0.2)] bg-white/[0.04]",
    pink: "border-neon-pink/50 shadow-[0_0_30px_rgba(255,0,153,0.2)] bg-white/[0.04]",
    purple: "border-neon-purple/50 shadow-[0_0_30px_rgba(160,32,240,0.2)] bg-white/[0.04]",
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass relative rounded-2xl border p-6 transition-all duration-300 gpu group cursor-default",
        variants[variant],
        hover && isHovered && glowColors[variant],
        hover && isHovered && "scale-[1.02] z-10",
        className
      )}
      {...props}
    >
      {/* Content wrapper - ensure pointer-events: auto is only on what needs interaction */}
      <div className="relative z-20 h-full">
        {children}
      </div>

      {/* Dynamic Glow Layer - pointer-events-none is CRITICAL */}
      <AnimatePresence>
        {hover && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 -z-10 blur-[40px] opacity-10 pointer-events-none",
              variant === "blue" && "bg-neon-blue",
              variant === "pink" && "bg-neon-pink",
              variant === "purple" && "bg-neon-purple"
            )}
          />
        )}
      </AnimatePresence>
      
      {/* Corner Details (Static) */}
      <div className={cn(
        "absolute -right-4 -top-4 h-12 w-12 rounded-full blur-[24px] opacity-10 pointer-events-none transition-opacity duration-300",
        isHovered ? "opacity-30" : "opacity-10",
        variant === "blue" && "bg-neon-blue",
        variant === "pink" && "bg-neon-pink",
        variant === "purple" && "bg-neon-purple"
      )} />
      
      {/* Top reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};
