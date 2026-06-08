import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ className, label, error, icon, type, ...props }, ref) => {
 const [showPassword, setShowPassword] = useState(false);
 const isPassword = type === "password";

 return (
 <div className="w-full space-y-2">
 {label && (
 <label className="block px-1 text-sm font-black text-gray-400">
 {label}
 </label>
 )}
 <div className="relative flex items-center">
 {icon && (
 <div className="absolute right-4 text-gray-500 pointer-events-none">
 {icon}
 </div>
 )}
 <input
 ref={ref}
 type={isPassword ? (showPassword ? "text" : "password") : type}
 className={cn(
 "w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-white placeholder:text-gray-600 transition-all duration-300 focus:border-neon-blue/50 focus:outline-none shadow-inner",
 icon ? "pr-12 pl-4" : "px-4",
 isPassword ? "pl-12" : "",
 error && "border-neon-pink/50 focus:border-neon-pink/50 focus:ring-neon-pink/20",
 className
 )}
 {...props}
 />
 {isPassword && (
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute left-4 text-gray-500 hover:text-white transition-colors p-1"
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 )}
 </div>
 {error && (
 <p className="px-1 text-xs text-neon-pink">{error}</p>
 )}
 </div>
 );
 }
);

Input.displayName = "Input";
