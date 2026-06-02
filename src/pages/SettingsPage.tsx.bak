import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
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
 ArrowRight,
 Award,
 Plus,
 Sparkles,
 Star,
 Mail,
 ChevronDown,
 HelpCircle,
 BookOpen,
 ShieldAlert as SecurityAlert
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { SmartImage } from "../components/ui/SmartImage";
import { useNavigate, useParams } from "react-router-dom";

type SettingsTab = "profile" | "security" | "notifications" | "ui" | "region" | "badges" | "elite" | "support" | "rules";

export const SettingsPage = () => {
 const navigate = useNavigate();
 const { tab } = useParams();
 const { user: authUser, refreshUser, isSidebarCollapsed } = useAuth();
 const { language, setLanguage } = useLanguage();
 const isRtl = language === "fa";
 const [activeTab, setActiveTab ] = useState<SettingsTab>((tab as SettingsTab) || "profile");
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
 const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
 bannerUrl: "",
 region: "Middle East",
 language: "Persian",
 currentPassword: "",
 newPassword: "",
 confirmPassword: ""
 });

 const [devices, setDevices] = useState<any[]>([]);
 const [userBadges, setUserBadges] = useState<any[]>([]);
 const [availableChoiceBadges, setAvailableChoiceBadges] = useState<any[]>([]);

 useEffect(() => {
 fetchUserData();
 fetchSettings();
 fetchDevices();
 fetchUserBadges();
 fetchChoiceBadges();
 }, []);

 useEffect(() => {
 if (tab && ["profile", "security", "notifications", "ui", "region", "badges", "elite", "support", "rules"].includes(tab)) {
 setActiveTab(tab as SettingsTab);
 }
 }, [tab]);

 const fetchChoiceBadges = async () => {
 try {
 const res = await api.get("/badges/category/STANDARD");
 setAvailableChoiceBadges(res.data.data || []);
 } catch (err) {}
 };

 const fetchUserBadges = async () => {
 try {
 const res = await api.get("/auth/me");
 setUserBadges(res.data.data.badges || []);
 } catch(err) {}
 };

 const handleToggleBadgePin = async (badgeId: string) => {
 const badge = userBadges.find(b => b.id === badgeId);
 if (!badge) return;

 const pinnedCount = userBadges.filter(b => b.isPinned).length;
 if (!badge.isPinned && pinnedCount >= 5) {
 toast.error("حداکثر می‌توانید ۵ نشان را پین کنید");
 return;
 }

 try {
 await api.patch("/user/profile", {
 badge_pins: {
 badgeId,
 isPinned: !badge.isPinned
 }
 });
 setUserBadges(prev => prev.map(b => b.id === badgeId ? { ...b, isPinned: !b.isPinned } : b));
 toast.success(badge.isPinned ? "نشان از پین خارج شد" : "نشان با موفقیت پین شد");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در بروزرسانی پین");
 }
 };

 const handleToggleStandardBadge = async (badgeId: string) => {
 try {
 setSaving(true);
 await api.post(`/badges/toggle-standard/${badgeId}`);
 await fetchUserBadges();
 toast.success("لیست نشان‌ها بروزرسانی شد");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در بروزرسانی نشان");
 } finally {
 setSaving(false);
 }
 };

 const fetchDevices = async () => {
 try {
 const res = await api.get("/user/me/devices");
 setDevices(res.data.data || []);
 } catch(err) {}
 };

 const handleRevokeDevice = async (id: string) => {
 try {
 await api.delete(`/user/me/devices/${id}`);
 setDevices(prev => prev.filter(d => d.id !== id));
 toast.success("دستگاه با موفقیت حذف شد");
 } catch(err) {
 toast.error("خطا در حذف دستگاه");
 }
 };

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
 bannerUrl: user.profile?.bannerUrl || user.bannerUrl || "",
 region: user.region || "Middle East",
 }));
 setTwoFactorEnabled(user.twoFactorEnabled || false);
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
 avatarUrl: formData.avatarUrl,
 bannerUrl: formData.bannerUrl
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

 const isVip = authUser?.membership === "VIP" || authUser?.membership === "PLUS" || (authUser as any)?.role === "STREAMER";
 const isRtlStyle = isRtl;
 const tabs = [
 ...(isVip ? [{ id: "elite" as const, icon: Crown, label: isRtlStyle ? "تنظیمات نخبگان" : "Elite Settings" }] : []),
 { id: "profile" as const, icon: User, label: isRtlStyle ? "پروفایل عمومی" : "Public Profile" },
 { id: "badges" as const, icon: Award, label: isRtlStyle ? "نشان‌ها" : "Badges & Flags" },
 { id: "security" as const, icon: Shield, label: isRtlStyle ? "امنیت و حساب" : "Security & Account" },
 { id: "notifications" as const, icon: Bell, label: isRtlStyle ? "اعلان‌ها" : "Notifications" },
 { id: "ui" as const, icon: Monitor, label: isRtlStyle ? "رابط کاربری" : "Interface & UI" },
 { id: "region" as const, icon: Globe, label: isRtlStyle ? "زبان و منطقه" : "Language & Region" },
 { id: "support" as const, icon: MessageSquare, label: isRtlStyle ? "تماس با مدیریت" : "Support Ticket" },
 { id: "rules" as const, icon: BookOpen, label: isRtlStyle ? "قوانین و مقررات" : "Platform Terms" },
 ] as const;

 const renderProfile = () => (
 <div className="space-y-6">
 {isVip && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative group cursor-pointer mb-8"
 onClick={() => navigate("/settings/elite")}
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
 <h3 className="text-xl font-black text-white uppercase ">
 {isRtl ? "تنظیمات نخبگان (Elite Settings)" : "Elite Settings (VIP & Streamer)"}
 </h3>
 <p className="text-[10px] text-yellow-400/70 font-bold uppercase mt-1">
 {isRtl ? "شخصی‌سازی پیشرفته مینی‌پروفایل، فریم‌ها و افکت‌های VIP" : "Advanced customization of mini-profile, frames, and VIP aura effects"}
 </p>
 </div>
 </div>
 <div className="h-12 w-12 rounded-full border border-yellow-400/30 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
 <ArrowRight className={cn("text-yellow-400 transition-transform", isRtl ? "-rotate-45 group-hover:rotate-0" : "rotate-135 group-hover:rotate-180")} />
 </div>
 </div>
 </NeonCard>
 </motion.div>
 )}

 <NeonCard variant="blue" className="space-y-8">
 <div className="flex items-center gap-6">
 <div className="group relative">
 <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
 {formData.avatarUrl || formData.username ? (
 <SmartImage 
 src={formData.avatarUrl || ""} 
 alt={formData.displayName}
 className="w-full h-full object-cover" 
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-neon-blue">
 <User size={40} />
 </div>
 )}
 </div>
 </div>
 <div className="flex-1">
 <h3 className="font-black text-white ">{isRtl ? "تصویر پروفایل" : "Profile Picture"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 mb-3">
 {isRtl ? "تصویر خود را آپلود کنید (فقط فرمت‌های PNG و JPG)." : "Upload your profile icon (PNG, JPG and WEBP formats supported)."}
 </p>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-none">
 <input 
 type="file" 
 accept="image/png, image/jpeg, image/gif, image/webp" 
 className="hidden" 
 id="avatar-upload"
 onChange={async (e) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
 if (!allowedTypes.includes(file.type)) {
 toast.error(isRtl ? "فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند" : "Only JPG, PNG, GIF, and WEBP formats are allowed");
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 toast.error(isRtl ? "حجم فایل نباید بیشتر از ۵ مگابایت باشد" : "File size cannot exceed 5MB");
 return;
 }
 const data = new FormData();
 data.append("file", file);
 try {
 const res = await api.post("/upload?target=profile", data, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (res.data.url) {
 setFormData(p => ({ ...p, avatarUrl: res.data.url }));
 toast.success(isRtl ? "تصویر با موفقیت آپلود شد" : "Avatar uploaded successfully");
 }
 } catch {
 toast.error(isRtl ? "خطا در آپلود تصویر" : "Error uploading avatar image");
 }
 }
 }}
 />
 <label htmlFor="avatar-upload" className="h-[46px] px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-white/10 hover:border-neon-blue/30 transition-all text-white shrink-0">
 <Camera size={16} className={cn(isRtl ? "ml-2" : "mr-2")} />
 {isRtl ? "آپلود تصویر" : "Upload Avatar"}
 </label>
 </div>
 </div>
 <div className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
 <button onClick={() => setFormData(p => ({ ...p, avatarUrl: "" }))} className="text-[10px] text-gray-600 font-black uppercase hover:text-neon-pink transition-colors">
 {isRtl ? "حذف تصویر" : "Remove Avatar"}
 </button>
 </div>
 </div>
 </div>

 <hr className="border-white/5" />

 <div className="flex items-center gap-6">
 <div className="flex-1">
 <h3 className="font-black text-white ">{isRtl ? "تصویر کاور (بنر)" : "Profile Cover (Banner)"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 mb-3">
 {isRtl ? "تصویر بنر پروفایل خود را آپلود کنید (حداکثر ۵ مگابایت، JPG، PNG، GIF و WEBP)." : "Upload profile banner image (Max 5MB, JPG, PNG, GIF, WEBP)."}
 </p>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-none">
 <input 
 type="file" 
 accept="image/png, image/jpeg, image/gif, image/webp" 
 className="hidden" 
 id="banner-upload"
 onChange={async (e) => {
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
 
 const data = new FormData();
 data.append("file", file);
 try {
 const res = await api.post("/upload/banner?target=cover", data, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (res.data.url) {
 setFormData(p => ({ ...p, bannerUrl: res.data.url }));
 toast.success("بنر با موفقیت آپلود شد");
 }
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در آپلود بنر");
 }
 }}
 />
 <label htmlFor="banner-upload" className="h-[46px] px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-white/10 hover:border-neon-blue/30 transition-all text-white shrink-0">
 <Camera size={16} className={cn(isRtl ? "ml-2" : "mr-2")} />
 {isRtl ? "آپلود بنر" : "Upload Banner"}
 </label>
 </div>
 </div>
 {formData.bannerUrl && (
 <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-24 w-full">
 <SmartImage src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
 </div>
 )}
 <div className={cn("mt-2", isRtl ? "text-right" : "text-left")}>
 <button onClick={() => setFormData(p => ({ ...p, bannerUrl: "" }))} className="text-[10px] text-gray-600 font-black uppercase hover:text-neon-pink transition-colors">
 {isRtl ? "حذف بنر" : "Remove Cover"}
 </button>
 </div>
 </div>
 </div>

 <hr className="border-white/5" />

 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
 <Input 
 label={isRtl ? "نام نمایشی" : "Display Name"} 
 placeholder={isRtl ? "Ali_Gamer_98" : "e.g. Maverick_98"} 
 value={formData.displayName}
 onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
 />
 <Input 
 label={isRtl ? "آیدی یکتا (Handle)" : "Unique Handle (Username)"} 
 placeholder="aligamer" 
 value={formData.username}
 disabled
 />
 <div className="sm:col-span-2">
 <label className="block px-1 text-[10px] font-black text-gray-500 uppercase mb-2 ">
 {isRtl ? "درباره شما (Bio)" : "About You (Bio)"}
 </label>
 <textarea 
 className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-700 transition-all focus:border-neon-blue/50 focus:outline-none h-32 resize-none"
 placeholder={isRtl ? "کمی در مورد خودتان، بازی‌هایی که دوست دارید و ... بنویسید" : "Tell us a bit about yourself, games you play..."}
 value={formData.bio}
 onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
 />
 </div>
 </div>

 <div className={cn("flex pt-4 border-t border-white/5", isRtl ? "justify-end" : "justify-start")}>
 <GlowButton 
 variant="blue" 
 className="px-10 h-10 text-[11px] font-black uppercase "
 onClick={handleSaveProfile}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال ذخیره..." : "Saving...") : (isRtl ? "ذخیره تغییرات پروفایل" : "Save Profile Changes")}
 </GlowButton>
 </div>
 </NeonCard>
 </div>
 );

 const handleEnable2FA = async () => {
 try {
 setSaving(true);
 await api.post("/user/me/2fa/enable");
 setShowTwoFactorModal(true);
 toast.success("کد تایید پیامکی به شماره همراه شما ارسال شد");
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

 const handleSendVerificationEmail = async () => {
 try {
 setSaving(true);
 await api.post("/auth/send-verification-email");
 toast.success("کد تایید به ایمیل شما ارسال شد");
 setShowVerificationModal(true);
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در ارسال ایمیل تایید");
 } finally {
 setSaving(false);
 }
 };

 const SecurityStatusCard = ({ title, status, desc, icon, color }: any) => {
 return (
 <div className={cn(
 "p-5 rounded-2xl border transition-all flex flex-col h-full",
 color === 'green' ? "bg-green-500/5 border-green-500/20" : 
 color === 'blue' ? "bg-neon-blue/5 border-neon-blue/20" : 
 "bg-red-500/5 border-red-500/20"
 )}>
 <div className="flex items-center justify-between mb-4">
 <div className={cn(
 "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
 color === 'green' ? "bg-green-500/10 text-green-400" : 
 color === 'blue' ? "bg-neon-blue/10 text-neon-blue" : 
 "bg-red-500/10 text-red-400"
 )}>
 {icon}
 </div>
 <span className={cn(
 "text-[10px] font-black uppercase px-3 py-1 rounded-full",
 color === 'green' ? "bg-green-500/20 text-green-400" : 
 color === 'blue' ? "bg-neon-blue/20 text-neon-blue" : 
 "bg-red-500/20 text-red-400"
 )}>{status}</span>
 </div>
 <h4 className="text-sm font-black text-white mb-1">{title}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{desc}</p>
 </div>
 );
 };

 const renderSecurity = () => (
 <div className="space-y-6">
 <NeonCard variant="purple" className="space-y-8">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-black text-white mb-1 flex items-center gap-2">
 {isRtl ? "وضعیت تایید حساب" : "Account Verification Status"}
 {authUser?.isVerified ? (
 <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "حساب تایید شده" : "Verified Account"}</span>
 ) : (
 <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "حساب تایید نشده" : "Unverified Account"}</span>
 )}
 </h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? (authUser?.isVerified ? "هویت شما با موفقیت تایید شده است." : "برای دسترسی به تمامی امکانات، حساب خود را تایید کنید") : (authUser?.isVerified ? "Your identity is verified and in good standing." : "Verify your account email to access all platform features.")}</p>
 </div>
 {!authUser?.isVerified && (
 <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase px-6 border-none" onClick={handleSendVerificationEmail}>{isRtl ? "تایید پروفایل" : "Verify Profile"}</GlowButton>
 )}
 </div>
 </div>

 <hr className="border-white/5" />

 <div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-black text-white mb-1 flex items-center gap-2">
 {isRtl ? "تایید دو مرحله‌ای (SMS)" : "Two-Factor Auth (SMS)"} 
 {twoFactorEnabled ? (
 <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "فعال" : "Enabled"}</span>
 ) : (
 <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded uppercase not-">{isRtl ? "غیرفعال" : "Disabled"}</span>
 )}
 </h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? "کد تایید امنیتی هنگام ورود به شماره همراه شما پیامک خواهد شد" : "Security codes will be messaged to your phone when you log in."}</p>
 </div>
 {twoFactorEnabled ? (
 <GlowButton variant="purple" size="sm" className="text-[10px] font-black uppercase px-6 border-none bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 shadow-none" onClick={handleDisable2FA} disabled={saving}>{isRtl ? "غیرفعال‌سازی 2FA" : "Disable 2FA"}</GlowButton>
 ) : (
 <GlowButton variant="blue" size="sm" className="text-[10px] font-black uppercase px-6 border-none" onClick={handleEnable2FA} disabled={saving}>{isRtl ? "فعال‌سازی 2FA" : "Enable 2FA"}</GlowButton>
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
 className="relative w-full max-w-sm rounded-[24px] bg-[#0a0a0f] border border-white/10 p-8 shadow-2xl overflow-hidden"
 style={{ transformOrigin: "center center" }}
 onMouseMove={(e) => e.stopPropagation()}
 >
 {showVerificationModal ? (
 <>
 <h3 className="text-xl font-black text-white mb-2">تایید ایمیل</h3>
 <p className="text-xs text-gray-500 font-bold mb-6 ">توکن ارسال شده به ایمیل خود را وارد کنید</p>
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
 <h3 className="text-xl font-black text-white mb-2">تایید دو مرحله‌ای پیامکی</h3>
 <p className="text-xs text-gray-500 font-bold mb-6 ">کد تایید ارسال شده به شماره همراه خود را وارد کنید</p>
 <Input 
 label="کد تایید"
 placeholder="مثلا 123456"
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
 <h3 className="font-black text-white mb-1">{isRtl ? "تغییر رمز عبور" : "Change Password"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 ">{isRtl ? "برای امنیت بیشتر از رمزهای طولانی استفاده کنید" : "Use custom long passwords for maximum security."}</p>
 <div className="space-y-6 max-w-md">
 <Input 
 label={isRtl ? "رمز عبور فعلی" : "Current Password"} 
 type="password" 
 value={formData.currentPassword}
 onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
 />
 <Input 
 label={isRtl ? "رمز عبور جدید" : "New Password"} 
 type="password" 
 value={formData.newPassword}
 onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
 />
 <Input 
 label={isRtl ? "تکرار رمز عبور جدید" : "Confirm New Password"} 
 type="password" 
 value={formData.confirmPassword}
 onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
 />
 </div>
 <div className="mt-6">
 <GlowButton 
 variant="purple" 
 className="px-10 h-10 text-[11px] font-black uppercase "
 onClick={handlePasswordChange}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال تغییر..." : "Updating...") : (isRtl ? "به‌روزرسانی رمز عبور" : "Update Password")}
 </GlowButton>
 </div>
 </div>

 <hr className="border-white/5" />

 <div>
 <h3 className="font-black text-white mb-4">{isRtl ? "دستگاه‌های متصل" : "Connected Devices"}</h3>
 <div className="space-y-3">
 {(devices || []).map((session, i) => (
 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neon-blue transition-colors">
 <Smartphone size={20} />
 </div>
 <div>
 <h4 className="text-xs font-black text-white flex items-center gap-2">
 {session.deviceName}
 {i === 0 && <span className="text-[8px] text-neon-blue uppercase">{isRtl ? "اخیر" : "Recent"}</span>}
 </h4>
 <p className="text-[10px] text-gray-500 font-bold">{session.ipAddress}</p>
 </div>
 </div>
 <button onClick={() => handleRevokeDevice(session.id)} className="text-[10px] font-black text-neon-pink uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{isRtl ? "خروج" : "Logout"}</button>
 </div>
 ))}
 {(!devices || devices.length === 0) && (
 <p className="text-[10px] text-gray-500 font-bold uppercase">{isRtl ? "در حال بارگذاری..." : "Loading..."}</p>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <SecurityStatusCard 
 title={isRtl ? "وضعیت تایید حساب" : "Account Verification"} 
 status={authUser?.isVerified ? (isRtl ? "تایید شده" : "Verified") : (isRtl ? "در انتظار تایید" : "Pending")}
 desc={authUser?.isVerified ? (isRtl ? "حساب شما کاملاً تایید شده و به تمامی امکانات دسترسی دارید." : "Your account is high standing and fully verified.") : (isRtl ? "تایید ایمیل برای دسترسی به تمامی امکانات لابی و فروشگاه الزامی است." : "Please verify your email to unlock all lobbies, chat and store privileges.")}
 icon={<Mail size={20} className="text-neon-blue" />}
 color={authUser?.isVerified ? "green" : "red"}
 />
 <SecurityStatusCard 
 title={isRtl ? "تایید دو مرحله‌ای" : "2FA Protection"} 
 status={twoFactorEnabled ? (isRtl ? "فعال" : "Enabled") : (isRtl ? "غیرفعال" : "Disabled")}
 desc={twoFactorEnabled ? (isRtl ? "تایید دو مرحله‌ای فعال است و امنیت حساب شما را تضمین می‌کند." : "2FA protection is armed and securing your sessions.") : (isRtl ? "برای جلوگیری از دسترسی غیرمجاز، تایید دو مرحله‌ای را فعال کنید." : "Secure your account from remote brute force attacks by enabling 2FA SMS.")}
 icon={<Lock size={20} className="text-neon-purple" />}
 color={twoFactorEnabled ? "green" : "blue"}
 />
 <SecurityStatusCard 
 title={isRtl ? "محافظت از اکانت" : "Account Protection"} 
 status={isRtl ? "تحت نظارت" : "Monitored"}
 desc={isRtl ? "سیستم ضد تقلب و محافظت از اکانت لoxx به صورت ۲۴ ساعته فعال است." : "The LOXX anti-cheat and token guard system is active 24/7."}
 icon={<SecurityAlert size={20} className="text-neon-pink" />}
 color="green"
 />
 </div>

 </NeonCard>
 </div>
 );

 const renderBadges = () => (
 <div className="space-y-6">
 <NeonCard variant="purple">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-black text-white uppercase ">
 {isRtlStyle ? "نشان‌های من" : "My Badges"}
 </h3>
 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ">
 {isRtlStyle ? "نشان‌هایی که برای نمایش در مینی‌-پروفایل پین می‌کنید (حداکثر ۵ عدد)" : "Pin badges to show up highlighted inside your miniature user profile (Max 5)"}
 </p>
 </div>
 <div className="px-4 py-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
 <span className="text-xs font-black text-neon-blue ">
 {userBadges.filter(b => b.isPinned).length} / 5 {isRtlStyle ? "پین شده" : "Pinned"}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
 {userBadges.map((badge) => (
 <motion.div
 key={badge.id}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => handleToggleBadgePin(badge.id)}
 className={cn(
 "relative aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 group",
 badge.isPinned 
 ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.1)]" 
 : "bg-white/5 border-white/5 hover:border-white/10"
 )}
 >
 <img src={badge.iconUrl} alt={badge.name} className="w-12 h-12 object-contain mb-2" />
 <span className="text-[10px] font-black text-white uppercase text-center line-clamp-1">{badge.name}</span>
 
 {badge.isPinned && (
 <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-neon-blue flex items-center justify-center text-dark-bg">
 <Plus size={12} className="rotate-45" />
 </div>
 )}
 
 <div className={cn(
 "absolute inset-0 rounded-[22px] flex items-center justify-center bg-dark-bg/80 opacity-0 group-hover:opacity-100 transition-opacity",
 badge.isPinned ? "bg-red-500/20" : "bg-neon-blue/20"
 )}>
 <span className="text-[10px] font-black text-white uppercase ">
 {badge.isPinned ? (isRtlStyle ? "برداشتن پین" : "Unpin") : (isRtlStyle ? "پین کردن" : "Pin Badge")}
 </span>
 </div>
 </motion.div>
 ))}
 {userBadges.length === 0 && (
 <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 opacity-30">
 <Award size={48} />
 <p className="text-xs font-black uppercase ">
 {isRtlStyle ? "هنوز هیچ نشانی کسب نکرده‌اید" : "You have not earned any custom badges yet."}
 </p>
 </div>
 )}
 </div>
 </NeonCard>

 <NeonCard variant="blue">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-black text-white uppercase ">
 {isRtlStyle ? "نشان‌های انتخابی" : "Customizable Choice Badges"}
 </h3>
 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ">
 {isRtlStyle ? "نشان‌هایی که می‌توانید برای خود انتخاب کنید" : "Choice badges you can freely equip/unequip"}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
 {availableChoiceBadges.map((badge) => {
 const hasBadge = userBadges.some(ub => ub.id === badge.id);
 return (
 <motion.div
 key={badge.id}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => handleToggleStandardBadge(badge.id)}
 className={cn(
 "relative aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 group",
 hasBadge 
 ? "bg-neon-pink/10 border-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.1)]" 
 : "bg-white/5 border-white/5 hover:border-white/10"
 )}
 >
 <img src={badge.iconUrl} alt={badge.name} className={cn("w-12 h-12 object-contain mb-2", !hasBadge && "grayscale opacity-50")} />
 <span className={cn("text-[10px] font-black uppercase text-center line-clamp-1", hasBadge ? "text-white" : "text-gray-600")}>{badge.name}</span>
 
 <div className={cn(
 "absolute inset-0 rounded-[22px] flex items-center justify-center bg-dark-bg/80 opacity-0 group-hover:opacity-100 transition-opacity",
 hasBadge ? "bg-red-500/20" : "bg-neon-pink/20"
 )}>
 <span className="text-[10px] font-black text-white uppercase ">
 {hasBadge ? (isRtlStyle ? "حذف کردن" : "Unequip Style") : (isRtlStyle ? "اضافه کردن" : "Equip Badge")}
 </span>
 </div>
 </motion.div>
 );
 })}
 </div>
 </NeonCard>
 </div>
 );

 const renderElite = () => (
 <div className="space-y-6">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="relative group cursor-pointer"
 onClick={() => navigate("/settings/elite")}
 >
 <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-[32px] blur-xl opacity-40 group-hover:opacity-60 transition duration-1000" />
 <NeonCard variant="gold" className="relative p-10 overflow-hidden border-none bg-black/60 backdrop-blur-3xl">
 <div className="absolute top-0 left-0 p-8 opacity-10">
 <Crown size={200} />
 </div>
 <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 text-center md:text-right">
 <div className="h-40 w-40 rounded-[48px] bg-yellow-400 text-dark-bg flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.4)]">
 <Sparkles size={64} fill="currentColor" />
 </div>
 <div className="flex-1">
 <h2 className="text-4xl font-black text-white uppercase mb-4">Elite Control Center</h2>
 <p className="text-sm text-yellow-400/80 font-black uppercase leading-relaxed">
 به عنوان عضو ویژه نخبگان، شما به ابزارهای شخصی‌سازی و هویتی منحصر به فرد دسترسی دارید. صفحه پیشرفته نخبگان در مسیر مجزا قرار دارد (برای ورود کلیک کنید).
 </p>
 </div>
 </div>
 </NeonCard>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <NeonCard variant="purple">
 <div className="flex items-center gap-4 mb-6">
 <div className="h-10 w-10 rounded-xl bg-neon-purple/10 flex items-center justify-center text-neon-purple">
 <Shield size={20} />
 </div>
 <h3 className="text-sm font-black text-white uppercase">شخصی‌سازی هویتی</h3>
 </div>
 
 <div className="space-y-4">
 {[
 { label: "هاله نورانی (Aura Effect)", desc: "جهت ویرایش به بخش تنظیمات نخبگان مسقیم وارد شوید", active: true },
 { label: "نام متحرک (Glow Name)", desc: "جهت ویرایش به بخش تنظیمات نخبگان مسقیم وارد شوید", active: true },
 { label: "فریم الماس (Elite Frame)", desc: "جهت ویرایش به بخش تنظیمات نخبگان مسقیم وارد شوید", active: false }
 ].map((item, i) => (
 <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-neon-purple/30 transition-all">
 <div>
 <h4 className="text-xs font-black text-white ">{item.label}</h4>
 <p className="text-[9px] text-gray-500 mt-0.5">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </NeonCard>

 <NeonCard variant="blue">
 <div className="flex items-center gap-4 mb-6">
 <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
 <Star size={20} />
 </div>
 <h3 className="text-sm font-black text-white uppercase">قابلیت‌های ویژه لابی</h3>
 </div>
 
 <div className="space-y-4">
 {[
 { label: "اعلان ورود (Join Alert)", desc: "جهت تنظیم به صفحه تنظیمات نخبگان بروید", active: true },
 { label: "پین شدن لابی (Pin Lobby)", desc: "جهت تنظیم به صفحه تنظیمات نخبگان بروید", active: true },
 { label: "تغییر تم لابی (Custom Theme)", desc: "جهت تنظیم به صفحه تنظیمات نخبگان بروید", active: false }
 ].map((item, i) => (
 <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-neon-blue/30 transition-all">
 <div>
 <h4 className="text-xs font-black text-white ">{item.label}</h4>
 <p className="text-[9px] text-gray-500 mt-0.5">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </NeonCard>
 </div>
 </div>
 );

 const renderNotifications = () => (
 <div className="space-y-4">
 <NeonCard variant="blue" className="p-0 overflow-hidden">
 <div className="p-6 border-b border-white/5">
 <h3 className="font-black text-white ">{isRtl ? "مدیریت اعلان‌ها" : "Manage Notifications"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? "نحوه اطلاع از رویدادهای Loxx را انتخاب کنید" : "Configure how you receive platform updates and alerts"}</p>
 </div>
 <div className="divide-y divide-white/5">
 {[
 { key: "receiveFriendRequests", label: isRtl ? "درخواست‌های دوستی" : "Friend Requests", desc: isRtl ? "وقتی کسی برای شما درخواست دوستی می‌فرستد" : "When someone sends you a friend invite", icon: User },
 { key: "receiveLobbyInvites", label: isRtl ? "دعوت به لابی" : "Lobby Invitations", desc: isRtl ? "وقتی دوستانتان شما را به بازی دعوت می‌کنند" : "When playing buddies invite you to a lobby", icon: User },
 { key: "showMentionAlerts", label: isRtl ? "اعلان‌های منشن" : "Mention Alerts", desc: isRtl ? "وقتی کسی شما را در چت منشن می‌کند" : "When someone @mentions you in any channel", icon: Bell },
 ].map((item, i) => (
 <label key={i} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 last:border-b-0">
 <div className="flex gap-4">
 <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-neon-blue transition-colors">
 <item.icon size={18} />
 </div>
 <div>
 <h4 className="text-sm font-black text-white ">{item.label}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase">{item.desc}</p>
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
 <h3 className="font-black text-white mb-1">{isRtl ? "وضعیت و تم" : "Status & Theme"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 ">{isRtl ? "ظاهر برنامه خود را شخصی‌سازی کنید" : "Personalize your visual appearance"}</p>
 <div className="space-y-4">
 <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10">
 <div className="flex items-center gap-3">
 <Eye size={16} className="text-gray-500" />
 <span className="text-xs font-black text-white ">{isRtl ? "نمایش وضعیت آنلاین" : "Show Online Status"}</span>
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
 <span className="text-xs font-black text-white uppercase">{isRtl ? "تم برنامه" : "App Theme"}</span>
 </div>
 <div className="grid grid-cols-2 gap-4">
 {['dark', 'high-contrast'].map((t) => (
 <button 
 key={t}
 onClick={() => updateSetting("theme", t)}
 className={cn(
 "py-3 rounded-xl border font-black text-[11px] uppercase transition-all",
 settings.theme === t ? "bg-neon-blue/10 border-neon-blue text-neon-blue" : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
 )}
 >
 {t === 'dark' ? (isRtl ? 'حالت تاریک' : 'Dark Mode') : (isRtl ? 'کنتراست بالا' : 'High Contrast')}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 <hr className="border-white/5" />

 <div>
 <h3 className="font-black text-white mb-1">{isRtl ? "عملکرد" : "Performance"}</h3>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 ">{isRtl ? "بهینه‌سازی برای دستگاه‌های مختلف" : "Optimize rendering for your devices"}</p>
 <div className="space-y-4">
 <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10">
 <div className="flex items-center gap-3">
 <Zap size={16} className="text-gray-500" />
 <span className="text-xs font-black text-white ">{isRtl ? "کاهش انیمیشن‌ها" : "Reduce Animations"}</span>
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

 const renderRegion = () => {
 const isRtl = language === "fa";
 return (
 <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
 <NeonCard variant="blue" className="space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className={isRtl ? "text-right" : "text-left"}>
 <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 flex items-center gap-2">
 <Languages size={14} /> {isRtl ? "انتخاب زبان" : "Select Language"}
 </h4>
 <select 
 value={language}
 onChange={(e) => {
 const val = e.target.value as "en" | "fa";
 updateSetting("language", val);
 setLanguage(val);
 }}
 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/50 font-black select"
 >
 <option value="fa" className="bg-dark-bg text-white">Persian / فارسی</option>
 <option value="en" className="bg-dark-bg text-white">English / انگلیسی</option>
 </select>
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 flex items-center gap-2">
 <MapPin size={14} /> {isRtl ? "منطقه بازی (Server Region)" : "Gaming Region (Server Region)"}
 </h4>
 <select 
 value={formData.region}
 onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/50 font-black select"
 >
 <option value="IR" className="bg-dark-bg text-white">Iran (Tehran)</option>
 <option value="ME" className="bg-dark-bg text-white">Middle East (Dubai)</option>
 <option value="EU" className="bg-dark-bg text-white">Europe West (Frankfurt)</option>
 </select>
 </div>
 </div>

 <hr className="border-white/5" />

 <div className="p-6 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 flex items-center gap-4">
 <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
 <Heart size={24} />
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <h4 className="text-sm font-black text-white ">{isRtl ? "محتوای بومی شده" : "Localized Content"}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
 {isRtl 
 ? "لوکس همزمان با زبان انتخابی شما، محتوای بازی‌ها و رویدادهای محلی منطقه شما را در اولویت قرار می‌دهد."
 : "LOXX prioritizes matching local region events and gaming latency metrics aligned with your chosen configuration."}
 </p>
 </div>
 </div>
 </NeonCard>
 </div>
 );
 };

 const [supportMessage, setSupportMessage] = useState("");

 const handleSendSupport = async () => {
 if (!supportMessage.trim()) { toast.error(isRtl ? "متن پیام خالی است" : "Message text cannot be empty"); return; }
 setSaving(true);
 try {
 await api.post("/reports", {
 targetType: "TICKET",
 reason: supportMessage
 });
 toast.success(isRtl ? "پیام شما با موفقیت ارسال شد" : "Your message has been successfully sent");
 setSupportMessage("");
 } catch { toast.error(isRtl ? "خطا در ارسال پیام" : "Error sending message"); }
 finally { setSaving(false); }
 };

 const faqItems = [
 {
 q: isRtl ? "۱. پلتفرم لوکس دقیقاً چیست و چه تفاوتی با نمونه‌های مشابه دارد؟" : "1. What is the LOXX platform and how is it different?",
 a: isRtl ? "لوکس (LOXX) یک پلتفرم کامل و همه جانبه فارسی است که بستر فوق‌العاده‌ای را برای ارتباط گرفتن، رفیق پیدا کردن و برقراری ارتباط موثر متنی و صوتی با بالاترین کیفیت ممکن فراهم کرده است. ما با رفع محدودیت‌های موجود برای کاربران ایرانی، فضایی دوستانه و تعاملی ایجاد کرده‌ایم تا بتوانید به راحتی با دوستان جدید آشنا شوید و با آن‌ها گفتگو کنید." : "LOXX is an all-in-one gaming community platform that provides chat, lobbies, and premium voice comms. We've removed limitations for Iranian gamers, creating a highly interactive space to meet new partners and sync up."
 },
 {
 q: isRtl ? "۲. سیستم تونلینگ LAN در کلاینت ویندوز چگونه کار می‌کند؟" : "2. How does LAN tunneling work in the Windows Client?",
 a: isRtl ? "ما یک معماری انحصاری TCP/UDP Relay پیاده‌سازی کرده‌ایم. کلاینت لوکس به صورت خودکار پورت‌های استاندارد بازی‌ها (مثل Minecraft، Warcraft III، CS و…) را رصد کرده و بسته‌های دیسکاوری را مستقیماً در شبکه محلی شما تزریق می‌کند. این یعنی به محض ورود به یک لابی در لوکس، بازی شما در لیست LAN ویندوز ظاهر می‌شود؛ بدون هاماچی، بدون درایور مجازی و بدون دردسر." : "We have implemented a custom TCP/UDP Relay architecture. The LOXX desktop client listens to standard game discovery ports (e.g., Minecraft, Warcraft III, Counter-Strike) and relays discovery broadcasts directly. Games appear in Windows LAN lists instantly without virtual NICs or Hamachi."
 },
 {
 q: isRtl ? "۳. چرا بخش لابی‌های آفلاین (LAN) در نسخه وب نمایش داده نمی‌شود؟" : "3. Why does the LAN Lobby section not show up on the Web version?",
 a: isRtl ? "به دلیل محدودیت‌های امنیتی مرورگرها در دسترسی به لایه‌های زیرین شبکه، سیستم پیشرفته Tunneling فقط در نسخه کلاینت ویندوز فعال است. کلاینت لوکس با تشخیص پلتفرم، تمامی امکانات لازم برای اتصال مستقیم را در اختیار شما قرار می‌دهد، در حالی که نسخه وب برای مدیریت حساب و چت سراسری بهینه شده است." : "Browser sandboxing prevents raw socket bindings required for packet level routing. Desktop clients natively resolve these configurations, whereas the web is tailored for global chats and user profile configurations."
 },
 {
 q: isRtl ? "۴. تفاوت اشتراک‌های VIP و +LOXX در چیست؟" : "4. What is the difference between LOXX VIP and LOXX PLUS status?",
 a: isRtl ? "همانطور که در بخش «ارتقای سطح کاربری» مشاهده می‌کنید:\n\nLOXX PLUS: مخصوص کاربرانی است که به دنبال شخصی‌سازی پروفایل (آواتار متحرک، استیکرهای اختصاصی، نشان مخصوص) و اولویت در لیست لابی‌ها هستند.\nLOXX VIP: سطح نخبگان لوکس است که علاوه بر تمام قابلیت‌های پلاس، به تنظیمات پیشرفته Elite، ظرفیت XP دوبرابر، گروه‌های چت VIP و تم‌های طلایی اختصاصی دسترسی دارند." : "LOXX PLUS grants custom profile perks (animated avatars, custom themes). LOXX VIP is the ultimate tier, featuring everything in PLUS, twice the XP multiplier, VIP-exclusive lobby invites, and golden theme accents."
 },
 {
 q: isRtl ? "۵. چطور می‌توانم در لیست «قهرمانان هفته» قرار بگیرم؟" : "5. How do I make it to the 'Heroes of the Week' ranking?",
 a: isRtl ? "سیستم رتبه‌بندی لوکس بر اساس فعالیت‌های شما (ایجاد لابی، تکمیل بازی‌ها و تعامل در پلتفرم) امتیاز XP محاسبه می‌کند. ۳ نفر برتر لیست رتبه‌بندی در پایان هر هفته، جوایز ویژه و اشتراک‌های رایگان دریافت می‌کنند. زمان باقیمانده تا ریست امتیازات را می‌توانید در صفحه «رتبه‌بندی» مشاهده کنید." : "The LOXX rating engine calculates XP based on lobby hosting, chat engagements, and activity metrics. The top 3 users on the weekly leaderboard receive complimentary shop bonuses and free upgrades."
 },
 {
 q: isRtl ? "۶. امنیت مکالمات صوتی (Voice Chat) چگونه تضمین می‌شود؟" : "6. How is secure and confidential voice chat guaranteed?",
 a: isRtl ? "سیستم گفتگوی صوتی (ویس چت) لوکس بر اساس مدرن‌ترین و پیشرفته‌ترین متدهای ارتباطی امن پیاده‌سازی شده است. در این ساختار هوشمند، ارتباط صوتی شما با نهایت سرعت مایکروثانیه منتقل شده و هیچ‌گونه ضبط یا ذخیره‌سازی روی سرورهای ما انجام نشده است تا بتوانید با خیالی کاملاً آسوده و امنیت کامل گفتگو کنید." : "Our low-latency WebRTC channels are encrypted and route directly to relay edge nodes. Voice packets are forwarded instantly in microseconds without server caching or voice logging."
 },
 {
 q: isRtl ? "۷. چرا باید اشتراک تهیه کنیم؟" : "7. Why should we purchase a platform subscription?",
 a: isRtl ? "پلتفرم لوکس یک پروژه کاملاً مستقل است که با هزینه‌های شخصی سنگین جهت خرید سرورهای باکیفیت و توسعه فنی لانچ شده است. تهیه اشتراک VIP توسط شما، تنها منبع درآمدی ما برای سرپا نگه داشتن سرورها، رفع باگ‌ها و افزودن قابلیت‌های جدید (مانند نسخه موبایل) است. شما با این کار، مستقیم از رشد جامعه گیمینگ فارسی حمایت می‌کنید." : "LOXX is an independent passion project funded personally. Premium subscriptions help cover bandwidth, cloud orchestration fees, and new tools like the upcoming mobile version. Your purchase supports independent gaming spaces."
 },
 {
 q: isRtl ? "۸. در صورت تداخل پورت یا خطا در اتصال چه کار کنم؟" : "8. What should I do if I get a port binding error?",
 a: isRtl ? "کلاینت هوشمند لوکس در صورت مسدود بودن پورت‌های بازی توسط آنتی‌ویروس یا برنامه‌های دیگر، بلافاصله از طریق اعلان‌های فارسی به شما هشدار داده و راهنمای رفع مشکل را نمایش می‌دهد. همچنین تیم پشتیبانی در چت سراسری همیشه آماده راهنمایی شماست." : "The LOXX smart client alerts you if ports are blocked by third-party anti-viruses or system firewalls. Our live chat moderators are also around the clock to assist you."
 }
 ];

 const renderSupport = () => (
 <div className="space-y-6">
 {/* FAQ Section */}
 <NeonCard className="space-y-6">
 <div className="flex items-center gap-4 border-b border-white/5 pb-4">
 <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
 <HelpCircle size={24} />
 </div>
 <div>
 <h3 className="text-xl font-black uppercase ">{isRtl ? "سوالات متداول (FAQ) - پلتفرم لوکس" : "Frequently Asked Questions (FAQ)"}</h3>
 <p className="text-[10px] uppercase font-bold text-gray-500">{isRtl ? "پاسخ به سوالات و مشکلات متداول کاربران" : "Answers to common platform questions and troubleshooting"}</p>
 </div>
 </div>

 <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
 {faqItems.map((item, idx) => {
 const isExpanded = expandedFaq === idx;
 return (
 <div 
 key={idx} 
 className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden transition-all duration-300 hover:border-white/10"
 >
 <button
 onClick={() => setExpandedFaq(isExpanded ? null : idx)}
 className={cn("w-full px-5 py-4 flex items-center justify-between gap-4 text-white font-bold text-sm md:text-base hover:bg-white/[0.02] transition-colors", isRtl ? "text-right" : "text-left")}
 >
 <span className={cn("leading-relaxed font-black", isRtl ? "text-right" : "text-left")}>{item.q}</span>
 <ChevronDown 
 size={18} 
 className={cn(
 "text-gray-400 transition-transform duration-300 shrink-0", 
 isExpanded && "rotate-180 text-neon-blue"
 )} 
 />
 </button>
 
 <AnimatePresence initial={false}>
 {isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2, ease: "easeInOut" }}
 >
 <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-400 leading-relaxed border-t border-white/5 bg-white/[0.01] whitespace-pre-wrap font-sans">
 {item.a}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>
 </NeonCard>

 {/* Ticket Box */}
 <NeonCard className="space-y-6">
 <div className="flex items-center gap-4 border-b border-white/5 pb-4">
 <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
 <MessageSquare size={24} />
 </div>
 <div>
 <h3 className="text-xl font-black uppercase ">{isRtl ? "ارسال تیکت / گزارش" : "Submit Ticket / Report"}</h3>
 <p className="text-[10px] uppercase font-bold text-gray-500">{isRtl ? "ارتباط مستقیم با مدیریت" : "Contact the administration directly"}</p>
 </div>
 </div>

 <div className="space-y-4">
 <label className="block text-[10px] font-black text-gray-500 uppercase ">{isRtl ? "شرح پیام" : "Message Description"}</label>
 <textarea
 value={supportMessage}
 onChange={(e) => setSupportMessage(e.target.value)}
 dir={isRtl ? "rtl" : "ltr"}
 className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-700 transition-all focus:border-neon-blue/50 focus:outline-none h-40 resize-none"
 placeholder={isRtl ? "گزارش مشکل، باگ، یا پیشنهاد خود را اینجا بنویسید..." : "Describe bugs, issues, or specify your suggestions here..."}
 />
 </div>

 <div className={cn("flex pt-4 border-t border-white/5", isRtl ? "justify-end" : "justify-start")}>
 <GlowButton 
 variant="blue" 
 className="px-10 h-10 text-[11px] font-black uppercase "
 onClick={handleSendSupport}
 disabled={saving}
 >
 {saving ? (isRtl ? "در حال ارسال..." : "Sending...") : (isRtl ? "ارسال پیام" : "Send Message")}
 </GlowButton>
 </div>
 </NeonCard>
 </div>
 );

 const renderRules = () => {
 if (!isRtl) {
 return (
 <div className="space-y-8 animate-fade-in" dir="ltr">
 <NeonCard className="relative overflow-hidden border-none bg-black/40 backdrop-blur-2xl">
 {/* Glow decoration */}
 <div className="absolute top-0 left-0 w-80 h-80 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />
 
 <header className="border-b border-white/5 pb-6 mb-8 text-left relative z-10">
 <div className="flex items-center gap-4 mb-4">
 <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
 <BookOpen size={24} />
 </div>
 <div>
 <h1 className="text-2xl md:text-3xl font-black text-white font-sans">Terms of Service & Rules</h1>
 <p className="text-xs text-gray-400 mt-1 font-sans">Last updated: May 15, 2026</p>
 </div>
 </div>
 <p className="text-sm text-gray-300 leading-relaxed font-sans">
 Welcome to LOXX. Please read these Terms of Service carefully before using our platform. By registering or using our gaming tunnel / voice server / match lobbies, you acknowledge you have read, understood, and agreed to adhere to these rules.
 </p>
 </header>

 <main className="space-y-8 relative z-10 font-sans text-left">
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-l-4 border-neon-blue pl-3 mb-2 flex items-center gap-2">
 <span>Article 1: Definitions & Platforms</span>
 </h3>
 <p className="text-sm text-gray-300 leading-relaxed pl-2">
 The LOXX platform includes our web console, desktop tunneling client, match lobbies, secure P2P voice rooms, and any future mobile applications launched to coordinate matchmaking and local-area gaming networks.
 </p>
 </section>

 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-l-4 border-neon-blue pl-3 mb-2">
 Article 2: User Account Integrity
 </h3>
 <p className="text-sm text-gray-300 leading-relaxed pl-2">
 Users must register with verified email addresses and maintain accurate profile data. Each player is restricted to one primary account. Sharing or trading accounts to bypass matchmaking ratings or bans is strictly prohibited.
 </p>
 </section>

 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-l-4 border-neon-blue pl-3 mb-2">
 Article 3: Zero-TUN & Desktop Client Safety
 </h3>
 <p className="text-sm text-gray-300 leading-relaxed pl-2">
 Our Zero-TUN tunneling client relays TCP/UDP game broadcast discovery frames natively on port 3000 proxies. Reverse-engineering code injection, memory patching, and anti-cheat tampering will cause automated permanent device level HWID bans.
 </p>
 </section>

 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-l-4 border-neon-blue pl-3 mb-2">
 Article 4: Subscriptions, VIP & Refund Clauses
 </h3>
 <p className="text-sm text-gray-300 leading-relaxed pl-2">
 LOXX VIP and LOXX PLUS memberships are immediately activated upon gateway billing confirmation. Subscriptions are strictly non-refundable and digital content purchases are final, unless there are systemic host side failures preventing platform launch.
 </p>
 </section>

 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-l-4 border-neon-blue pl-3 mb-2">
 Article 5: Communication Integrity & Safety
 </h3>
 <p className="text-sm text-gray-300 leading-relaxed pl-2">
 LOXX enforces zero-tolerance against hate speech, systematic harassment, and coordinate tracking of user data. Peer-to-peer real-time voice packets are fully encrypted and transmitted directly without server logging or inspection.
 </p>
 </section>
 </main>

 <footer className="mt-8 text-center text-gray-400 font-sans border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-2">
 <p className="text-sm font-bold">Thank you for being part of the LOXX community.</p>
 <div className="px-6 py-2 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 text-xs font-black text-neon-blue uppercase">
 LOXX Engineering Team
 </div>
 </footer>
 </NeonCard>
 </div>
 );
 }

 return (
 <div className="space-y-8 animate-fade-in" dir="rtl">
 <NeonCard className="relative overflow-hidden border-none bg-black/40 backdrop-blur-2xl">
 {/* Glow decoration */}
 <div className="absolute top-0 right-0 w-80 h-80 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />
 
 <header className="border-b border-white/5 pb-6 mb-8 text-right relative z-10">
 <div className="flex items-center gap-4 mb-4">
 <div className="h-12 w-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
 <BookOpen size={24} />
 </div>
 <div>
 <h1 className="text-2xl md:text-3xl font-black text-white ">قوانین و مقررات جامع استفاده از پلتفرم لوکس (LOXX)</h1>
 <p className="text-xs text-gray-400 mt-1 font-sans">آخرین بروزرسانی: ۲۶ اردیبهشت ۱۴۰۵ (۱۵ می ۲۰۲۶)</p>
 </div>
 </div>
 <p className="text-sm text-gray-300 leading-relaxed font-sans">
 با احترام به کاربران گرامی، مطالعه دقیق قوانین و مقررات زیر پیش از استفاده از خدمات پلتفرم گیمینگ لوکس (LOXX) الزامی است. ورود شما به پلتفرم و استفاده از هر یک از خدمات آن، به منزله آگاهی کامل و پذیرش تمامی موارد ذکر شده در این سند تلقی می‌شود.
 </p>
 </header>

 <main className="space-y-8 relative z-10 font-sans text-right">
 {/* Section 1 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2 flex items-center gap-2">
 <span>ماده ۱: تعاریف</span>
 </h3>
 <ul className="space-y-2.5 text-sm text-gray-300 pr-2">
 <li className="leading-relaxed">
 <strong className="text-white">پلتفرم لوکس:</strong> شامل وبسایت، کلاینت دسکتاپ ویندوز، اپلیکیشنهای موبایل (در صورت ارائه آتی) و کلیه خدمات مرتبط با میزبانی، اتصال، ارتباط و مدیریت بازیهای آنلاین و تحت شبکه.
 </li>
 <li className="leading-relaxed">
 <strong className="text-white">کاربر:</strong> شخص حقیقی یا حقوقی که در پلتفرم لوکس ثبتنام کرده و از خدمات آن استفاده مینماید.
 </li>
 <li className="leading-relaxed">
 <strong className="text-white">کلاینت ویندوز:</strong> نرمافزار اختصاصی لوکس برای سیستمعامل ویندوز که امکاناتی نظیر تونلینگ LAN با تکنولوژی Zero-TUN را فراهم میآورد.
 </li>
 <li className="leading-relaxed">
 <strong className="text-white">Zero-TUN:</strong> تکنولوژی اختصاصی لوکس برای ایجاد اتصالات کمتأخیر در بازیهای تحت شبکه (LAN) از طریق هدایت هوشمند ترافیک.
 </li>
 <li className="leading-relaxed">
 <strong className="text-white">اشتراک VIP/PLUS:</strong> سطوح کاربری ویژه با امکانات و مزایای افزوده که با پرداخت هزینه در اختیار کاربر قرار میگیرد.
 </li>
 <li className="leading-relaxed">
 <strong className="text-white">محتوای تولید شده توسط کاربر (UGC):</strong> شامل اطلاعات پروفایل، آواتار، نام کاربری، پیامهای چت و سایر اطلاعاتی که توسط کاربر در پلتفرم بارگذاری یا ایجاد میشود.
 </li>
 </ul>
 </section>

 {/* Section 2 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۲: شرایط عمومی ثبت‌نام و حساب کاربری
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed">
 <strong className="text-white">۲.۱.</strong> کاربران موظفند اطلاعات صحیح، کامل و بروز در زمان ثبتنام ارائه دهند. مسئولیت هرگونه اشتباه در ارائه اطلاعات به عهده کاربر است.
 </p>
 <p className="leading-relaxed">
 <strong className="text-white">۲.۲.</strong> هر کاربر مجاز به داشتن تنها یک حساب کاربری اصلی است. ایجاد حسابهای متعدد با هدف سوءاستفاده یا دور زدن محدودیتها ممنوع است.
 </p>
 <p className="leading-relaxed">
 <strong className="text-white">۲.۳.</strong> حفظ و امنیت اطلاعات حساب کاربری (نام کاربری و رمز عبور) به عهده کاربر است. هرگونه مسئولیت ناشی از افشای اطلاعات حساب به شخص ثالث بر عهده کاربر خواهد بود.
 </p>
 <p className="leading-relaxed">
 <strong className="text-white">۲.۴.</strong> پلتفرم لوکس حق رد درخواست ثبتنام، تعلیق یا حذف حساب کاربری در صورت تشخیص عدم رعایت قوانین یا رفتار غیرمتعارف را برای خود محفوظ میدارد.
 </p>
 </div>
 </section>

 {/* Section 3 */}
 <section className="space-y-4">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۳: قوانین مربوط به خدمات و پلتفرم
 </h3>
 <div className="space-y-3.5 pr-2">
 <div className="space-y-2">
 <h4 className="text-sm font-black text-white">۳.۱. سیستم Zero-TUN و کلاینت ویندوز:</h4>
 <p className="text-sm text-gray-300 leading-relaxed pr-3">
 الف) کلاینت ویندوز لوکس صرفاً برای تسهیل اتصال در بازیهای مجاز طراحی شده است. هرگونه تلاش برای مهندسی معکوس، هک، تزریق کد مخرب یا استفاده غیرمجاز از این سیستم اکیداً ممنوع است.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3">
 ب) مسئولیت انطباق پورتهای مورد استفاده بازی با قوانین آنتیویروس یا فایروال سیستم کاربر، به عهده کاربر است. لوکس راهنماییهای لازم را در صورت بروز تداخل ارائه خواهد داد.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3">
 پ) استفاده از سیستم Zero-TUN صرفاً برای اتصال به بازیهای قانونی مجاز است. هرگونه استفاده برای مقاصد تجاری، دسترسی غیرمجاز به شبکهها یا فعالیتهای غیرقانونی، منجر به پیگرد قانونی خواهد شد.
 </p>
 </div>

 <div className="space-y-2">
 <h4 className="text-sm font-black text-white">۳.۲. محتوای چت و ارتباطات:</h4>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 الف) استفاده از زبان توهینآمیز، نژادپرستانه، تبعیضآمیز، تهدیدآمیز، حاوی محتوای جنسی یا نفرتپراکنی در تمامی بخشهای ارتباطی پلتفرم (چت لابی، چت سراسری، پیام خصوصی) ممنوع است.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 ب) انتشار اطلاعات خصوصی دیگران بدون رضایت آنها، ممنوع است.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 پ) اسپم کردن، ارسال پیامهای تکراری یا تبلیغات غیرمجاز در چتها ممنوع است.
 </p>
 </div>

 <div className="space-y-2">
 <h4 className="text-sm font-black text-white">۳.۳. سیستم اشتراک VIP/PLUS:</h4>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 الف) اشتراکهای VIP و PLUS پس از فعالسازی، غیرقابل استرداد (Non-refundable) هستند، مگر در مواردی که پلتفرم لوکس قادر به ارائه خدمات نباشد.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 ب) فروش، انتقال یا اشتراکگذاری حساب کاربری یا اشتراک ویژه با دیگران بدون مجوز رسمی، تخلف محسوب میشود.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 پ) لوکس حق تغییر، تعدیل یا حذف برخی از امکانات اشتراکها را با اطلاعرسانی قبلی برای خود محفوظ میدارد.
 </p>
 </div>

 <div className="space-y-2">
 <h4 className="text-sm font-black text-white">۳.۴. حفظ حریم خصوصی و داده‌ها:</h4>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 الف) اطلاعات کاربری شما مطابق با «سیاست حفظ حریم خصوصی لوکس» (که به صورت مجزا در دسترس است) جمعآوری، استفاده و محافظت میشود.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 ب) مکالمات صوتی (Voice Chat) از طریق پروتکل P2P (Peer-to-Peer) و به صورت End-to-End Encrypted انجام شده و در سرورهای لوکس ذخیره یا شنود نمیشوند.
 </p>
 <p className="text-sm text-gray-300 leading-relaxed pr-3 font-sans">
 پ) لوکس از کوکیها و توکنهای امنیتی برای بهبود تجربه کاربری و حفظ امنیت جلسات استفاده میکند.
 </p>
 </div>
 </div>
 </section>

 {/* Section 4 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۴: حقوق مالکیت معنوی
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۴.۱.</strong> کلیه حقوق مادی و معنوی مربوط به پلتفرم لوکس، شامل طراحی رابط کاربری، کدها، لوگوها، نام تجاری، محتوای متنی و گرافیکی اختصاصی، متعلق به شرکت یا تیم توسعهدهنده لوکس است.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۴.۲.</strong> ایجاد هرگونه کپی، توزیع، تغییر یا استفاده تجاری از بخشهایی از پلتفرم بدون کسب اجازه کتبی ممنوع است.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۴.۳.</strong> امتیاز و حق استفاده از فونتهای فارسی (مانند فونت کلامه) و سایر داراییهای گرافیکی مطابق با لایسنسهای مربوطه رعایت خواهد شد.
 </p>
 </div>
 </section>

 {/* Section 5 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۵: مسئولیت‌ها و محدودیت‌ها
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۵.۱.</strong> پلتفرم لوکس تلاش میکند تا حداکثر پایداری و در دسترس بودن خدمات را فراهم آورد، اما هیچ تضمینی در خصوص عدم قطعی یا خطاهای احتمالی در سرویسها، بهویژه در شرایط فورس ماژور (مانند حملات DDoS، قطعی اینترنت جهانی، بلایای طبیعی) ارائه نمیدهد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۵.۲.</strong> لوکس هیچگونه مسئولیتی در قبال محتوای تولید شده توسط کاربران، از جمله صحت، کامل بودن یا قانونی بودن آن ندارد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۵.۳.</strong> لوکس مسئولیتی در قبال خسارات احتمالی ناشی از استفاده نادرست کاربر از پلتفرم، نقص در سیستمهای کاربر (مانند آنتیویروس) یا استفاده از نسخههای دستکاری شده کلاینت یا پلتفرم ندارد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۵.۴.</strong> در صورت نیاز به ارتقاء یا نگهداری فنی، ممکن است دسترسی موقت به بخشی از خدمات محدود شود. لوکس تلاش خواهد کرد این محدودیتها را در ساعات کمترافیک اعمال و اطلاعرسانی نماید.
 </p>
 </div>
 </section>

 {/* Section 6 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۶: قوانین مربوط به پرداخت و اشتراک
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۶.۱.</strong> تمامی پرداختها از طریق درگاههای امن بانکی و با رعایت استانداردهای امنیتی صورت میگیرد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۶.۲.</strong> اطلاعات کارت بانکی کاربران در سرورهای لوکس ذخیره نمیشود.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۶.۳.</strong> کاربران موظفند از کارتهای بانکی معتبر و متعلق به خود برای انجام تراکنشها استفاده نمایند. هرگونه تراکنش از طریق کارتهای سرقتی یا غیرمجاز، پیگرد قانونی دارد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۶.۴.</strong> قوانین مربوط به بازگشت وجه (در صورت وجود) صرفاً در شرایطی که در ماده ۳.۳.الف ذکر شده، اعمال خواهد شد.
 </p>
 </div>
 </section>

 {/* Section 7 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۷: رسیدگی به تخلفات و جرائم
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۷.۱.</strong> در صورت نقض هر یک از مواد این توافقنامه، لوکس حق دارد به صلاحدید خود، اقدامات زیر را انجام دهد:
 </p>
 <p className="leading-relaxed pr-3 font-sans">الف) اخطار کتبی یا شفاهی به کاربر.</p>
 <p className="leading-relaxed pr-3 font-sans">ب) محدودسازی موقت دسترسی به بخشی از خدمات.</p>
 <p className="leading-relaxed pr-3 font-sans">ج) تعلیق دائم حساب کاربری.</p>
 <p className="leading-relaxed pr-3 font-sans">د) حذف کامل حساب کاربری و تمامی اطلاعات مرتبط با آن.</p>
 <p className="leading-relaxed pr-3 font-sans">ه) پیگیری حقوقی و قضایی در مراجع ذیصلاح در صورت ارتکاب جرائم سایبری یا نقض حقوق مالکیت معنوی.</p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۷.۲.</strong> لوکس با نهادهای قضایی و امنیتی در چارچوب قوانین جمهوری اسلامی ایران همکاری خواهد کرد.
 </p>
 </div>
 </section>

 {/* Section 8 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۸: تغییرات در قوانین
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۸.۱.</strong> لوکس حق بازنگری و اعمال تغییرات در این قوانین را در هر زمان برای خود محفوظ میدارد. تغییرات پس از انتشار در صفحه قوانین و مقررات پلتفرم، لازمالاجرا خواهند بود.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۸.۲.</strong> ادامه استفاده شما از پلتفرم پس از اعمال تغییرات، به منزله پذیرش قوانین جدید است. توصیه میشود به صورت دورهای این صفحه را مطالعه فرمایید.
 </p>
 </div>
 </section>

 {/* Section 9 */}
 <section className="space-y-3">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۹: قوانین مربوط به به‌روزرسانی خودکار (Auto-Updater)
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۹.۱.</strong> سیستم بهروزرسانی خودکار برای کلاینت ویندوز لوکس طراحی شده است تا تجربه کاربری بدون وقفه را تضمین کند.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۹.۲.</strong> فرآیند دانلود و نصب بهروزرسانیها ممکن است نیازمند دسترسی ادمین (Administrator Privileges) باشد. در صورت بروز خطا در نصب، کاربر موظف است برنامه را با دسترسی ادمین اجرا کند.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۹.۳.</strong> لوکس هیچ مسئولیتی در قبال اختلال در فرآیند بهروزرسانی به دلیل مشکلات سیستمعامل کاربر، تداخل نرمافزاری یا قطع ناگهانی اینترنت ندارد.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۹.۴.</strong> در صورت بروز مشکل حاد در فرآیند بهروزرسانی، کاربر میتواند آخرین نسخه را از وبسایت رسمی لوکس دانلود و به صورت دستی نصب نماید.
 </p>
 </div>
 </section>

 {/* Section 10 */}
 <section className="space-y-3 border-b border-white/5 pb-8">
 <h3 className="text-lg font-black text-neon-blue border-r-4 border-neon-blue pr-3 mb-2">
 ماده ۱۰: قوانین متفرقه
 </h3>
 <div className="space-y-2 text-sm text-gray-300 pr-2">
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۱۰.۱.</strong> این قوانین تابع قوانین جمهوری اسلامی ایران هستند.
 </p>
 <p className="leading-relaxed font-sans">
 <strong className="text-white">۱۰.۲.</strong> در صورت بروز هرگونه اختلاف در تفسیر یا اجرای این قوانین، ابتدا تلاش خواهد شد تا از طریق مذاکره و توافق حل و فصل شود. در صورت عدم حصول نتیجه، مرجع قضایی صالح، دادگاههای عمومی و انقلاب محل استقرار شرکت یا تیم توسعه لوکس خواهد بود.
 </p>
 </div>
 </section>
 </main>
 
 <footer className="mt-8 text-center text-gray-400 font-sans border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-2">
 <p className="text-sm font-bold">با تشکر از همراهی شما با پلتفرم لوکس.</p>
 <div className="px-6 py-2 rounded-2xl bg-neon-blue/5 border border-neon-blue/20 text-xs font-black text-neon-blue uppercase">
 تیم توسعه لوکس
 </div>
 </footer>
 </NeonCard>
 </div>
 );
};

 return (
 <div className="flex min-h-[calc(100vh-64px)] pb-20 md:pb-0" dir={isRtl ? "rtl" : "ltr"}>
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 transition-all duration-300", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))}>
 <div className="container mx-auto max-w-5xl">
 <header className={cn("mb-10 text-center", isRtl ? "md:text-right" : "md:text-left")}>
 <h1 className="text-3xl md:text-4xl font-black text-white uppercase shadow-text-glow">
 {isRtl ? "تنظیمات" : "Settings"}
 </h1>
 <p className="text-xs md:text-sm text-gray-500 font-bold uppercase mt-1">
 {isRtl ? "حساب کاربری و اولویت‌های خود را شخصی‌سازی کنید" : "Customize your account and platform preferences"}
 </p>
 </header>

 <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
 {/* Sidebar Tabs */}
 <div className="lg:col-span-1 space-y-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 flex lg:flex-col gap-2 lg:gap-2">
 {tabs.map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as SettingsTab)}
 className={cn(
 "flex items-center gap-3 rounded-2xl px-5 py-4 text-xs font-black uppercase transition-all shrink-0 w-max lg:w-full",
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
 {activeTab === "elite" && renderElite()}
 {activeTab === "profile" && renderProfile()}
 {activeTab === "badges" && renderBadges()}
 {activeTab === "security" && renderSecurity()}
 {activeTab === "notifications" && renderNotifications()}
 {activeTab === "ui" && renderUI()}
 {activeTab === "region" && renderRegion()}
 {activeTab === "support" && renderSupport()}
 {activeTab === "rules" && renderRules()}
 </div>
 </div>
 </div>
 </main>
 </div>
 );
};
