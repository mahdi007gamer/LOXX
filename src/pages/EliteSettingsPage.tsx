import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { SmartImage } from "../components/ui/SmartImage";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
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
 ArrowLeft,
 Camera,
 Trash2,
 RefreshCw,
 Upload,
 Layers,
 Settings2,
 Lock,
 Trophy,
 Radio,
 Copy
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
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
 streamerLinks?: {
 aparat?: string;
 twitch?: string;
 kick?: string;
 youtube?: string;
 donate?: string;
 };
 floatingParticles?: boolean;
 tiltEffect?: boolean;
}

export const EliteSettingsPage = () => {
 const navigate = useNavigate();
 const { user, updateUser, isSidebarCollapsed } = useAuth();
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [uploadingAvatar, setUploadingAvatar] = useState(false);
 const [uploadingBanner, setUploadingBanner] = useState(false);
 const [uploadingBg, setUploadingBg] = useState(false);
 
 const avatarInputRef = useRef<HTMLInputElement>(null);
 const bannerInputRef = useRef<HTMLInputElement>(null);
 const bgImageInputRef = useRef<HTMLInputElement>(null);
 
 const [metadata, setMetadata] = useState<VIPMetadata>({
 auraEffect: false,
 shinyName: false,
 specialFrame: false,
 fullGlow: false,
 floatingParticles: false,
 tiltEffect: false,
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
 },
 streamerLinks: {
 aparat: "",
 twitch: "",
 kick: "",
 youtube: "",
 donate: ""
 }
 });

 const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
 const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");

 const mouseX = useMotionValue(0);
 const mouseY = useMotionValue(0);
 const tiltX = useTransform(mouseY, [-150, 150], [10, -10]);
 const tiltY = useTransform(mouseX, [-150, 150], [-10, 10]);

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = e.clientX - rect.left - rect.width / 2;
 const y = e.clientY - rect.top - rect.height / 2;
 mouseX.set(x);
 mouseY.set(y);
 };

 const handleMouseLeave = () => {
 mouseX.set(0);
 mouseY.set(0);
 };

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
 const msg = isRtl 
 ? "آیا مطمئن هستید که می‌خواهید تمامی تنظیمات نخبگان را به حالت پیش‌فرض برگردانید؟"
 : "Are you sure you want to revert all Elite settings back to default?";
 if (window.confirm(msg)) {
 setMetadata({
 auraEffect: false,
 shinyName: false,
 specialFrame: false,
 fullGlow: false,
 floatingParticles: false,
 tiltEffect: false,
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
 toast.success(isRtl ? "تنظیمات به حالت پیش‌فرض بازگشت" : "Settings reverted to defaults");
 }
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'bg') => {
 const file = e.target.files?.[0];
 if (!file) return;

 const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
 if (!allowedTypes.includes(file.type)) {
 toast.error(isRtl ? "فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند" : "Only JPG, PNG, GIF, and WEBP files are allowed");
 return;
 }

 if (file.size > 5 * 1024 * 1024) {
 toast.error(isRtl ? "حجم فایل نباید بیشتر از ۵ مگابایت باشد" : "File size must not exceed 5MB");
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
 toast.success(isRtl ? "فایل با موفقیت آپلود شد" : "File uploaded successfully");
 } catch (err: any) {
 toast.error(isRtl ? "خطا در آپلود فایل" : "Error uploading file");
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
 toast.success(isRtl ? "تنظیمات نخبگان با موفقیت ذخیره شد" : "Elite settings saved successfully");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || (isRtl ? "خطا در ذخیره‌سازی" : "Error saving settings"));
 } finally {
 setSaving(false);
 }
 };

 const frames: { id: FrameType; label: string; icon: any; color: string; disabled?: boolean }[] = [
 { id: "none", label: isRtl ? "بدون فریم" : "No Frame", icon: User, color: "gray" },
 { id: "gold_aura", label: isRtl ? "هاله طلایی" : "Gold Aura", icon: Crown, color: "yellow" },
 { id: "diamond", label: isRtl ? "دیاموند" : "Diamond", icon: Trophy, color: "blue" },
 { id: "lightning", label: isRtl ? "رعد و برق" : "Lightning", icon: Zap, color: "blue" },
 { id: "glitch", label: isRtl ? "گلیچ" : "Glitch", icon: Monitor, color: "pink" },
 { id: "fire", label: isRtl ? "آتشین" : "Fiery", icon: Flame, color: "orange" },
 { id: "neon_pulse", label: isRtl ? "نئون پالز" : "Neon Pulse", icon: CircleDashed, color: "cyan" },
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

 const isStreamer = (user as any)?.role === "STREAMER";
 const isVip = user?.membership === "VIP" || (user as any)?.membershipType === "VIP" || isStreamer;

 const primaryVariant = isStreamer ? "purple" : "gold";
 const primaryColorHex = isStreamer ? "#c084fc" : "#facc15";
 const primaryText = isStreamer ? "text-neon-purple" : "text-yellow-400";
 const primaryBg = isStreamer ? "bg-neon-purple" : "bg-yellow-400";
 const primaryBorder = isStreamer ? "border-neon-purple" : "border-yellow-400";
 
 if (!isVip && !loading) {
 return (
 <div className="flex min-h-[calc(100vh-64px)] items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
 <Sidebar />
 <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto">
 <div className="h-20 w-20 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 mx-auto mb-6">
 <Crown size={40} />
 </div>
 <h2 className="text-2xl font-black text-white mb-4">
 {isRtl ? "دسترسی محدود!" : "Access Denied!"}
 </h2>
 <p className="text-gray-400 font-bold mb-8 ">
 {isRtl 
 ? "تنظیمات نخبگان فقط برای اعضای دارای اشتراک VIP فعال است. با ارتقای حساب کاربری، قفل این قابلیت را باز کنید." 
 : "Elite settings are exclusive to VIP members. Upgrade your subscription to unlock this feature."}
 </p>
 <GlowButton 
 variant="gold" 
 className="w-full h-12 uppercase font-black"
 onClick={() => navigate("/premium")}
 >
 {isRtl ? "مشاهده پنل اشتراک" : "View Premium Subscriptions"}
 </GlowButton>
 </div>
 </div>
 );
 }

 const effectsList = [
 { id: "auraEffect", label: isRtl ? "هاله نورانی (Aura)" : "Avatar Aura Effect", icon: Flame, color: "text-orange-400", desc: isRtl ? "هاله متحرک دور آواتار" : "Animated glow around avatar" },
 { id: "shinyName", label: isRtl ? "نام درخشان (Shiny)" : "Shiny Nickname", icon: Sparkles, color: "text-white", desc: isRtl ? "افکت درخشش روی نام" : "Pulsating shine on user name" },
 { id: "specialFrame", label: isRtl ? "فریم متحرک" : "Animated Border Profile", icon: Zap, color: "text-neon-blue", desc: isRtl ? "فریم متحرک دور کل پروفایل" : "Animated thin frame around card" },
 { id: "fullGlow", label: isRtl ? "ویژگی Glow" : "Outer Glow Effect", icon: Zap, color: "text-yellow-400", desc: isRtl ? "هاله نورانی دور مینی پروفایل" : "Bright backlight on card focus" },
 { id: "floatingParticles", label: isRtl ? "ذرات معلق" : "Floating Dust Particles", icon: Sparkles, color: "text-purple-400", desc: isRtl ? "ذرات نوری شناور در بک‌گراند" : "Slow moving specs in standard background" },
 { id: "tiltEffect", label: isRtl ? "افکت ۳-بعدی" : "Interactive 3D Tilt", icon: Layers, color: "text-green-400", desc: isRtl ? "چرخش کارت با حرکت موس" : "Interactive 3D isometric mouse rotation" },
 ];

 return (
 <div className="flex min-h-[calc(100vh-64px)] pb-20 md:pb-0" dir={isRtl ? "rtl" : "ltr"}>
 <Sidebar />
 <input type="file" ref={avatarInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'avatar')} />
 <input type="file" ref={bannerInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'banner')} />
 <input type="file" ref={bgImageInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileUpload(e, 'bg')} />
 
 <main className={cn("flex-1 px-4 py-8 lg:px-8 transition-all duration-300", !isSidebarCollapsed ? (isRtl ? "md:mr-64" : "md:ml-64") : (isRtl ? "md:mr-20" : "md:ml-20"))}>
 <div className="container mx-auto max-w-6xl">
 <header className={`mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 ${isRtl ? "text-right" : "text-left"}`}>
 <div>
 <div className={`flex items-center gap-2 mb-2 ${isRtl ? "justify-end" : "justify-start"}`}>
 <span className={cn("text-[10px] font-black text-dark-bg px-2 py-0.5 rounded uppercase ", primaryBg)}>Elite Access</span>
 {isStreamer ? <Radio size={20} className={primaryText} /> : <Crown size={20} className={primaryText} />}
 </div>
 <h1 className="text-4xl md:text-5xl font-black text-white uppercase ">
 {isRtl ? "تنظیمات نخبگان" : "Elite Creator Settings"}
 </h1>
 <p className="text-xs text-gray-500 font-bold uppercase mt-1 ">
 {isRtl ? "پروفایل خود را به سطح افسانه‌ای برسانید" : "Elevate your profile presentation to a legendary status"}
 </p>
 </div>
 
 <div className={`flex gap-3 ${!isRtl ? "flex-row-reverse" : ""}`}>
 <button 
 onClick={handleReset}
 className="h-12 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-black text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-2"
 title={isRtl ? "بازگشت به تنظیمات کارخانه" : "Reset all customizations to default"}
 >
 <Trash2 size={16} />
 </button>
 <button 
 onClick={() => navigate("/settings")}
 className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all flex items-center gap-2"
 >
 {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} 
 {isRtl ? "بازگشت به تنظیمات" : "Back to Settings"}
 </button>
 <GlowButton 
 variant={primaryVariant as any} 
 className="h-12 px-10 uppercase font-black text-xs shadow-xl shadow-yellow-500/20"
 onClick={handleSave}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال ذخیره..." : "Saving...") : (isRtl ? "اعمال تغییرات نخبگان" : "Apply Customizations")}
 </GlowButton>
 </div>
 </header>

 <div className="grid grid-cols-1 gap-8 items-start">
 <div className="space-y-8">
 {/* Media & Advanced Effects Row */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {/* Media & Background */}
 <NeonCard variant={primaryVariant as any} className="space-y-6">
 <h3 className={`text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
 <ImageIcon size={20} className={primaryText} />
 <span>{isRtl ? "رسانه و پس‌زمینه نخبگان" : "Elite Assets & Backgrounds"}</span>
 </h3>
 
 <div className="space-y-6">
 <div className="flex gap-4">
 <div className="flex-1 space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "تصویر آواتار" : "Avatar Photo"}
 </label>
 <GlowButton variant={primaryVariant as any} size="sm" className="w-full h-10 text-[10px]" onClick={() => avatarInputRef.current?.click()}>
 {isRtl ? "تغییر آواتار" : "Change Avatar"}
 </GlowButton>
 </div>
 <div className="flex-1 space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "بنر پروفایل" : "Profile Cover"}
 </label>
 <GlowButton variant={primaryVariant as any} size="sm" className="w-full h-10 text-[10px]" onClick={() => bannerInputRef.current?.click()}>
 {isRtl ? "تغییر بنر" : "Change Banner"}
 </GlowButton>
 </div>
 </div>

 <div className="space-y-4 pt-4 border-t border-white/5">
 <label className="block text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "پس‌زمینه مینی پروفایل (JPG, PNG, GIF, WEBP)" : "Mini Profile Background Card (JPG, PNG, GIF, WEBP)"}
 </label>
 <div className="relative group">
 <div className={cn(
 "h-32 w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center transition-all",
 metadata.bgImage ? `${primaryBorder}/30` : `hover:${primaryBorder}/20`
 )}>
 {metadata.bgImage ? (
 <img src={metadata.bgImage} alt="Background" className="w-full h-full object-cover" />
 ) : (
 <div className="text-center">
 <ImageIcon size={32} className="text-gray-700 mb-2 mx-auto" />
 <p className="text-[8px] text-gray-600 font-bold uppercase ">
 {isRtl ? "بدون بک‌گراند اختصاصی" : "No Custom Card Background"}
 </p>
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
 <Upload size={12} className={isRtl ? "ml-1" : "mr-1"} /> 
 {uploadingBg ? (isRtl ? "در حال آپلود..." : "Uploading...") : (isRtl ? "آپلود فایل" : "Upload Image")}
 </GlowButton>
 {metadata.bgImage && (
 <button onClick={() => setMetadata(m => ({ ...m, bgImage: undefined }))} className="text-[10px] font-black text-neon-pink uppercase hover:scale-110 transition-transform">
 {isRtl ? "حذف تصویر" : "Remove Background"}
 </button>
 )}
 </div>
 </div>
 </div>
 
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <label className="text-[10px] font-black text-gray-500 uppercase ">
 {isRtl ? `میزان شفافیت بک‌گراند (${Math.round(metadata.opacity * 100)}%)` : `Background Opacity (${Math.round(metadata.opacity * 100)}%)`}
 </label>
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
 <h3 className={`text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
 <Sparkles size={20} className="text-neon-blue" />
 <span>{isRtl ? "امکانات پیشرفته نخبگان" : "Elite Dynamic Effects"}</span>
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {effectsList.map(effect => (
 <div 
 key={effect.id} 
 className={cn(
 "group cursor-pointer flex flex-col p-4 rounded-2xl border transition-all duration-300",
 (metadata as any)[effect.id] 
 ? "bg-white/10 border-white/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]" 
 : "bg-white/5 border-white/5 hover:border-white/10"
 )}
 onClick={() => setMetadata(m => ({ ...m, [effect.id]: !((m as any)[effect.id]) }))}
 >
 <div className={`flex items-center justify-between mb-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
 <div className={cn("p-2 rounded-xl bg-white/5", effect.color)}>
 <effect.icon size={16} />
 </div>
 <div className={cn(
 "w-8 h-4 rounded-full relative transition-all",
 (metadata as any)[effect.id] ? "bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "bg-gray-800"
 )}>
 <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", (metadata as any)[effect.id] ? (isRtl ? "right-0.5" : "left-4") : (isRtl ? "right-4" : "left-0.5"))} />
 </div>
 </div>
 <span className="text-[11px] font-black text-white ">{effect.label}</span>
 <span className="text-[9px] text-gray-500 mt-1">{effect.desc}</span>
 </div>
 ))}
 </div>

 <div className="pt-4 border-t border-white/5 space-y-6">
 <div className={isRtl ? "text-right" : "text-left"}>
 <label className="block text-[10px] font-black text-gray-500 uppercase mb-4 ">
 {isRtl ? "فونت استایل (Font Style)" : "Special Name Font Glow"}
 </label>
 <div className="grid grid-cols-2 gap-3">
 {[
 { id: "none", label: isRtl ? "بدون افکت" : "No Glow Effect" },
 { id: "lightning", label: isRtl ? "برقی" : "Lightning Spark" },
 { id: "glitch", label: isRtl ? "گیلیچ" : "Glitch Scanline" },
 { id: "fire", label: isRtl ? "آتیش" : "Fire Flame" }
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
 <span className={cn("text-xs font-black uppercase ", metadata.fontStyle === style.id ? "text-neon-blue" : "text-gray-400")}>{style.label}</span>
 </button>
 ))}
 </div>
 </div>

 {metadata.specialFrame && (
 <div className={isRtl ? "text-right" : "text-left"}>
 <label className={`block text-[10px] font-black text-neon-blue uppercase mb-4 flex items-center gap-2 ${isRtl ? "justify-start" : "justify-start"}`}>
 <CircleDashed size={14} /> {isRtl ? "فریم اختصاصی (Frame Type)" : "Animated Card Border Custom Frame"}
 </label>
 <div className="grid grid-cols-2 gap-3">
 {frames.map((f) => (
 <button
 key={f.id}
 onClick={() => setMetadata({ ...metadata, frame: f.id })}
 className={cn(
 "relative h-12 rounded-xl border transition-all flex items-center justify-center group gap-2",
 metadata.frame === f.id 
 ? "bg-neon-pink/10 border-neon-pink shadow-[0_0_15px_rgba(236,72,153,0.3)]" 
 : "bg-white/5 border-white/5 hover:border-white/10"
 )}
 >
 <f.icon size={14} className={cn(metadata.frame === f.id ? "text-neon-pink" : "text-gray-500")} />
 <span className={cn("text-xs font-black uppercase ", metadata.frame === f.id ? "text-white" : "text-gray-400")}>{f.label}</span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 </NeonCard>
 </div>

 {/* Streamer Links & Promo */}
 {isStreamer && (
 <NeonCard variant="purple" className="space-y-6">
 <h3 className={`text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
 <Radio size={20} className="text-neon-purple" />
 <span>{isRtl ? "لینک‌های شبکه اجتماعی استریمر" : "Streamer External Channel Links"}</span>
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "استریم آپارات" : "Aparat Stream Link"}
 </label>
 <Input 
 value={metadata.streamerLinks?.aparat || ""} 
 placeholder="https://aparat.com/username"
 onChange={(e) => setMetadata(m => ({ ...m, streamerLinks: { ...m.streamerLinks, aparat: e.target.value } }))} 
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "استریم توییچ" : "Twitch Stream Link"}
 </label>
 <Input 
 value={metadata.streamerLinks?.twitch || ""} 
 placeholder="https://twitch.tv/username"
 onChange={(e) => setMetadata(m => ({ ...m, streamerLinks: { ...m.streamerLinks, twitch: e.target.value } }))} 
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "یوتیوب" : "YouTube Channel"}
 </label>
 <Input 
 value={metadata.streamerLinks?.youtube || ""} 
 placeholder="https://youtube.com/@username"
 onChange={(e) => setMetadata(m => ({ ...m, streamerLinks: { ...m.streamerLinks, youtube: e.target.value } }))} 
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">Kick</label>
 <Input 
 value={metadata.streamerLinks?.kick || ""} 
 placeholder="https://kick.com/username"
 onChange={(e) => setMetadata(m => ({ ...m, streamerLinks: { ...m.streamerLinks, kick: e.target.value } }))} 
 />
 </div>
 <div className="space-y-2 lg:col-span-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "لینک دونیت (حمایت مالی)" : "Donate/Support Link"}
 </label>
 <Input 
 value={metadata.streamerLinks?.donate || ""} 
 placeholder="https://zarinp.al/username"
 onChange={(e) => setMetadata(m => ({ ...m, streamerLinks: { ...m.streamerLinks, donate: e.target.value } }))} 
 />
 </div>
 </div>

 <div className="mt-8 pt-6 border-t border-white/5">
 <div className="relative overflow-hidden rounded-[32px] bg-[#0d0d12] border border-neon-purple/30 p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] group">
 <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 via-transparent to-neon-purple/5 opacity-50 transition-opacity group-hover:opacity-100" />
 <div className={`relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between ${isRtl ? "text-right" : "text-left"}`}>
 <div>
 <p className="text-[11px] text-gray-400 font-bold uppercase mb-2">
 {isRtl ? "کد تخفیف اختصاصی شما" : "Your Creator Discount Promo Code"}
 </p>
 <div className="flex items-center gap-4">
 <span className="text-3xl font-black text-white bg-white/5 px-6 py-2 rounded-2xl border border-white/10 uppercase font-mono">{((user as any)?.streamerStats?.discountCode) || (user?.username || "STREAMER").toUpperCase()}</span>
 <button onClick={() => {
 navigator.clipboard.writeText(((user as any)?.streamerStats?.discountCode) || (user?.username || "STREAMER").toUpperCase());
 toast.success(isRtl ? "کد تخفیف کپی شد" : "Discount code copied!");
 }} className="p-3 bg-neon-purple/10 text-neon-purple rounded-xl hover:bg-neon-purple/20 transition-all border border-neon-purple/20" title={isRtl ? "کپی کردن" : "Copy to clipboard"}>
 <Copy size={20} />
 </button>
 </div>
 </div>
 <div className="flex gap-8 items-center text-center">
 <div>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">
 {isRtl ? "تخفیف کاربر" : "Customer Discount"}
 </p>
 <p className="text-2xl font-black text-neon-purple ">{((user as any)?.streamerStats?.userDiscountPercent) || 10}٪</p>
 </div>
 <div className="w-px h-12 bg-white/10" />
 <div>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">
 {isRtl ? "درآمد فعلی شما" : "Your Net Commission"}
 </p>
 <p className="text-2xl font-black text-green-400 ">
 {((user as any)?.streamerStats?.streamerCommissionPercent) || 10}
 {isRtl ? "٪ پورسانت" : "% Commission Share"}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </NeonCard>
 )}

 {/* Colors & Preview */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Color Controls */}
 <NeonCard variant="purple" className="lg:col-span-12 xl:col-span-5 space-y-6 self-start">
 <h3 className={`text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
 <Palette size={20} className="text-neon-purple" />
 <span>{isRtl ? "سفارشی‌سازی متون و رنگ‌ها" : "Color & Style Theme Swatches"}</span>
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ نام کاربری" : "Username Forecolor"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, text: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, text: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ تایتل (ثانویه)" : "Secondary Subtitle Color"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.textGradient || metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, textGradient: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.textGradient || metadata.colors.text} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, textGradient: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ تم (Accent)" : "Lobby Accent Color"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.accent} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, accent: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.accent} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, accent: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ مقادیر آمار (Stats)" : "Stats Value Highlight"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.statsText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsText: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.statsText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsText: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ لیبل‌ها" : "Label Text Color"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.statsLabel || "#4b5563"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsLabel: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.statsLabel || "#4b5563"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, statsLabel: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ متن نشان‌ها" : "Badge Text Color"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.badgeText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, badgeText: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.badgeText || "#ffffff"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, badgeText: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 {metadata.auraEffect && (
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ هاله نورانی" : "Avatar Aura Glow Color"}
 </label>
 <div className="flex gap-2">
 <input type="color" value={metadata.colors.auraColor || "#eab308"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, auraColor: e.target.value } }))} className="w-12 h-10 rounded-xl border-none cursor-pointer bg-white/5" />
 <Input value={metadata.colors.auraColor || "#eab308"} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, auraColor: e.target.value } }))} className="flex-1" />
 </div>
 </div>
 )}
 {metadata.fullGlow && (
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase ">
 {isRtl ? "رنگ ویژگی Glow" : "Outer Card Glow Color"}
 </label>
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
 <span className="text-[11px] font-black text-white ">
 {isRtl ? "پس‌زمینه گرادینت کارت" : "Custom Card Gradient Overlay"}
 </span>
 <button 
 onClick={() => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, enabled: !m.colors.gradient?.enabled } } }))}
 className={cn(
 "w-10 h-5 rounded-full relative transition-all",
 metadata.colors.gradient?.enabled ? "bg-neon-pink" : "bg-gray-800"
 )}
 >
 <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", metadata.colors.gradient?.enabled ? (isRtl ? "right-1" : "left-6") : (isRtl ? "right-6" : "left-1"))} />
 </button>
 </div>
 
 {metadata.colors.gradient?.enabled && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <span className="text-[8px] font-black text-gray-500 uppercase ">
 {isRtl ? "رنگ اول" : "Color Start"}
 </span>
 <input type="color" value={metadata.colors.gradient.color1} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color1: e.target.value } } }))} className="w-full h-10 rounded-xl cursor-pointer" />
 </div>
 <div className="space-y-1">
 <span className="text-[8px] font-black text-gray-500 uppercase ">
 {isRtl ? "رنگ دوم" : "Color End"}
 </span>
 <input type="color" value={metadata.colors.gradient.color2} onChange={(e) => setMetadata(m => ({ ...m, colors: { ...m.colors, gradient: { ...m.colors.gradient!, color2: e.target.value } } }))} className="w-full h-10 rounded-xl cursor-pointer" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-500 uppercase ">
 {isRtl ? `زاویه (${metadata.colors.gradient.angle}°)` : `Gradient Angle (${metadata.colors.gradient.angle}°)`}
 </label>
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
 <span className="text-[10px] font-black uppercase ">
 {isRtl ? "پیش‌نمایش نهایی مینی پروفایل" : "Live Real-Time Miniature Preview"}
 </span>
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
 boxShadow: metadata.fullGlow ? `0 0 60px ${metadata.colors.glowColor || primaryColorHex}4d` : undefined,
 rotateX: metadata.tiltEffect ? tiltX : 0,
 rotateY: metadata.tiltEffect ? tiltY : 0,
 transformPerspective: metadata.tiltEffect ? 1000 : "none"
 }}
 onMouseMove={metadata.tiltEffect ? handleMouseMove : undefined}
 onMouseLeave={metadata.tiltEffect ? handleMouseLeave : undefined}
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
 
 {/* Floating Particles */}
 {metadata.floatingParticles && (
 <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
 {[...Array(15)].map((_, i) => (
 <motion.div
 key={`particle-${i}`}
 className="absolute w-1 h-1 rounded-full bg-white/40 blur-[1px]"
 initial={{
 x: Math.random() * 340,
 y: Math.random() * 500,
 scale: Math.random() * 1.5 + 0.5,
 }}
 animate={{
 y: [null, -100, Math.random() * 500],
 x: [null, Math.random() * 50 - 25, Math.random() * 50 - 25],
 opacity: [0, 1, 0]
 }}
 transition={{
 duration: Math.random() * 5 + 5,
 repeat: Infinity,
 ease: "linear",
 delay: Math.random() * 3
 }}
 style={{
 backgroundColor: metadata.colors.glowColor || primaryColorHex
 }}
 />
 ))}
 </div>
 )}
 
 {renderFrameEffect(metadata.frame)}
 
 <div className="h-32 relative overflow-hidden z-10">
 {bannerUrl ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" /> : <div className={cn("absolute inset-0 bg-gradient-to-br to-[#0a0a0f]", isStreamer ? "from-purple-400/20" : "from-yellow-400/20")} />}
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
 style={{ backgroundColor: metadata.colors.auraColor || primaryColorHex }}
 />
 )}
 <div className={cn(
 "h-24 w-24 rounded-[32px] bg-[#0a0a0f] p-[2px] relative z-20",
 metadata.frame === "lightning" ? "border-blue-400 shadow-[0_0_15px_blue]" : 
 isStreamer ? "bg-gradient-to-tr from-purple-400 via-purple-200 to-purple-600" :
 "bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-600"
 )}>
 <div className="h-full w-full rounded-[30px] bg-[#0d0d12] flex items-center justify-center overflow-hidden">
 {avatarUrl ? <SmartImage src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-700" />}
 </div>
 </div>
 <div className="absolute top-1 right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-[#0a0a0f] z-[25]"></div>
 </div>
 </div>
 
 <div className="space-y-6">
 <div className={isRtl ? "text-right" : "text-left"}>
 <h4 
 className={cn("text-2xl font-black uppercase", metadata.shinyName && "animate-pulse")}
 style={{ 
 color: metadata.colors.text,
 ...getFontStyle()
 }}
 >
 {user?.displayName || "Elite User"}
 </h4>
 <span className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1 ${isRtl ? "justify-start" : "justify-start"}`} style={{ color: metadata.colors.accent }}>
 <div className="h-1 w-1 rounded-full bg-current animate-ping" />
 {isStreamer 
 ? (isRtl ? "عضو تیم استریم" : "Streamer Team Creator") 
 : (isRtl ? "عضو ویژه لوکس (VIP)" : "LOXX Premium Exclusive (VIP)")}
 </span>
 </div>
 
 <div className="grid grid-cols-4 gap-2 py-4 border-y border-white/5">
 <div className="text-center">
 <p className="text-[8px] font-black uppercase mb-1 " style={{ color: metadata.colors.statsLabel || "#4b5563" }}>
 {isRtl ? "عضویت" : "Member"}
 </p>
 <p className="text-xs font-black " style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
 {isRtl ? "۷۴۲ روز" : "742 Days"}
 </p>
 </div>
 <div className="text-center">
 <p className="text-[8px] font-black uppercase mb-1 " style={{ color: metadata.colors.statsLabel || "#4b5563" }}>
 {isRtl ? "دوستان" : "Friends"}
 </p>
 <p className="text-xs font-black " style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>128</p>
 </div>
 <div className="text-center">
 <p className="text-[8px] font-black uppercase mb-1 " style={{ color: metadata.colors.statsLabel || "#4b5563" }}>
 {isRtl ? "لابی‌ها" : "Lobbies"}
 </p>
 <p className="text-xs font-black " style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>42</p>
 </div>
 <div className="text-center">
 <p className="text-[8px] font-black uppercase mb-1 " style={{ color: metadata.colors.statsLabel || "#4b5563" }}>
 {isRtl ? "رتبه" : "Rank"}
 </p>
 <p className="text-xs font-black " style={{ color: metadata.colors.statsText || metadata.colors.text || "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Supreme</p>
 </div>
 </div>
 
 <div className={`flex flex-wrap gap-2 ${isRtl ? "justify-start" : "justify-start"}`}>
 <div className="px-3 py-1 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
 <span className="text-[8px] font-black uppercase " style={{ color: metadata.colors.badgeText || "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>FOUNDER</span>
 </div>
 <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
 <span className="text-[8px] font-black uppercase " style={{ color: metadata.colors.badgeText || "#6b7280" }}>CHAMPION</span>
 </div>
 </div>
 
 <GlowButton variant="gold" className="w-full h-12 !rounded-2xl font-black text-xs uppercase bg-gradient-to-r from-yellow-500 to-yellow-600 text-dark-bg border-none" disabled>
 {isRtl ? "ویرایش پروفایل" : "Edit Profile"}
 </GlowButton>
 </div>
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 
 <div className="pt-8 text-right">
 <NeonCard variant="blue" className="p-5 border-neon-blue/20 bg-neon-blue/5">
 <div className={`flex items-start gap-4 ${isRtl ? "flex-row text-right" : "flex-row-reverse text-left"}`}>
 <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
 <RefreshCw size={20} />
 </div>
 <div className="flex-1">
 <h4 className="text-sm font-black text-white ">
 {isRtl ? "اتصال زنده برقرار است" : "Live Sync Active"}
 </h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
 {isRtl 
 ? "تغییرات شما بلافاصله در مینی پروفایل اعمال می‌شود." 
 : "Your edits are synced synchronously to the mini profile presentation canvas above."}
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
