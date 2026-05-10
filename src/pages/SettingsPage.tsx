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
  Palette, 
  Trash2, 
  RefreshCw, 
  Upload, 
  Layers, 
  Settings2,
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
  ArrowRight,
  Award,
  Plus,
  Sparkles,
  Star,
  Mail,
  Trophy,
  Activity,
  UserCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const SecurityStatusCard = ({ title, status, desc, icon, color = "blue" }: any) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <h4 className="text-xs font-black text-white italic">{title}</h4>
      </div>
      <span className={cn(
        "text-[9px] font-black uppercase px-2 py-0.5 rounded",
        color === "green" ? "bg-green-500/20 text-green-400" : 
        color === "red" ? "bg-red-500/20 text-red-400" : 
        "bg-neon-blue/20 text-neon-blue"
      )}>
        {status}
      </span>
    </div>
    <p className="text-[10px] text-gray-400 leading-relaxed font-bold">{desc}</p>
  </div>
);

type SettingsTab = "profile" | "security" | "notifications" | "ui" | "region" | "badges" | "elite";

export const SettingsPage = () => {
  const { user: authUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [setupStep, setSetupStep] = useState<"initial" | "verifying">("initial");
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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
    displayName: authUser?.displayName || "",
    bio: "",
    username: authUser?.username || "",
    avatarUrl: authUser?.avatarUrl || "",
    bannerUrl: "",
    region: "IR",
    language: "fa",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [devices, setDevices] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  const [vipMetadata, setVipMetadata] = useState<any>({
    auraEffect: true,
    shinyName: true,
    specialFrame: false,
    frame: "none",
    opacity: 0.8,
    colors: {
      bg: "#0d0d14",
      text: "#ffffff",
      accent: "#00e5ff"
    }
  });

  useEffect(() => {
    fetchUserData();
    fetchDevices();
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const [allRes, userRes] = await Promise.all([
        api.get("/badges"),
        api.get("/badges/my")
      ]);
      if (allRes.data.status === "success") setAllBadges(allRes.data.data);
      if (userRes.data.status === "success") setUserBadges(userRes.data.data);
    } catch (err) {}
  };

  const toggleBadge = async (badgeId: string) => {
    try {
      await api.post(`/badges/toggle-standard/${badgeId}`);
      toast.success("وضعیت نشان ویرایش شد");
      fetchBadges();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ویرایش نشان");
    }
  };

  const togglePinBadge = async (badgeId: string, isPinned: boolean) => {
    try {
      await api.post(`/badges/pin/${badgeId}`, { isPinned });
      toast.success(isPinned ? "نشان پین شد" : "نشان از پین خارج شد");
      fetchBadges();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error("خطا در تغییر وضعیت پین");
    }
  };

  const fetchUserData = async () => {
    try {
      if (refreshUser) await refreshUser();
      const res = await api.get("/auth/me");
      if (res.data.status === "success") {
        const d = res.data.data;
        setTwoFactorEnabled(d.twoFactorEnabled);
        if (d.vipMetadata) setVipMetadata(d.vipMetadata);
        setFormData(p => ({
          ...p,
          displayName: d.displayName || "",
          bio: d.bio || "",
          username: d.username || "",
          avatarUrl: d.avatarUrl || "",
          bannerUrl: d.bannerUrl || "",
          region: d.region || "IR",
        }));
      }
    } catch (err) {}
    setLoading(false);
  };

  const toggleVipFeature = async (key: string) => {
    try {
      const newMetadata = { ...vipMetadata, [key]: !vipMetadata[key] };
      setVipMetadata(newMetadata);
      await api.patch("/user/profile", { vipMetadata: newMetadata });
      toast.success("تنظیمات ویژه به‌روزرسانی شد");
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error("خطا در به‌روزرسانی تنظیمات ویژه");
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await api.get("/user/me/sessions");
      setDevices(res.data.data || []);
    } catch (err) {}
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("رمز عبور جدید و تکرار آن مطابقت ندارند");
    }
    try {
      setSaving(true);
      await api.post("/user/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setFormData(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در تغییر رمز عبور");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setSaving(true);
      await api.post("/user/me/2fa/enable");
      setShowTwoFactorModal(true);
      toast.success("کد تایید به ایمیل شما ارسال شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در برقراری ارتباط");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setSaving(true);
      await api.post("/user/me/2fa/verify", { code: twoFactorCode });
      toast.success("تایید دو مرحله‌ای با موفقیت فعال شد");
      setShowTwoFactorModal(false);
      setTwoFactorEnabled(true);
      setTwoFactorCode("");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "کد اشتباه است");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setSaving(true);
      await api.post("/user/me/2fa/disable");
      toast.success("تایید دو مرحله‌ای غیرفعال شد");
      setTwoFactorEnabled(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در انجام عملیات");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailByToken = async () => {
    try {
      setSaving(true);
      await api.post("/auth/verify-email", { token: verificationCode });
      toast.success("ایمیل شما با موفقیت تایید شد");
      setShowVerificationModal(false);
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "توکن معتبر نمی‌باشد");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, type: "avatar" | "banner") => {
    try {
      if (type === "avatar") setUploadingAvatar(true);
      else setUploadingBanner(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await api.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.url) {
        setFormData(p => ({ ...p, [type === "avatar" ? "avatarUrl" : "bannerUrl"]: res.data.url }));
        toast.success(type === "avatar" ? "تصویر پروفایل انتخاب شد" : "بنر انتخاب شد");
      }
    } catch (err: any) {
      toast.error("خطا در آپلود تصویر");
    } finally {
      if (type === "avatar") setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.patch("/user/profile", {
        displayName: formData.displayName,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
        bannerUrl: formData.bannerUrl,
        region: formData.region
      });
      toast.success("پروفایل با موفقیت به‌روزرسانی شد");
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در برقراری ارتباط");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeDevice = async (id: string) => {
    try {
      await api.delete(`/user/sessions/${id}`);
      fetchDevices();
      toast.success("دستگاه با موفقیت خارج شد");
    } catch (err) {}
  };

  const updateSetting = (key: string, val: any) => {
    setSettings(p => ({ ...p, [key]: val }));
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <NeonCard variant="purple" className="relative group overflow-hidden p-0">
         <div className="h-40 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 relative">
            {formData.bannerUrl ? (
              <img src={formData.bannerUrl} className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            )}
            <label className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-all cursor-pointer">
              {uploadingBanner ? <Sparkles className="animate-spin" size={18} /> : <Camera size={18} />}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "banner")} />
            </label>
         </div>
         <div className="px-8 pb-8 -mt-12 relative z-10 flex flex-col md:flex-row gap-6 md:items-end">
            <div className="relative">
              <div className="h-28 w-28 rounded-[32px] bg-[#0a0a0f] p-1 border-2 border-neon-purple shadow-[0_0_30px_rgba(191,0,255,0.2)]">
                <img src={formData.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Loxx"} className="h-full w-full rounded-[28px] object-cover" />
              </div>
              <label className="absolute bottom-1 right-1 h-8 w-8 rounded-xl bg-neon-purple text-white flex items-center justify-center border-2 border-[#0a0a0f] hover:scale-110 transition-transform cursor-pointer">
                {uploadingAvatar ? <Sparkles className="animate-spin text-white" size={14} /> : <Camera size={14} />}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "avatar")} />
              </label>
            </div>
            <div className="flex-1 md:pb-2">
               <h2 className="text-2xl font-black text-white italic tracking-tight">{formData.displayName || formData.username}</h2>
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">@{formData.username}</p>
            </div>
         </div>
      </NeonCard>

      <NeonCard variant="purple" className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Input label="نام نمایشی" value={formData.displayName} onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))} placeholder="نام خود را وارد کنید" />
           <Input label="نام کاربری" value={formData.username} disabled placeholder="نام کاربری قابل تغییر نیست" />
         </div>
         <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">بیوگرافی</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-purple/50 min-h-[100px] font-bold italic"
              placeholder="چیزی بنویسید..."
              value={formData.bio}
              onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
            />
         </div>
         <div className="flex justify-end pt-4">
            <GlowButton variant="purple" className="px-12 h-12 text-xs font-black uppercase italic" disabled={saving} onClick={handleSaveProfile}>
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </GlowButton>
         </div>
      </NeonCard>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <NeonCard variant="purple" className="space-y-8">
        <div>
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="font-black text-white italic mb-1 flex items-center gap-2">
                 وضعیت تایید حساب
                 {authUser?.isVerified ? (
                   <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-italic">حساب تایید شده</span>
                 ) : (
                   <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase not-italic">حساب تایید نشده</span>
                 )}
               </h3>
               <p className="text-[10px] text-gray-500 font-bold uppercase italic">{authUser?.isVerified ? "هویت شما با موفقیت تایید شده است." : "برای دسترسی به تمامی امکانات، حساب خود را تایید کنید"}</p>
             </div>
             {!authUser?.isVerified && (
               <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase italic px-6 border-none" onClick={() => setShowVerificationModal(true)}>تایید پروفایل</GlowButton>
             )}
           </div>
        </div>

        <hr className="border-white/5" />

        <div>
          <h3 className="font-black text-white italic mb-1">تغییر رمز عبور</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 italic">برای امنیت بیشتر از رمزهای طولانی استفاده کنید</p>
          <div className="space-y-6 max-w-md">
            <Input 
               label="رمز عبور فعلی" 
               type="password" 
               placeholder="••••••••"
               value={formData.currentPassword}
               onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input 
               label="رمز عبور جدید" 
               type="password" 
               placeholder="••••••••"
               value={formData.newPassword}
               onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
            />
            <Input 
               label="تکرار رمز عبور جدید" 
               type="password" 
               placeholder="••••••••"
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
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="font-black text-white italic mb-1 flex items-center gap-2">
                 تایید دو مرحله‌ای (2FA) 
                 {twoFactorEnabled ? (
                   <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-italic">فعال</span>
                 ) : (
                   <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded uppercase not-italic">غیرفعال</span>
                 )}
               </h3>
               <p className="text-[10px] text-gray-500 font-bold uppercase italic">کد تایید هنگام ورود به ایمیل شما ارسال خواهد شد</p>
             </div>
             {twoFactorEnabled ? (
               <GlowButton variant="purple" size="sm" className="text-[10px] font-black uppercase italic px-6 border-none bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 shadow-none" onClick={handleDisable2FA} disabled={saving}>غیرفعال‌سازی 2FA</GlowButton>
             ) : (
               <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase italic px-6 border-none" onClick={handleEnable2FA} disabled={saving}>فعال‌سازی 2FA</GlowButton>
             )}
           </div>
        </div>

        {/* 2FA Modal */}
        <AnimatePresence>
          {(showTwoFactorModal || showVerificationModal) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                 onClick={() => { setShowTwoFactorModal(false); setShowVerificationModal(false); setSetupStep("initial"); }}
               />
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                 className="relative w-full max-w-sm rounded-[24px] bg-[#0a0a0f] border border-white/10 p-8 shadow-2xl"
               >
                 {showVerificationModal ? (
                   <>
                     <h3 className="text-xl font-black text-white italic mb-2">تایید ایمیل</h3>
                     <p className="text-xs text-gray-500 font-bold mb-6 italic">توکن ارسال شده به ایمیل خود را وارد کنید</p>
                     <Input 
                       label="توکن تایید"
                       placeholder="توکن را اینجا قرار دهید"
                       value={verificationCode}
                       onChange={(e) => setVerificationCode(e.target.value)}
                     />
                     <div className="mt-6 flex flex-col gap-3">
                       <GlowButton variant="blue" className="w-full text-xs font-black uppercase blur-none shadow-none h-12" onClick={handleVerifyEmailByToken} disabled={saving || !verificationCode}>تایید ایمیل</GlowButton>
                       <button onClick={() => { setShowVerificationModal(false); }} className="h-10 text-xs font-black text-gray-500 hover:text-white uppercase transition-colors">بعداً انجام میدم</button>
                     </div>
                   </>
                 ) : (
                   <>
                     <h3 className="text-xl font-black text-white italic mb-2">تایید ایمیل</h3>
                     <p className="text-xs text-gray-500 font-bold mb-6 italic">کد تایید ارسال شده به ایمیل را وارد کنید</p>
                     <Input 
                       label="کد تایید"
                       placeholder="مثلا 12345"
                       value={twoFactorCode}
                       onChange={(e) => setTwoFactorCode(e.target.value)}
                     />
                     <div className="mt-6 flex justify-end gap-3">
                       <button onClick={() => { setShowTwoFactorModal(false); setSetupStep("initial"); }} className="px-4 text-xs font-black text-gray-500 hover:text-white uppercase">انصراف</button>
                       <GlowButton variant="blue" className="px-8 text-xs font-black uppercase blur-none shadow-none" onClick={handleVerify2FA} disabled={saving || twoFactorCode.length < 5}>ثبت و فعالسازی</GlowButton>
                     </div>
                   </>
                 )}
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <hr className="border-white/5" />

        <div>
          <h3 className="font-black text-white italic mb-4">دستگاه‌های متصل</h3>
          <div className="space-y-3">
             {devices.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neon-blue transition-colors">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white italic flex items-center gap-2">
                        {session.deviceName}
                        {i === 0 && <span className="text-[8px] text-neon-blue uppercase">اخیر</span>}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold">{session.ipAddress}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRevokeDevice(session.id)} className="text-[10px] font-black text-neon-pink uppercase italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">خروج</button>
               </div>
             ))}
             {devices.length === 0 && (
               <p className="text-[10px] text-gray-500 font-bold uppercase">در حال بارگذاری...</p>
             )}
          </div>
        </div>
      </NeonCard>

      <NeonCard variant="blue" className="p-8">
        <div className="flex items-center gap-3 mb-8">
           <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
              <Shield size={20} />
           </div>
           <div>
              <h3 className="font-black text-white italic uppercase tracking-tighter">خلاصه وضعیت امنیت</h3>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest italic">Security Health & Guard Status</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <SecurityStatusCard 
             title="وضعیت تایید حساب" 
             status={authUser?.isVerified ? "تایید شده" : "در انتظار تایید"}
             desc={authUser?.isVerified ? "حساب شما کاملاً تایید شده و به تمامی امکانات دسترسی دارید." : "تایید ایمیل برای دسترسی به تمامی امکانات لابی و فروشگاه الزامی است."}
             icon={<Mail size={20} className="text-neon-blue" />}
             color={authUser?.isVerified ? "green" : "red"}
           />
           <SecurityStatusCard 
             title="تایید دو مرحله‌ای" 
             status={twoFactorEnabled ? "فعال" : "غیرفعال"}
             desc={twoFactorEnabled ? "تایید دو مرحله‌ای فعال است و امنیت حساب شما را تضمین می‌کند." : "برای جلوگیری از دسترسی غیرمجاز، تایید دو مرحله‌ای را فعال کنید."}
             icon={<Lock size={20} className="text-neon-purple" />}
             color={twoFactorEnabled ? "green" : "blue"}
           />
           <SecurityStatusCard 
             title="محافظت از اکانت" 
             status="تحت نظارت"
             desc="سیستم ضد تقلب و محافظت از اکانت لoxx به صورت ۲۴ ساعته فعال است."
             icon={<ShieldAlert size={20} className="text-neon-pink" />}
             color="green"
           />
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

  const renderElite = () => {
    const isVip = authUser?.membership === "VIP" || authUser?.membership === "PLATINUM" || authUser?.membership === "PLUS";
    
    return (
      <div className="space-y-6">
        {isVip ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12">
               <div className="flex items-center justify-between bg-yellow-400/5 p-8 rounded-[48px] border border-yellow-400/20 mb-8 relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-[24px] bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                           <Crown size={32} />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">تنظیمات نخبگان</h3>
                           <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic group-hover:text-yellow-400/70 transition-colors">LOXX ELITE PRESETS & CONTROLS</p>
                        </div>
                     </div>
                  </div>
                  <GlowButton 
                    variant="gold" 
                    className="h-12 px-10 uppercase italic font-black text-xs relative z-10"
                    onClick={() => window.location.href = "/elite-settings"}
                  >
                    پنل پیشرفته نخبگان
                  </GlowButton>
                  <div className="absolute top-0 right-0 h-40 w-40 bg-yellow-400 border-b border-l border-yellow-400/20 opacity-[0.03] blur-[40px] pointer-events-none" />
               </div>
            </div>

            {/* Quick Controls Section */}
            <div className="lg:col-span-7 space-y-6">
               <NeonCard variant="gold" className="space-y-6">
                  <h4 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                    <Palette size={20} className="text-yellow-400" />
                    <span>شخصی‌سازی سریع مینی پروفایل</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                       { id: "auraEffect", label: "هاله نورانی", desc: "نمایش هاله رنگی دور آواتار" },
                       { id: "shinyName", label: "نام درخشان", desc: "افکت درخشش روی نام کاربری" },
                       { id: "specialFrame", label: "فریم متحرک", desc: "استفاده از قاب‌های گرافیکی" }
                     ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-yellow-400/20 transition-all">
                           <div>
                              <h4 className="text-xs font-black text-white italic">{item.label}</h4>
                              <p className="text-[9px] text-gray-500 italic mt-0.5">{item.desc}</p>
                           </div>
                           <div 
                            onClick={() => toggleVipFeature(item.id)}
                            className={cn(
                              "h-7 w-12 rounded-full relative transition-colors cursor-pointer",
                              vipMetadata[item.id] ? "bg-yellow-400/20" : "bg-white/10"
                            )}
                           >
                              <div className={cn(
                                "absolute top-1.5 h-4 w-4 rounded-full transition-all",
                                vipMetadata[item.id] ? "right-1.5 bg-yellow-400 shadow-[0_0_10px_#facc15]" : "left-1.5 bg-gray-600"
                              )} />
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">شفافیت بک‌گراند (Opacity)</label>
                     <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.1"
                        value={vipMetadata.opacity || 0.8} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVipMetadata(prev => ({ ...prev, opacity: val }));
                          api.patch("/user/profile", { vipMetadata: { ...vipMetadata, opacity: val } });
                        }}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400"
                     />
                  </div>
               </NeonCard>

               <div className="p-6 rounded-[32px] border border-white/5 bg-white/[0.02] flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[24px] bg-white/5 flex items-center justify-center text-gray-500">
                     <Monitor size={32} />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-sm font-black text-white italic">تنظیمات کامل گرافیکی</h4>
                     <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-relaxed">برای انتخاب گیف، تغییر هاله و شخصی‌سازی دقیق تمام رنگ‌ها وارد پنل نخبگان شوید.</p>
                  </div>
                  <button onClick={() => window.location.href = "/elite-settings"} className="p-3 rounded-2xl bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-all">
                     <ArrowRight size={20} />
                  </button>
               </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5 h-full">
               <div className="sticky top-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <h3 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em] italic">Live View</h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  <div className="relative group perspective-1000">
                     <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden border border-yellow-400/20 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl" style={{ backgroundColor: vipMetadata.colors?.bg || "#0d0d14", opacity: vipMetadata.opacity || 1 }}>
                        <div className="h-24 relative overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600">
                           {authUser?.bannerUrl && <img src={authUser.bannerUrl} alt="" className="w-full h-full object-cover opacity-50" />}
                           <div className="absolute inset-0 bg-black/40" />
                        </div>
                        <div className="px-6 pb-6 relative z-10">
                           <div className="relative -mt-10 mb-4 h-20 w-20 rounded-[24px] bg-[#0d0d12] border-2 border-yellow-400 p-1">
                              <img src={authUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.username}`} className="w-full h-full rounded-[18px] object-cover" alt="" />
                              {vipMetadata.auraEffect && <div className="absolute -inset-1 rounded-[24px] border border-yellow-400/30 animate-pulse shadow-[0_0_15px_#facc1555]" />}
                           </div>
                           <h4 className={cn("text-2xl font-black italic tracking-tighter uppercase", vipMetadata.shinyName ? "text-yellow-400 text-shadow-glow" : "text-white")}>{authUser?.displayName}</h4>
                           <p className="text-[10px] text-yellow-400/70 font-black uppercase tracking-widest mt-1 italic flex items-center gap-1"><Crown size={10} /> LOXX ELITE MEMBER</p>
                           
                           <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="h-10 rounded-xl bg-white/5 border border-white/5" />
                              <div className="h-10 rounded-xl bg-white/5 border border-white/5" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <NeonCard variant="purple" className="p-12 text-center rounded-[48px] bg-gradient-to-br from-[#0d0d12] to-[#1a1a25] border-white/5 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.15)] relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
             <div className="relative z-10">
                <div className="h-24 w-24 rounded-[32px] bg-neon-purple/10 flex items-center justify-center text-neon-purple border border-neon-purple/20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-700">
                   <Crown size={48} />
                </div>
                <h3 className="text-3xl font-black text-white italic mb-2 tracking-tighter uppercase">بخش مخصوص اعضای ویژه</h3>
                <p className="text-xs text-gray-500 mb-10 font-bold uppercase tracking-widest italic">برای دسترسی به تنظیمات پیشرفته نخبگان باید حساب خود را ارتقا دهید</p>
                <GlowButton variant="purple" className="px-16 h-14 !rounded-[24px] text-sm font-black italic uppercase tracking-widest" onClick={() => window.location.href = "/premium"}>مشاهده پلن‌ها</GlowButton>
             </div>
          </NeonCard>
        )}
      </div>
    );
  };

  const renderBadges = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-8 rounded-[40px] border border-white/5">
         <div>
            <h3 className="text-2xl font-black text-white italic mb-1 uppercase tracking-tighter">نشان‌های اختصاصی</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">مدیریت و پین کردن نشان‌های کسب شده</p>
         </div>
         <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-center">
               <p className="text-[8px] text-gray-500 font-black uppercase">کل نشان‌ها</p>
               <p className="text-lg font-black text-neon-blue italic">{userBadges.length}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
               <p className="text-[8px] text-gray-500 font-black uppercase">پین شده</p>
               <p className="text-lg font-black text-neon-pink italic">{userBadges.filter((b: any) => b.isPinned).length}/5</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NeonCard variant="blue" className="space-y-6 h-fit">
           <h4 className="text-sm font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4 uppercase">
              <Star size={16} className="text-neon-blue" fill="currentColor" />
              <span>نشان‌های پین شده</span>
           </h4>
           <div className="grid grid-cols-4 gap-4">
              {userBadges.filter((b: any) => b.isPinned).map((b: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2 group relative">
                   <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center border border-neon-blue/30 relative">
                      <img src={b.badge?.iconUrl || b.iconUrl} alt={b.badge?.name || b.name} className="h-8 w-8 object-contain" />
                      <button 
                        onClick={() => togglePinBadge(b.badgeId || b.id, false)}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Lock size={10} />
                      </button>
                   </div>
                   <span className="text-[8px] font-black text-gray-400 italic truncate max-w-full">{b.badge?.name || b.name}</span>
                </div>
              ))}
              {userBadges.filter((b: any) => b.isPinned).length === 0 && (
                <div className="col-span-4 py-8 text-center text-[10px] text-gray-600 font-bold uppercase italic">هیچ نشانی پین نشده است</div>
              )}
           </div>
        </NeonCard>

        <NeonCard className="space-y-6">
           <h4 className="text-sm font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4 uppercase">
              <Award size={16} className="text-neon-pink" />
              <span>تمام نشان‌های من</span>
           </h4>
           <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {userBadges.map((b: any, i: number) => {
                const badgeId = b.badgeId || b.id;
                const isPinned = b.isPinned;
                return (
                  <div key={i} className={cn(
                    "flex flex-col items-center gap-2 group p-2 rounded-xl transition-all cursor-pointer",
                    isPinned ? "bg-neon-blue/5 border border-neon-blue/20" : "hover:bg-white/5"
                  )} onClick={() => togglePinBadge(badgeId, !isPinned)}>
                     <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center relative">
                        <img src={b.badge?.iconUrl || b.iconUrl} alt={b.badge?.name || b.name} className="h-7 w-7 object-contain" />
                        {isPinned && <Star size={10} className="absolute -top-1 -right-1 text-neon-blue fill-neon-blue" />}
                     </div>
                     <span className="text-[8px] font-black text-white italic truncate max-w-full">{b.badge?.name || b.name}</span>
                  </div>
                );
              })}
              {userBadges.length === 0 && (
                <div className="col-span-4 py-12 text-center">
                   <Lock size={32} className="mx-auto mb-3 text-gray-700 opacity-20" />
                   <p className="text-[10px] text-gray-600 font-black uppercase italic">شما هنوز نشانی کسب نکرده‌اید</p>
                </div>
              )}
           </div>
        </NeonCard>
      </div>

      <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
         <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-neon-blue" />
            <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">نشان‌های استاندارد رایگان</h4>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allBadges.filter((b: any) => b.category === "STANDARD").map((b: any, i: number) => {
              const hasBadge = userBadges.some(ub => (ub.badgeId || ub.id) === b.id);
              return (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3 group relative overflow-hidden",
                    hasBadge ? "bg-neon-blue/10 border-neon-blue/40" : "bg-white/5 border-white/5 border-dashed hover:border-white/20"
                  )}
                  onClick={() => toggleBadge(b.id)}
                >
                   <img src={b.iconUrl} alt={b.name} className={cn("h-10 w-10 object-contain transition-transform group-hover:scale-110", !hasBadge && "grayscale opacity-50")} />
                   <span className={cn("text-[8px] font-black italic text-center", hasBadge ? "text-white" : "text-gray-600")}>{b.name}</span>
                   {hasBadge && (
                     <div className="absolute top-0 right-0 p-1">
                        <UserCheck size={10} className="text-neon-blue" />
                     </div>
                   )}
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "profile", label: "پروفایل", icon: User },
    { id: "security", label: "امنیت", icon: Lock },
    { id: "notifications", label: "اعلان‌ها", icon: Bell },
    { id: "ui", label: "رابط کاربری", icon: Monitor },
    { id: "region", label: "منطقه", icon: Globe },
    { id: "badges", label: "نشان‌ها", icon: Award },
    { id: "elite", label: "تنظیمات نخبگان", icon: Crown },
  ];

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

              <div className="lg:col-span-3">
                {activeTab === "elite" && renderElite()}
                {activeTab === "profile" && renderProfile()}
                {activeTab === "badges" && renderBadges()}
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
