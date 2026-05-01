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
    blue: "border-neon-blue/20 bg-slate-950/40",
    pink: "border-neon-pink/20 bg-slate-950/40",
    purple: "border-neon-purple/20 bg-slate-950/40",
  };

  const glowColors = {
    blue: "border-neon-blue/40 shadow-[0_8px_20px_-5px_rgba(0,229,255,0.12),0_10px_20px_rgba(0,0,0,0.5)] bg-white/[0.02]",
    pink: "border-neon-pink/40 shadow-[0_8px_20px_-5px_rgba(255,0,153,0.12),0_10px_20px_rgba(0,0,0,0.5)] bg-white/[0.02]",
    purple: "border-neon-purple/40 shadow-[0_8px_20px_-5px_rgba(160,32,240,0.12),0_10px_20px_rgba(0,0,0,0.5)] bg-white/[0.02]",
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass relative rounded-2xl border p-6 transition-all duration-250 ease-out gpu group cursor-default",
        variants[variant],
        hover && isHovered && glowColors[variant],
        hover && isHovered && "scale-[1.02] -translate-y-[4px] z-10",
        className
      )}
      {...props}
    >
      {/* Content wrapper */}
      <div className="relative z-20 h-full">
        {children}
      </div>

      {/* Decorative Corner Glow (Subtle) */}
      <div className={cn(
        "absolute -right-2 -top-2 h-8 w-8 rounded-full blur-[12px] pointer-events-none transition-opacity duration-500",
        isHovered ? "opacity-15" : "opacity-0",
        variant === "blue" && "bg-neon-blue",
        variant === "pink" && "bg-neon-pink",
        variant === "purple" && "bg-neon-purple"
      )} />
      
      {/* Top reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};
