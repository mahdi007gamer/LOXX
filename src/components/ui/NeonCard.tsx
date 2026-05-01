import React from "react";
import { cn } from "@/src/lib/utils";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "blue" | "pink" | "purple";
  hover?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export const NeonCard = ({
  className,
  variant = "blue",
  hover = true,
  children,
  ...props
}: NeonCardProps) => {
  const variants = {
    blue: "border-neon-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]",
    pink: "border-neon-pink/30 shadow-[0_0_15px_rgba(255,0,153,0.1)]",
    purple: "border-neon-purple/30 shadow-[0_0_15px_rgba(160,32,240,0.1)]",
  };

  const hoverVariants = {
    blue: "hover:border-neon-blue/60 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]",
    pink: "hover:border-neon-pink/60 hover:shadow-[0_0_25px_rgba(255,0,153,0.2)]",
    purple: "hover:border-neon-purple/60 hover:shadow-[0_0_25px_rgba(160,32,240,0.2)]",
  };

  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-xl border p-6 transition-all duration-500",
        variants[variant],
        hover && hoverVariants[variant],
        className
      )}
      {...props}
    >
      {/* Decorative corner glow */}
      <div className={cn(
        "absolute -right-12 -top-12 h-24 w-24 rounded-full blur-[60px] opacity-20",
        variant === "blue" && "bg-neon-blue",
        variant === "pink" && "bg-neon-pink",
        variant === "purple" && "bg-neon-purple"
      )} />
      
      {children}
    </div>
  );
};
