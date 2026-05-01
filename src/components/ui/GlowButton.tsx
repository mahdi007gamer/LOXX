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
      blue: "bg-neon-blue text-dark-bg border-transparent shadow-[0_10px_20px_-8px_rgba(0,0,0,0.8)] hover:bg-neon-blue/90 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.9)]",
      pink: "bg-neon-pink text-dark-bg border-transparent shadow-[0_10px_20px_-8px_rgba(0,0,0,0.8)] hover:bg-neon-pink/90 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.9)]",
      purple: "bg-neon-purple text-dark-bg border-transparent shadow-[0_10px_20px_-8px_rgba(0,0,0,0.8)] hover:bg-neon-purple/90 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.9)]",
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
