const fs = require('fs');
let code = fs.readFileSync('src/pages/DownloadPage.tsx', 'utf8');

const replacement = `{/* Antivirus & Weak Internet Help Box */}
        <div className="w-full max-w-2xl mt-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-md">
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
        </div>`;

code = code.replace(/<div className="mt-8 flex items-center gap-2 text-xs text-gray-500 font-bold">[\s\S]*?<\/div>/, replacement);

fs.writeFileSync('src/pages/DownloadPage.tsx', code);
console.log('DownloadPage updated!');
