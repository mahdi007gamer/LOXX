import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { 
  User, 
  Settings, 
  Award, 
  Gamepad2, 
  Calendar, 
  Zap,
  Star,
  Target,
  Edit2,
  Share2,
  Crown,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Camera,
  Trash
} from "lucide-react";
import { cn } from "../lib/utils";
import { QuickProfilePopover } from "../components/ui/QuickProfilePopover";
import { BadgeType, MembershipType } from "../types";
import { SmartImage } from "../components/ui/SmartImage";
import { useLanguage } from "../context/LanguageContext";

export const ProfilePage = () => {
  const { user, setUser, isSidebarCollapsed } = useAuth();
  const { language, t } = useLanguage();
  const isRtl = language === "fa";
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    bannerUrl: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me"); // Using my enhanced me endpoint or dedicated profile
      setProfileData(res.data.data);
      setEditForm({
        displayName: res.data.data.displayName || "",
        bio: res.data.data.bio || "",
        avatarUrl: res.data.data.avatarUrl || "",
        bannerUrl: res.data.data.bannerUrl || "",
      });
    } catch (err) {
      toast.error("خطا در دریافت اطلاعات پروفایل");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.patch('/user/profile', {
        display_name: editForm.displayName,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        bannerUrl: editForm.bannerUrl
      });
      fetchProfile();
      toast.success("پروفایل بروزرسانی شد");
      setIsEditModalOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || "خطا در بروزرسانی");
    }
  };

  const isVip = profileData?.membership === "VIP" || profileData?.membership === MembershipType.VIP || profileData?.role === "STREAMER";
  const isPlus = profileData?.membership === "PLUS" || profileData?.membership === MembershipType.PLUS;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم تصویر نباید بیشتر از ۲ مگابایت باشد");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      toast.error("فقط فرمت‌های jpg و png مجاز هستند");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditForm(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success("تصویر با موفقیت آپلود شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در آپلود تصویر");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error("حجم بنر نباید بیشتر از ۱ مگابایت باشد");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      toast.error("فقط فرمت‌های jpg و png مجاز هستند");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditForm(prev => ({ ...prev, bannerUrl: data.url }));
      toast.success("بنر با موفقیت آپلود شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در آپلود بنر");
    }
  };

  if (loading) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className={cn("flex-1 px-4 py-8 lg:px-8 transition-all duration-300", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))} dir={isRtl ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-5xl">
          {/* Enhanced Profile Header */}
          <div className={cn(
            "relative mb-8 overflow-hidden rounded-[40px] bg-[#0a0a0f] border transition-all duration-700",
            isVip || isPlus ? "border-yellow-400/30 shadow-[0_40px_100px_-20px_rgba(250,204,21,0.15)]" : "border-white/10"
          )}>
            {/* Banner Area */}
            <div className="h-64 w-full relative group">
               {profileData?.bannerUrl ? (
                 <SmartImage 
                    src={profileData.bannerUrl} 
                    isVipEnabled={isVip} 
                    alt="Banner" 
                    className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className={cn(
                   "w-full h-full bg-gradient-to-br transition-all duration-700",
                    isVip ? "from-yellow-400/20 via-orange-500/10 to-transparent" :
                    isPlus ? "from-neon-blue/20 via-blue-600/10 to-transparent" :
                    "from-white/5 to-transparent"
                 )} />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
               <button 
                 onClick={() => setIsEditModalOpen(true)}
                 className="absolute top-6 left-6 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-neon-blue hover:text-dark-bg transition-all opacity-0 group-hover:opacity-100"
               >
                 <Camera size={18} />
               </button>
            </div>
            
            <div className="px-10 pb-10">
              <div className="relative -mt-20 flex flex-col items-end gap-8 sm:flex-row">
                {/* Avatar */}
                <div className="relative group mx-auto sm:mx-0">
                  <div className={cn(
                    "h-40 w-40 rounded-[48px] bg-[#0a0a0f] p-1 shadow-2xl relative z-10",
                    isVip ? "bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-600" :
                    isPlus ? "bg-neon-blue" : "border border-white/10"
                  )}>
                    <div className="h-full w-full rounded-[42px] bg-[#0d0d12] flex items-center justify-center overflow-hidden">
                      {profileData?.avatarUrl ? (
                        <SmartImage 
                           src={profileData.avatarUrl} 
                           isVipEnabled={isVip} 
                           alt={profileData.username} 
                           className="h-full w-full object-cover" 
                        />
                      ) : (
                        <User size={64} className="text-gray-700" />
                      )}
                    </div>
                  </div>
                  {isVip && (
                    <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-dark-bg border-4 border-[#0a0a0f] shadow-2xl z-20 animate-bounce">
                      <Crown size={22} fill="currentColor" />
                    </div>
                  )}
                  {isPlus && (
                    <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-neon-blue flex items-center justify-center text-dark-bg border-4 border-[#0a0a0f] shadow-2xl z-20">
                      <Zap size={22} fill="currentColor" />
                    </div>
                  )}
                </div>

                <div className="flex-1 pt-6 text-center sm:text-right w-full">
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <h1 className={cn(
                      "text-4xl font-black italic tracking-tighter uppercase",
                      isVip ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200" : "text-white"
                    )}>
                      {profileData?.displayName || profileData?.username}
                    </h1>
                    <CheckCircle2 size={24} className="text-neon-blue" fill="currentColor" />
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 overflow-x-auto no-scrollbar pb-1">
                    {profileData?.membership && (
                      <div className={cn(
                        "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border shadow-xl shrink-0",
                        profileData.membership === "VIP" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30" : 
                        profileData.membership === "PLUS" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30" :
                        "bg-white/5 text-gray-400 border-white/10"
                      )}>
                        {profileData.membership === "VIP" ? "Elite Member (VIP)" : profileData.membership === "PLUS" ? "Golden Member (PLUS)" : "Regular Player"}
                      </div>
                    )}
                    <div className="h-1 w-1 rounded-full bg-gray-700" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={12} /> عضویت از {profileData?.stats?.daysSinceJoin || 0} روز پیش
                    </span>
                    <div className="h-1 w-1 rounded-full bg-gray-700" />
                    {profileData?.isVerified ? (
                      <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                        <CheckCircle2 size={12} /> تایید شده
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                        <Shield size={12} /> تایید نشده
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-gray-400 text-sm max-w-2xl leading-relaxed italic line-clamp-2">{profileData?.bio || "بایوگرافی هنوز تنظیم نشده است"}</p>
                </div>

                <div className="flex items-center gap-3 self-center sm:self-end mt-4 sm:mt-0">
                  <GlowButton variant="blue" className="px-8 h-12 gap-2 !rounded-2xl font-black italic text-xs uppercase" onClick={() => setIsEditModalOpen(true)}>
                    <Edit2 size={16} />
                    <span>ویرایش پروفایل</span>
                  </GlowButton>
                  <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Stats & Badges */}
            <div className="space-y-6">
              <NeonCard variant="blue" className="p-8">
                <h3 className="flex items-center gap-3 font-black text-white italic uppercase tracking-tighter text-xl mb-6">
                  <Target size={20} className="text-neon-blue shadow-glow" />
                  <span>آمار لوکس</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[24px] bg-white/5 p-5 text-center group hover:border-gray-500/30 border border-transparent transition-all">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">روز عضویت</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{profileData?.stats?.daysSinceJoin || 0}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/5 p-5 text-center group hover:border-neon-pink/30 border border-transparent transition-all">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">لابی‌های شرکت کرده</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{profileData?.stats?.lobbiesJoined || 0}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/5 p-5 text-center group hover:border-neon-blue/30 border border-transparent transition-all">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">تعداد دوستان</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{profileData?.stats?.friendsCount || 0}</p>
                  </div>
                  <div className="rounded-[24px] bg-white/5 p-5 text-center group hover:border-neon-purple/30 border border-transparent transition-all">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">لابی‌های ساخته شده</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{profileData?.stats?.lobbiesCreated || 0}</p>
                  </div>
                </div>
              </NeonCard>

              <NeonCard variant="purple" className="p-8">
                 <h3 className="flex items-center gap-3 font-black text-white italic uppercase tracking-tighter text-xl mb-6">
                  <Award size={20} className="text-neon-purple" />
                  <span>سطح و افتخارات</span>
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-gray-500 font-black uppercase italic">سطح کاربری (Level)</p>
                      <p className="text-xl font-black text-neon-blue italic">Lv. {profileData?.level || 1}</p>
                   </div>
                   
                   <div className="space-y-3">
                      <p className="text-[10px] text-gray-500 font-black uppercase italic mr-2">نشان‌های کسب شده</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData?.badges?.map((badge: any) => (
                          <div 
                            key={badge.id} 
                            title={badge.name} 
                            className={cn(
                              "h-12 w-12 rounded-2xl bg-white/5 border flex items-center justify-center p-2 transition-all hover:scale-110",
                              badge.isPinned ? "border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.2)]" : "border-white/5"
                            )}
                          >
                            <img src={badge.iconUrl} alt={badge.name} className="h-full w-full object-contain" />
                          </div>
                        ))}
                        {(!profileData?.badges || profileData.badges.length === 0) && (
                          <p className="text-[10px] text-gray-600 italic">هنوز نشانی کسب نکرده‌اید</p>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-600 italic mt-2">* نشان‌های دور آبی در مینی‌پروفایل شما نمایش داده می‌شوند.</p>
                   </div>
                </div>
              </NeonCard>

              {!profileData?.isVerified ? (
                <NeonCard variant="blue" className="p-8 border-neon-blue/30 bg-neon-blue/5">
                  <h3 className="flex items-center gap-3 font-black text-white italic uppercase tracking-tighter text-lg mb-4">
                    <Shield size={18} className="text-neon-blue" />
                    <span>تایید هویت پیامکی</span>
                  </h3>
                  <p className="text-xs text-gray-400 mb-1 leading-relaxed italic">
                    حساب شما هنوز به طور کامل تایید نشده است. لطفاً برای فعالسازی کامل حساب و دسترسی به مینی‌پروفایل معتبر، شماره همراه خود را تایید کنید.
                  </p>
                </NeonCard>
              ) : (
                <NeonCard variant="blue" className="p-8 border-green-500/30 bg-green-500/5">
                  <h3 className="flex items-center gap-3 font-black text-white italic uppercase tracking-tighter text-lg mb-4">
                    <Shield size={18} className="text-green-400" />
                    <span>تایید هویت پیامکی</span>
                  </h3>
                  <p className="text-xs text-green-400/80 mb-1 leading-relaxed italic">
                    عالی! حساب کاربری شما با موفقیت از طریق سامانه پیامکی تایید شده و نشان طلایی تایید در مینی‌پروفایل شما فعال است.
                  </p>
                </NeonCard>
              )}
            </div>

            {/* Right Column: Mini Profile Preview & Activities */}
            <div className="lg:col-span-2 space-y-6">
               <NeonCard className="p-10 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.05),transparent_50%)]" />
                 <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2 relative z-10">پیش‌نمایش مینی‌پروفایل یکپارچه</h3>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-12 relative z-10 italic">این دقیقاً همان چیزی است که کاربران دیگر از شما می‌بینند</p>
                 
                 <div className="relative mx-auto w-fit scale-110 drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                    <QuickProfilePopover 
                      onClose={() => {}} 
                      isSelf={true}
                      user={{
                        senderName: profileData?.displayName || profileData?.username || "Gamer",
                        senderAvatar: profileData?.avatarUrl,
                        senderLevel: 24,
                        senderBadges: [BadgeType.PRO, BadgeType.CHAMPION],
                        membership: profileData?.membership,
                        bannerUrl: profileData?.bannerUrl,
                        vipMetadata: profileData?.vipMetadata,
                        stats: profileData?.stats
                      }}
                    />
                 </div>
                 
                 <div className="mt-16 p-4 rounded-2xl bg-white/5 border border-white/5 text-right relative z-10">
                    <p className="text-[10px] text-neon-blue font-black uppercase tracking-widest mb-1 italic">اطلاعیه</p>
                    <p className="text-xs text-gray-400 leading-relaxed italic">تنظیمات مینی‌پروفایل شما (رنگ‌ها، افکت‌ها و فریم‌ها) فقط برای اعضای VIP و PLUS در دسترس است. هم‌اکنون حساب خود را ارتقا دهید.</p>
                 </div>
               </NeonCard>
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={isEditModalOpen} title="ویرایش پروفایل لوکس" onClose={() => setIsEditModalOpen(false)}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2 block italic">نام نمایشی (Display Name)</label>
              <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-neon-blue focus:outline-none font-bold italic" />
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2 block italic">آیدی (Username)</label>
              <input type="text" value={user?.username} disabled className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-gray-600 font-bold italic" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2 block italic">بایوگرافی پروفایل (Bio)</label>
            <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-neon-blue focus:outline-none font-bold italic h-32 resize-none" placeholder="کمی درباره خودت بنویس..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2 block italic">تصویر پروفایل (Avatar)</label>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-[#0a0a0f] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {editForm.avatarUrl ? <img src={editForm.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User size={32} className="text-gray-700" />}
                </div>
                <div className="flex-1">
                  <input type="file" id="avatar-input" accept="image/png, image/jpeg" onChange={handleAvatarUpload} className="hidden" />
                  <label htmlFor="avatar-input" className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-white/10 cursor-pointer transition-all">
                    <Camera size={14} /> انتخاب تصویر
                  </label>
                  <button onClick={() => setEditForm(p => ({ ...p, avatarUrl: "" }))} className="mt-2 text-[8px] text-neon-pink font-black uppercase flex items-center gap-1 hover:underline">
                    <Trash size={10} /> حذف آواتار
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2 block italic">بنر پروفایل (Banner)</label>
              <div className="space-y-3">
                 <input type="file" id="banner-input" accept="image/png, image/jpeg" onChange={handleBannerUpload} className="hidden" />
                 <label htmlFor="banner-input" className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-white/10 cursor-pointer transition-all">
                    <Camera size={14} /> آپلود بنر جدید (۱ مگ)
                 </label>
                 {editForm.bannerUrl && (
                   <div className="relative h-14 w-full rounded-xl overflow-hidden border border-white/10">
                      <img src={editForm.bannerUrl} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setEditForm(p => ({ ...p, bannerUrl: "" }))} className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 opacity-0 hover:opacity-100 transition-opacity">
                        <Trash size={16} />
                      </button>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-end gap-3">
             <button onClick={() => setIsEditModalOpen(false)} className="h-12 px-8 text-xs font-black text-gray-500 hover:text-white uppercase italic">انصراف</button>
             <GlowButton className="h-12 px-12 !rounded-2xl font-black text-xs uppercase italic tracking-widest" onClick={handleUpdateProfile}>ذخیره تغییرات نهایی</GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
