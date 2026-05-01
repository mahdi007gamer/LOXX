import React from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "blue" | "pink" | "purple";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "blue", size = "md", glow = true, ...props }, ref) => {
    const variants = {
      blue: "bg-neon-blue/10 text-neon-blue border-neon-blue/40 shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:bg-neon-blue hover:text-dark-bg hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]",
      pink: "bg-neon-pink/10 text-neon-pink border-neon-pink/40 shadow-[0_0_15px_rgba(255,0,153,0.1)] hover:bg-neon-pink hover:text-dark-bg hover:shadow-[0_0_15px_rgba(255,0,153,0.3)]",
      purple: "bg-neon-purple/10 text-neon-purple border-neon-purple/40 shadow-[0_0_15px_rgba(160,32,240,0.1)] hover:bg-neon-purple hover:text-dark-bg hover:shadow-[0_0_15px_rgba(160,32,240,0.3)]",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm font-black tracking-widest",
      lg: "px-10 py-4 text-base font-black tracking-widest",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed uppercase font-black tracking-widest cursor-pointer gpu",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

GlowButton.displayName = "GlowButton";
