import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonCard } from "../components/ui/NeonCard";
import { Input } from "../components/ui/Input";
import { GlowButton } from "../components/ui/GlowButton";
import { Gamepad2, MessageCircle, Lock, User, ArrowRight, Loader2, Users, Phone, ArrowLeft, ShieldCheck, KeyRound, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";

type AuthStep = "AUTH" | "FORGOT_PASSWORD" | "RESET_PASSWORD" | "VERIFY_2FA" | "VERIFY_SMS";

export const AuthPage = () => {
 const [isLogin, setIsLogin] = useState(true);
 const [loading, setLoading] = useState(false);
 const [step, setStep] = useState<AuthStep>("AUTH");
 const [tempUserId, setTempUserId] = useState<string | null>(null);
 const [verificationToken, setVerificationToken] = useState<string | null>(null);
 const [verificationCode, setVerificationCode] = useState("");
 const [statusToken, setStatusToken] = useState<string | null>(null);
 const [acceptedTerms, setAcceptedTerms] = useState(true);
 const [formData, setFormData] = useState({
 username: "",
 phone: "",
 password: "",
 referralCode: "",
 referralUsername: "",
 otpCode: "",
 newPassword: "",
 twoFactorCode: ""
 });
 const [forgotIdentifier, setForgotIdentifier] = useState("");
 const [resendTimer, setResendTimer] = useState(120);

 const navigate = useNavigate();
 const { login, user } = useAuth();

 React.useEffect(() => {
 let interval: any;
 if ((step === "VERIFY_SMS" || step === "VERIFY_2FA" || step === "RESET_PASSWORD") && resendTimer > 0) {
 interval = setInterval(() => {
 setResendTimer(prev => prev - 1);
 }, 1000);
 }
 return () => clearInterval(interval);
 }, [step, resendTimer]);

 const handleResendSMS = async () => {
 try {
 setLoading(true);
 if (step === "VERIFY_SMS") {
 await api.post("/auth/resend-verification", { phone: formData.phone });
 toast.success("کد تایید پیامکی مجدداً ارسال شد");
 } else if (step === "VERIFY_2FA") {
 toast.success("جهت ارسال مجدد کد امنیتی، مجدداً فرم ورود را تکمیل فرمایید");
 } else if (step === "RESET_PASSWORD") {
 await api.post("/auth/forgot-password", { phone: forgotIdentifier });
 toast.success("کد بازیابی مجدداً ارسال شد");
 }
 setResendTimer(120);
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || "خطا در ارسال مجدد کد");
 } finally {
 setLoading(false);
 }
 };

 React.useEffect(() => {
 if (user) {
 const code = localStorage.getItem("pending_invite_code");
 if (code) {
 localStorage.removeItem("pending_invite_code");
 navigate("/invite/" + code);
 } else {
 navigate("/dashboard");
 }
 }
 }, [user, navigate]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);

 try {
 if (step === "AUTH") {
 if (isLogin) {
 try {
 const response = await api.post("/auth/login", {
 phone: formData.phone,
 password: formData.password
 });
 
 if (response.data.status === "2fa_required") {
 setTempUserId(response.data.userId);
 setStep("VERIFY_2FA");
 toast.success("کد تایید دو مرحله‌ای به همراه شما پیامک شد");
 return;
 }

 login(response.data.token, response.data.user);
 toast.success("خوش آمدید!");
 } catch (err: any) {
 if (err.response?.data?.error?.code === "VERIFICATION_REQUIRED" || err.response?.data?.message === "VERIFICATION_REQUIRED") {
 setStep("VERIFY_SMS");
 toast.error("حساب شما هنوز تایید نشده است. یک کد تایید برای شماره شما پیامک شد.");
 } else {
 toast.error(err.response?.data?.error?.message || "شماره همراه یا رمز عبور اشتباه است");
 }
 }
 } else {
 try {
 const registerResponse = await api.post("/auth/register", {
 username: formData.username,
 phone: formData.phone,
 password: formData.password,
 referralCode: formData.referralCode || undefined,
 referralUsername: formData.referralUsername || undefined
 });
 
 setVerificationToken(registerResponse.data.user.verificationToken);
 setStep("VERIFY_SMS");
 toast.success("ثبت‌نام با موفقیت انجام شد. کد تایید پیامکی را وارد کنید.");
 } catch (err: any) {
 toast.error(err.response?.data?.error?.message || err.response?.data?.message || "خطا در ثبت‌نام. لطفاً مجدداً تلاش کنید.");
 }
 }
 } else if (step === "VERIFY_SMS") {
 const response = await api.post("/auth/verify-signup", {
 phone: formData.phone,
 code: verificationCode
 });
 login(response.data.token, response.data.user);
 toast.success("ثبت نام و فعالسازی حساب کاربری موفقیت آمیز بود!");
 navigate("/dashboard");
 } else if (step === "VERIFY_2FA") {
 const response = await api.post("/auth/verify-2fa", {
 userId: tempUserId,
 code: formData.twoFactorCode
 });
 login(response.data.token, response.data.user);
 toast.success("خوش آمدید!");
 } else if (step === "FORGOT_PASSWORD") {
 await api.post("/auth/forgot-password", {
 phone: forgotIdentifier
 });
 toast.success("کد بازیابی ارسال شد");
 setStep("RESET_PASSWORD");
 } else if (step === "RESET_PASSWORD") {
 await api.post("/auth/reset-password", {
 phone: forgotIdentifier,
 code: formData.otpCode,
 newPassword: formData.newPassword
 });
 toast.success("رمز عبور با موفقیت تغییر کرد. وارد شوید.");
 setStep("AUTH");
 setIsLogin(true);
 }
 } catch (error: any) {
 const message = error.response?.data?.error?.message || error.response?.data?.message || "خطایی رخ داد";
 toast.error(message);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
 <div className="relative w-full max-w-md">
 <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-neon-blue/10 blur-[80px]" />
 <div className="absolute -bottom-20 -right-20 -z-10 h-64 w-64 rounded-full bg-neon-pink/10 blur-[80px]" />

 <NeonCard variant={isLogin ? "blue" : "pink"} className="transition-colors duration-500">
 <AnimatePresence mode="wait">
 <motion.div
 key={step === "AUTH" ? (isLogin ? "login" : "signup") : step}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.3 }}
 >
 <div className="mb-8 text-center">
 <motion.div 
 className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white/5 shadow-neon transition-colors ${isLogin ? 'border-neon-blue/50 text-neon-blue' : 'border-neon-pink/50 text-neon-pink'}`}
 >
 <img src="/logo.png" alt="LOXX" className="h-10 w-auto" />
 </motion.div>
 
 {step === "AUTH" && (
 <>
 <h2 className="text-2xl font-black text-white uppercase ">
 {isLogin ? "ورود پادشاهی" : "عضویت در لوکس"}
 </h2>
 <p className="mt-2 text-xs text-gray-500 font-bold uppercase ">
 {isLogin 
 ? "آماده نبردهای سهمگین هستید؟" 
 : "به جمع برترین گیمرهای ایران بپیوندید"}
 </p>
 </>
 )}

 {step === "VERIFY_SMS" && (
 <>
 <h2 className="text-2xl font-black text-white uppercase ">تایید شماره همراه</h2>
 <p className="mt-2 text-xs text-gray-500 font-bold uppercase ">لطفاً کد تایید پیامک شده را وارد کنید</p>
 </>
 )}
 {step === "VERIFY_2FA" && (
 <>
 <h2 className="text-2xl font-black text-white uppercase ">امنیت دو مرحله‌ای</h2>
 <p className="mt-2 text-xs text-gray-500 font-bold uppercase leading-relaxed">
 کد تایید امنیتی به شماره همراه شما پیامک شد.<br />
 لطفاً آن را در زیر وارد کنید.
 </p>
 </>
 )}
 </div>

 <form className="space-y-4" onSubmit={handleSubmit}>
 {step === "AUTH" && (
 <>
 <AnimatePresence mode="popLayout">
 {!isLogin && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="space-y-4"
 >
 <Input 
 label="نام کاربری" 
 placeholder="Gamer_Elite" 
 name="username"
 value={formData.username}
 onChange={handleInputChange}
 icon={<User size={18} />} 
 required={!isLogin}
 />
 </motion.div>
 )}
 </AnimatePresence>
 
 <Input 
 label="شماره همراه" 
 type="tel"
 name="phone"
 placeholder="0912xxxxxxx" 
 value={formData.phone}
 onChange={handleInputChange}
 icon={<Phone size={18} />} 
 required
 />
 <Input 
 label="رمز عبور" 
 type="password" 
 name="password"
 placeholder="••••••••" 
 value={formData.password}
 onChange={handleInputChange}
 icon={<Lock size={18} />} 
 required
 />
 
 {!isLogin && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="p-4 rounded-2xl bg-neon-pink/5 border border-neon-pink/20 shadow-lg shadow-neon-pink/5 relative overflow-hidden text-right"
 dir="rtl"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-neon-pink/10 rounded-full blur-2xl pointer-events-none" />
 <Input 
 label="نام کاربری معرف (اختیاری)" 
 placeholder="مثال: lo_coder" 
 name="referralUsername"
 value={formData.referralUsername}
 onChange={handleInputChange}
 icon={<Users size={18} />} 
 />
 <div className="mt-2.5 flex items-start gap-1.5 text-[10px] text-gray-300 font-sans leading-relaxed">
 <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-neon-pink shrink-0" />
 <span>با وارد کردن نام کاربری دوستتان، هر دو نفر شما <strong className="text-neon-pink">۳ روز اشتراک VIP رایگان</strong> به عنوان هدیه دریافت خواهید کرد! ✨</span>
 </div>
 </motion.div>
 )}
 
 {!isLogin && (
 <div className="flex items-start gap-3 mt-3 bg-white/[0.01] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.02]">
 <input 
 type="checkbox"
 id="acceptTermsCheckbox"
 checked={acceptedTerms}
 onChange={(e) => setAcceptedTerms(e.target.checked)}
 className="h-5 w-5 rounded border-white/10 bg-black/40 text-neon-pink focus:ring-0 cursor-pointer accent-neon-pink shrink-0 mt-0.5"
 />
 <label htmlFor="acceptTermsCheckbox" className="text-xs text-gray-300 select-none cursor-pointer leading-relaxed text-right">
 من همه <Link to="/terms" target="_blank" className="text-neon-pink hover:underline font-black">قوانین و مقررات</Link> لوکس را مطالعه کرده و قبول دارم.
 </label>
 </div>
 )}

 {isLogin && (
 <div className="flex justify-end">
 <button 
 type="button" 
 onClick={() => setStep("FORGOT_PASSWORD")}
 className="text-[10px] text-neon-blue font-black uppercase hover:underline"
 >
 فراموشی رمز؟
 </button>
 </div>
 )}
 </>
 )}

 {step === "VERIFY_SMS" && (
 <div className="space-y-6 text-right">
 <Input 
 label="کد تایید پیامکی (۶ رقمی)" 
 name="smsVerificationCode" 
 placeholder="123456" 
 dir="ltr" 
 className="text-center font-black tracking-[0.5em] text-lg" 
 value={verificationCode} 
 onChange={(e) => setVerificationCode(e.target.value)} 
 icon={<KeyRound size={18} />} 
 maxLength={6}
 required 
 />
 
 <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
 <div className="text-xs text-gray-400 font-bold mb-3 flex items-center gap-1.5 duration-300">
 <Clock size={14} className="text-neon-pink" />
 <span>برای ارسال مجدد کد زمان باقی‌مانده:</span>
 <span className="font-mono text-white text-sm ">
 {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, "0")}
 </span>
 </div>
 
 <button
 type="button"
 onClick={handleResendSMS}
 disabled={resendTimer > 0 || loading}
 className={`text-xs font-black uppercase transition-all px-4 py-2 rounded-xl border ${
 resendTimer > 0 
 ? "bg-transparent border-white/5 text-gray-600 cursor-not-allowed" 
 : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(255,0,127,0.1)]"
 }`}
 >
 ارسال مجدد کد پیامکی
 </button>
 </div>

 <div className="flex justify-center">
 <button 
 type="button"
 onClick={() => setStep("AUTH")}
 className="text-xs text-gray-500 hover:text-white transition-all hover:underline decoration-white/10 underline-offset-4 font-bold"
 >
 لغو و بازگشت به صفحه قبلی
 </button>
 </div>
 </div>
 )}

 {/* Keep other steps simplified but consistent */}
 {step === "VERIFY_2FA" && (
 <Input label="کد تایید" name="twoFactorCode" placeholder="123456" dir="ltr" className="text-center font-black" value={formData.twoFactorCode} onChange={handleInputChange} icon={<KeyRound size={18} />} required />
 )}

 {step === "FORGOT_PASSWORD" && (
 <Input label="شماره همراه" name="phone" placeholder="0912xxxxxxx" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} icon={<Phone size={18} />} required />
 )}

 {step === "RESET_PASSWORD" && (
 <>
 <Input label="کد تایید" name="otpCode" placeholder="123456" dir="ltr" className="text-center font-black" value={formData.otpCode} onChange={handleInputChange} icon={<KeyRound size={18} />} required />
 <Input label="رمز جدید" type="password" name="newPassword" placeholder="••••••••" value={formData.newPassword} onChange={handleInputChange} icon={<Lock size={18} />} required />
 </>
 )}

 <div className="space-y-4 pt-4">
 <div className="relative group/btn w-full">
 <GlowButton 
 variant={isLogin ? "blue" : "pink"} 
 className="w-full h-14 !rounded-2xl font-black uppercase disabled:opacity-50 disabled:pointer-events-none"
 disabled={loading || (step === "AUTH" && !isLogin && !acceptedTerms)}
 >
 {loading ? <Loader2 className="animate-spin" /> : (
 step === "AUTH" ? (isLogin ? "ورود به سرزمین لوکس" : "ثبت‌نام در لوکس") :
 step === "VERIFY_SMS" ? "تایید و فعالسازی حساب" :
 "تایید نهایی"
 )}
 </GlowButton>
 {step === "AUTH" && !isLogin && !acceptedTerms && (
 <div className="absolute inset-0 z-20 cursor-not-allowed group-hover/btn:opacity-100 opacity-0 pointer-events-auto flex items-center justify-center transition-opacity">
 <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neon-pink/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-neon-pink/30 text-xs text-white font-black whitespace-nowrap shadow-xl flex items-center gap-2 pointer-events-none">
 <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
 جهت ثبت‌نام باید قوانین و مقررات را بپذیرید!
 </div>
 </div>
 )}
 </div>
 </div>

 {step === "AUTH" && (
 <div className="pt-4 mt-4 border-t border-white/5">
 <button 
 type="button"
 onClick={() => setIsLogin(!isLogin)}
 className={`w-full py-4 text-sm font-black uppercase rounded-2xl border transition-all ${
 isLogin 
 ? 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20 shadow-[0_0_15px_rgba(255,0,127,0.15)]' 
 : 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
 }`}
 >
 {isLogin ? "ثبت‌نام در سرزمین لوکس" : "ورود به سرزمین لوکس"}
 </button>
 </div>
 )}
 </form>
 </motion.div>
 </AnimatePresence>
 </NeonCard>
 </div>
 </div>
 );
};
