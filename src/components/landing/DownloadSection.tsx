import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Monitor, Apple, Smartphone, Download } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { useLanguage } from "../../context/LanguageContext";

export const DownloadSection = () => {
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";
  const [windowsVersion, setWindowsVersion] = useState<string | null>(null);
  const [windowsUrl, setWindowsUrl] = useState<string>("https://loxx.ir/updater/loxx-Setup-1.1.0.exe");

  useEffect(() => {
    // Attempt to fetch latest.yml to get the exact version/url
    const fetchLatest = async () => {
      try {
        const res = await fetch("https://loxx.ir/updater/latest.yml", { cache: "no-store" });
        if (res.ok) {
          const text = await res.text();
          
          const cleanYamlValue = (val: string) => {
            if (!val) return "";
            let cleaned = val.split("#")[0] || ""; // remove trailing comments
            cleaned = cleaned.trim().replace(/^['"]|['"]$/g, "").trim(); // strip single/double quotes
            return cleaned;
          };

          // parse version
          let version = "1.1.0";
          const versionMatch = text.match(/version:\s*(.+)/);
          if (versionMatch && versionMatch[1]) {
            version = cleanYamlValue(versionMatch[1]);
            setWindowsVersion(version);
          }

          // parse path (with fallback to url)
          let finalPath = "";
          const pathMatch = text.match(/path:\s*(.+)/);
          if (pathMatch && pathMatch[1]) {
            finalPath = cleanYamlValue(pathMatch[1]);
          } else {
            const urlMatch = text.match(/url:\s*(.+)/);
            if (urlMatch && urlMatch[1]) {
              finalPath = cleanYamlValue(urlMatch[1]);
            }
          }

          // Gather candidate URLs to probe which one actually exists on the production server
          const candidates: string[] = [];
          const addCandidate = (urlStr: string) => {
            if (urlStr && !candidates.includes(urlStr)) {
              candidates.push(urlStr);
            }
          };

          // 1. Exact path specified in latest.yml
          if (finalPath) {
            if (finalPath.startsWith("http://") || finalPath.startsWith("https://")) {
              addCandidate(finalPath);
            } else {
              const encodedPath = finalPath.split('/')
                .map(segment => encodeURIComponent(segment))
                .join('/');
              addCandidate(`https://loxx.ir/updater/${encodedPath}`);
            }
          }

          // 2. Dash version setups (standardized name formats)
          addCandidate(`https://loxx.ir/updater/loxx-Setup-${version}.exe`);
          addCandidate(`https://loxx.ir/updater/loxx-setup-${version}.exe`);
          addCandidate(`https://loxx.ir/updater/Loxx-Setup-${version}.exe`);
          addCandidate(`https://loxx.ir/updater/Loxx-setup-${version}.exe`);

          // 3. Space based setups (traditional electron-builder formats)
          addCandidate(`https://loxx.ir/updater/loxx%20Setup%20${version}.exe`);
          addCandidate(`https://loxx.ir/updater/Loxx%20Setup%20${version}.exe`);

          // 4. Fallbacks without version numbers
          addCandidate("https://loxx.ir/updater/loxx-setup.exe");
          addCandidate("https://loxx.ir/updater/loxx-Setup.exe");
          addCandidate("https://loxx.ir/updater/Loxx-Setup.exe");
          addCandidate("https://loxx.ir/updater/loxx%20Setup.exe");
          addCandidate("https://loxx.ir/updater/Loxx%20Setup.exe");

          // Keep the first candidate as the default fallback in case all probe tests fail
          let selectedUrl = candidates[0] || "https://loxx.ir/updater/loxx-Setup-1.1.0.exe";

          // Probe candidates asynchronously to find the first 200 OK URL that is not HTML
          const probeUrls = async () => {
            for (const cand of candidates) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1800); // 1.8 seconds timeout per check

                const probeRes = await fetch(cand, {
                  method: "HEAD",
                  signal: controller.signal,
                  mode: "cors"
                });

                clearTimeout(timeoutId);

                const contentType = probeRes.headers.get("content-type") || "";
                
                // If it returns 200 but it's HTML, Nginx is fallback-routing to index.html (SPA).
                // A real installer executable will NOT have text/html in Content-Type.
                if (probeRes.status === 200 && !contentType.toLowerCase().includes("text/html")) {
                  selectedUrl = cand;
                  console.log("[Loxx Updater Resilient Sniffer] Successfully found live URL:", cand);
                  break; // Found working URL! Exit loop
                }
              } catch (e) {
                // Ignore errors and probe next candidate (could be CORS limit or 404)
              }
            }
            setWindowsUrl(selectedUrl);
          };

          probeUrls();
        }
      } catch (err) {
        console.warn("Could not fetch latest.yml for download section", err);
      }
    };
    fetchLatest();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden" id="download" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-neon-blue/5 skew-y-3 transform -z-10" />
      
      <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            {isRtl ? (
              <>دریافت <span className="neon-text-blue">کلاینت‌های</span> لوکس</>
            ) : (
              <>Download <span className="neon-text-blue">LOXX</span> Desktop Client</>
            )}
          </h2>
          <p className="text-gray-400 mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
            {isRtl 
              ? "برای تجربه بدون لگ همراه با تماس صوتی یکپارچه داخل بازی و اورلی ویندوز، کلاینت اختصاصی لوکس را دریافت کنید."
              : "For a lag-free experience with integrated in-game real-time voice chat and custom Windows HUD overlays, download the dedicated LOXX client."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Windows (Featured - Ultra Eye-catching Client) */}
            <div className="bg-gradient-to-b from-[#101428] to-[#040612] border-2 border-neon-blue rounded-3xl p-8 flex flex-col items-center justify-between shadow-[0_0_50px_rgba(0,229,255,0.25)] hover:shadow-[0_0_70px_rgba(0,229,255,0.45)] hover:border-neon-pink transition-all duration-500 group overflow-hidden relative col-span-1 transform lg:scale-105 z-20">
              
              {/* Rotating background aura */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15),transparent_60%)] pointer-events-none" />
              <div className="absolute -inset-[10px] bg-gradient-to-r from-neon-blue/10 via-neon-pink/10 to-neon-purple/10 opacity-30 blur-xl group-hover:opacity-60 transition-opacity duration-700 pointer-events-none" />
              
              {/* Special Badge */}
              <div className={`absolute top-3 ${isRtl ? "left-3" : "right-3"} bg-gradient-to-r from-neon-pink to-neon-purple text-dark-bg text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,153,0.5)] z-20 animate-bounce`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>{isRtl ? "نسخه پیشنهادی و رسمی" : "Recommended Official"}</span>
              </div>

              {/* Icon Container with glowing ring & audio wave effect */}
              <div className="mb-6 h-24 w-24 rounded-2xl bg-neon-blue/15 flex items-center justify-center text-neon-blue border border-neon-blue/40 shadow-[0_0_30px_rgba(0,229,255,0.3)] group-hover:scale-110 group-hover:border-neon-pink group-hover:text-neon-pink group-hover:shadow-[0_0_40px_rgba(255,0,153,0.4)] transition-all duration-500 z-10 relative">
                
                {/* Visual Audio Waves Decors */}
                <span className="absolute -left-2 bottom-4 w-1 h-6 bg-neon-blue/40 rounded-full group-hover:bg-neon-pink/60 animate-[pulse_1.2s_infinite]" />
                <span className="absolute -right-2 bottom-6 w-1 h-8 bg-neon-blue/40 rounded-full group-hover:bg-neon-pink/60 animate-[pulse_1s_infinite_0.2s]" />
                <span className="absolute -top-1 left-8 w-6 h-1 bg-neon-blue/30 rounded-full group-hover:bg-neon-pink/50 animate-ping" />
                
                <Monitor size={42} className="transition-transform duration-500 group-hover:rotate-1" />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 z-10 tracking-tight flex items-center gap-2">
                {isRtl ? "کلاینت ویندوز Loxx" : "LOXX Windows Client"}
              </h3>
              
              <p className="text-gray-300 text-xs mb-6 h-12 z-10 font-bold max-w-xs leading-relaxed text-center px-2">
                {isRtl 
                  ? "روان‌ترین تجربه تماس صوتی ریل‌تایم درون بازی + سیستم هوشمند ضد لگ و پینگ کم"
                  : "Smooth real-time voice chat + ultra low ping proxy integration."}
              </p>
              
              <a href={windowsUrl} target="_blank" rel="noopener noreferrer" className="w-full z-10">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-blue via-teal-400 to-neon-blue bg-[length:200%_auto] text-dark-bg font-black text-sm tracking-widest hover:bg-[right_center] transition-all duration-500 shadow-[0_10px_35px_rgba(0,229,255,0.4)] hover:shadow-[0_15px_45px_rgba(0,229,255,0.6)] cursor-pointer relative overflow-hidden flex items-center justify-center gap-2.5">
                    
                    {/* Metallic Shine Sweep with Framer Motion */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "linear"
                      }}
                    />
                    
                    <Download size={20} className="animate-bounce shrink-0" />
                    <span className="font-extrabold text-base">
                      {isRtl 
                        ? `دریافت نسخه ویندوز ${windowsVersion ? `(v${windowsVersion})` : 'مستقیم'}`
                        : `Download Windows Client ${windowsVersion ? `(v${windowsVersion})` : 'Direct'}`}
                    </span>
                  </button>
                </motion.div>
              </a>
              
              {/* Extra micro labels underneath button */}
              <span className="mt-3 text-[10px] text-neon-blue font-black tracking-widest uppercase z-10 group-hover:text-neon-pink transition-colors">
                {isRtl ? "حجم فایل کمتر از ۱۰۰ مگابایت" : "File size under 100 MB"}
              </span>

            </div>

            {/* Android */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-green-400 transition-colors">
                <Smartphone size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isRtl ? "اندروید" : "Android"}</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">
                {isRtl ? "دانلود مستقیم و گوگل‌پلی" : "Direct Download & Google Play"}
              </p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                {isRtl ? "در حال توسعه..." : "In Development..."}
              </button>
            </div>

            {/* iOS */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                <Apple size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isRtl ? "iOS" : "Apple iOS"}</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">
                {isRtl ? "اپ استور و نصب مستقیم" : "App Store & Direct IPA"}
              </p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                {isRtl ? "در حال توسعه..." : "In Development..."}
              </button>
            </div>

            {/* Mac OS */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-gray-200 transition-colors">
                <Monitor size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isRtl ? "مک OS" : "macOS"}</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">
                {isRtl ? "پشتیبانی از پردازنده‌های M1 و M2" : "Designed for Apple M1, M2 & M3"}
              </p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                {isRtl ? "به زودی" : "Coming Soon"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
