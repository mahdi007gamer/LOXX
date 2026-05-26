import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, Download, Share, PlusSquare, X, SmartphoneCharging, ArrowUpCircle } from "lucide-react";

export const PwaInstaller = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check display-mode to see if it is already installed/running as standalone PWA
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true
  );

  useEffect(() => {
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileDevice = /android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(userAgent) || (window.innerWidth < 768);
    setIsMobile(isMobileDevice);

    // Detect iOS
    const isApple = /ipad|iphone|ipod/i.test(userAgent) && !(window as any).MSStream;
    setIsIos(isApple);

    // Prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // If user is already logged in, show on mobile
      const isDismissed = localStorage.getItem("loxx_pwa_dismissed");
      if (!isStandalone && isMobileDevice && !isDismissed && user) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS Safari (doesn't trigger beforeinstallprompt)
    if (isApple && isMobileDevice && !isStandalone && user) {
      const isDismissed = localStorage.getItem("loxx_pwa_dismissed");
      if (!isDismissed) {
        // Delay a bit to look very polished
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [user, isStandalone]);

  // If user logs in mid-way, evaluate showing again
  useEffect(() => {
    if (user && isMobile && !isStandalone) {
      const isDismissed = localStorage.getItem("loxx_pwa_dismissed");
      if (!isDismissed) {
        if (deferredPrompt || isIos) {
          setShowPrompt(true);
        }
      }
    } else {
      setShowPrompt(false);
    }
  }, [user, isMobile, isStandalone, deferredPrompt, isIos]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show native prompt
    deferredPrompt.prompt();
    
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt choice: ${outcome}`);
    
    // Reset stored event
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Set a dismiss cookie/local storage so they aren't pestered for 7 days
    const nextPromptDate = new Date();
    nextPromptDate.setDate(nextPromptDate.getDate() + 7);
    localStorage.setItem("loxx_pwa_dismissed", "true");
    localStorage.setItem("loxx_pwa_dismiss_until", nextPromptDate.toISOString());
    setShowPrompt(false);
  };

  // Check if dismissal has expired
  useEffect(() => {
    const dismissUntil = localStorage.getItem("loxx_pwa_dismiss_until");
    if (dismissUntil) {
      const expired = new Date() > new Date(dismissUntil);
      if (expired) {
        localStorage.removeItem("loxx_pwa_dismissed");
        localStorage.removeItem("loxx_pwa_dismiss_until");
      }
    }
  }, []);

  if (!showPrompt || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-end justify-center p-0 md:p-4 md:items-center animate-fade-in">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full bg-[#0d0d14]/98 border-t border-neon-blue/20 rounded-t-[32px] md:rounded-[24px] md:border p-6 pb-8 md:max-w-md max-h-[90vh] overflow-y-auto shadow-[0_-25px_50px_rgba(0,0,0,0.8)] relative"
          dir="rtl"
        >
          {/* Top visual decoration handle */}
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 block md:hidden" />

          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Header Graphic */}
          <div className="flex flex-col items-center text-center mt-2 mb-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-neon-blue to-neon-pink rounded-3xl blur-md opacity-50 animate-pulse" />
              <img 
                src="/logo.png" 
                alt="LOXX" 
                className="w-16 h-16 rounded-2xl relative z-10 border border-white/10 bg-black/80 p-1 object-contain"
              />
            </div>
            <h3 className="text-xl font-black text-white mt-4 flex items-center gap-2">
              <span>نصب اپلیکیشن وب لوکس (PWA)</span>
            </h3>
            <p className="text-gray-400 text-xs mt-2 max-w-xs leading-relaxed">
              با اضافه کردن میانبر لوکس به صفحه گوشی خود، با یک ضربه کلاینت وب را مثل بازی‌های بومی با سرعت بالا باز کنید!
            </p>
          </div>

          {/* Conditional Layout (Android/Chrome or iOS/Safari) */}
          {isIos ? (
            <div className="space-y-4 mb-6">
              <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-neon-pink font-black uppercase tracking-widest block mb-1">
                  راهنمای نصب ویژه آیفون و iOS Safari
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  از آنجا که سیستم‌عامل iOS امکان نصب مستقیم درون‌برنامه‌ای را محدود کرده است، کافیست مراحل بسیار ساده زیر را دنبال کنید:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ۱
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      گزینه اشتراک‌گذاری <Share size={14} className="text-neon-blue inline" /> (Share) را در پایین صفحه آیفون لمس کنید.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ۲
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      در گزینه‌های باز شده به پایین بروید و <PlusSquare size={14} className="text-neon-pink inline" /> <span className="text-neon-pink">"Add to Home Screen"</span> یا <span className="text-neon-pink">"افزودن به صفحه اصلی"</span> را لمس کنید.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ۳
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">
                      در نهایت جهت تایید، در بالای سمت راست صفحه دکمه <span className="text-neon-blue">"Add (افزودن)"</span> را بزنید.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-neon-blue font-black uppercase tracking-widest block mb-1">
                  پیشنهاد ویژه سیستم‌عامل اندروید
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  کافیست روی دکمه زیر ضربه بزنید تا با ایجاد میانبر، کلاینت بازی بدون مرورگر و در قالبی تمام‌صفحه باز شود.
                </p>
              </div>

              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-blue to-teal-400 text-dark-bg font-black text-sm hover:opacity-95 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={18} className="animate-bounce" />
                  <span>ایجاد سریع میانبر روی صفحه گوشی</span>
                </button>
              ) : (
                <div className="bg-[#12121a]/80 border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-gray-400 leading-relaxed">
                    منوی سه نقطه بالا یا پایین مرورگر کروم خود را لمس کنید و سپس گزینه <span className="text-neon-blue">"Install app"</span> یا <span className="text-neon-blue">"Add to Home Screen"</span> را انتخاب نمایید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-gray-400 text-center font-bold text-xs cursor-pointer transition-all"
            >
              بعداً نصب می‌کنم
            </button>
            {isIos && (
              <button
                onClick={handleDismiss}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-center font-black text-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_15px_rgba(255,0,153,0.3)]"
              >
                متوجه شدم!
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
