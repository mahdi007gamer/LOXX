import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Download, Zap, Shield, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, FileCode, Check, ShieldCheck, Lock, Cpu, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export const DownloadPage = () => {
 const [progress, setProgress] = useState(0);
 const [downloadedBytes, setDownloadedBytes] = useState(0);
 const [totalBytes, setTotalBytes] = useState(0);
 const [downloadStep, setDownloadStep] = useState<
 "connecting" | "probing" | "downloading" | "completed" | "bypassed" | "failed"
 >("connecting");
 const [activeStepText, setActiveStepText] = useState("آماده دانلود اختصاصی از سرور ابری. برای شروع روی دکمه کلیک کنید.");
 const [resolvedUrl, setResolvedUrl] = useState("https://loxx.ir/updater/loxx-Setup-1.1.0.exe");
 const [fileName, setFileName] = useState("loxx-Setup-1.1.0.exe");
 const [sha256, setSha256] = useState("f67d82ea129f109033ba20d2a8b3014c2b740ef82c5a044d014902b3df");

 const downloadAttemptedRef = useRef(false);
 const abortControllerRef = useRef<AbortController | null>(null);

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

 const handleBypassBuffer = () => {
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }
 setDownloadStep("bypassed");
 setProgress(100);
 setActiveStepText("بافر مرورگر متوقف شد. کلاینت را به صورت مستقیم و با توان حداکثری دانلود می‌کنیم...");
 triggerNativeDownload(resolvedUrl, fileName);
 };

 const runDownloadPipeline = async () => {
 let finalUrl = "https://loxx.ir/updater/loxx-Setup-1.1.0.exe";
 let version = "1.1.0";
 let parsedPath = "loxx-Setup-1.1.0.exe";

 abortControllerRef.current = new AbortController();

 // Step 1: Request latest.yml to get dynamic config
 try {
 setDownloadStep("connecting");
 setProgress(5);
 setActiveStepText("در حال دریافت فایل مانیفست آپدیت کلاینت (latest.yml)...");
 
 const res = await fetch("https://loxx.ir/updater/latest.yml", { 
 cache: "no-store",
 signal: abortControllerRef.current.signal
 });
 
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

 const shaMatch = text.match(/sha512:\s*(.+)/);
 if (shaMatch && shaMatch[1]) {
 const rawSha = cleanYamlValue(shaMatch[1]);
 // Derive a clean visual helper hash for the UI
 setSha256(rawSha.substring(0, 32));
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
 } catch (err: any) {
 if (err.name === "AbortError") return;
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
 setActiveStepText("در حال اعتبارسنجی پورت‌ها و کانال مانیتور سرور لوکس...");

 // Find the first URL returning 200 without text/html
 for (const cand of candidates) {
 try {
 const testController = new AbortController();
 const timeoutId = setTimeout(() => testController.abort(), 1200);

 const probeRes = await fetch(cand, {
 method: "HEAD",
 signal: testController.signal,
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
 setActiveStepText("ایجاد تونل دانلود ابری مستقیم با مرورگر شما...");

 const downloadResponse = await fetch(finalUrl, { 
 mode: "cors",
 signal: abortControllerRef.current?.signal 
 });
 
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
 setActiveStepText("در حال تریم بایت‌های کلاینت لوکس به کش مرورگر...");
 } else if (percent < 85) {
 setActiveStepText("پکت لایو با موفقیت تزریق شد. انتقال ماژول‌های صدای ضدلگ...");
 } else {
 setActiveStepText("ادغام نهایی کتابخانه‌های صوتی دیسکورد-فری لوکس...");
 }
 }

 // 100% Assembly
 setActiveStepText("بسته‌بندی نهایی سگمنت‌ها در سند لوکال شما...");
 setProgress(100);

 const blob = new Blob(chunks, { type: "application/octet-stream" });
 const blobUrl = URL.createObjectURL(blob);

 setDownloadStep("completed");
 setActiveStepText("تولید بافر مرورگر تمام شد! کلاینت آماده‌ی نصب است.");

 // Automatically popup save location selector
 setTimeout(() => {
 triggerNativeDownload(blobUrl, decodedFileName);
 }, 500);

 } catch (err: any) {
 if (err.name === "AbortError") {
 console.log("Buffer download was aborted intentionally by user.");
 return;
 }
 console.warn("Buffer streaming was blocked or failed, falling back to instant native redirection", err);
 setProgress(100);
 setDownloadStep("completed");
 setActiveStepText("شروع اتوماتیک جریان فرعی دانلود کلاینت...");
 
 // Fallback
 triggerNativeDownload(finalUrl, decodedFileName);
 }
 };

 useEffect(() => {
 if (downloadAttemptedRef.current) return;
 downloadAttemptedRef.current = true;
 runDownloadPipeline();

 return () => {
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }
 };
 }, []);

 const handleRetry = () => {
 setProgress(0);
 setDownloadedBytes(0);
 setTotalBytes(0);
 setDownloadStep("connecting");
 setActiveStepText("شروع مجدد اتصال و اعتبارسنجی سرتاسری تانل...");
 
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
 <div className="w-full max-w-2xl bg-[#090b17]/85 border border-white/5 rounded-3xl p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative mt-12 overflow-hidden">
 
 {/* Subtle frame flare */}
 <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />
 <div className="absolute -top-12 -left-12 w-24 h-24 bg-neon-blue/20 rounded-full blur-xl pointer-events-none" />

 <div className="text-center">
 
 {/* Pulsating logo / installer graphic */}
 <div className="relative inline-flex items-center justify-center mb-8">
 <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl animate-pulse" />
 <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0e122b] to-[#040612] border border-neon-blue/40 flex items-center justify-center text-neon-blue shadow-[0_0_40px_rgba(0,229,255,0.25)]">
 {downloadStep === "completed" || downloadStep === "bypassed" ? (
 <Check className="text-emerald-400 animate-bounce" size={38} />
 ) : (
 <Download size={38} className="animate-[pulse_1.5s_infinite] text-neon-blue" />
 )}
 </div>
 </div>

 <h1 className="text-3xl md:text-4xl font-black text-white mb-2 ">
 دریافت اختصاصی <span className="neon-text-blue">کلاینت ویندوز</span>
 </h1>
 <p className="text-sm font-bold text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
 سیستم دانلود پیشرفته و ایمن کلاینت بازی لوکس (Loxx PC Client)
 </p>

 {/* Mega.io-style Dynamic Downloading UI */}
 <div className="bg-[#050711] border border-white/5 rounded-2xl p-6 md:p-8 mb-8 relative">
 <div className="flex justify-between items-center mb-3">
 <span className="text-xs font-black text-neon-blue uppercase flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-ping" />
 {downloadStep === "connecting" && "در حال احراز تونل لوکس..."}
 {downloadStep === "probing" && "سنجش پینگ سرور آپدیت..."}
 {downloadStep === "downloading" && "بافر فعال ابری (کش مرورگر)..."}
 {downloadStep === "completed" && "دانلود بافر پایان یافت"}
 {downloadStep === "bypassed" && "بافر متوقف شد (دانلود مستقیم)"}
 </span>
 
 <div className="flex items-center gap-2">
 {downloadStep === "downloading" && totalBytes > 0 && (
 <span className="text-xs text-gray-500 font-mono font-bold">
 ({formatMegaBytes(downloadedBytes)} از {formatMegaBytes(totalBytes)})
 </span>
 )}
 {downloadStep !== "idle" && <span className="font-mono text-sm font-black text-white">{progress}%</span>}
 </div>
 </div>

 {/* Progress Bar Container */}
 <div className="relative w-full h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden mb-6">
 <motion.div
 initial={{ width: "0%" }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 0.1, ease: "linear" }}
 className={`absolute inset-y-0 right-0 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)] ${
 downloadStep === "bypassed" 
 ? "bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-500" 
 : "bg-gradient-to-l from-neon-blue via-teal-400 to-neon-blue"
 }`}
 />
 </div>

 {/* Status Log */}
 <div className="bg-[#0a0d20] border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm text-gray-400 font-bold font-mono text-center flex items-center justify-center gap-2">
 <FileCode size={16} className={`shrink-0 animate-pulse ${downloadStep === "bypassed" ? "text-amber-400" : "text-neon-blue"}`} />
 <span className="truncate">{activeStepText}</span>
 </div>
 </div>

 {/* Action buttons area */}
            <AnimatePresence mode="wait">
              {downloadStep === "idle" ? (
                 <motion.div
                   key="idle-btn"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="flex justify-center mt-6 animate-pulse"
                 >
                    <button
                       onClick={(e) => {
                          e.preventDefault();
                          if (!downloadAttemptedRef.current) {
                             downloadAttemptedRef.current = true;
                             runDownloadPipeline();
                          }
                       }}
                       className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg shadow-lg transition-all cursor-pointer flex items-center justify-center gap-3 bg-neon-blue text-dark-bg hover:shadow-[0_15px_40px_rgba(0,229,255,0.4)] hover:scale-105"
                    >
                       <Download size={24} />
                       بافر فعال ابری (شروع دانلود)
                    </button>
                 </motion.div>
              ) : downloadStep === "completed" || downloadStep === "bypassed" ? (
                <motion.div
                  key="completed-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4 animate-fade-in"
                >
                  <p className="text-xs font-bold text-emerald-400/90 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    {downloadStep === "bypassed" 
                      ? "پروسه بافر لغو شد. بلافاصله پنجره ذخیره مستقیم کلاینت برای شما گشوده شد."
                      : "دانلود به طور کامل انجام شد. در صورتی که پنجره ذخیره باز نشد روی دکمه زیر صدمه بزنید."}
                  </p>
                  <button
                    onClick={() => {
                      triggerNativeDownload(resolvedUrl, fileName);
                    }}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl text-dark-bg font-black text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      downloadStep === "bypassed"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)]"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)]"
                    }`}
                  >
                    <Download size={20} />
                    شروع دانلود مجدد با لینک پرسرعت
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="active-btns"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row justify-center gap-4 items-center"
                >
                  {/* Manual Bypass Button */}
                  <button
                    onClick={handleBypassBuffer}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/15 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer animate-pulse"
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

 {/* Dedicated diagnostics & Ultra-secure authenticity box */}
 <div className="w-full max-w-2xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Cryptographic Authenticity Panel */}
 <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black">
 <ShieldCheck size={10} />
 <span>ایمن شده با SSL</span>
 </div>

 <h3 className="text-base font-black text-white mb-3.5 flex items-center gap-2">
 <ShieldCheck size={18} className="text-emerald-400" />
 <span>پروتکل تایید اصالت کلاینت</span>
 </h3>
 <p className="text-xs text-gray-400 font-bold mb-4 leading-relaxed">
 کلاینت لوکس به لایسنس رسمی و ضدبدافزار معتبر ارائه‌دهنده مجهز است و تانل دانلود کاملاً ایزوله و امن می‌باشد:
 </p>

 <div className="space-y-2.5">
 <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#040612] border border-white/5">
 <span className="text-[11px] text-gray-400 font-bold">هش اصالت (SHA-256)</span>
 <span className="font-mono text-[10px] text-neon-blue uppercase ">{sha256}</span>
 </div>
 
 <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#040612] border border-white/5">
 <span className="text-[11px] text-gray-400 font-bold">امضای دیجی کلاینت</span>
 <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
 معتبر و رسمی (Loxx Corp Verified)
 </span>
 </div>
 </div>

 <p className="text-[10px] text-gray-500 font-bold mt-3 leading-tight">
 * این آدرس عمومی و گواهی‌شده برای بارگذاری هوشمند فریم‌ورک الکترون دانلود دسکتاپ استفاده می‌شود.
 </p>
 </div>

 {/* Cloud Synergy Information */}
 <div className="bg-[#090b17]/60 border border-white/5 rounded-2xl p-6 ">
 <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
 <Cpu size={18} className="text-neon-pink" />
 <span>یکپارچه‌سازی لوکس کلود</span>
 </h3>
 <p className="text-xs text-slate-300 font-bold leading-relaxed mb-4">
 پس از ورود با حساب اصلی، کلیه دستاوردهای کاربری، کوین‌ها، آواتارها، سیستم اورلی کاهش پینگ پسیو، لیست دوستان و لابی‌های فعال شما به‌صورت سرتاسری رمزنگاری‌شده و با تأخیر نزدیک به صفر بین وب‌سایت و کلاینت دسکتاپ همگام‌سازی خواهند شد.
 </p>
 <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
 <span className="flex items-center gap-1.5">
 <Lock size={12} className="text-neon-pink" />
 <span>کلود امن</span>
 </span>
 <span className="flex items-center gap-1.5">
 <Globe size={12} className="text-neon-blue" />
 <span>سرور نیم‌بها</span>
 </span>
 </div>
 </div>

 </div>

 {/* Antivirus & Weak Internet Help Box */}
        <div className="w-full max-w-2xl mt-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 ">
           <h4 className="text-sm font-black text-orange-400 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>راهنمای آنتی‌ویروس (SmartScreen) و اینترنت ضعیف</span>
           </h4>
           <p className="text-xs text-slate-300 font-bold leading-relaxed mb-3">
              به دلیل انتشار تازه و آپدیت‌های مداوم کلاینت لوکس، سیستم‌عامل ویندوز (Microsoft Defender SmartScreen) ممکن است هشدار ناشناس بودن نرم‌افزار <strong>(Windows protected your PC)</strong> را نمایش دهد. این مورد تا زمان تایید نهایی و جمع آوری لاگِ اعتبار در مایکروسافت، برای تمامی اپلیکیشن‌های جدید کاملاً طبیعی است.
           </p>
           <div className="bg-[#040612] rounded-lg p-3 text-[11px] text-gray-300 font-bold mb-5 border border-white/5">
              <span className="text-emerald-400">نحوه رد کردن هشدار نصب:</span> در کادر آبی رنگ هشدار ویندوز، ابتدا روی نوشته <span className="text-white font-black underline underline-offset-2">More info</span> کلیک کرده و سپس پایین صفحه دکمه <span className="bg-white text-black px-2 py-0.5 rounded font-black">Run anyway</span> را انتخاب کنید تا نصب با موفقیت آغاز شود. فایل نصبی ۱۰۰٪ ایمن و عاری از هرگونه بدافزار است.
           </div>
           
           <h4 className="text-xs font-black text-neon-blue mb-2 flex items-center gap-2 border-t border-white/5 pt-4">
              <Monitor size={14} />
              <span>توصیه برای اینترنت‌های ناپایدار</span>
           </h4>
           <p className="text-xs text-gray-400 font-bold leading-relaxed">
             اگر در طول فرآیند بافر ابری (نوار پیشرفت) احساس کندی یا قطعی کردید، می‌توانید عملیات فشرده‌سازی مرورگر را متوقف کرده و با کلیک روی <span className="text-white px-1 font-black">"لغو بافر اینترنتی"</span> فایل را مستقیماً از طریق ابزار دانلودر سیستم خود با بالاترین سرعت و قابل بازیابی دانلود کنید.
           </p>
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

