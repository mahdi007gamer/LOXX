import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { 
  User, 
  Bell, 
  Shield, 
  Monitor, 
  Globe, 
  Lock,
  Camera,
  MessageSquare,
  Zap,
  Volume2,
  Eye,
  Smartphone,
  Languages,
  MapPin,
  Clock,
  Heart,
  Crown,
  ArrowRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

type SettingsTab = "profile" | "security" | "notifications" | "ui" | "region";

export const SettingsPage = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    receiveFriendRequests: true,
    receiveLobbyInvites: true,
    showMentionAlerts: true,
    theme: "dark",
    language: "fa",
    showOnlineStatus: true,
    reduceAnimations: false
  });

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    username: "",
    avatarUrl: "",
    region: "Middle East",
    language: "Persian",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchUserData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await api.patch("/settings", { [key]: value });
    } catch (err) {
      toast.error("خطا در بروزرسانی تنظیمات");
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await api.get("/auth/me");
      const user = res.data.data;
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || "",
        bio: user.bio || "",
        username: user.username || "",
        avatarUrl: user.profile?.avatarUrl || user.avatarUrl || "",
        region: user.region || "Middle East",
      }));
    } catch (err) {
      toast.error("خطا در دریافت اطلاعات کاربر");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/user/profile", {
        display_name: formData.displayName,
        bio: formData.bio,
        region: formData.region,
        avatarUrl: formData.avatarUrl
      });
      toast.success("پروفایل با موفقیت بروزرسانی شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در بروزرسانی");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("رمز عبور جدید و تکرار آن مطابقت ندارند");
    }
    setSaving(true);
    try {
      await api.patch("/user/security/password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در تغییر رمز عبور");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    ...(authUser?.membership === "VIP" ? [{ id: "elite" as any, icon: Crown, label: "Elite Settings" }] : []),
    { id: "profile", icon: User, label: "پروفایل عمومی" },
    { id: "security", icon: Shield, label: "امنیت" },
    { id: "notifications", icon: Bell, label: "اعلان‌ها" },
    { id: "ui", icon: Monitor, label: "رابط کاربری" },
    { id: "region", icon: Globe, label: "زبان و منطقه" },
  ] as const;

  const renderProfile = () => (
    <div className="space-y-6">
      {authUser?.membership === "VIP" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group cursor-pointer mb-8"
          onClick={() => window.location.href = "/settings/elite"}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <NeonCard variant="gold" className="relative transition-transform group-hover:scale-[1.01] overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown size={120} />
             </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-[20px] bg-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-xl shadow-yellow-400/10 transition-transform group-hover:rotate-6">
                  <Crown size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight">تنظیمات نخبگان (Elite Settings)</h3>
                  <p className="text-[10px] text-yellow-400/70 font-bold uppercase tracking-[0.2em] mt-1">شخصی‌سازی پیشرفته مینی‌پروفایل، فریم‌ها و افکت‌های VIP</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full border border-yellow-400/30 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
                <ArrowRight className="text-yellow-400 -rotate-45 group-hover:rotate-0 transition-transform" />
              </div>
            </div>
          </NeonCard>
        </motion.div>
      )}

      <NeonCard variant="blue" className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="group relative">
            <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neon-blue">
                  <User size={40} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-white italic">تصویر پروفایل</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 mb-3">تصویر خود را آپلود کنید یا لینک آن را وارد کنید.</p>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Input 
                  label="لینک تصویر (آدرس آنلاین)"
                  placeholder="https://example.com/avatar.png"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData(p => ({ ...p, avatarUrl: e.target.value }))}
                />
              </div>
              <div className="flex-none">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  id="avatar-upload"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const data = new FormData();
                      data.append("file", file);
                      try {
                        const res = await api.post("/upload", data, {
                          headers: { "Content-Type": "multipart/form-data" }
                        });
                        if (res.data.url) {
                          setFormData(p => ({ ...p, avatarUrl: res.data.url }));
                          toast.success("تصویر با موفقیت آپلود شد");
                        } else {
                          toast.error("خطا در دریافت تصویر آپلود شده");
                        }
                      } catch (err: any) {
                        toast.error(err.response?.data?.error?.message || "خطا در آپلود تصویر");
                      }
                    }
                  }}
                />
                <label htmlFor="avatar-upload" className="h-[46px] px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black italic cursor-pointer hover:bg-white/10 hover:border-neon-blue/30 transition-all text-white shrink-0">
                  <Camera size={16} className="ml-2" />
                  آپلود تصویر
                </label>
              </div>
            </div>
            <div className="mt-2 text-right">
              <button onClick={() => setFormData(p => ({ ...p, avatarUrl: "" }))} className="text-[10px] text-gray-600 font-black uppercase italic hover:text-neon-pink transition-colors">حذف تصویر</button>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input 
             label="نام نمایشی" 
             placeholder="Ali_Gamer_98" 
             value={formData.displayName}
             onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
          />
          <Input 
             label="آیدی یکتا (Handle)" 
             placeholder="aligamer" 
             value={formData.username}
             disabled
          />
          <div className="sm:col-span-2">
            <label className="block px-1 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">درباره شما (Bio)</label>
            <textarea 
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-700 transition-all focus:border-neon-blue/50 focus:outline-none h-32 resize-none"
              placeholder="کمی در مورد خودتان، بازی‌هایی که دوست دارید و ... بنویسید"
              value={formData.bio}
              onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <GlowButton 
             variant="blue" 
             className="px-10 h-10 text-[11px] font-black uppercase italic"
             onClick={handleSaveProfile}
             disabled={saving}
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات پروفایل"}
          </GlowButton>
        </div>
      </NeonCard>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <NeonCard variant="purple" className="space-y-8">
        <div>
          <h3 className="font-black text-white italic mb-1">تغییر رمز عبور</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 italic">برای امنیت بیشتر از رمزهای طولانی استفاده کنید</p>
          <div className="space-y-6 max-w-md">
            <Input 
               label="رمز عبور فعلی" 
               type="password" 
               value={formData.currentPassword}
               onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input 
               label="رمز عبور جدید" 
               type="password" 
               value={formData.newPassword}
               onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
            />
            <Input 
               label="تکرار رمز عبور جدید" 
               type="password" 
               value={formData.confirmPassword}
               onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
            />
          </div>
          <div className="mt-6">
            <GlowButton 
               variant="purple" 
               className="px-10 h-10 text-[11px] font-black uppercase italic"
               onClick={handlePasswordChange}
               disabled={saving}
            >
              {saving ? "در حال تغییر..." : "به‌روزرسانی رمز عبور"}
            </GlowButton>
          </div>
        </div>
        
        <hr className="border-white/5" />

        <div>
          <h3 className="font-black text-white italic mb-1 flex items-center gap-2">
            تایید دو مرحله‌ای <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded uppercase not-italic">غیرفعال</span>
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-4 italic">یک لایه امنیتی اضافی به حساب خود اضافه کنید</p>
          <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase italic h-9 px-6 border-none">فعال‌سازی 2FA</GlowButton>
        </div>

        <hr className="border-white/5" />

        <div>
          <h3 className="font-black text-white italic mb-4">دستگاه‌های متصل</h3>
          <div className="space-y-3">
             {[
               { device: "Windows Desktop", location: "Tehran, Iran", current: true },
               { device: "iPhone 13", location: "Karaj, Iran", current: false }
             ].map((session, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neon-blue transition-colors">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white italic flex items-center gap-2">
                        {session.device}
                        {session.current && <span className="text-[8px] text-neon-blue uppercase">فعلی</span>}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold">{session.location}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="text-[10px] font-black text-neon-pink uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">خروج</button>
                  )}
               </div>
             ))}
          </div>
        </div>
      </NeonCard>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <NeonCard variant="blue" className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-black text-white italic">مدیریت اعلان‌ها</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase italic">نحوه اطلاع از رویدادهای Loxx را انتخاب کنید</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { key: "receiveFriendRequests", label: "درخواست‌های دوستی", desc: "وقتی کسی برای شما درخواست دوستی می‌فرستد", icon: User },
            { key: "receiveLobbyInvites", label: "دعوت به لابی", desc: "وقتی دوستانتان شما را به بازی دعوت می‌کنند", icon: User },
            { key: "showMentionAlerts", label: "اعلان‌های منشن", desc: "وقتی کسی شما را در چت منشن می‌کند", icon: Bell },
          ].map((item, i) => (
            <label key={i} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 last:border-b-0">
               <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-neon-blue transition-colors">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white italic">{item.label}</h4>
                    <p className="text-[10px] text-gray-500 font-bold italic uppercase">{item.desc}</p>
                  </div>
               </div>
               <div className="relative inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={(settings as any)[item.key]} 
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-500 peer-checked:after:bg-neon-blue after:border-gray-900 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue/20"></div>
               </div>
            </label>
          ))}
        </div>
      </NeonCard>
    </div>
  );

  const renderUI = () => (
    <div className="space-y-6">
      <NeonCard variant="blue" className="space-y-8">
        <div>
          <h3 className="font-black text-white italic mb-1">وضعیت و تم</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 italic">ظاهر برنامه خود را شخصی‌سازی کنید</p>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10">
               <div className="flex items-center gap-3">
                 <Eye size={16} className="text-gray-500" />
                 <span className="text-xs font-black text-white italic">نمایش وضعیت آنلاین</span>
               </div>
               <input 
                 type="checkbox" 
                 checked={settings.showOnlineStatus} 
                 onChange={(e) => updateSetting("showOnlineStatus", e.target.checked)}
                 className="accent-neon-blue" 
               />
            </label>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                   <Monitor size={16} className="text-gray-500" />
                   <span className="text-xs font-black text-white italic uppercase">تم برنامه</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {['dark', 'high-contrast'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => updateSetting("theme", t)}
                        className={cn(
                          "py-3 rounded-xl border font-black italic text-[11px] uppercase transition-all",
                          settings.theme === t ? "bg-neon-blue/10 border-neon-blue text-neon-blue" : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
                        )}
                      >
                        {t === 'dark' ? 'حالت تاریک' : 'کنتراست بالا'}
                      </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        <div>
          <h3 className="font-black text-white italic mb-1">عملکرد</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 italic">بهینه‌سازی برای دستگاه‌های مختلف</p>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10">
               <div className="flex items-center gap-3">
                 <Zap size={16} className="text-gray-500" />
                 <span className="text-xs font-black text-white italic">کاهش انیمیشن‌ها</span>
               </div>
               <input 
                 type="checkbox" 
                 checked={settings.reduceAnimations} 
                 onChange={(e) => updateSetting("reduceAnimations", e.target.checked)}
                 className="accent-neon-blue" 
               />
            </label>
          </div>
        </div>
      </NeonCard>
    </div>
  );

  const renderRegion = () => (
    <div className="space-y-6">
      <NeonCard variant="blue" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
              <Languages size={14} /> انتخاب زبان
            </h4>
            <select 
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/50 font-black italic"
            >
               <option value="fa" className="bg-dark-bg">Persian / فارسی</option>
            </select>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
              <MapPin size={14} /> منطقه بازی (Server Region)
            </h4>
            <select 
              value={formData.region}
              onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/50 font-black italic"
            >
               <option value="IR" className="bg-dark-bg">Iran (Tehran)</option>
               <option value="ME" className="bg-dark-bg">Middle East (Dubai)</option>
               <option value="EU" className="bg-dark-bg">Europe West (Frankfurt)</option>
            </select>
          </div>
        </div>

        <hr className="border-white/5" />

        <div className="p-6 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 flex items-center gap-4">
           <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
              <Heart size={24} />
           </div>
           <div>
              <h4 className="text-sm font-black text-white italic">محتوای بومی شده</h4>
              <p className="text-[10px] text-gray-500 font-bold italic uppercase leading-relaxed">
                لوکس همزمان با زبان انتخابی شما، محتوای بازی‌ها و رویدادهای محلی منطقه شما را در اولویت قرار می‌دهد.
              </p>
           </div>
        </div>
      </NeonCard>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] pb-20 md:pb-0">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-5xl">
           <header className="mb-10 text-center md:text-right">
            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter shadow-text-glow">تنظیمات</h1>
            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">حساب کاربری و اولویت‌های خود را شخصی‌سازی کنید</p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
             {/* Sidebar Tabs */}
             <div className="lg:col-span-1 space-y-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 flex lg:flex-col gap-2 lg:gap-2">
                {tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-5 py-4 text-xs font-black uppercase italic transition-all shrink-0 w-max lg:w-full",
                      activeTab === tab.id 
                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_20px_rgba(0,229,255,0.1)]' 
                        : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                    )}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
             </div>

              {/* Content Area */}
              <div className="lg:col-span-3">
                {activeTab === ("elite" as any) && (
                   <div className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group cursor-pointer"
                        onClick={() => window.location.href = "/settings/elite"}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-[32px] blur-xl opacity-40 group-hover:opacity-70 transition duration-1000" />
                        <NeonCard variant="gold" className="relative p-10 overflow-hidden border-none bg-black/40 backdrop-blur-xl">
                           <div className="absolute top-0 left-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Crown size={200} />
                           </div>
                           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-right">
                              <div className="h-24 w-24 rounded-[32px] bg-yellow-400 text-dark-bg flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.4)] group-hover:scale-110 transition-transform duration-500">
                                 <Crown size={48} fill="currentColor" />
                              </div>
                              <div className="flex-1">
                                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">داشبورد نخبگان (Elite Settings)</h2>
                                 <p className="text-sm text-yellow-400/80 font-bold uppercase tracking-widest italic mb-6">کنترل کامل بر فریم‌ها، افکت‌ها و استایل‌های اختصاصی VIP</p>
                                 <GlowButton variant="gold" className="px-12 h-12 text-xs font-black uppercase italic">باز کردن تنظیمات پیشرفته</GlowButton>
                              </div>
                              <div className="h-16 w-16 rounded-full border-2 border-yellow-400/30 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
                                 <ArrowRight className="text-yellow-400 -rotate-45 group-hover:rotate-0 transition-transform" />
                              </div>
                           </div>
                        </NeonCard>
                      </motion.div>
                   </div>
                )}
                {activeTab === "profile" && renderProfile()}
                {activeTab === "security" && renderSecurity()}
                {activeTab === "notifications" && renderNotifications()}
                {activeTab === "ui" && renderUI()}
                {activeTab === "region" && renderRegion()}
              </div>
          </div>
        </div>
      </main>
    </div>
  );
};
