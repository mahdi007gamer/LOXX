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

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
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
    blue: "bg-neon-blue",
    pink: "bg-neon-pink",
    purple: "bg-neon-purple",
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "glass relative rounded-2xl border p-6 transition-all duration-300 gpu",
        variants[variant],
        isHovered && "border-opacity-50 z-10 scale-[1.01]",
        className
      )}
      {...props}
    >
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full">
        {children}
      </div>

      {/* Dynamic Glow */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 -z-10 blur-[40px] opacity-20",
              glowColors[variant]
            )}
          />
        )}
      </AnimatePresence>
      
      {/* Decorative corner glow (static) */}
      <div className={cn(
        "absolute -right-8 -top-8 h-20 w-20 rounded-full blur-[40px] opacity-10",
        variant === "blue" && "bg-neon-blue",
        variant === "pink" && "bg-neon-pink",
        variant === "purple" && "bg-neon-purple"
      )} />
    </motion.div>
  );
};
