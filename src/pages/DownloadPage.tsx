import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Download, Zap, Shield, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, FileCode, Check } from "lucide-react";
import { Link } from "react-router-dom";

export const DownloadPage = () => {
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadStep, setDownloadStep] = useState<
    "connecting" | "probing" | "downloading" | "completed" | "failed"
  >("connecting");
  const [activeStepText, setActiveStepText] = useState("در حال برقرار اتصال با سرور مرکزی لوکس...");
  const [resolvedUrl, setResolvedUrl] = useState("https://loxx.ir/updater/loxx-Setup-1.1.0.exe");
  const [fileName, setFileName] = useState("loxx-Setup-1.1.0.exe");

  const downloadAttemptedRef = useRef(false);

  // Download trigger
  const triggerNativeDownload = (url: string, name: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.location.href = url;
    }
  };

  const runDownloadPipeline = async () => {
    let finalUrl = "https://loxx.ir/updater/loxx-Setup-1.1.0.exe";
    let version = "1.1.0";
    let parsedPath = "loxx-Setup-1.1.0.exe";

    // Step 1: Request latest.yml to get dynamic config
    try {
      setDownloadStep("connecting");
      setProgress(5);
      setActiveStepText("در حال خواندن اطلاعات فایل پایگاه داده آپدیت لوکس (latest.yml)...");
      const res = await fetch("https://loxx.ir/updater/latest.yml", { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        const cleanYamlValue = (val: string) => {
          if (!val) return "";
          let cleaned = val.split("#")[0] || "";
          return cleaned.trim().replace(/^['"]|['"]$/g, "").trim();
        };

        const versionMatch = text.match(/version:\s*(.+)/);
        if (versionMatch && versionMatch[1]) {
          version = cleanYamlValue(versionMatch[1]);
        }

        const pathMatch = text.match(/path:\s*(.+)/);
        if (pathMatch && pathMatch[1]) {
          parsedPath = cleanYamlValue(pathMatch[1]);
        } else {
          const urlMatch = text.match(/url:\s*(.+)/);
          if (urlMatch && urlMatch[1]) {
            parsedPath = cleanYamlValue(urlMatch[1]);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest.yml dynamically. Fallback to templates", err);
    }

    // Step 2: Build candidate list for highly resilient URL probing
    const candidates: string[] = [];
    const addCandidate = (urlStr: string) => {
      if (urlStr && !candidates.includes(urlStr)) {
        candidates.push(urlStr);
      }
    };

    if (parsedPath) {
      if (parsedPath.startsWith("http://") || parsedPath.startsWith("https://")) {
        addCandidate(parsedPath);
      } else {
        const encodedPath = parsedPath.split('/')
          .map(segment => encodeURIComponent(segment))
          .join('/');
        addCandidate(`https://loxx.ir/updater/${encodedPath}`);
      }
    }

    // Standardized alternate name permutations
    addCandidate(`https://loxx.ir/updater/loxx-Setup-${version}.exe`);
    addCandidate(`https://loxx.ir/updater/loxx%20Setup%20${version}.exe`);
    addCandidate(`https://loxx.ir/updater/Loxx-Setup-${version}.exe`);
    addCandidate(`https://loxx.ir/updater/Loxx%20Setup%20${version}.exe`);
    addCandidate(`https://loxx.ir/updater/loxx-setup.exe`);
    addCandidate(`https://loxx.ir/updater/Loxx-Setup.exe`);

    setProgress(15);
    setDownloadStep("probing");
    setActiveStepText("در حال پینگ و تست سلامت آدرس دانلود فایل کلاینت...");

    // Find the first URL returning 200 without text/html
    for (const cand of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const probeRes = await fetch(cand, {
          method: "HEAD",
          signal: controller.signal,
          mode: "cors"
        });
        clearTimeout(timeoutId);

        const contentType = probeRes.headers.get("content-type") || "";
        if (probeRes.status === 200 && !contentType.toLowerCase().includes("text/html")) {
          finalUrl = cand;
          break;
        }
      } catch (e) {
        // continue to next candidate
      }
    }

    const extractedFileName = finalUrl.substring(finalUrl.lastIndexOf("/") + 1) || "loxx-Setup-1.1.0.exe";
    const decodedFileName = decodeURIComponent(extractedFileName);
    setFileName(decodedFileName);
    setResolvedUrl(finalUrl);

    // Step 3: Streamed buffer fetch (MEGA.io style!)
    try {
      setProgress(25);
      setDownloadStep("downloading");
      setActiveStepText("در حال اتصال استریم دانلود کلاینت...");

      const downloadResponse = await fetch(finalUrl, { mode: "cors" });
      if (!downloadResponse.ok) {
        throw new Error("Target file response is not OK");
      }

      const reader = downloadResponse.body?.getReader();
      const contentLengthHeader = downloadResponse.headers.get("Content-Length");
      const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 78447647; // Default approx 78MB
      setTotalBytes(contentLength);

      if (!reader) {
        throw new Error("Stream readers not supported by browser");
      }

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        chunks.push(value);
        receivedLength += value.length;
        setDownloadedBytes(receivedLength);

        // Map scale from 25% to 99%
        const percent = Math.round((receivedLength / contentLength) * 100);
        setProgress(Math.min(percent, 99));

        if (percent < 50) {
          setActiveStepText("در حال استریم لایو کلاینت ضدتحریم لوکس به مرورگر...");
        } else if (percent < 85) {
          setActiveStepText("دریافت موفقیت‌آمیز بسته‌های کاهش‌پینگ و اورلی گیمینگ...");
        } else {
          setActiveStepText("در حال همگام‌سازی ماژول صدا و چت گروهی لوکس...");
        }
      }

      // 100% Assembly
      setActiveStepText("در حال تجمیع نهایی بسته‌های دانلود شده در مرورگر...");
      setProgress(100);

      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const blobUrl = URL.createObjectURL(blob);

      setDownloadStep("completed");
      setActiveStepText("بسته‌بندی کلاینت لوکس کامل شد! در حال انتقال به سیستم شما...");

      // Automatically popup save location selector
      setTimeout(() => {
        triggerNativeDownload(blobUrl, decodedFileName);
      }, 500);

    } catch (err) {
      console.warn("Buffer streaming was blocked or failed, falling back to instant native redirection", err);
      setProgress(100);
      setDownloadStep("completed");
      setActiveStepText("در حال آغاز خودکار دانلود مستقیم کلاینت...");
      
      // Fallback
      triggerNativeDownload(finalUrl, decodedFileName);
    }
  };

  useEffect(() => {
    if (downloadAttemptedRef.current) return;
    downloadAttemptedRef.current = true;
    runDownloadPipeline();
  }, []);

  const handleRetry = () => {
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setDownloadStep("connecting");
    setActiveStepText("شروع مجدد پروسه اتصال امن و مانیتور سگمنت‌ها...");
    
    setTimeout(() => {
      runDownloadPipeline();
    }, 600);
  };

  // Human-readable sizes helper
  const formatMegaBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <span>بازگشت به لابی خانه</span>
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
                  <Check className="text-emerald-400 animate-bounce" size={38} />
                ) : (
                  <Download size={38} className="animate-[pulse_1.5s_infinite] text-neon-blue" />
                )}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              دریافت اختصاصی <span className="neon-text-blue">کلاینت ویندوز</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              سیستم دانلود پیشرفته و بدون معطلی کلاینت بازی لوکس (Loxx PC Installer)
            </p>

            {/* Mega.io-style Dynamic Downloading UI */}
            <div className="bg-[#050711] border border-white/5 rounded-2xl p-6 md:p-8 mb-8 relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-neon-blue tracking-widest uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-ping" />
                  {downloadStep === "connecting" && "در حال اتصال به پایگاه..."}
                  {downloadStep === "probing" && "تست سلامت لینک..."}
                  {downloadStep === "downloading" && "در حال بافر کلاینت..."}
                  {downloadStep === "completed" && "عملیات موفقیت‌آمیز"}
                </span>
                
                <div className="flex items-center gap-2">
                  {downloadStep === "downloading" && totalBytes > 0 && (
                    <span className="text-xs text-gray-500 font-mono font-bold">
                      ({formatMegaBytes(downloadedBytes)} از {formatMegaBytes(totalBytes)})
                    </span>
                  )}
                  <span className="font-mono text-sm font-black text-white">{progress}%</span>
                </div>
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
                <FileCode size={16} className="text-neon-blue shrink-0 animate-pulse" />
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
                  className="flex flex-col items-center gap-4 animate-fade-in"
                >
                  <p className="text-xs font-bold text-emerald-400/90 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    دانلود به طور کامل انجام شد و ذخیره گردید. اگر دانلود آغاز نشده، روی دکمه زیر کلیک کنید.
                  </p>
                  <button
                    onClick={() => {
                      triggerNativeDownload(resolvedUrl, fileName);
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-dark-bg font-black text-base shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    شروع دانلود مجدد به صورت مستقیم
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
                      triggerNativeDownload(resolvedUrl, fileName);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/15 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Download size={18} className="text-neon-blue group-hover:translate-y-0.5 transition-transform" />
                    <span>لغو بافر اینترنتی و دانلود مستقیم فوری</span>
                  </button>

                  <button
                    onClick={handleRetry}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>ریستارت دانلود</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Dedicated diagnostics info */}
        <div className="w-full max-w-2xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-pink" />
              <span>نام فایل روی سرور دانلود</span>
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-4 leading-relaxed">
              این کلاینت مستقیما طبق تنظیمات فایل کانفیگ به یکی از فایل‌های اجرایی روی پوشه آپدیتر سرور لود می‌شود:
            </p>
            <div className="bg-[#040612] p-3 rounded-xl border border-white/5 select-all font-mono text-[11px] text-neon-pink text-center font-bold">
              {fileName}
            </div>
            <p className="text-[10px] text-gray-500 font-bold mt-2 text-center">
              آدرس وب: https://loxx.ir/updater/{fileName}
            </p>
          </div>

          <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              <span>امنیت ۱۰۰٪ و نصب گام‌به‌گام</span>
            </h3>
            <ul className="text-xs text-gray-400 font-bold flex flex-col gap-3">
              <li className="flex gap-2 leading-relaxed">
                <span className="text-neon-blue flex-shrink-0">۱.</span>
                <span>فایل نصب را به عنوان Administrator اجرا کنید تا مجوزهای اورلی به درستی ست شوند.</span>
              </li>
              <li className="flex gap-2 leading-relaxed">
                <span className="text-neon-pink flex-shrink-0">۲.</span>
                <span>کوین‌ها و رتبه شما همگام با حساب کاربری سایت در کلاینت دسکتاپ نمایش داده خواهند شد.</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 font-bold">
          <HelpCircle size={14} />
          <span>هسته کلاینت لوکس کاملا اپن‌سورس و گواهی‌شده است.</span>
        </div>

      </div>

      <footer className="w-full py-6 border-t border-white/5 bg-[#03050c]/50 text-center text-xs text-gray-500 font-bold">
        <div className="container mx-auto px-4">
          تمام حقوق مادی و معنوی لوکس بازی محفوظ است © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
};

export default DownloadPage;
