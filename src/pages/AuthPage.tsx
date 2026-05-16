import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonCard } from "../components/ui/NeonCard";
import { Input } from "../components/ui/Input";
import { GlowButton } from "../components/ui/GlowButton";
import { Gamepad2, MessageCircle, Lock, User, ArrowRight, Loader2, Users, Phone, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
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
    phone: "",
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

  React.useEffect(() => {
    let interval: any;
    if (step === "VERIFY_BALE" && formData.phone) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/auth/status/${formData.phone}`);
          if (response.data.verified) {
            login(response.data.token, response.data.user);
            toast.success("حساب شما با موفقیت تایید شد!");
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [step, formData.phone, login, navigate]);

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
              toast.success("کد تایید ارسال شد");
              return;
            }

            login(response.data.token, response.data.user);
            toast.success("خوش آمدید!");
          } catch (err: any) {
             if (err.response?.data?.error?.code === "VERIFICATION_REQUIRED") {
                setStep("VERIFY_BALE");
                toast.error("حساب شما هنوز تایید نشده است.");
             } else {
                toast.error("شماره همراه یا رمز عبور اشتباه است");
             }
          }
        } else {
          const registerResponse = await api.post("/auth/register", {
            username: formData.username,
            phone: formData.phone,
            password: formData.password,
            referralCode: formData.referralCode || undefined
          });
          
          setVerificationToken(registerResponse.data.user.verificationToken);
          setStep("VERIFY_BALE");
          toast.success("ثبت‌نام با موفقیت انجام شد.");
        }
      } else if (step === "VERIFY_BALE") {
        setIsLogin(true);
        setStep("AUTH");
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
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                      {isLogin ? "ورود پادشاهی" : "عضویت در لوکس"}
                    </h2>
                    <p className="mt-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                      {isLogin 
                        ? "آماده نبردهای سهمگین هستید؟" 
                        : "به جمع برترین گیمرهای ایران بپیوندید"}
                    </p>
                  </>
                )}

                {step === "VERIFY_BALE" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">اتصال امن بله</h2>
                    <p className="mt-2 text-xs text-gray-500 font-bold uppercase tracking-widest">منتظر تایید شما در بازوی بله هستیم</p>
                  </>
                )}
                {step === "VERIFY_2FA" && (
                  <>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">امنیت دو مرحله‌ای</h2>
                    <p className="mt-2 text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      کد تایید امنیتی به حساب بله شما ارسال شد.<br />
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
                      <Input 
                        label="کد معرف (هدیه شروع)" 
                        placeholder="Invite Code" 
                        name="referralCode"
                        value={formData.referralCode}
                        onChange={handleInputChange}
                        icon={<Users size={18} />} 
                      />
                    )}
                    
                    {isLogin && (
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setStep("FORGOT_PASSWORD")}
                          className="text-[10px] text-neon-blue font-black uppercase tracking-widest hover:underline"
                        >
                          فراموشی رمز؟
                        </button>
                      </div>
                    )}
                  </>
                )}

                {step === "VERIFY_BALE" && (
                  <div className="space-y-6 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="relative z-10">
                         <div className="flex justify-center mb-4">
                            <div className="relative">
                               <div className="absolute inset-0 bg-neon-blue blur-xl opacity-30 animate-pulse" />
                               <div className="h-16 w-16 rounded-full bg-neon-blue/20 flex items-center justify-center border border-neon-blue/50">
                                  <Loader2 size={32} className="text-neon-blue animate-spin" />
                               </div>
                            </div>
                         </div>
                         <h3 className="text-xl font-black text-white italic mb-2">منتظر تایید شماره موبایل...</h3>
                         <p className="text-gray-300 text-sm leading-relaxed mb-6 font-bold">
                           لطفاً روی دکمه زیر بزنید و پس از ورود به ربات، شماره موبایل خود را با استفاده از دکمه داخل ربات بله به اشتراک بگذارید.
                         </p>
                         
                         <GlowButton 
                          type="button"
                          variant="blue"
                          className="w-full h-14 !rounded-2xl font-black italic uppercase tracking-tighter"
                          onClick={() => window.open(verificationToken ? `https://ble.ir/loxxbot?start=${verificationToken}` : `https://ble.ir/loxxbot`, "_blank")}
                         >
                           <MessageCircle size={20} className="ml-2" />
                           ورود به ربات بله و تایید شماره
                         </GlowButton>

                         <button 
                           type="button"
                           onClick={() => setStep("AUTH")}
                           className="mt-6 text-xs text-gray-500 hover:text-white transition-colors underline decoration-white/10 underline-offset-4"
                         >
                           لغو و بازگشت به صفحه ورود
                         </button>
                       </div>
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
                  <GlowButton 
                    variant={isLogin ? "blue" : "pink"} 
                    className="w-full h-14 !rounded-2xl font-black uppercase italic tracking-widest"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      step === "AUTH" ? (isLogin ? "ورود به سرزمین لوکس" : "ثبت‌نام در لوکس") :
                      step === "VERIFY_BALE" ? "بازگشت به ورود" : "تایید نهایی"
                    )}
                  </GlowButton>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

          {step === "AUTH" && (
            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className={`text-xs font-black italic uppercase tracking-tighter transition-colors ${isLogin ? 'text-neon-pink hover:text-white' : 'text-neon-blue hover:text-white'}`}
              >
                {isLogin ? "هنوز اکانت نداری؟ همین حالا بساز" : "قبلاً ثبت‌نام کردی؟ وارد شو"}
              </button>
            </div>
          )}
        </NeonCard>
      </div>
    </div>
  );
};
