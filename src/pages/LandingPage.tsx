import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Play, Zap, Users, Trophy } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { NeonCard } from "../components/ui/NeonCard";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 text-center sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-4 py-1.5 text-sm font-medium text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <Zap size={16} />
            <span>نسل جدید پلتفرم گیمینگ ایران</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-7xl">
            <span className="block text-white">دنیای هیجان در</span>
            <span className="neon-text-blue block drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">لوکس (LOXX)</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
            جامعه‌ای برای گیمرهای حرفه‌ای. لابی بسازید، با دوستانتان چت کنید و در رقابت‌های هیجان‌انگیز شرکت کنید.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth">
              <GlowButton variant="pink" size="lg" className="flex gap-2">
                <Play size={20} fill="currentColor" />
                <span>همین حالا شروع کنید</span>
              </GlowButton>
            </Link>
            <Link to="/lobbies">
              <GlowButton variant="blue" size="lg" className="flex gap-2">
                <Users size={20} />
                <span>مشاهده لابی‌ها</span>
              </GlowButton>
            </Link>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-blue/5 blur-[120px]" />
      </section>

      {/* Stats Section */}
      <section className="container mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-20 sm:grid-cols-3">
        {[
          { icon: Users, label: "بیش از ۱۰۰۰ گیمر فعال", color: "blue" as const },
          { icon: Zap, label: "پینگ بسیار پایین", color: "pink" as const },
          { icon: Trophy, label: "جوایز ماهانه ویژه", color: "purple" as const },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <NeonCard variant={stat.color} className="flex flex-col items-center gap-4 text-center">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg bg-white/5",
                stat.color === "blue" && "text-neon-blue",
                stat.color === "pink" && "text-neon-pink",
                stat.color === "purple" && "text-neon-purple",
              )}>
                <stat.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white">{stat.label}</h3>
            </NeonCard>
          </motion.div>
        ))}
      </section>

      {/* Feature Section Preview */}
      <section className="bg-white/2 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">قابلیت‌های منحصر به فرد</h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-neon-blue" />
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue">
                  <MessageSquareIcon size={20} />
                </div>
                <div>
                  <h4 className="mb-2 text-xl font-bold text-white">چت بلادرنگ</h4>
                  <p className="text-gray-400">با دوستانتان در محیطی کاملاً فارسی و به صورت لحظه‌ای گفتگو کنید.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-pink/10 text-neon-pink">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="mb-2 text-xl font-bold text-white">مدیریت لابی</h4>
                  <p className="text-gray-400">به سادگی لابی بسازید و دیگران را به بازی دعوت کنید.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <NeonCard variant="blue" className="h-full overflow-hidden p-0">
                <div className="aspect-video bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                   <Gamepad2 size={80} className="text-white/20 animate-pulse" />
                </div>
              </NeonCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");
import { MessageSquare as MessageSquareIcon, Gamepad2, Target } from "lucide-react";
