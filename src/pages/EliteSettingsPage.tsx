import React, { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

type FrameType = "none" | "lightning" | "glitch" | "fire" | "anime" | "neon" | "cyber" | "cosmic" | "shield";

interface VIPMetadata {
  frame: FrameType;
  frameColor: string;
  effectType: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
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
  
  const [metadata, setMetadata] = useState<VIPMetadata>({
    frame: "none",
    frameColor: "#00e5ff",
    effectType: "none",
    colors: {
      bg: "rgba(13, 13, 20, 0.8)",
      text: "#ffffff",
      accent: "#00e5ff"
    }
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");

  useEffect(() => {
    if (user?.vipMetadata) {
      try {
        const parsed = typeof user.vipMetadata === 'string' ? JSON.parse(user.vipMetadata) : user.vipMetadata;
        setMetadata(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse VIP metadata", e);
      }
    }
    setLoading(false);
  }, [user]);

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

  const frames: { id: FrameType; label: string; icon: any; color: string }[] = [
    { id: "none", label: "بدون فریم", icon: User, color: "gray" },
    { id: "lightning", label: "رعد و برق", icon: Zap, color: "blue" },
    { id: "glitch", label: "گلیچ", icon: Monitor, color: "pink" },
    { id: "fire", label: "آتشین", icon: Flame, color: "orange" },
    { id: "anime", label: "انیمه‌ای", icon: Sparkles, color: "purple" },
    { id: "neon", label: "نئون پالز", icon: CircleDashed, color: "cyan" },
    { id: "cyber", label: "سایبر کور", icon: Cpu, color: "green" },
    { id: "cosmic", label: "کازمیک رینگ", icon: Orbit, color: "indigo" },
    { id: "shield", label: "سپر انرژی", icon: ShieldCheck, color: "yellow" },
  ];

  const renderFrameEffect = (type: FrameType) => {
    switch (type) {
      case "lightning":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
            <motion.div 
              animate={{ opacity: [0, 1, 0.5, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-blue-400/20 blur-xl"
            />
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  x: [0, 5, -5, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ repeat: Infinity, duration: 0.2, delay: i * 0.5 }}
                className="absolute inset-0 border-2 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
              />
            ))}
          </div>
        );
      case "fire":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-600/40 to-transparent blur-lg" />
            {[1, 2, 3, 4, 5].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  y: [20, -40],
                  x: [i * 10, i * 10 + (Math.random() * 20 - 10)],
                  opacity: [0, 1, 0],
                  scale: [1, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.2 }}
                className="absolute bottom-0 w-4 h-4 bg-orange-500/60 rounded-full blur-md"
              />
            ))}
          </div>
        );
      case "glitch":
        return (
          <motion.div 
            animate={{ 
              x: ["-2px", "2px", "-1px", "1px", "0px"],
              filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 z-0 border-2 border-pink-500/50 rounded-[2rem] shadow-[inset_0_0_10px_rgba(236,72,153,0.5)]"
          />
        );
      case "neon":
        return (
          <motion.div 
            animate={{ 
              boxShadow: [
                "0 0 5px #00e5ff, inset 0 0 5px #00e5ff",
                "0 0 20px #00e5ff, inset 0 0 10px #00e5ff",
                "0 0 5px #00e5ff, inset 0 0 5px #00e5ff"
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 z-0 border-2 border-cyan-400 rounded-[2rem]"
          />
        );
      default:
        return null;
    }
  };

  const isVip = user?.membership === "VIP" || user?.membership === "PLUS";

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
                className="h-12 px-10 uppercase italic font-black text-xs"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "در حال ذخیره..." : "اعمال تغییرات نخبگان"}
              </GlowButton>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Customization Controls */}
            <div className="lg:col-span-7 space-y-8">
              {/* Media */}
              <NeonCard variant="gold" className="space-y-6">
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                  <ImageIcon size={20} className="text-yellow-400" />
                  <span>رسانه‌های متحرک</span>
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">تصویر پروفایل (GIF مجاز است)</label>
                    <div className="flex gap-4">
                      <Input 
                        placeholder="https://example.com/avatar.gif" 
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="flex-1"
                      />
                      <GlowButton variant="blue" className="h-12 w-12 p-0"><Camera size={18} /></GlowButton>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">بنر پروفایل (GIF مجاز است)</label>
                    <div className="flex gap-4">
                      <Input 
                        placeholder="https://example.com/banner.gif" 
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        className="flex-1"
                      />
                      <GlowButton variant="blue" className="h-12 w-12 p-0"><ImageIcon size={18} /></GlowButton>
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {frames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => setMetadata({ ...metadata, frame: frame.id })}
                      className={cn(
                        "group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square",
                        metadata.frame === frame.id 
                          ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.2)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <frame.icon size={24} className={cn("mb-2", metadata.frame === frame.id ? "text-neon-blue" : "text-gray-500 group-hover:text-white")} />
                      <span className={cn("text-[10px] font-black italic", metadata.frame === frame.id ? "text-white" : "text-gray-500")}>
                        {frame.label}
                      </span>
                    </button>
                  ))}
                </div>
              </NeonCard>

              {/* Colors */}
              <NeonCard className="space-y-6">
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                  <Palette size={20} className="text-neon-pink" />
                  <span>شخصی‌سازی رنگ‌های پروفایل</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ پس‌زمینه</label>
                    <input 
                      type="color" 
                      value={metadata.colors?.bg}
                      onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, bg: e.target.value } })}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ متن‌ها</label>
                    <input 
                      type="color" 
                      value={metadata.colors?.text}
                      onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, text: e.target.value } })}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">رنگ المان‌های UI</label>
                    <input 
                      type="color" 
                      value={metadata.colors?.accent}
                      onChange={(e) => setMetadata({ ...metadata, colors: { ...metadata.colors, accent: e.target.value } })}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
              </NeonCard>

              {/* Global Chat Preview */}
              <NeonCard className="space-y-6">
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 border-b border-white/5 pb-4">
                  <MessageSquare size={20} className="text-purple-400" />
                  <span>پیش‌نمایش چت سراسری</span>
                </h3>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center shrink-0 border border-neon-blue/30">
                       <User size={20} className="text-neon-blue" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neon-blue italic">Global Elite</span>
                        <span className="text-[10px] font-bold text-gray-400">14:20</span>
                      </div>
                      <div className="p-3 rounded-2xl rounded-tr-none bg-neon-blue/10 border border-neon-blue/20 max-w-sm">
                        <p className="text-sm text-white font-bold italic leading-relaxed">سلام به همه! به لوکس خوش آمدید 👑</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20 text-center">
                    <p className="text-[11px] font-black text-yellow-400 italic">“شخصی‌سازی استایل چت، رنگ متن و افکت‌های پیام به زودی اضافه می‌گردد.”</p>
                  </div>
                </div>
              </NeonCard>
            </div>

            {/* Live Preview Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] text-center mb-4">Mini Profile Live Preview</h3>
                
                {/* The Preview Card */}
                <div className="relative group perspective-1000">
                  <motion.div 
                    initial={false}
                    animate={{ rotateY: [0, 2, 0, -2, 0], rotateX: [0, -2, 0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 10 }}
                    className="relative w-full aspect-[4/5] max-w-sm mx-auto rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500"
                    style={{ 
                      backgroundColor: metadata.colors?.bg || "rgba(13, 13, 20, 0.8)",
                      borderColor: metadata.colors?.accent + "40"
                    }}
                  >
                    {/* Frame Effects BACKGROUND */}
                    {renderFrameEffect(metadata.frame)}

                    {/* Banner */}
                    <div className="h-1/3 w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20" />
                      {bannerUrl ? (
                         <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center opacity-30">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    {/* Profile Content */}
                    <div className="relative px-8 pt-0 pb-10 flex flex-col items-center text-center -mt-16 z-10">
                      {/* Avatar */}
                      <div className="relative mb-6">
                        <div className={cn(
                          "w-32 h-32 rounded-[2rem] bg-dark-bg p-1 shadow-2xl relative z-10",
                          metadata.frame !== "none" && "bg-gradient-to-br"
                        )}
                        style={{ border: `2px solid ${metadata.colors?.accent}` }}
                        >
                          <div className="h-full w-full rounded-[1.8rem] overflow-hidden bg-white/5 flex items-center justify-center text-neon-blue">
                             {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                <User size={48} />
                             )}
                          </div>
                        </div>
                        {isVip && (
                          <div className="absolute -top-4 -right-4 text-3xl drop-shadow-lg z-20">👑</div>
                        )}
                      </div>

                      {/* Info */}
                      <h3 className="text-2xl font-black italic mb-1" style={{ color: metadata.colors?.text }}>{user?.displayName || user?.username}</h3>
                      <p className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: metadata.colors?.accent }}>VIP GLOBAL ELITE</p>

                      <div className="w-full grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5" style={{ borderColor: metadata.colors?.accent + "20" }}>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">XP Capacity</p>
                          <p className="text-lg font-black text-white italic">2X <span className="text-[10px] text-gray-600">Active</span></p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5" style={{ borderColor: metadata.colors?.accent + "20" }}>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Rank Priority</p>
                          <p className="text-lg font-black text-white italic">High</p>
                        </div>
                      </div>

                      {/* Skills/Tags */}
                      <div className="flex flex-wrap justify-center gap-2">
                        {["Gamer", "Pro", "VIP"].map((tag, i) => (
                          <span 
                            key={i} 
                            className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border border-white/10"
                            style={{ backgroundColor: metadata.colors?.accent + "10", color: metadata.colors?.text, borderColor: metadata.colors?.accent + "30" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Scanlines / Overlay for effects */}
                    {metadata.frame === "glitch" && (
                      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] z-20 opacity-30" />
                    )}
                  </motion.div>
                </div>

                <NeonCard variant="blue" className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white italic">پیش‌نمایش زنده</h4>
                      <p className="text-[10px] text-gray-500 font-bold italic uppercase leading-tight">
                        تمام تغییرات شما بلافاصله روی مینی پروفایل در سرتاسر لوکس اعمال می‌شود.
                      </p>
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
