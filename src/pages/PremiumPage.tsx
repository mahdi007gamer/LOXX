import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { 
 Check, Crown, Zap, Star, Shield, 
 MessageSquare, Users, Image as ImageIcon, Sparkles, 
 ArrowRight, Layout, CreditCard, Upload, 
 X, AlertCircle, Clock, CheckCircle2, 
 Copy, ExternalLink, RefreshCw,
 MessageCircle, Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { BankCard } from "../components/premium/BankCard";
import confetti from "canvas-confetti";
import { useLanguage } from "../context/LanguageContext";

type Step = "SELECT" | "PREVIEW" | "PAYMENT" | "STATUS";
type PlanType = "PLUS" | "VIP";

const PLAN_FEATURES = {
 PLUS: [
 { icon: <ImageIcon size={18} />, label: "Animated Avatar (GIF)", detail: "استفاده از گیف برای عکس پروفایل" },
 { icon: <Layout size={18} />, label: "Mini Profile Banner", detail: "بنر اختصاصی برای مینی پروفایل" },
 { icon: <MessageSquare size={18} />, label: "Exclusive Stickers", detail: "استکیرهای متحرک و خاص در چت" },
 { icon: <Sparkles size={18} />, label: "Special Reactions", detail: "ریاکشن‌های نئونی روی پیام‌ها" },
 { icon: <Users size={18} />, label: "Quick Invite", detail: "دعوت سریع تمام دوستان به لابی" },
 { icon: <Zap size={18} />, label: "Priority Lobbies", detail: "اولویت نمایش لابی در لیست" },
 { icon: <Shield size={18} />, label: "LOXX Plus Badge", detail: "نشان مخصوص پلاس کنار نام کاربر" },
 ],
 VIP: [
 { icon: <Shield size={18} />, label: "Elite Settings", detail: "دسترسی به تنظیمات نخبگان و شخصی‌سازی مینی‌پروفایل" },
 { icon: <Zap size={18} />, label: "Double XP Capacity", detail: "دو برابر شدن ظرفیت دریافت XP روزانه" },
 { icon: <MessageCircle size={18} />, label: "VIP Chat Groups", detail: "سیستم گروه‌های چت اختصاصی با مدیریت کامل" },
 { icon: <Award size={18} />, label: "Social Priority", detail: "اولویت نمایش در لیست دوستان و جستجو" },
 { icon: <Crown size={18} />, label: "Elite Lobbies", detail: "تم طلایی و کارت‌های ویژه در لابی‌ها" },
 { icon: <ImageIcon size={18} />, label: "Animated Profile", detail: "پشتیبانی از GIF برای آواتار و بنر پروفایل" },
 { icon: <Sparkles size={18} />, label: "All Plus features", detail: "شامل تمام امکانات نسخه پلاس" },
 ]
};

const PLAN_DATA = {
 PLUS: {
 name: "LOXX Plus",
 price: "199,000",
 color: "blue",
 tagline: "تجربه ارتقا یافته",
 theme: "from-neon-blue/20 to-transparent"
 },
 VIP: {
 name: "LOXX VIP",
 price: "599,000",
 color: "purple",
 tagline: "سطح نخبگان لوکس",
 theme: "from-neon-purple/20 to-transparent"
 }
};

export const PremiumPage = () => {
 const { user, isSidebarCollapsed } = useAuth();
 const navigate = useNavigate();
 const { language, t } = useLanguage();
 const isRtl = language === "fa";
 const [step, setStep] = useState<Step>("SELECT");
 const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
 const [pendingPayment, setPendingPayment] = useState<any>(null);
 const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [receiptFile, setReceiptFile] = useState<File | null>(null);
 const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
 const [promoCode, setPromoCode] = useState("");
 const [promoDiscount, setPromoDiscount] = useState<number>(0);
 const [promoMessage, setPromoMessage] = useState("");
 const [promoError, setPromoError] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

 useEffect(() => {
 fetchPaymentStatus();
 return () => {
 if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
 };
 }, []);

 const fetchPaymentStatus = async () => {
 try {
 const { data } = await api.get("/payments/status");
 if (data.status === "success" && data.data) {
 setPendingPayment(data.data);
 setPaymentStatus(data.data.status);
 
 if (data.data.status === "PENDING") {
 setStep("STATUS");
 startPolling();
 }
 }
 } catch (err) {
 console.error("Failed to fetch payment status", err);
 } finally {
 setLoading(false);
 }
 };

 const startPolling = () => {
 if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
 pollingIntervalRef.current = setInterval(async () => {
 try {
 const { data } = await api.get("/payments/status");
 if (data.status === "success" && data.data) {
 if (data.data.status !== paymentStatus) {
 setPaymentStatus(data.data.status);
 if (data.data.status === "APPROVED") {
 handleSuccessEffect();
 setPendingPayment(data.data);
 clearInterval(pollingIntervalRef.current!);
 } else if (data.data.status === "REJECTED") {
 toast.error("پرداخت شما تایید نشد. لطفاً مجدداً تلاش کنید.");
 setPendingPayment(data.data);
 clearInterval(pollingIntervalRef.current!);
 }
 }
 }
 } catch (err) {
 console.error("Polling error", err);
 }
 }, 5000);
 };

 const handleSuccessEffect = () => {
 // Center blast
 confetti({
 particleCount: 150,
 spread: 70,
 origin: { y: 0.6 },
 colors: ["#22c55e", "#4ade80", "#16a34a", "#ffffff"]
 });
 
 // Side cannons for "Cooler" effect
 const duration = 3 * 1000;
 const end = Date.now() + duration;

 const frame = () => {
 confetti({
 particleCount: 2,
 angle: 60,
 spread: 55,
 origin: { x: 0 },
 colors: ["#22c55e", "#4ade80"]
 });
 confetti({
 particleCount: 2,
 angle: 120,
 spread: 55,
 origin: { x: 1 },
 colors: ["#22c55e", "#4ade80"]
 });

 if (Date.now() < end) {
 requestAnimationFrame(frame);
 }
 };
 frame();
 };

 const handleSelectPlan = (plan: PlanType) => {
 setSelectedPlan(plan);
 setStep("PREVIEW");
 };

 const handleCancelPayment = async () => {
 if (!confirm("آیا از لغو درخواست پرداخت اطمینان دارید؟")) return;
 
 try {
 setSubmitting(true);
 await api.post("/payments/cancel");
 if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
 setPendingPayment(null);
 setPaymentStatus(null);
 setStep("SELECT");
 toast.success("درخواست با موفقیت لغو شد");
 } catch (err) {
 toast.error("خطا در لغو درخواست");
 } finally {
 setSubmitting(false);
 }
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 if (file.size > 3 * 1024 * 1024) {
 toast.error("حجم فایل نباید بیشتر از ۳ مگابایت باشد");
 return;
 }
 setReceiptFile(file);
 const reader = new FileReader();
 reader.onloadend = () => {
 setReceiptPreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 useEffect(() => {
 const timer = setTimeout(async () => {
 if (promoCode.trim().length >= 3) {
 try {
 const res = await api.post("/payments/verify-promo", { code: promoCode });
 if (res.data.status === "success") {
 setPromoDiscount(res.data.data.discountPercent);
 setPromoMessage(res.data.data.message);
 setPromoError(false);
 }
 } catch (err: any) {
 setPromoDiscount(0);
 setPromoMessage("کد تخفیف نامعتبر است");
 setPromoError(true);
 }
 } else {
 setPromoDiscount(0);
 setPromoMessage("");
 setPromoError(false);
 }
 }, 500);
 return () => clearTimeout(timer);
 }, [promoCode]);

 const handleSubmitPayment = async () => {
 if (!receiptFile || !selectedPlan) {
 toast.error("لطفاً تصویر رسید را بارگذاری کنید");
 return;
 }

 try {
 setSubmitting(true);
 
 // 1. Upload receipt to private authorized endpoint
 const formData = new FormData();
 formData.append("file", receiptFile);
 
 const uploadRes = await api.post("/upload/receipt", formData, {
 headers: {
 "Content-Type": "multipart/form-data"
 }
 });

 if (!uploadRes.data.url) {
 throw new Error("خطا در آپلود تصویر رسید");
 }

 // 2. Create payment request with the private URL
 const response = await api.post("/payments/create", {
 type: selectedPlan,
 receiptImageUrl: uploadRes.data.url,
 promoCode: promoDiscount > 0 ? promoCode : undefined
 });

 if (response.data.status === "success") {
 setPendingPayment(response.data.data);
 setPaymentStatus("PENDING");
 setStep("STATUS");
 startPolling();
 toast.success("رسید با موفقیت ثبت شد");
 }
 } catch (err: any) {
 toast.error(err.response?.data?.message || "خطا در ثبت رسید");
 } finally {
 setSubmitting(false);
 }
 };

 if (loading) {
 return (
 <div className="flex min-h-screen bg-[#050507] items-center justify-center">
 <RefreshCw className="animate-spin text-neon-blue" size={32} />
 </div>
 );
 }

 return (
 <div className="flex min-h-[calc(100vh-64px)] bg-[#050507]">
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-32 md:pb-8 transition-all duration-300", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))} dir={isRtl ? "rtl" : "ltr"}>
 <div className="container mx-auto max-w-6xl">
 <AnimatePresence mode="wait">
 {step === "SELECT" ? (
 <motion.div
 key="select"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 >
 <header className="mb-16 text-center">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[10px] font-black uppercase mb-6 "
 >
 <Sparkles size={14} className="animate-pulse" />
 {isRtl ? "تجربه نسل جدید گیمینگ" : "Next Gen Gaming Experience"}
 </motion.div>
 <h1 className="text-4xl md:text-7xl font-black text-white uppercase mb-4">
 {isRtl ? "ارتقای سطح کاربری" : "Upgrade Membership"}
 </h1>
 <p className="text-gray-500 max-w-2xl mx-auto font-bold text-center">
 {isRtl 
 ? "برای حمایت از لوکس و باز کردن قابلیت‌های استثنایی، یکی از اشتراک‌های ویژه را انتخاب کنید."
 : "Support LOXX and unlock pristine, elite features by selecting one of our premium offerings."} <br/>
 <span className="text-[10px] text-neon-blue font-black uppercase tracking-[0.3em] mt-3 block opacity-60">Elevate Your Loxx Experience</span>
 </p>
 </header>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start mb-20">
 {/* PLUS CARD */}
 <NeonCard variant="blue" className="p-8 md:p-12 bg-dark-card/50 backdrop-blur-2xl border-white/5 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
 <Zap size={200} className="rotate-12" />
 </div>
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className={isRtl ? "text-right" : "text-left"}>
 <h2 className="text-3xl font-black text-white uppercase ">LOXX PLUS</h2>
 <p className="text-neon-blue font-bold uppercase text-xs ">
 {isRtl ? "تجربه ارتقا یافته" : "Upgraded Experience"}
 </p>
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <span className="text-2xl font-black text-white ">{PLAN_DATA.PLUS.price}</span>
 <span className="text-gray-500 text-[10px] font-bold block uppercase">
 {isRtl ? "تومان / ماه" : "Toman / Month"}
 </span>
 </div>
 </div>
 <div className="space-y-4 mb-10 relative z-10">
 {PLAN_FEATURES.PLUS.map((feat, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.05 }}
 className={cn("flex gap-4 items-center group/item hover:translate-x-1 transition-transform", isRtl ? "flex-row" : "flex-row-reverse justify-end")}
 >
 <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0 transition-all group-hover/item:scale-110 group-hover/item:rotate-6 group-hover/item:bg-neon-blue/20 shadow-neon-blue/0 group-hover/item:shadow-neon-blue/20 shadow-lg">
 {feat.icon}
 </div>
 <div className={cn("flex flex-col", isRtl ? "text-right" : "text-left")}>
 <p className="text-[12px] font-black text-white uppercase leading-none mb-1 group-hover/item:text-neon-blue transition-colors">{feat.label}</p>
 <p className="text-[10px] text-gray-500 font-bold leading-none">
 {isRtl ? feat.detail : feat.label}
 </p>
 </div>
 </motion.div>
 ))}
 </div>
 <GlowButton onClick={() => handleSelectPlan("PLUS")} variant="blue" className="w-full py-5 text-sm font-black uppercase ">
 {isRtl ? "دریافت پلاس" : "GET PLUS"} <ArrowRight size={18} className="mr-2 inline" />
 </GlowButton>
 </NeonCard>

 {/* VIP CARD */}
 <NeonCard variant="purple" className="p-8 md:p-12 bg-[#12051a]/50 backdrop-blur-2xl border-yellow-400/20 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
 <Crown size={200} className="rotate-12" />
 </div>
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className={isRtl ? "text-right" : "text-left"}>
 <h2 className="text-3xl font-black text-white uppercase ">LOXX VIP</h2>
 <p className="text-yellow-400 font-bold uppercase text-xs ">
 {isRtl ? "سطح نخبگان لوکس" : "Elite Tier Lounge"}
 </p>
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <span className="text-2xl font-black text-white ">{PLAN_DATA.VIP.price}</span>
 <span className="text-gray-500 text-[10px] font-bold block uppercase">
 {isRtl ? "تومان / ماه" : "Toman / Month"}
 </span>
 </div>
 </div>
 <div className="space-y-4 mb-10 relative z-10">
 {PLAN_FEATURES.VIP.map((feat, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.05 }}
 className={cn("flex gap-4 items-center group/item hover:translate-x-1 transition-transform", isRtl ? "flex-row" : "flex-row-reverse justify-end")}
 >
 <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 shrink-0 transition-all group-hover/item:scale-110 group-hover/item:rotate-6 group-hover/item:bg-yellow-400/20 shadow-yellow-400/0 group-hover/item:shadow-yellow-400/20 shadow-lg">
 {feat.icon}
 </div>
 <div className={cn("flex flex-col", isRtl ? "text-right" : "text-left")}>
 <p className="text-[12px] font-black text-white uppercase leading-none mb-1 group-hover/item:text-yellow-400 transition-colors">{feat.label}</p>
 <p className="text-[10px] text-gray-500 font-bold leading-none">
 {isRtl ? feat.detail : feat.label}
 </p>
 </div>
 </motion.div>
 ))}
 </div>
 <GlowButton onClick={() => handleSelectPlan("VIP")} variant="pink" className="w-full py-5 text-sm font-black uppercase bg-gradient-to-r from-neon-purple to-neon-pink">
 {isRtl ? "دریافت VIP" : "GET VIP"} <Crown size={18} className="mr-2 inline" />
 </GlowButton>
 </NeonCard>
 </div>
 </motion.div>
 ) : null}

 {step === "PREVIEW" && selectedPlan ? (
 <motion.div
 key="preview"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 1.05 }}
 className="max-w-4xl mx-auto"
 >
 <button onClick={() => setStep("SELECT")} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold uppercase text-xs ">
 <X size={16} /> {isRtl ? "بازگشت به انتخاب طرح" : "Back to Plans Selection"}
 </button>
 
 <NeonCard 
 variant={PLAN_DATA[selectedPlan].color as any} 
 className={cn("p-8 md:p-16 relative overflow-hidden", PLAN_DATA[selectedPlan].theme)}
 >
 {/* Backdrop flair */}
 <div className="absolute -top-24 -right-24 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl" />
 <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl" />

 <div className="text-center mb-12 relative z-10">
 <motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ type: "spring", damping: 12 }}
 className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 mb-6 text-white"
 >
 {selectedPlan === "VIP" ? <Crown size={40} className="text-yellow-400" /> : <Zap size={40} className="text-neon-blue" />}
 </motion.div>
 <h2 className="text-4xl md:text-6xl font-black text-white uppercase mb-4">
 {PLAN_DATA[selectedPlan].name}
 </h2>
 <p className={cn("font-bold uppercase animate-pulse", 
 selectedPlan === "VIP" ? "text-yellow-400" : "text-neon-blue"
 )}>
 {selectedPlan === "PLUS" 
 ? (isRtl ? "شما در حال خرید نسخه ارتقا یافته هستید" : "YOU ARE ORDERING LOXX PLUS UPGRADE") 
 : (isRtl ? "شما در حال خرید نسخه نخبگان هستید" : "YOU ARE ORDERING LOXX VIP ELITE")}
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16 relative z-10">
 {PLAN_FEATURES[selectedPlan].map((feat, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: i * 0.03 }}
 className="flex gap-5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg relative z-10", 
 selectedPlan === "VIP" ? "bg-yellow-400/20 text-yellow-400 shadow-yellow-400/10" : "bg-neon-blue/20 text-neon-blue shadow-neon-blue/10"
 )}>
 {React.cloneElement(feat.icon as React.ReactElement, { size: 24 })}
 </div>
 <div className="relative z-10">
 <h4 className="text-white font-black uppercase text-base mb-0.5">{feat.label}</h4>
 <p className="text-xs text-gray-400 font-bold leading-tight">{feat.detail}</p>
 </div>
 </motion.div>
 ))}
 </div>

 <GlowButton 
 onClick={() => setStep("PAYMENT")}
 variant={selectedPlan === "VIP" ? "gold" : "blue"} 
 className="w-full py-6 text-lg font-black uppercase relative z-10"
 >
 {isRtl ? "ادامه به مرحله پرداخت" : "CONTINUE TO PAYMENT"} <CreditCard size={20} className="mr-2 inline" />
 </GlowButton>
 </NeonCard>
 </motion.div>
 ) : null}

 {step === "PAYMENT" && selectedPlan ? (
 <motion.div
 key="payment"
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -50 }}
 className="max-w-4xl mx-auto"
 >
 <button onClick={() => setStep("PREVIEW")} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold uppercase text-xs ">
 <X size={16} /> {isRtl ? "بازگشت به پیش‌نمایش" : "Back to Preview"}
 </button>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center justify-center">
 <div className="space-y-8 flex flex-col items-center lg:items-end w-full">
 <div className="text-center lg:text-right w-full">
 <h2 className="text-3xl font-black text-white uppercase mb-2">{isRtl ? "اطلاعات پرداخت" : "Payment Details"}</h2>
 <p className="text-gray-500 font-bold text-sm ">{isRtl ? "لطفاً مبلغ را کارت‌به‌کارت کنید و تصویر رسید را بارگذاری نمایید." : "Please transfer the amount via Card-to-Card and upload your receipt snapshot."}</p>
 </div>

 <div className="w-full max-w-lg space-y-6">
 <BankCard 
 cardNumber="6063-7311-8109-6737"
 cardHolder={isRtl ? "مهدی دلال زاده احمدی" : "Mehdi DalalZadeh Ahmadi"}
 />

 <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 space-y-5 shadow-2xl backdrop-blur-md">
 <div className="flex justify-between items-center">
 <span className="text-gray-500 font-black uppercase text-[10px] leading-none">{isRtl ? "نوع اشتراک" : "PLAN TYPE"}</span>
 <span className={cn(
 "text-[10px] font-black px-4 py-1.5 rounded-full uppercase ",
 selectedPlan === "VIP" 
 ? "bg-yellow-400 text-dark-bg" 
 : "bg-neon-blue text-dark-bg"
 )}>
 {selectedPlan === "VIP" ? "LOXX ELITE (VIP)" : "LOXX PLUS"}
 </span>
 </div>
 <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border-2 border-dashed border-white/10 relative overflow-hidden">
 <span className="text-gray-500 font-black uppercase text-[10px] relative z-10">{isRtl ? "مشخصات کد تخفیف" : "PROMOCODE"}</span>
 <div className="flex flex-col items-end w-1/2 relative z-10">
 <input
 type="text"
 placeholder={isRtl ? "کد تخفیف (الزاماً با حروف بزرگ)" : "COUPON CODE (UPPERCASE)"}
 value={promoCode}
 onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
 className={cn(
 "w-full bg-white/5 border rounded-xl px-4 py-2 text-sm text-white font-mono text-left focus:outline-none transition-colors",
 promoError ? "border-red-500/50" : promoDiscount > 0 ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 focus:border-neon-blue/50"
 )}
 dir="ltr"
 />
 {promoMessage && (
 <span className={cn("text-[9px] font-bold mt-2", promoError ? "text-red-400" : "text-purple-400 animate-pulse")}>
 {promoMessage}
 </span>
 )}
 </div>
 {promoDiscount > 0 && (
 <div className="absolute inset-0 bg-purple-500/10 animate-pulse-slow"></div>
 )}
 </div>
 
 <div className="flex justify-between items-center mt-4">
 <span className="text-gray-500 font-black uppercase text-[10px] ">{isRtl ? "مبلغ نهایی" : "FINAL AMOUNT"}</span>
 <div className="flex flex-col items-end">
 <span className={cn(
 "font-black text-2xl ",
 selectedPlan === "VIP" ? "text-yellow-400" : "text-neon-blue"
 )}>
 {promoDiscount > 0 
 ? (parseInt(PLAN_DATA[selectedPlan].price.replace(/,/g, '')) * (1 - promoDiscount / 100)).toLocaleString()
 : PLAN_DATA[selectedPlan].price} <span className="text-[10px]">{isRtl ? "تومان" : "Toman"}</span>
 </span>
 {promoDiscount > 0 ? (
 <span className="text-[9px] text-purple-400 font-bold animate-pulse mt-1">{isRtl ? `تخفیف ${promoDiscount}% اعمال شد` : `Discount ${promoDiscount}% Applied`}</span>
 ) : (
 <span className="text-[9px] text-gray-600 font-bold mt-1 line-through">{PLAN_DATA[selectedPlan].price}</span>
 )}
 </div>
 </div>
 
 <div className="pt-5 border-t border-white/5 space-y-3">
 <div className="flex flex-col gap-2">
 <p className="text-[10px] text-gray-400 font-black uppercase text-right">{isRtl ? "کپی شماره کارت سریع:" : "QUICK CARD COPY:"}</p>
 <div 
 className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 group/copy transition-all"
 onClick={() => {
 navigator.clipboard.writeText("6063731181096737");
 toast.success(isRtl ? "شماره کارت کپی شد" : "Card number copied successfully");
 }}
 >
 <Copy size={18} className="text-neon-blue group-hover/copy:scale-110 transition-transform" />
 <span className="text-white font-mono font-black tracking-[0.15em] text-sm md:text-base">6063-7311-8109-6737</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <h4 className="text-white font-black uppercase ">{isRtl ? "آپلود تصویر رسید" : "Upload Receipt Snapshot"}</h4>
 
 <div 
 onClick={() => fileInputRef.current?.click()}
 className={cn(
 "relative aspect-square rounded-[40px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden group",
 receiptPreview ? "border-neon-blue/40" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
 )}
 >
 {receiptPreview ? (
 <>
 <img src={receiptPreview} className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <p className="text-white font-black uppercase text-xs">{isRtl ? "تغییر تصویر" : "Change Image"}</p>
 </div>
 </>
 ) : (
 <>
 <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-neon-blue transition-colors">
 <Upload size={32} />
 </div>
 <div className="text-center">
 <p className="text-white font-black uppercase text-sm">{isRtl ? "انتخاب عکس رسید" : "Select Receipt Snapshot"}</p>
 <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase ">Maximum size 3MB</p>
 </div>
 </>
 )}
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileChange} 
 accept="image/*" 
 className="hidden" 
 />
 </div>

 <GlowButton 
 onClick={handleSubmitPayment}
 disabled={!receiptFile || submitting}
 variant="blue" 
 className="w-full py-5 text-sm font-black uppercase "
 >
 {submitting ? (isRtl ? "در حال ارسال..." : "SUBMITTING...") : (isRtl ? "ارسال برای تایید" : "SUBMIT PAYMENT FOR APPROVAL")} <Check size={18} className="mr-2 inline" />
 </GlowButton>
 
 <p className="text-[9px] text-gray-600 font-bold uppercase text-center leading-relaxed">
 {isRtl ? "با زدن دکمه ارسال، شما تایید می‌کنید که مبلغ را به درستی واریز کرده‌اید. فعال‌سازی بین ۱ تا ۱۵ دقیقه زمان می‌برد." : "By clicking submit, you verify the funds are fully transferred. Activations take between 1 to 15 minutes."}
 </p>
 </div>
 </div>
 </motion.div>
 ) : null}

 {step === "STATUS" && pendingPayment ? (
 <motion.div
 key="status"
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 1.1 }}
 className="max-w-2xl mx-auto"
 >
 <NeonCard 
 variant={paymentStatus === "APPROVED" ? "green" : (pendingPayment.type === "VIP" ? "purple" : "blue")}
 className={cn(
 "p-12 text-center relative overflow-hidden transition-all duration-1000",
 paymentStatus === "APPROVED" ? "bg-green-500/10 border-green-500/40 shadow-[0_0_100px_rgba(34,197,94,0.2)]" : "bg-dark-card/50"
 )}
 >
 {/* The neon bar at top */}
 <div className={cn(
 "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-current to-transparent animate-shimmer z-50",
 paymentStatus === "APPROVED" ? "text-green-500 shadow-[0_0_15px_rgba(34,197,94,1)]" : "text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.5)]"
 )} />
 
 {/* Adjusted icon positioning: more margin-top and higher z-index */}
 <div className="relative mt-20 mb-10 flex justify-center z-40">
 <div className={cn(
 "h-32 w-32 rounded-[40px] bg-white/5 flex items-center justify-center relative shadow-2xl backdrop-blur-xl border border-white/10",
 )}>
 {paymentStatus === "APPROVED" ? (
 <div className="relative z-50">
 <CheckCircle2 size={72} className="text-green-400 animate-bounce" />
 <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full scale-150 -z-10" />
 </div>
 ) : paymentStatus === "REJECTED" ? (
 <AlertCircle size={72} className="text-red-500 z-50" />
 ) : (
 <Clock size={72} className="text-neon-blue animate-pulse z-50" />
 )}
 
 {/* Animated Pings */}
 <div className={cn(
 "absolute inset-[-20px] rounded-[50px] border-2 opacity-20 animate-ping z-0",
 paymentStatus === "APPROVED" ? "border-green-500" : "border-neon-blue"
 )} />
 <div className={cn(
 "absolute inset-[-40px] rounded-[60px] border opacity-10 animate-pulse z-0",
 paymentStatus === "APPROVED" ? "border-green-500" : "border-neon-blue"
 )} />
 </div>
 </div>

 <h2 className={cn(
 "text-4xl font-black uppercase mb-4 transition-colors duration-500",
 paymentStatus === "APPROVED" ? "text-green-400" : "text-white"
 )}>
 {paymentStatus === "APPROVED" ? (isRtl ? "تبریک! اشتراک فعال شد" : "CONGRATULATIONS! PREMIUM ACTIVATED") : 
 paymentStatus === "REJECTED" ? (isRtl ? "خطا در تایید تراکنش" : "TRANSACTION REJECTED") : 
 (isRtl ? "در انتظار تأیید" : "PENDING APPROVAL")}
 </h2>
 
 <p className="text-gray-400 font-bold text-sm mb-8 leading-relaxed max-w-sm mx-auto">
 {paymentStatus === "APPROVED" ? (isRtl ? "پرداخت شما تایید شد و تمامی امکانات ویژه برای شما باز شده است. از تجربه لوکس لذت ببرید!" : "Your payment has been successfully confirmed and all elite advantages are active. Enjoy LOXX!") : 
 paymentStatus === "REJECTED" ? (isRtl ? "متاسفانه رسید شما مورد تایید قرار نگرفت. ممکن است تصویر ناخوانا باشد یا تراکنش ثبت نشده باشد." : "Apologies, your receipt snapshot was rejected by the auditing console. Please try submitting again.") :
 (isRtl ? "رسید شما با موفقیت دریافت شد و در صف بررسی قرار گرفت. تا دقایقی دیگر اشتراک شما فعال خواهد شد." : "Receipt received successfully and put in admin verification queue. Your profile will upgrade in a few moments.")}
 </p>

 <div className="flex flex-col gap-4">
 <div className={cn("p-4 rounded-3xl bg-white/5 border border-white/5 flex justify-between items-center", isRtl ? "text-right flex-row" : "text-left flex-row-reverse")}>
 <div>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? "تاریخ ثبت" : "REGISTRATION DATE"}</p>
 <p className="text-white font-black text-sm">{new Date(pendingPayment.createdAt).toLocaleString(isRtl ? "fa-IR" : "en-US")}</p>
 </div>
 <div>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{isRtl ? "کد پیگیری" : "TRACKING ID"}</p>
 <p className="text-white font-black text-sm">#{pendingPayment.id.slice(0, 8).toUpperCase()}</p>
 </div>
 </div>

 {paymentStatus === "APPROVED" ? (
 <GlowButton variant="blue" onClick={() => navigate("/")} className="w-full py-5">
 {isRtl ? "ورود به پنل کاربری" : "GO TO MAIN PANEL"} <ArrowRight size={18} className="mr-2 inline" />
 </GlowButton>
 ) : paymentStatus === "REJECTED" ? (
 <GlowButton onClick={() => setStep("SELECT")} variant="secondary" className="w-full py-5">
 {isRtl ? "تلاش دوباره" : "TRY AGAIN"} <RefreshCw size={18} className="mr-2 inline" />
 </GlowButton>
 ) : (
 <GlowButton 
 onClick={handleCancelPayment}
 disabled={submitting}
 className="w-full py-4 text-xs font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
 >
 {submitting ? (isRtl ? "در حال لغو..." : "CANCELLING...") : (isRtl ? "لغو درخواست پرداخت" : "CANCEL PAYMENT REQUEST")} <X size={16} className="mr-2 inline" />
 </GlowButton>
 )}
 </div>
 </NeonCard>
 </motion.div>
 ) : null}
 </AnimatePresence>

 <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
 <div className="h-12 w-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue mx-auto mb-4">
 <Shield size={24} />
 </div>
 <h4 className="text-white font-black uppercase mb-2">{isRtl ? "پرداخت امن" : "SECURE PAYMENT"}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{isRtl ? "تراکنش‌ها توسط ادمین تایید و بررسی می‌شوند." : "All transactions are reviewed and verified by administrators."}</p>
 </div>
 <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
 <div className="h-12 w-12 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink mx-auto mb-4">
 <Clock size={24} />
 </div>
 <h4 className="text-white font-black uppercase mb-2">{isRtl ? "تایید سریع" : "FAST APPROVAL"}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{isRtl ? "فعال‌سازی اشتراک در کمتر از ۱۵ دقیقه." : "Rapid activation in less than 15 minutes."}</p>
 </div>
 <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
 <div className="h-12 w-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple mx-auto mb-4">
 <Users size={24} />
 </div>
 <h4 className="text-white font-black uppercase mb-2">{isRtl ? "حمایت از پلتفرم" : "SUPPORT PLATFORM"}</h4>
 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{isRtl ? "با خرید پلاس به توسعه لوکس کمک می‌کنید." : "By purchasing, you directly power LOXX future developments."}</p>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
};
