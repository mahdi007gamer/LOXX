import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Input } from "../components/ui/Input";
import { 
  User, 
  Bell, 
  Shield, 
  Monitor, 
  Globe, 
  Eye, 
  Lock,
  Camera,
  Check
} from "lucide-react";
import { motion } from "motion/react";

export const SettingsPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-4xl">
           <header className="mb-10">
            <h1 className="text-3xl font-black text-white">تنظیمات</h1>
            <p className="text-gray-400">حساب کاربری و اولویت‌های خود را مدیریت کنید</p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
             {/* Tabs Navigation */}
             <div className="space-y-1 lg:col-span-1">
                {[
                  { icon: User, label: "پروفایل عمومی", active: true },
                  { icon: Shield, label: "امنیت", active: false },
                  { icon: Bell, label: "اعلان‌ها", active: false },
                  { icon: Monitor, label: "رابط کاربری", active: false },
                  { icon: Globe, label: "زبان و منطقه", active: false },
                ].map((tab, i) => (
                  <button 
                    key={i}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      tab.active 
                        ? 'bg-neon-blue/10 text-neon-blue' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
             </div>

             {/* Settings Content */}
             <div className="space-y-8 lg:col-span-3">
                <NeonCard variant="blue" className="space-y-8">
                   <div className="flex items-center gap-6">
                      <div className="group relative">
                        <div className="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                           <div className="flex h-full w-full items-center justify-center text-neon-blue">
                             <User size={40} />
                           </div>
                        </div>
                        <button className="absolute -bottom-2 -left-2 rounded-lg bg-neon-blue p-1.5 text-dark-bg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={14} />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">تصویر پروفایل</h3>
                        <p className="text-xs text-gray-400 mt-1">فرمت‌های JPG، PNG یا GIF. حداکثر ۲ مگابایت.</p>
                        <div className="mt-3 flex gap-3">
                           <GlowButton variant="blue" size="sm">تغییر آواتار</GlowButton>
                           <button className="text-xs text-gray-500 hover:text-neon-pink">حذف</button>
                        </div>
                      </div>
                   </div>

                   <hr className="border-white/5" />

                   <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                     <Input label="نام نمایشی" placeholder="Ali_Gamer_98" />
                     <Input label="آیدی یکتا" placeholder="aligamer" />
                     <div className="sm:col-span-2">
                       <label className="block px-1 text-sm font-medium text-gray-400 mb-2">درباره شما (Bio)</label>
                       <textarea 
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 transition-all focus:border-neon-blue/50 focus:outline-none h-32"
                        placeholder="کمی در مورد خودتان بنویسید..."
                       />
                     </div>
                   </div>

                   <hr className="border-white/5" />

                   <div>
                      <h4 className="font-bold text-white mb-4">شبکه‌های اجتماعی</h4>
                      <div className="space-y-4">
                        <Input placeholder="Discord Username" label="دیسکورد" />
                        <Input placeholder="@twitter_handle" label="توییتر" />
                      </div>
                   </div>

                   <div className="flex justify-end pt-4">
                      <GlowButton variant="blue" className="px-12">
                         ذخیره تغییرات
                      </GlowButton>
                   </div>
                </NeonCard>

                <NeonCard variant="pink" className="border-neon-pink/20">
                   <div className="flex items-center justify-between">
                     <div className="flex gap-4">
                       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon-pink/10 text-neon-pink">
                          <Eye size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-white">حالت ناشناس</h3>
                          <p className="text-xs text-gray-400 mt-1">فعالیت‌های شما در لابی‌ها برای دیگران نمایش داده نمی‌شود.</p>
                       </div>
                     </div>
                     <div className="h-6 w-12 rounded-full bg-white/10 relative p-1 cursor-pointer">
                        <div className="h-4 w-4 rounded-full bg-gray-500" />
                     </div>
                   </div>
                </NeonCard>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
