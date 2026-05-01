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
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { damping: 20, stiffness: 150 });
  const mouseYSpring = useSpring(y, { damping: 20, stiffness: 150 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !hover) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    if (hover) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const variants = {
    blue: "border-neon-blue/20 shadow-[0_0_15px_rgba(0,229,255,0.05)] bg-neon-blue/[0.02]",
    pink: "border-neon-pink/20 shadow-[0_0_15px_rgba(255,0,153,0.05)] bg-neon-pink/[0.02]",
    purple: "border-neon-purple/20 shadow-[0_0_15px_rgba(160,32,240,0.05)] bg-neon-purple/[0.02]",
  };

  const glowColors = {
    blue: "shadow-[0_0_50px_rgba(0,229,255,0.3)] border-neon-blue/50",
    pink: "shadow-[0_0_50px_rgba(255,0,153,0.3)] border-neon-pink/50",
    purple: "shadow-[0_0_50px_rgba(160,32,240,0.3)] border-neon-purple/50",
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "glass relative rounded-2xl border p-6 transition-all duration-300 gpu group",
        variants[variant],
        isHovered && glowColors[variant],
        isHovered && "scale-[1.02] bg-white/[0.04] z-10",
        className
      )}
      {...props}
    >
      <div 
        style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} 
        className="relative z-10 h-full pointer-events-none"
      >
        <div className="pointer-events-auto h-full">
          {children}
        </div>
      </div>

      {/* Dynamic Glow Background */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute inset-0 -z-10 blur-[40px] opacity-20",
              variant === "blue" && "bg-neon-blue",
              variant === "pink" && "bg-neon-pink",
              variant === "purple" && "bg-neon-purple"
            )}
          />
        )}
      </AnimatePresence>
      
      {/* Decorative corner glow (static) - pointer-events-none to prevent flickering */}
      <div className={cn(
        "absolute -right-8 -top-8 h-20 w-20 rounded-full blur-[40px] opacity-10 pointer-events-none",
        variant === "blue" && "bg-neon-blue",
        variant === "pink" && "bg-neon-pink",
        variant === "purple" && "bg-neon-purple"
      )} />
      
      {/* Subtle border shine effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};
