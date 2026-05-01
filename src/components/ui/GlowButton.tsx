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
      blue: "bg-neon-blue/10 text-neon-blue border-neon-blue/50 hover:bg-neon-blue hover:text-dark-bg shadow-[0_0_15px_rgba(0,229,255,0.3)]",
      pink: "bg-neon-pink/10 text-neon-pink border-neon-pink/50 hover:bg-neon-pink hover:text-dark-bg shadow-[0_0_15px_rgba(255,0,153,0.3)]",
      purple: "bg-neon-purple/10 text-neon-purple border-neon-purple/50 hover:bg-neon-purple hover:text-dark-bg shadow-[0_0_15px_rgba(160,32,240,0.3)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-6 py-2.5 text-sm font-medium",
      lg: "px-8 py-3.5 text-base font-bold",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          glow && "hover:shadow-[0_0_25px_currentColor]",
          className
        )}
        {...props}
      />
    );
  }
);

GlowButton.displayName = "GlowButton";
