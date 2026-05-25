import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Monitor, Apple, Smartphone, Download } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";

export const DownloadSection = () => {
  const [windowsVersion, setWindowsVersion] = useState<string | null>(null);
  const [windowsUrl, setWindowsUrl] = useState<string>("https://loxx.ir/updater/loxx-setup.exe");

  useEffect(() => {
    // Attempt to fetch latest.yml to get the exact version/url
    const fetchLatest = async () => {
      try {
        const res = await fetch("https://loxx.ir/updater/latest.yml", { cache: "no-store" });
        if (res.ok) {
          const text = await res.text();
          // parse version
          const versionMatch = text.match(/version:\s*(.+)/);
          if (versionMatch && versionMatch[1]) {
            setWindowsVersion(versionMatch[1].trim());
          }
          // parse path
          const pathMatch = text.match(/path:\s*(.+)/);
          if (pathMatch && pathMatch[1]) {
            setWindowsUrl(`https://loxx.ir/updater/${pathMatch[1].trim()}`);
          }
        }
      } catch (err) {
        console.warn("Could not fetch latest.yml for download section", err);
      }
    };
    fetchLatest();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden" id="download">
      <div className="absolute inset-0 bg-neon-blue/5 skew-y-3 transform -z-10" />
      
      <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">دریافت <span className="neon-text-blue">کلاینت‌های</span> لوکس</h2>
          <p className="text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
            برای تجربه بدون لگ همراه با تماس صوتی یکپارچه داخل بازی و اورلی ویندوز، کلاینت اختصاصی لوکس را دریافت کنید.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Windows */}
            <div className="bg-black/40 border border-neon-blue/30 rounded-3xl p-8 flex flex-col items-center justify-between hover:bg-black/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-6 h-20 w-20 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.2)] group-hover:scale-110 transition-transform z-10">
                <Monitor size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 z-10">ویندوز</h3>
              <p className="text-gray-400 text-sm mb-6 h-10 z-10">نسخه پایدار برای ویندوز ۱۰ و ۱۱</p>
              
              <a href={windowsUrl} target="_blank" rel="noreferrer" className="w-full z-10">
                <GlowButton variant="blue" className="w-full justify-center">
                  <Download size={18} className="ml-2" />
                  دانلود {windowsVersion ? `(v${windowsVersion})` : 'مستقیم'}
                </GlowButton>
              </a>
            </div>

            {/* Android */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-green-400 transition-colors">
                <Smartphone size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">اندروید</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">دانلود مستقیم و گوگل‌پلی</p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                در حال توسعه...
              </button>
            </div>

            {/* iOS */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                <Apple size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">iOS</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">اپ استور و نصب مستقیم</p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                در حال توسعه...
              </button>
            </div>

            {/* Mac OS */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-between relative overflow-hidden transition-all group hover:bg-white/10">
              <div className="mb-6 h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-gray-200 transition-colors">
                <Monitor size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">مک OS</h3>
              <p className="text-gray-500 text-sm mb-6 h-10 group-hover:text-gray-400 transition-colors">پشتیبانی از پردازنده‌های M1 و M2</p>
              
              <button disabled className="w-full py-3 rounded-xl bg-black/50 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed">
                به زودی
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
