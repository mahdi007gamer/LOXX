import React from "react";
import { cn } from "@/src/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block px-1 text-sm font-medium text-gray-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 transition-all duration-300 focus:border-neon-blue/50 focus:outline-none focus:ring-2 focus:ring-neon-blue/20",
            error && "border-neon-pink/50 focus:border-neon-pink/50 focus:ring-neon-pink/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="px-1 text-xs text-neon-pink">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
