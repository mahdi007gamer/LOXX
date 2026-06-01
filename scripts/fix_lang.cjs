const fs = require('fs');
let txt = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

const oldFa = "در کلاینت آزمایشی لوکس، استریم به صورت مستقیم (Direct P2P) هندل می‌شود تا تاخیر به صفر نزدیک شود؛ به همین علت، ترافیک آپلود برای تک‌تک بیننده‌ها مجزا مصرف می‌شود. در نسخه‌های آتی، با راه‌اندازی سرورهای رله اختصاصی (SFU Gateway)، استریم شما تک‌مسیره به سرور فرستاده شده و نامحدود کاربر می‌توانند آن را بدون مصرف پردازش/آپلود بیشتر سیستم شما تماشا کنند.";
const oldEn = "In LOXX Beta, streams are handled via Direct P2P to achieve ultra-low response. Upload traffic is used per concurrent viewer. In future versions, dedicated Relay Servers (SFU Gateways) will stream single-route so unlimited users can join without extra system cost or upload bounds.";

const newFa = "در حال حاضر هسته نسل جدید استریمینگ لوکس در حالت آزمایشی (Beta) قرار دارد. این زیرساخت هوشمند با بهره‌گیری از الگوریتم‌های انحصاری شبکه، در تلاش است تا با مدیریت فوق‌پیشرفته ترافیک، بالاترین کیفیت تصویر را با کمترین تاخیر و پینگ برای گیمرها ارائه دهد. تیم مهندسی ما در حال گسترش و بهینه‌سازی مداوم این معماری ابری-هیبریدی است.";
const newEn = "The next-generation LOXX streaming engine is currently in its beta phase. This smart infrastructure leverages exclusive networking algorithms to deliver ultra-high video quality with near-zero latency through advanced traffic routing. Our engineering team is continuously fine-tuning this hybrid-cloud architecture for optimal peak performance.";

txt = txt.replace(oldFa, newFa);
txt = txt.replace(oldEn, newEn);

fs.writeFileSync('src/context/LanguageContext.tsx', txt);
