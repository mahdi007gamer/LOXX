import React from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "blue" | "pink" | "purple" | "secondary";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  loading?: boolean;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "blue", size = "md", glow = true, loading, disabled, children, ...props }, ref) => {
    const variants = {
      blue: "bg-neon-blue text-dark-bg border-transparent shadow-[0_8px_32px_0_rgba(0,229,255,0.25)] hover:bg-neon-blue/90 hover:shadow-[0_12px_40px_0_rgba(0,229,255,0.35)]",
      pink: "bg-neon-pink text-dark-bg border-transparent shadow-[0_8px_32px_0_rgba(255,0,153,0.25)] hover:bg-neon-pink/90 hover:shadow-[0_12px_40px_0_rgba(255,0,153,0.35)]",
      purple: "bg-neon-purple text-dark-bg border-transparent shadow-[0_8px_32px_0_rgba(160,32,240,0.25)] hover:bg-neon-purple/90 hover:shadow-[0_12px_40px_0_rgba(160,32,240,0.35)]",
      secondary: "bg-white/5 text-white hover:bg-white/10 border-transparent shadow-none"
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
        disabled={loading || disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed uppercase font-black tracking-widest cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" /> : null}
        {children}
      </motion.button>
    );
  }
);

GlowButton.displayName = "GlowButton";
