import React, { useState } from "react";
import { cn } from "@/src/lib/utils";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "blue" | "pink" | "purple" | "green" | "red";
  hover?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key | null;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
    blue: "border-white/10 bg-[#0a0a0f]",
    pink: "border-white/10 bg-[#0a0a0f]",
    purple: "border-white/10 bg-[#0a0a0f]",
    green: "border-white/10 bg-[#0a0a0f]",
    red: "border-white/10 bg-[#0a0a0f]",
  };

  const glowColors = {
    blue: "border-neon-blue/50 shadow-[0_4px_20px_rgba(0,186,255,0.1)]",
    pink: "border-neon-pink/50 shadow-[0_4px_20px_rgba(255,46,155,0.1)]",
    purple: "border-neon-purple/50 shadow-[0_4px_20px_rgba(182,31,255,0.1)]",
    green: "border-green-500/50 shadow-[0_4px_20px_rgba(34,197,94,0.1)]",
    red: "border-red-500/50 shadow-[0_4px_20px_rgba(239,68,68,0.1)]",
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass relative rounded-2xl border p-6 transition-all duration-250 ease-out group cursor-default",
        variants[variant],
        hover && isHovered && glowColors[variant],
        hover && isHovered && "scale-[1.02] -translate-y-1 z-10",
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
        variant === "purple" && "bg-neon-purple",
        variant === "green" && "bg-green-500",
        variant === "red" && "bg-red-500"
      )} />
      
      {/* Top reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};
