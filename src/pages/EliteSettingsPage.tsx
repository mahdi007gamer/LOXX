import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { SmartImage } from "../components/ui/SmartImage";
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
import { useNavigate } from "react-router-dom";

type FrameType = "none" | "lightning" | "glitch" | "fire" | "anime" | "neon_pulse" | "cyber" | "cosmic" | "shield" | "gold_aura" | "diamond";
type GradientType = "linear" | "radial" | "conic";

interface VIPMetadata {
  auraEffect: boolean;
  shinyName: boolean;
  specialFrame: boolean;
  fullGlow: boolean;
  frame: FrameType;
  frameColor: string;
  effectType: string;
  fontStyle?: "none" | "lightning" | "glitch" | "fire";
  opacity: number;
  bgImage?: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    statsText?: string;
    statsLabel?: string;
    badgeText?: string;
    textGradient?: string;
    auraColor?: string;
    glowColor?: string;
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
  const navigate = useNavigate();
  const { user, updateUser, isSidebarCollapsed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  
  const [metadata, setMetadata] = useState<VIPMetadata>({
    auraEffect: false,
    shinyName: false,
    specialFrame: false,
    fullGlow: false,
    frame: "none",
    frameColor: "#00e5ff",
    effectType: "none",
    fontStyle: "none",
    opacity: 0.2,
    colors: {
      bg: "#0d0d14",
      text: "#ffffff",
      accent: "#00e5ff",
      statsText: "#ffffff",
      statsLabel: "#4b5563",
      badgeText: "#ffffff",
      auraColor: "#eab308",
      glowColor: "#facc15",
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
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    const initMetadata = () => {
      if (!user?.vipMetadata) {
        setLoading(false);
        return;
      }
      
      try {
        const parsed = typeof user.vipMetadata === 'string' ? JSON.parse(user.vipMetadata) : user.vipMetadata;
        setMetadata(prev => ({
          ...prev,
          ...parsed,
          colors: {
            ...prev.colors,
            ...(parsed.colors || {}),
            gradient: {
              ...prev.colors.gradient!,
              ...(parsed.colors?.gradient || {})
            }
          }
        }));
      } catch (e) {
        console.error("Failed to parse VIP metadata", e);
      } finally {
        setLoading(false);
      }
    };

    initMetadata();
  }, [user]);

  const handleReset = () => {
    if (window.confirm("آیا مطمئن هستید که می‌خواهید تمامی تنظیمات نخبگان را به حالت پیش‌فرض برگردانید؟")) {
      setMetadata({
        auraEffect: false,
        shinyName: false,
        specialFrame: false,
        fullGlow: false,
        frame: "none",
        frameColor: "#00e5ff",
        effectType: "none",
        fontStyle: "none",
        opacity: 0.2,
        colors: {
          bg: "#0d0d14",
          text: "#ffffff",
          accent: "#00e5ff",
          statsText: "#ffffff",
          statsLabel: "#4b5563",
          badgeText: "#ffffff",
          gradient: {
            enabled: false,
            color1: "#00e5ff",
            color2: "#0044ff",
            type: "linear",
            angle: 45
          }
        }
      });
      toast.success("تنظیمات به حالت پیش‌فرض بازگشت");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'bg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    let setter;
    if (type === 'avatar') setter = setUploadingAvatar;
    else if (type === 'banner') setter = setUploadingBanner;
    else setter = setUploadingBg;

    setter(true);

    try {
      const { data } = await api.post(`/upload?target=${type === 'avatar' ? 'profile' : type === 'banner' ? 'cover' : 'elite_bg'}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'avatar') setAvatarUrl(data.url);
      else if (type === 'banner') setBannerUrl(data.url);
      else setMetadata(m => ({ ...m, bgImage: data.url }));
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
  ];

  const getFontStyle = () => {
    if (metadata?.fontStyle === "lightning") {
      return { textShadow: "0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 40px #0ff", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    if (metadata?.fontStyle === "fire") {
      return { textShadow: "0 -2px 4px #fff, 0 -2px 10px #ff3, 0 -10px 20px #fd3, 0 -18px 40px #f80", animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    if (metadata?.fontStyle === "glitch") {
      return { textShadow: "2px 0 0 rgba(255,0,0,0.8), -2px 0 0 rgba(0,255,255,0.8)", animation: "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    return { textShadow: "0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)" };
  };

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
      default:
        return null;
    }
  };

  const isVip = user?.membership === "VIP" || (user as any)?.membershipType === "VIP";

  if (!isVip && !loading) {
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
            onClick={() => navigate("/premium")}
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
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'avatar')} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'banner')} />
      <input type="file" ref={bgImageInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'bg')} />
      
      <main className={cn("flex-1 px-4 py-8 lg:px-8 transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
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
                onClick={handleReset}
                className="h-12 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-black text-red-500 italic hover:bg-red-500/20 transition-all flex items-center gap-2"
                title="بازگشت به تنظیمات کارخانه"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => navigate("/settings")}
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

          <div className="grid grid-cols-1 gap-8 items-start">
            <div className="space-y-8">
              {/* Media & Advanced Effects Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Media & Background */}
                  <NeonCard variant="gold" className="space-y-6">
                    <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                      <ImageIcon size={20} className="text-yellow-400" />
                      <span>رسانه و پس‌زمینه نخبگان</span>
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase italic">تصویر آواتار</label>
                          <GlowButton variant="gold" size="sm" className="w-full h-10 text-[10px]" onClick={() => avatarInputRef.current?.click()}>تغییر آواتار</GlowButton>
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase italic">بنر پروفایل</label>
                          <GlowButton variant="gold" size="sm" className="w-full h-10 text-[10px]" onClick={() => bannerInputRef.current?.click()}>تغییر بنر</GlowButton>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic">پس‌زمینه مینی پروفایل (JPG, PNG, GIF, WEBP)</label>
                        <div className="relative group">
                          <div className={cn(
                            "h-32 w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center transition-all",
                            metadata.bgImage ? "border-yellow-400/30" : "hover:border-yellow-400/20"
                          )}>
                            {metadata.bgImage ? (
                              <img src={metadata.bgImage} alt="Background" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                <ImageIcon size={32} className="text-gray-700 mb-2 mx-auto" />
                                <p className="text-[8px] text-gray-600 font-bold uppercase italic">بدون بک‌گراند اختصاصی</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <GlowButton 
                                variant="gold" 
                                size="sm" 
                                className="h-8 text-[10px]"
                                onClick={() => bgImageInputRef.current?.click()}
                                disabled={uploadingBg}
                              >
                                <Upload size={12} className="ml-1" /> {uploadingBg ? "در حال آپلود..." : "آپلود فایل"}
                              </GlowButton>
                              {metadata.bgImage && (
                                <button onClick={() => setMetadata(m => ({ ...m, bgImage: undefined }))} className="text-[10px] font-black text-neon-pink uppercase italic hover:scale-110 transition-transform">حذف تصویر</button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase italic">میزان شفافیت بک‌گراند ({Math.round(metadata.opacity * 100)}%)</label>
                            <span className="text-[10px] font-mono text-yellow-400">{metadata.opacity.toFixed(2)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={metadata.opacity} 
                            onChange={(e) => setMetadata(m => ({ ...m, opacity: parseFloat(e.target.value) }))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400"
                          />
                        </div>
                      </div>
                    </div>
                  </NeonCard>

                  {/* Effects */}
                  <NeonCard variant="blue" className="space-y-6">
                    <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                      <Sparkles size={20} className="text-neon-blue" />
                      <span>امکانات پیشرفته نخبگان</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "auraEffect", label: "هاله نورانی (Aura)", icon: Flame, color: "text-orange-400", desc: "هاله متحرک دور آواتار" },
                        { id: "shinyName", label: "نام درخشان (Shiny)", icon: Sparkles, color: "text-white", desc: "افکت درخشش روی نام" },
                        { id: "specialFrame", label: "فریم متحرک", icon: Zap, color: "text-neon-blue", desc: "فریم متحرک دور کل پروفایل" },
                        { id: "fullGlow", label: "ویژگی Glow", icon: Zap, color: "text-yellow-400", desc: "هاله نورانی دور مینی پروفایل" },
                      ].map(effect => (
                        <div 
                          key={effect.id} 
                          className={cn(
                            "group cursor-pointer flex flex-col p-4 rounded-2xl border transition-all duration-300",
                            (metadata as any)[effect.id] 
                              ? "bg-white/10 border-white/20" 
                              : "bg-white/5 border-white/5 hover:border-white/10"
                          )}
                          onClick={() => setMetadata(m => ({ ...m, [effect.id]: !((m as any)[effect.id]) }))}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <div className={cn("p-2 rounded-xl bg-white/5", effect.color)}>
                                <effect.icon size={16} />
                             </div>
                             <div className={cn(
                               "w-8 h-4 rounded-full relative transition-all",
                               (metadata as any)[effect.id] ? "bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "bg-gray-800"
                             )}>
                                <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", (metadata as any)[effect.id] ? "right-0.5" : "left-0.5")} />
                             </div>
                          </div>
                          <span className="text-[11px] font-black text-white italic">{effect.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">فونت استایل (Font Style)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "none", label: "بدون افکت" },
                          { id: "lightning", label: "برقی" },
                          { id: "glitch", label: "گیلیچ" },
                          { id: "fire", label: "آتیش" }
                        ].map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setMetadata({ ...metadata, fontStyle: style.id as any })}
                            className={cn(
                              "relative h-12 rounded-xl border transition-all flex items-center justify-center group",
                              metadata.fontStyle === style.id 
                                ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.2)]" 
                                : "bg-white/5 border-white/5 hover:border-white/10"
                            )}
                          >
                             <span className={cn("text-xs font-black uppercase tracking-widest italic", metadata.fontStyle === style.id ? "text-neon-blue" : "text-gray-400")}>{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </NeonCard>
              </div>

               {/* Colors & Preview */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Color Controls */}
                  <NeonCard variant="purple" className="lg:col-span-12 xl:col-span-5 space-y-6 self-start">
                     <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                       <Palette size={20} className="text-neon-purple" />
                       <span>سفارشی‌سازی متون و رنگ‌ها</span>
                     </h3>
 
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ نام کاربری</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, text: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, text: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ تایتل (ثانویه)</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.textGradient || metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, textGradient: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.textGradient || metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, textGradient: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ تم (Accent)</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.accent} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, accent: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.accent} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, accent: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                        </div>
 
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ مقادیر آمار (Stats)</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.statsText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsText: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.statsText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsText: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ لیبل‌ها</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.statsLabel || "#4b5563"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsLabel: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.statsLabel || "#4b5563"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsLabel: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ متن نشان‌ها</label>
                              <div className="flex gap-2">
                                <input type="color" value={metadata.colors.badgeText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, badgeText: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                <Input value={metadata.colors.badgeText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, badgeText: e.target.value } }))} className="flex-1" />
                              </div>
                           </div>
                           {metadata.auraEffect && (
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ هاله نورانی</label>
                                <div className="flex gap-2">
                                  <input type="color" value={metadata.colors.auraColor || "#eab308"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, auraColor: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                  <Input value={metadata.colors.auraColor || "#eab308"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, auraColor: e.target.value } }))} className="flex-1" />
                                </div>
                             </div>
                           )}
                           {metadata.fullGlow && (
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase italic">رنگ ویژگی Glow</label>
                                <div className="flex gap-2">
                                  <input type="color" value={metadata.colors.glowColor || "#facc15"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, glowColor: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
                                  <Input value={metadata.colors.glowColor || "#facc15"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, glowColor: e.target.value } }))} className="flex-1" />
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
 
                     <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[11px] font-black text-white italic">پس‌زمینه گرادینت کارت</span>
                           <button 
                              onClick={() => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, enabled: !m.colors.gradient?.enabled } } }))}
                              className={cn(
                                "w-10 h-5 rounded-full relative transition-all",
                                metadata.colors.gradient?.enabled ? "bg-neon-pink" : "bg-gray-800"
                              )}
                           >
                              <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", metadata.colors.gradient?.enabled ? "right-1" : "left-1")} />
                           </button>
                        </div>
                        
                        {metadata.colors.gradient?.enabled && (
                          <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black text-gray-500 uppercase italic">رنگ اول</span>
                                   <input type="color" value={metadata.colors.gradient.color1} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color1: e.target.value } } }))} className="w-full h-10 rounded-xl cursor-pointer" />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black text-gray-500 uppercase italic">رنگ دوم</span>
                                   <input type="color" value={metadata.colors.gradient.color2} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color2: e.target.value } } }))} className="w-full h-10 rounded-xl cursor-pointer" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase italic">زاویه ({metadata.colors.gradient.angle}°)</label>
                                <input type="range" min="0" max="360" value={metadata.colors.gradient.angle} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, angle: parseInt(e.target.value) } } }))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-pink" />
                             </div>
                          </div>
                        )}
                     </div>
                  </NeonCard>
 
                  {/* Preview Section */}
                  <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-center justify-start py-4">
                     <div className="mb-6 flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                        <Sparkles size={16} />
                        <span className="text-[10px] font-black uppercase italic tracking-widest">پیش‌نمایش نهایی مینی پروفایل</span>
                     </div>
                     
                     <div className="relative group scale-[1.1] transition-transform">
                       <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         className={cn(
                           "relative w-[340px] rounded-[48px] overflow-hidden border backdrop-blur-3xl transition-all duration-500",
                           metadata.fullGlow ? "border-yellow-400" : "shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-white/10"
                         )}
                         style={{
                           ...getBackgroundStyle(),
                           boxShadow: metadata.fullGlow ? `0 0 60px ${metadata.colors.glowColor || "#facc15"}4d` : undefined
                         }}
                       >
                         {/* Background Image Layer */}
                         {metadata.bgImage && (
                           <div 
                             className="absolute inset-0 z-0 pointer-events-none" 
                             style={{ 
                               backgroundImage: `url(${metadata.bgImage})`, 
                               backgroundSize: 'cover', 
                               backgroundPosition: 'center', 
                               opacity: metadata.opacity 
                             }} 
                           />
                         )}
 
                         {/* Enhanced Readability Overlay - exactly as in Popover */}
                         <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
 
                         {renderFrameEffect(metadata.frame)}
 
                         <div className="h-32 relative overflow-hidden z-10">
                            {bannerUrl ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-[#0a0a0f]" />}
                            <div className="absolute inset-0 bg-black/40" />
                         </div>
 
                         <div className="px-8 pb-10 pt-0 relative z-10">
                           <div className="flex items-start justify-between">
                              <div className="relative -mt-14 mb-4 inline-block">
                                 {metadata.auraEffect && (
                                   <motion.div 
                                     animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }} 
                                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
                                     className="absolute -inset-2 rounded-[38px] blur-xl z-0 pointer-events-none"
                                     style={{ backgroundColor: metadata.colors.auraColor || "#eab308" }}
                                   />
                                 )}
                                 <div className={cn(
                                    "h-24 w-24 rounded-[32px] bg-[#0a0a0f] p-[2px] relative z-20",
                                    metadata.frame === "lightning" ? "border-blue-400 shadow-[0_0_15px_blue]" : "bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-600"
                                 )}>
                                    <div className="h-full w-full rounded-[30px] bg-[#0d0d12] flex items-center justify-center overflow-hidden">
                                       {avatarUrl ? <SmartImage src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-700" />}
                                    </div>
                                 </div>
                                 <div className="absolute top-1 right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-[#0a0a0f] z-[25]"></div>
                              </div>
                           </div>
 
                           <div className="space-y-6">
                             <div>
                                <h4 
                                  className={cn("text-2xl font-black italic tracking-tighter uppercase", metadata.shinyName && "animate-pulse")}
                                  style={{ 
                                    color: metadata.colors.text,
                                    ...getFontStyle()
                                  }}
                                >
                                  {user?.displayName || "Elite User"}
                                </h4>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1" style={{ color: metadata.colors.accent }}>
                                   <div className="h-1 w-1 rounded-full bg-current animate-ping" />
                                   عضو ویژه لوکس (VIP)
                                </span>
                             </div>
 
                             <div className="grid grid-cols-4 gap-2 py-4 border-y border-white/5">
                                 <div className="text-center">
                                    <p className="text-[8px] font-black uppercase mb-1 italic" style={{ color: metadata.colors.statsLabel || "#4b5563" }}>عضویت</p>
                                    <p className="text-xs font-black italic" style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>742 روز</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[8px] font-black uppercase mb-1 italic" style={{ color: metadata.colors.statsLabel || "#4b5563" }}>دوستان</p>
                                    <p className="text-xs font-black italic" style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>128</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[8px] font-black uppercase mb-1 italic" style={{ color: metadata.colors.statsLabel || "#4b5563" }}>لابی‌ها</p>
                                    <p className="text-xs font-black italic" style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>42</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[8px] font-black uppercase mb-1 italic" style={{ color: metadata.colors.statsLabel || "#4b5563" }}>رتبه</p>
                                    <p className="text-xs font-black italic" style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Supreme</p>
                                 </div>
                             </div>
 
                             <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                                   <span className="text-[8px] font-black uppercase italic" style={{ color: metadata.colors.badgeText || "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>FOUNDER</span>
                                </div>
                                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                                   <span className="text-[8px] font-black uppercase italic" style={{ color: metadata.colors.badgeText || "#6b7280" }}>CHAMPION</span>
                                </div>
                             </div>
 
                             <GlowButton variant="gold" className="w-full h-12 !rounded-2xl font-black text-xs uppercase italic tracking-widest bg-gradient-to-r from-yellow-500 to-yellow-600 text-dark-bg border-none" disabled>ویرایش پروفایل</GlowButton>
                           </div>
                         </div>
                       </motion.div>
                    </div>
                  </div>
               </div>

              <div className="pt-8">
                <NeonCard variant="blue" className="p-5 border-neon-blue/20 bg-neon-blue/5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white italic">اتصال زنده برقرار است</h4>
                      <p className="text-[10px] text-gray-500 font-bold italic uppercase mt-1">تغییرات شما بلافاصله در مینی پروفایل اعمال می‌شود.</p>
                    </div>
                  </div>
                </NeonCard>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
