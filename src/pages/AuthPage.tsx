import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonCard } from "../components/ui/NeonCard";
import { Input } from "../components/ui/Input";
import { GlowButton } from "../components/ui/GlowButton";
import { Gamepad2, Mail, Lock, User, ArrowRight, Loader2, Users, Phone, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";

type AuthStep = "AUTH" | "FORGOT_PASSWORD" | "RESET_PASSWORD" | "VERIFY_2FA" | "VERIFY_BALE";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("AUTH");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    referralCode: "",
    otpCode: "",
    newPassword: "",
    twoFactorCode: ""
  });
  const [forgotIdentifier, setForgotIdentifier] = useState("");

  const navigate = useNavigate();
  const { login, user } = useAuth();

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
          const response = await api.post("/auth/login", {
            email: formData.email,
            password: formData.password
          });
          
          if (response.data.status === "2fa_required") {
            setTempUserId(response.data.userId);
            setStep("VERIFY_2FA");
            toast.success("کد تایید دو مرحله‌ای به ایمیل شما ارسال شد");
            return;
          }

          login(response.data.token, response.data.user);
          toast.success("خوش آمدید!");
        } else {
          const registerResponse = await api.post("/auth/register", {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            referralCode: formData.referralCode || undefined
          });
          
          setVerificationToken(registerResponse.data.user.verificationToken);
          setStep("VERIFY_BALE");
          toast.success("ثبت‌نام با موفقیت انجام شد.");
        }
      } else if (step === "VERIFY_BALE") {
        // Users can just try to login after verifying on Bale
        setIsLogin(true);
        setStep("AUTH");
        toast.success("حالا می‌توانید وارد شوید (پس از تایید در بله)");
      } else if (step === "VERIFY_2FA") {
        const response = await api.post("/auth/verify-2fa", {
          userId: tempUserId,
          code: formData.twoFactorCode
        });
        login(response.data.token, response.data.user);
        toast.success("خوش آمدید!");
      } else if (step === "FORGOT_PASSWORD") {
        // Simple forgot password logic
        await api.post("/auth/forgot-password", {
          identifier: forgotIdentifier
        });
        toast.success("ایمیل بازیابی برای شما ارسال شد");
        setStep("RESET_PASSWORD");
      } else if (step === "RESET_PASSWORD") {
        await api.post("/auth/reset-password", {
          identifier: forgotIdentifier,
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
        {/* Decorative blur backgrounds */}
        <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-neon-blue/10 blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 -z-10 h-64 w-64 rounded-full bg-neon-pink/10 blur-[80px]" />

        <NeonCard variant={isLogin ? "blue" : "pink"} className="transition-colors duration-500">
          <AnimatePresence mode="wait">
            <motion.div
              key={step === "AUTH" ? (isLogin ? "login" : "signup") : step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="mb-8 text-center">
                <motion.div 
                  layoutId="auth-icon"
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white/5 shadow-lg transition-colors duration-500 overflow-hidden ${isLogin ? 'border-neon-blue/50 text-neon-blue' : 'border-neon-pink/50 text-neon-pink'}`}
                >
                  <img src="/logo.png" alt="LOXX" className="h-10 w-auto" />
                </motion.div>
                
                {step === "AUTH" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                      {isLogin ? "ورود به حساب کاربری" : "ثبت‌نام در لوکس"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-400 font-bold">
                      {isLogin 
                        ? "مشخصات خود را وارد کنید" 
                        : "به جمع گیمرهای حرفه‌ای بپیوندید"}
                    </p>
                  </>
                )}

                {step === "VERIFY_BALE" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">تایید هویت با بله</h2>
                    <p className="mt-2 text-sm text-gray-400 font-bold">برای فعالسازی حساب، باید از طریق بازوی بله اقدام کنید</p>
                  </>
                )}

                {step === "VERIFY_2FA" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">تایید دو مرحله‌ای</h2>
                    <p className="mt-2 text-sm text-gray-400 font-bold">کد ارسال شده به ایمیل یا بله را وارد کنید</p>
                  </>
                )}

                {step === "FORGOT_PASSWORD" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">فراموشی رمز عبور</h2>
                    <p className="mt-2 text-sm text-gray-400 font-bold">ایمیل خود را وارد کنید</p>
                  </>
                )}

                {step === "RESET_PASSWORD" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">تغییر رمز عبور</h2>
                    <p className="mt-2 text-sm text-gray-400 font-bold">کد تایید و رمز جدید را وارد کنید</p>
                  </>
                )}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {step === "AUTH" && (
                  <>
                    <AnimatePresence>
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          <Input 
                            label="نام کاربری" 
                            placeholder="Gamer123" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            icon={<User size={18} />} 
                            required={!isLogin}
                          />
                          <Input 
                            label="کد معرف (اختیاری)" 
                            placeholder="کد دعوت" 
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleInputChange}
                            icon={<Users size={18} />} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <Input 
                      label="ایمیل" 
                      type="email"
                      name="email"
                      placeholder="example@gmail.com" 
                      value={formData.email}
                      onChange={handleInputChange}
                      icon={<Mail size={18} />} 
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
                    
                    {isLogin && (
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setStep("FORGOT_PASSWORD")}
                          className="text-xs text-neon-blue font-bold hover:underline"
                        >
                          فراموشی رمز عبور؟
                        </button>
                      </div>
                    )}
                  </>
                )}

                {step === "VERIFY_BALE" && (
                  <div className="space-y-6 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                       <p className="text-gray-300 text-sm leading-relaxed mb-4">
                         ۱. وارد بازوی <span className="text-neon-blue font-bold">@loxxbot</span> در پیام‌رسان بله شوید.<br />
                         ۲. بر روی دکمه <span className="text-neon-pink font-bold">شروع (Start)</span> کلیک کنید.<br />
                         ۳. شماره همراه خود را برای تایید نهایی ارسال کنید.
                       </p>
                       
                       <a 
                        href={`https://ble.ir/loxxbot?start=${verificationToken}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00e5ff] text-black rounded-xl font-black italic uppercase text-sm hover:scale-105 transition-transform"
                       >
                         <Phone size={18} />
                         ورود به بازوی بله
                       </a>
                    </div>
                    
                    <p className="text-[10px] text-gray-500">
                      پس از تایید در بله، به این صفحه برگردید و وارد حساب خود شوید.
                    </p>
                  </div>
                )}

                {step === "VERIFY_2FA" && (
                  <Input 
                    label="کد دو مرحله‌ای" 
                    name="twoFactorCode"
                    placeholder="123456"
                    dir="ltr"
                    className="text-center tracking-widest font-black"
                    value={formData.twoFactorCode}
                    onChange={handleInputChange}
                    icon={<ShieldCheck size={18} />}
                    required
                  />
                )}

                {step === "FORGOT_PASSWORD" && (
                  <Input 
                    label="ایمیل" 
                    type="email"
                    placeholder="mail@example.com"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    icon={<Mail size={18} />}
                    required
                  />
                )}

                {step === "RESET_PASSWORD" && (
                  <>
                    <Input 
                      label="کد تایید" 
                      name="otpCode"
                      placeholder="123456"
                      dir="ltr"
                      className="text-center tracking-widest font-black"
                      value={formData.otpCode}
                      onChange={handleInputChange}
                      icon={<KeyRound size={18} />}
                      required
                    />
                    <Input 
                      label="رمز عبور جدید" 
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      icon={<Lock size={18} />}
                      required
                    />
                  </>
                )}

                <div className="flex flex-col gap-3 pt-2">
                   <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlowButton 
                      variant={(isLogin || step === "VERIFY_2FA") ? "blue" : "pink"} 
                      className="w-full h-14 !rounded-2xl font-black uppercase italic tracking-widest"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        step === "AUTH" ? (isLogin ? "ورود به لابی" : "تایید و ثبت‌نام") :
                        step === "VERIFY_BALE" ? "متوجه شدم (ورود)" :
                        step === "VERIFY_2FA" ? "بررسی کد" :
                        step === "FORGOT_PASSWORD" ? "ارسال کد تایید" : "تغییر رمز عبور"
                      )}
                    </GlowButton>
                   </motion.div>

                   {step !== "AUTH" && (
                     <button 
                      type="button"
                      onClick={() => setStep("AUTH")}
                      className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold"
                     >
                       <ArrowLeft size={14} /> بازگشت
                     </button>
                   )}
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

          {step === "AUTH" && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-sm text-gray-400 font-bold">
                {isLogin ? "هنوز عضو نشده‌اید؟" : "قبلاً ثبت‌نام کرده‌اید؟"}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className={`mr-2 font-black italic uppercase transition-colors ${isLogin ? 'text-neon-pink hover:text-neon-pink/80' : 'text-neon-blue hover:text-neon-blue/80'}`}
                >
                  {isLogin ? "ایجاد حساب کاربری" : "ورود به حساب"}
                </button>
              </p>
            </div>
          )}
        </NeonCard>
      </div>
    </div>
  );
};
