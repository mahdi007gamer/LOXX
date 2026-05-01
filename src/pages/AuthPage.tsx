import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonCard } from "../components/ui/NeonCard";
import { Input } from "../components/ui/Input";
import { GlowButton } from "../components/ui/GlowButton";
import { Gamepad2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Decorative blur backgrounds */}
        <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-neon-blue/10 blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 -z-10 h-64 w-64 rounded-full bg-neon-pink/10 blur-[80px]" />

        <NeonCard variant={isLogin ? "blue" : "pink"}>
          <div className="mb-8 text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white/5 shadow-lg transition-colors duration-500 ${isLogin ? 'border-neon-blue/50 text-neon-blue' : 'border-neon-pink/50 text-neon-pink'}`}>
              <Gamepad2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-white">
              {isLogin ? "ورود به حساب کاربری" : "ثبت‌نام در لوکس"}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {isLogin 
                ? "خوش آمدید! مشخصات خود را وارد کنید" 
                : "به جمع هزاران گیمر حرفه‌ای بپیوندید"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <Input 
                label="نام کاربری" 
                placeholder="Gamer123" 
                icon={<User size={18} />} 
              />
            )}
            <Input 
              label="ایمیل" 
              type="email" 
              placeholder="example@gmail.com" 
              icon={<Mail size={18} />} 
            />
            <Input 
              label="رمز عبور" 
              type="password" 
              placeholder="••••••••" 
              icon={<Lock size={18} />} 
            />
            
            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-neon-blue hover:underline">
                  فراموشی رمز عبور؟
                </button>
              </div>
            )}

            <GlowButton 
              variant={isLogin ? "blue" : "pink"} 
              className="w-full"
              size="lg"
            >
              {isLogin ? "ورود به لابی" : "ساخت اکانت"}
            </GlowButton>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-sm text-gray-400">
              {isLogin ? "هنوز عضو نشده‌اید؟" : "قبلاً ثبت‌نام کرده‌اید؟"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className={`mr-2 font-bold transition-colors ${isLogin ? 'text-neon-pink hover:text-neon-pink/80' : 'text-neon-blue hover:text-neon-blue/80'}`}
              >
                {isLogin ? "ایجاد حساب کاربری" : "ورود به حساب"}
              </button>
            </p>
          </div>
        </NeonCard>
      </div>
    </div>
  );
};
