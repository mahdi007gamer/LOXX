import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { 
  Crown, 
  User, 
  Image as ImageIcon, 
  Palette, 
  Zap, 
  Flame, 
  Sparkles, 
  CircleDashed, 
  Cpu, 
  Orbit, 
  ShieldCheck,
  Monitor,
  MessageSquare,
  ArrowRight,
  Camera,
  Trash2,
  RefreshCw,
  Upload,
  Layers,
  Settings2,
  Lock,
  Trophy
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

type FrameType = "none" | "lightning" | "glitch" | "fire" | "anime" | "neon_pulse" | "cyber" | "cosmic" | "shield" | "gold_aura" | "diamond";
type GradientType = "linear" | "radial" | "conic";

interface VIPMetadata {
  frame: FrameType;
  frameColor: string;
  effectType: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    gradient?: {
      enabled: boolean;
      color1: string;
      color2: string;
      type: GradientType;
      angle: number;
    };
  };
  chatStyle?: {
    bubbleColor: string;
    textColor: string;
    effect?: string;
  };
}

export const EliteSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [metadata, setMetadata] = useState<VIPMetadata>({
    frame: "none",
    frameColor: "#00e5ff",
    effectType: "none",
    colors: {
      bg: "rgba(13, 13, 20, 0.9)",
      text: "#ffffff",
      accent: "#00e5ff",
      gradient: {
        enabled: false,
        color1: "#00e5ff",
        color2: "#0044ff",
        type: "linear",
        angle: 45
      }
    }
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");

  useEffect(() => {
    if (user?.vipMetadata) {
      try {
        const parsed = typeof user.vipMetadata === 'string' ? JSON.parse(user.vipMetadata) : user.vipMetadata;
        setMetadata(prev => {
          const merged = { ...prev, ...parsed };
          // Ensure nested objects exist
          if (!merged.colors.gradient) {
            merged.colors.gradient = {
              enabled: false,
              color1: merged.colors.accent,
              color2: "#000000",
              type: "linear",
              angle: 45
            };
          }
          return merged;
        });
      } catch (e) {
        console.error("Failed to parse VIP metadata", e);
      }
    }
    setLoading(false);
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const setter = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setter(true);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'avatar') setAvatarUrl(data.url);
      else setBannerUrl(data.url);
      toast.success("فایل با موفقیت آپلود شد");
    } catch (err: any) {
      toast.error("خطا در آپلود فایل");
    } finally {
      setter(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/user/profile", {
        avatarUrl,
        bannerUrl,
        vipMetadata: JSON.stringify(metadata)
      });
      updateUser({ avatarUrl, bannerUrl, vipMetadata: metadata });
      toast.success("تنظیمات نخبگان با موفقیت ذخیره شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  const frames: { id: FrameType; label: string; icon: any; color: string; disabled?: boolean }[] = [
    { id: "none", label: "بدون فریم", icon: User, color: "gray" },
    { id: "gold_aura", label: "هاله طلایی", icon: Crown, color: "yellow" },
    { id: "diamond", label: "دیاموند", icon: Trophy, color: "blue" },
    { id: "lightning", label: "رعد و برق", icon: Zap, color: "blue" },
    { id: "glitch", label: "گلیچ", icon: Monitor, color: "pink" },
    { id: "fire", label: "آتشین", icon: Flame, color: "orange" },
    { id: "neon_pulse", label: "نئون پالز", icon: CircleDashed, color: "cyan" },
    { id: "anime", label: "انیمه‌ای", icon: Sparkles, color: "purple", disabled: true },
    { id: "cyber", label: "سایبر کور", icon: Cpu, color: "green", disabled: true },
    { id: "cosmic", label: "کازمیک رینگ", icon: Orbit, color: "indigo", disabled: true },
    { id: "shield", label: "سپر انرژی", icon: ShieldCheck, color: "yellow", disabled: true },
  ];

  const getBackgroundStyle = () => {
    if (!metadata.colors.gradient?.enabled) {
      return { backgroundColor: metadata.colors.bg };
    }
    const { color1, color2, type, angle } = metadata.colors.gradient;
    if (type === "linear") return { background: `linear-gradient(${angle}deg, ${color1}, ${color2})` };
    if (type === "radial") return { background: `radial-gradient(circle at center, ${color1}, ${color2})` };
    return { background: `conic-gradient(from ${angle}deg, ${color1}, ${color2})` };
  };

  const renderFrameEffect = (type: FrameType) => {
    switch (type) {
      case "lightning":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ opacity: [0, 0.4, 0.2, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-blue-400/20 blur-2xl"
            />
            <div className="absolute inset-0 border-[3px] border-blue-400/30 rounded-[2.5rem]" />
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [1, 1.02, 1],
                  filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                }}
                transition={{ repeat: Infinity, duration: 0.15, delay: i * 0.4 }}
                className="absolute inset-0 border-[2px] border-white/40 shadow-[0_0_25px_rgba(96,165,250,0.9)] rounded-[2.5rem]"
              />
            ))}
          </div>
        );
      case "fire":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-orange-600/60 via-red-500/20 to-transparent blur-xl" />
            <div className="absolute inset-x-0 bottom-0 border-b-[4px] border-orange-500/50 blur-[2px]" />
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  y: [20, -120],
                  x: [i * 15, i * 15 + (Math.sin(i) * 30)],
                  opacity: [0, 1, 0],
                  scale: [1.2, 0.2],
                  rotate: [0, 180]
                }}
                transition={{ repeat: Infinity, duration: 0.8 + Math.random(), delay: i * 0.15 }}
                className="absolute bottom-0 w-6 h-6 bg-orange-500/40 rounded-full blur-md"
              />
            ))}
          </div>
        );
      case "glitch":
        return (
          <motion.div 
            animate={{ 
              x: ["-2px", "2px", "-1px", "1px", "0px"],
              y: ["1px", "-1px", "0px"],
              filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(0deg)"]
            }}
            transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 3 }}
            className="absolute inset-0 z-0 border-[3px] border-pink-500 rounded-[2.5rem] shadow-[inset_0_0_20px_rgba(236,72,153,0.5),0_0_15px_rgba(236,72,153,0.5)]"
          />
        );
      case "neon_pulse":
        return (
          <motion.div 
            animate={{ 
              boxShadow: [
                "0 0 10px #00e5ff, inset 0 0 10px #00e5ff",
                "0 0 30px #00e5ff, inset 0 0 15px #00e5ff",
                "0 0 10px #00e5ff, inset 0 0 10px #00e5ff"
              ],
              borderColor: ["#00e5ff", "#ffffff", "#00e5ff"]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 z-0 border-[3px] border-cyan-400 rounded-[2.5rem]"
          />
        );
      case "gold_aura":
        return (
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -inset-8 z-0 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_70%)] rounded-full pointer-events-none"
          />
        );
      case "diamond":
        return (
          <div className="absolute inset-0 z-0 border-2 border-cyan-400/30 rounded-none transform rotate-45 scale-150 pointer-events-none" />
        );
      case "cyber":
        return (
          <div className="absolute inset-0 z-0 border-2 border-green-500/20 rounded-[2.5rem] animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)] pointer-events-none" />
        );
      case "cosmic":
        return (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 z-0 border-t-2 border-indigo-500/40 rounded-full pointer-events-none"
          />
        );
      default:
        return null;
    }
  };

  const isVip = user?.membership === "VIP";

  if (!isVip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Sidebar />
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto">
          <div className="h-20 w-20 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 mx-auto mb-6">
            <Crown size={40} />
          </div>
          <h2 className="text-2xl font-black text-white italic mb-4">دسترسی محدود!</h2>
          <p className="text-gray-400 font-bold mb-8 italic">تنظیمات نخبگان فقط برای اعضای دارای اشتراک VIP فعال است. با ارتقای حساب کاربری، قفل این قابلیت را باز کنید.</p>
          <GlowButton 
            variant="gold" 
            className="w-full h-12 uppercase italic font-black"
            onClick={() => window.location.href = "/premium"}
          >
            مشاهده پنل اشتراک
          </GlowButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] pb-20 md:pb-0">
      <Sidebar />
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileUpload(e, 'avatar')} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileUpload(e, 'banner')} />
      
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2 justify-end">
                <span className="text-[10px] font-black bg-yellow-400 text-dark-bg px-2 py-0.5 rounded uppercase tracking-widest italic">Elite Access</span>
                <Crown size={20} className="text-yellow-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">تنظیمات نخبگان</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 italic">پروفایل خود را به سطح افسانه‌ای برسانید</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = "/settings"}
                className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white italic hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <ArrowRight size={16} /> بازگشت به تنظیمات
              </button>
              <GlowButton 
                variant="gold" 
                className="h-12 px-10 uppercase italic font-black text-xs shadow-xl shadow-yellow-500/20"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "در حال ذخیره..." : "اعمال تغییرات نخبگان"}
              </GlowButton>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customization Controls */}
            <div className="lg:col-span-7 space-y-8">
              {/* Media */}
              <NeonCard variant="gold" className="space-y-6 overflow-hidden">
                <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
                  <Layers size={100} />
                </div>
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4 relative z-10">
                  <ImageIcon size={20} className="text-yellow-400" />
                  <span>رسانه‌های متحرک</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">تصویر پروفایل (JPG, PNG, GIF)</label>
                    <div className="relative group">
                       <div className="h-40 w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-yellow-400/50 transition-colors">
                          {avatarUrl ? (
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                             <User size={48} className="text-gray-700" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                             <GlowButton 
                               variant="gold" 
                               size="sm" 
                               className="h-8 text-[10px]"
                               onClick={() => avatarInputRef.current?.click()}
                               disabled={uploadingAvatar}
                             >
                               <Upload size={12} className="ml-1" /> {uploadingAvatar ? "در حال آپلود..." : "آپلود فایل"}
                             </GlowButton>
                             {avatarUrl && (
                               <button onClick={() => setAvatarUrl("")} className="text-[10px] font-black text-neon-pink uppercase italic">حذف تصویر</button>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="یا آدرس تصویر خود را وارد کنید..." 
                         value={avatarUrl}
                         onChange={(e) => setAvatarUrl(e.target.value)}
                         className="text-[10px]"
                       />
                       <button 
                         onClick={() => avatarInputRef.current?.click()}
                         className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                         title="آپلود فایل"
                       >
                         <Upload size={14} className="text-yellow-400" />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">بنر پروفایل (JPG, PNG, GIF)</label>
                    <div className="relative group">
                       <div className="h-40 w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-yellow-400/50 transition-colors">
                          {bannerUrl ? (
                             <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                             <ImageIcon size={48} className="text-gray-700" />
                          )}
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                             <GlowButton 
                               variant="gold" 
                               size="sm" 
                               className="h-8 text-[10px]"
                               onClick={() => bannerInputRef.current?.click()}
                               disabled={uploadingBanner}
                             >
                               <Upload size={12} className="ml-1" /> {uploadingBanner ? "در حال آپلود..." : "آپلود فایل"}
                             </GlowButton>
                             {bannerUrl && (
                               <button onClick={() => setBannerUrl("")} className="text-[10px] font-black text-neon-pink uppercase italic">حذف بنر</button>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <Input 
                         placeholder="یا آدرس بنر خود را وارد کنید..." 
                         value={bannerUrl}
                         onChange={(e) => setBannerUrl(e.target.value)}
                         className="text-[10px]"
                       />
                       <button 
                         onClick={() => bannerInputRef.current?.click()}
                         className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                         title="آپلود فایل"
                       >
                         <Upload size={14} className="text-yellow-400" />
                       </button>
                    </div>
                  </div>
                </div>
              </NeonCard>

              {/* Frames */}
              <NeonCard className="space-y-6">
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                  <Monitor size={20} className="text-neon-blue" />
                  <span>فریم‌های ویژه Mini Profile</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {frames.map((frame) => (
                    <button
                      key={frame.id}
                      disabled={frame.disabled}
                      onClick={() => setMetadata({ ...metadata, frame: frame.id })}
                      className={cn(
                        "group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all aspect-square",
                        metadata.frame === frame.id 
                          ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.2)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20",
                        frame.disabled && "opacity-40 cursor-not-allowed grayscale"
                      )}
                    >
                      {frame.disabled && (
                        <div className="absolute top-1 left-1 bg-black/60 rounded-lg px-1.5 py-0.5 z-10">
                           <Lock size={8} className="text-yellow-400" />
                        </div>
                      )}
                      <frame.icon size={22} className={cn("mb-2", metadata.frame === frame.id ? "text-neon-blue" : "text-gray-500 group-hover:text-white")} />
                      <span className={cn("text-[8px] font-black italic uppercase tracking-tighter text-center", metadata.frame === frame.id ? "text-white" : "text-gray-600")}>
                        {frame.label}
                        {frame.disabled && <span className="block text-[6px] text-yellow-400/70 mt-0.5">Soon</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </NeonCard>

              {/* Colors & Gradient */}
              <NeonCard className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-lg font-black text-white italic flex items-center gap-2">
                    <Palette size={20} className="text-neon-pink" />
                    <span>شخصی‌سازی رنگ‌های پروفایل</span>
                  </h3>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1.5 border border-white/10">
                     <button 
                        onClick={() => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, enabled: false } } }))}
                        className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase italic", !metadata.colors.gradient?.enabled ? "bg-neon-blue text-dark-bg" : "text-gray-500")}
                      >ثابت</button>
                     <button 
                        onClick={() => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, enabled: true } } }))}
                        className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase italic", metadata.colors.gradient?.enabled ? "bg-neon-pink text-dark-bg" : "text-gray-500")}
                      >گردینت</button>
                  </div>
                </div>

                <div className="space-y-8">
                  {metadata.colors.gradient?.enabled ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">رنگ اول</label>
                                <div className="flex gap-3 items-center">
                                  <input type="color" value={metadata.colors.gradient.color1} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color1: e.target.value } } }))} className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer" />
                                  <span className="text-[10px] font-mono text-gray-400 uppercase">{metadata.colors.gradient.color1}</span>
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">رنگ دوم</label>
                                <div className="flex gap-3 items-center">
                                  <input type="color" value={metadata.colors.gradient.color2} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color2: e.target.value } } }))} className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer" />
                                  <span className="text-[10px] font-mono text-gray-400 uppercase">{metadata.colors.gradient.color2}</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">نوع گرادینت</label>
                             <div className="grid grid-cols-3 gap-2">
                                {(["linear", "radial", "conic"] as GradientType[]).map(type => (
                                  <button 
                                    key={type}
                                    onClick={() => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, type } } }))}
                                    className={cn("py-2 rounded-xl border text-[9px] font-black uppercase italic transition-all", metadata.colors.gradient?.type === type ? "border-neon-pink bg-neon-pink/10 text-neon-pink" : "border-white/10 hover:border-white/30 text-gray-500")}
                                  >
                                    {type}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">زاویه / جهت ({metadata.colors.gradient.angle}°)</label>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={metadata.colors.gradient.angle} 
                                onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, angle: parseInt(e.target.value) } } }))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-pink"
                             />
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">پیش‌نمایش پس‌زمینه</h4>
                             <div 
                                className="h-32 w-full rounded-xl border border-white/10 shadow-inner" 
                                style={getBackgroundStyle()}
                             />
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-neon-pink/5 border border-neon-pink/10 rounded-xl">
                             <Settings2 size={14} className="text-neon-pink" />
                             <p className="text-[9px] text-neon-pink/70 font-bold uppercase italic">گرادینت فقط روی پس‌زمینه مینی پروفایل اعمال می‌شود.</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ پس‌زمینه</label>
                        <div className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <input type="color" value={metadata.colors.bg} onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, bg: e.target.value } })} className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer" />
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{metadata.colors.bg}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ متن‌ها</label>
                        <div className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <input type="color" value={metadata.colors.text} onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, text: e.target.value } })} className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer" />
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{metadata.colors.text}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ المان‌های UI</label>
                        <div className="flex gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <input type="color" value={metadata.colors.accent} onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, accent: e.target.value } })} className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer" />
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{metadata.colors.accent}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </NeonCard>
            </div>

            {/* Live Preview Sidebar */}
            <div className="lg:col-span-5 sticky top-24 self-start">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <h3 className="text-[10px] font-black text-neon-blue uppercase tracking-[0.4em] italic">Mini Profile Live</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>
                
                {/* The Preview Card - Matching QuickProfilePopover design */}
                <div className="relative group perspective-1000 scale-[1.05]">
                  <motion.div 
                    initial={false}
                    animate={{ rotateY: [0, 1, 0, -1, 0], rotateX: [0, -1, 0, 1, 0], y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="relative w-full aspect-[4/5] max-w-[320px] mx-auto rounded-[32px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
                    style={{ 
                      ...getBackgroundStyle(),
                      borderColor: metadata.colors.accent + "40"
                    }}
                  >
                    {/* Frame Effects */}
                    {renderFrameEffect(metadata.frame)}

                    {/* Banner section matching original design */}
                    <div className="h-28 relative overflow-hidden">
                       {/* Banner Image */}
                       {bannerUrl ? (
                         <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                       ) : (
                         <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800" />
                       )}
                       {/* Overlay matching isVIP logic */}
                       <div className="absolute inset-0 bg-black/30"></div>
                       <motion.div 
                          animate={{ opacity: [0.1, 0.4, 0.1], x: [-20, 20, -20] }}
                          transition={{ duration: 5, repeat: Infinity }}
                          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" 
                       />
                    </div>

                    {/* Content area matching original design */}
                    <div className="px-6 pb-6 pt-0 relative z-10">
                      <div className="flex items-start justify-between">
                         {/* Avatar with Ring */}
                         <div className="relative -mt-12 mb-3 inline-block">
                            <div className={cn(
                              "h-24 w-24 rounded-[32px] bg-[#0a0a0f] p-[2px] shadow-2xl relative z-10 bg-gradient-to-tr",
                              metadata.frameColor !== "#00e5ff" ? `from-[${metadata.frameColor}]` : "from-yellow-400 to-yellow-200"
                            )}>
                               <div className="h-full w-full rounded-[28px] bg-[#0d0d12] flex items-center justify-center text-5xl overflow-hidden relative border-4 border-[#0a0a0f]">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-4xl opacity-50">👤</span>
                                  )}
                                  {/* VIP Animated Aura */}
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(250,204,21,0.2),transparent)]"
                                  />
                               </div>
                            </div>
                            
                            {/* Online Status */}
                            <div className="absolute top-1 right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-[#0a0a0f] z-20 shadow-lg"></div>
                            
                            {/* Crown badge */}
                            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-yellow-400 text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-xl z-20">
                               <Crown size={14} fill="currentColor" />
                            </div>
                         </div>

                         {/* Action button placeholder */}
                         <div className="mt-4 h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 opacity-50">
                            <MessageSquare size={22} />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <div className="flex items-center gap-2">
                               <h4 className="text-2xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                 {user?.displayName || "Loxx Gamer"}
                               </h4>
                               <ShieldCheck size={16} className="text-neon-blue" fill="currentColor" />
                            </div>
                            <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em] flex items-center gap-1 mt-0.5" style={{ color: metadata.colors.accent }}>
                               <Crown size={12} /> عضو ویژه (VIP)
                            </span>
                         </div>

                         {/* Stats matching original design */}
                         <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center transition-colors" style={{ borderColor: metadata.colors.accent + "20" }}>
                              <p className="text-[8px] text-gray-600 font-black uppercase mb-1">رتبه لوکس</p>
                              <div className="flex items-center justify-center gap-1">
                                 <ShieldCheck size={10} className="text-neon-pink" />
                                 <p className="text-[10px] font-black text-white italic uppercase" style={{ color: metadata.colors.text }}>Supreme</p>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center transition-colors" style={{ borderColor: metadata.colors.accent + "20" }}>
                              <p className="text-[8px] text-gray-600 font-black uppercase mb-1">سطح ارشد</p>
                              <div className="flex items-center justify-center gap-1">
                                 <Sparkles size={10} className="text-neon-blue" />
                                 <p className="text-[10px] font-black text-white italic" style={{ color: metadata.colors.text }}>{user?.level || 99}</p>
                              </div>
                            </div>
                         </div>

                         <div className="pt-2">
                            <GlowButton 
                              variant="purple" 
                              className="w-full h-11 !rounded-2xl font-black text-xs uppercase italic tracking-widest bg-gradient-to-r from-yellow-600 to-yellow-400 text-dark-bg border-none"
                              disabled
                            >
                               ذخیره و پیش‌نمایش
                            </GlowButton>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="pt-8">
                  <NeonCard variant="blue" className="p-5 border-neon-blue/20 bg-neon-blue/5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0 animate-pulse">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white italic">اتصال زنده برقرار است</h4>
                        <p className="text-[10px] text-gray-500 font-bold italic uppercase leading-tight mt-1">
                          تمام تغییرات بصری شما بلافاصله در سیستم مرکزی LOXX همگام‌سازی می‌شود.
                        </p>
                      </div>
                    </div>
                  </NeonCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
