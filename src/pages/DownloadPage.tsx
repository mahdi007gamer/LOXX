import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Download, Zap, Shield, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, FileCode } from "lucide-react";
import { Link } from "react-router-dom";

export const DownloadPage = () => {
  const [progress, setProgress] = useState(0);
  const [downloadStep, setDownloadStep] = useState<
    "connecting" | "fetching" | "preparing" | "completed" | "failed"
  >("connecting");
  const [activeStepText, setActiveStepText] = useState("در حال برقراری اتصال با سرورهای دانلود لوکس...");
  const [manualTriggered, setManualTriggered] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  // High-speed CDN mirror which is known to be fully reachable and working
  const stableMirrorUrl = "https://cdn.imgurl.ir/uploads/o691335_loxx_Setup_1.1.0.exe";
  const officialMirrorUrl = "https://loxx.ir/updater/loxx-Setup-1.1.0.exe";

  const downloadAttemptedRef = useRef(false);

  // Directly trigger immediate browser download via iframe to absolute security and bypass 404/CORs barriers
  const triggerNativeDownload = (url: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "loxx-Setup-1.1.0.exe");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.location.href = url;
    }
  };

  useEffect(() => {
    if (downloadAttemptedRef.current) return;
    downloadAttemptedRef.current = true;

    // Phase 1: Connection Simulation (0% -> 20%)
    const connectionTimeout = setTimeout(() => {
      setDownloadStep("fetching");
      setActiveStepText("در حال رمزگذاری تونل ضدتحریم و کاهش پینگ کلاینت Loxx...");
    }, 1200);

    // Phase 2: Progress stream
    let interval: NodeJS.Timeout;
    let currentProgress = 0;

    const startProgressTracker = () => {
      interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 3;
        
        if (currentProgress >= 45 && currentProgress < 75) {
          setActiveStepText("در حال آماده‌سازی بسته‌های نصبی بهینه‌شده کلاینت...");
        } else if (currentProgress >= 75 && currentProgress < 95) {
          setDownloadStep("preparing");
          setActiveStepText("در حال ادغام شناسه کاربری و ماژول صدای گیمی ریل‌تایم...");
        }

        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          setDownloadStep("completed");
          setActiveStepText("کلاینت با موفقیت آماده شد! شروع اتوماتیک دانلود...");
          clearInterval(interval);
          
          // Trigger download automatically!
          setTimeout(() => {
            triggerNativeDownload(stableMirrorUrl);
          }, 800);
        } else {
          setProgress(currentProgress);
        }
      }, 150);
    };

    // Kick off progress simulator
    startProgressTracker();

    return () => {
      clearTimeout(connectionTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    setProgress(0);
    setDownloadStep("connecting");
    setActiveStepText("اتصال مجدد به نزدیک‌ترین دیتاسنتر ابری لوکس...");
    setNetworkError(false);
    
    setTimeout(() => {
      setDownloadStep("fetching");
      setActiveStepText("دریافت فایل نصبی از سرور بدون فیلتر...");
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 12) + 6;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          setDownloadStep("completed");
          setActiveStepText("آماده برای ذخیره‌سازی هم‌اکنون...");
          clearInterval(interval);
          triggerNativeDownload(stableMirrorUrl);
        } else {
          setProgress(currentProgress);
        }
      }, 100);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#060813] text-gray-100 flex flex-col justify-between relative overflow-hidden font-sans pt-12 md:pt-4" dir="rtl">
      
      {/* Visual background grids / neon ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-neon-blue/10 rounded-full blur-[180px] opacity-60" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-neon-pink/5 rounded-full blur-[150px] opacity-40" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[120px] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)]" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12 flex-grow flex flex-col justify-center items-center z-10 relative">
        
        {/* Back Link to Landing */}
        <Link to="/" className="absolute top-0 right-4 md:right-0 flex items-center gap-2 text-sm text-gray-400 hover:text-neon-blue transition-colors group font-black">
          <ArrowLeft size={16} className="transform rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>بازگشت به لابی لوکس</span>
        </Link>

        {/* Core Card */}
        <div className="w-full max-w-2xl bg-[#090b17]/85 border border-white/5 rounded-3xl p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative mt-12 overflow-hidden">
          
          {/* Subtle frame flare */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-neon-blue/20 rounded-full blur-xl pointer-events-none" />

          <div className="text-center">
            
            {/* Pulsating logo / installer graphic */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0e122b] to-[#040612] border border-neon-blue/40 flex items-center justify-center text-neon-blue shadow-[0_0_40px_rgba(0,229,255,0.25)]">
                {downloadStep === "completed" ? (
                  <CheckCircle size={38} className="text-emerald-400 animate-bounce" />
                ) : (
                  <Download size={38} className="animate-[pulse_1.5s_infinite] text-neon-blue" />
                )}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              دریافت مستقیم <span className="neon-text-blue">کلاینت ویندوز</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              نسخه رسمی Loxx v1.1.0 بهینه شده برای سیستم‌های گیمینگ و شبکه‌های داخل کشور
            </p>

            {/* Mega.io-style Dynamic Downloading UI */}
            <div className="bg-[#050711] border border-white/5 rounded-2xl p-6 md:p-8 mb-8 relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-neon-blue tracking-widest uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-ping" />
                  {downloadStep === "connecting" && "در حال احراز اتصال..."}
                  {downloadStep === "fetching" && "بافرینگ لوکال فایل..."}
                  {downloadStep === "preparing" && "پیکربندی هوشمند ضدلگ..."}
                  {downloadStep === "completed" && "عملیات موفقیت‌آمیز"}
                </span>
                <span className="font-mono text-sm font-black text-white">{progress}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="relative w-full h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  className="absolute inset-y-0 right-0 bg-gradient-to-l from-neon-blue via-teal-400 to-neon-blue rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                />
              </div>

              {/* Status Log */}
              <div className="bg-[#0a0d20] border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm text-gray-400 font-bold font-mono text-center flex items-center justify-center gap-2">
                <FileCode size={16} className="text-neon-blue shrink-0" />
                <span className="truncate">{activeStepText}</span>
              </div>
            </div>

            {/* Action buttons area */}
            <AnimatePresence mode="wait">
              {downloadStep === "completed" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4"
                >
                  <p className="text-xs font-bold text-emerald-400/90 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    دانلود به طور خودکار شروع شده است. در صورت عدم شروع، دکمه زیر را فشار دهید.
                  </p>
                  <button
                    onClick={() => {
                      setManualTriggered(true);
                      triggerNativeDownload(stableMirrorUrl);
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-dark-bg font-black text-base shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    شروع دانلود مجدد کلاینت
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row justify-center gap-4 items-center"
                >
                  {/* Manual Bypass Button */}
                  <button
                    onClick={() => {
                      triggerNativeDownload(stableMirrorUrl);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/15 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Download size={18} className="text-neon-blue group-hover:translate-y-0.5 transition-transform" />
                    <span>رد کردن انتظار و دانلود فوری کلاینت</span>
                  </button>

                  <button
                    onClick={handleRetry}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>تلاش مجدد اتصال</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Elegant Diagnostics & Installation Steps */}
        <div className="w-full max-w-2xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Diagnostic Mirror Links */}
          <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-pink" />
              <span>لینک‌های کمکی و تست شده</span>
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-4 leading-relaxed">
              اگر لینک دانلود اصلی با اختلال شرکت اینترنت شما روبرو شده است، از سرورهای اختصاصی دانلود زیر استفاده کنید:
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={stableMirrorUrl}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">دانلود از سرور نیم‌بهای ایران (۱)</span>
                <span className="text-[10px] bg-neon-blue/15 border border-neon-blue/30 text-neon-blue px-2 py-0.5 rounded-md font-bold">بسیار سریع</span>
              </a>
              <a
                href={officialMirrorUrl}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon-pink/30 hover:bg-neon-pink/5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">سرور دانلود کمکی (۲)</span>
                <span className="text-[10px] bg-neon-pink/15 border border-neon-pink/30 text-neon-pink px-2 py-0.5 rounded-md font-bold">بدون سانسور</span>
              </a>
            </div>
          </div>

          {/* Safe install instructions */}
          <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              <span>مراحل فعال‌سازی کلاینت</span>
            </h3>
            <ul className="text-xs text-gray-400 font-bold flex flex-col gap-3">
              <li className="flex gap-2 leading-relaxed">
                <span className="text-neon-blue flex-shrink-0">۱.</span>
                <span>فایل نصبی دانلود شده را با سطح دسترسی ادمین (Run as Administrator) اجرا کنید تا اورلی و کاهش پینگ به درستی راه‌اندازی شوند.</span>
              </li>
              <li className="flex gap-2 leading-relaxed">
                <span className="text-neon-blue flex-shrink-0">۲.</span>
                <span>پس از نصب، می‌توانید از نام کاربری و رمز عبور وبسایت برای ورود به کلاینت استفاده کنید.</span>
              </li>
              <li className="flex gap-2 leading-relaxed">
                <span className="text-neon-pink flex-shrink-0">۳.</span>
                <span>اورلی صوتی لوکس به طور خودکار بازی‌های در حال اجرا (مانند CS2، Dota، Valorant و ...) را شناسایی خواهد کرد.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Support section */}
        <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 font-bold">
          <HelpCircle size={14} />
          <span>سوالی دارید؟ در دیسکورد یا تیکت رسمی با ما در میان بگذارید.</span>
        </div>

      </div>

      {/* Futuristic footer layout */}
      <footer className="w-full py-6 border-t border-white/5 bg-[#03050c]/50 text-center text-xs text-gray-500 font-bold">
        <div className="container mx-auto px-4">
          تمام حقوق پلتفرم بازی لوکس محفوظ است © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
};

export default DownloadPage;
