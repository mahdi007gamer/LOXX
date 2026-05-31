import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';
import { NeonCard } from '../components/ui/NeonCard';
import { BookOpen, ShieldAlert, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

export const TermsPage = () => {
  const { language } = useLanguage();
  const isRtl = language === "fa";

  return (
    <>
      <Navbar />
      <main className={cn("min-h-screen bg-[#07070F] pt-32 pb-24", isRtl ? "text-right" : "text-left")} dir={isRtl ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-12 relative"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-pink/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink mb-4 shadow-lg shadow-neon-pink/5">
              <BookOpen size={28} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 italic tracking-tight">
              {isRtl ? "قوانین و مقررات جامع" : "Terms & Conditions"}
            </h1>
            <p className="text-gray-400 font-sans text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              {isRtl ? "شرایط استفاده از پلتفرم گیمینگ و جامعه بازیکنان لوکس (LOXX)" : "Comprehensive Terms of Service and Community Rules for the LOXX Gaming Platform"}
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-sans">
              <Calendar size={14} className="text-neon-pink" />
              <span>
                {isRtl ? "تاریخ آخرین بروزرسانی: ۲۶ اردیبهشت ۱۴۰۵ (۱۵ می ۲۰۲۶)" : "Last updated: May 15, 2026"}
              </span>
            </div>
          </motion.div>
          
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <NeonCard variant="pink" className="p-6 md:p-8 bg-black/40 backdrop-blur-2xl border-none">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className={`text-lg font-black text-white italic mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {isRtl ? "کاربر گرامی و گرانقدر لوکس" : "Valued LOXX Gamer & Member"}
                  </h2>
                  <p className={`text-sm text-gray-300 leading-relaxed font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
                    {isRtl 
                      ? "با احترام به کاربران گرامی، مطالعه دقیق قوانین و مقررات زیر پیش از استفاده از خدمات پلتفرم گیمینگ لوکس (LOXX) الزامی است. ورود شما به پلتفرم و استفاده از هر یک از خدمات آن، به منزله آگاهی کامل و پذیرش تمامی موارد ذکر شده در این سند تلقی می‌شود."
                      : "Please review these comprehensive terms and legal parameters carefully. Entering LOXX or initiating connection tunnels constitutes non-restrictive legal consent and absolute alignment with the operational parameters, rules, and privacy codes defined within."}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>

          {/* Detailed Terms */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="space-y-8 bg-white/[0.02] backdrop-blur-3xl p-8 md:p-12 rounded-[32px] border border-white/5 relative overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute top-1/3 right-0 w-96 h-96 bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-neon-pink/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="space-y-10 relative z-10 font-sans">
              {isRtl ? (
                <>
                  {/* Section 1 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۱: تعاریف</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">پلتفرم لوکس:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">شامل وبسایت، کلاینت دسکتاپ ویندوز، اپلیکیشن‌های موبایل (در صورت ارائه آتی) و کلیه خدمات مرتبط با میزبانی، اتصال، ارتباط و مدیریت بازی‌های آنلاین و تحت شبکه.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">کاربر:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">شخص حقیقی یا حقوقی که در پلتفرم لوکس ثبت‌نام کرده و از خدمات آن استفاده می‌نماید.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">کلاینت ویندوز:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">نرم‌افزار اختصاصی لوکس برای سیستم‌عامل ویندوز که امکاناتی نظیر تونلینگ LAN با تکنولوژی Zero-TUN را فراهم می‌آورد.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">Zero-TUN:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">تکنولوژی اختصاصی لوکس برای ایجاد اتصالات کم‌تأخیر در بازی‌های تحت شبکه (LAN) از طریق هدایت هوشمند ترافیک.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all col-span-1 md:col-span-2">
                        <strong className="text-neon-pink block mb-1">اشتراق VIP/PLUS و محتوای کاربر:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">سطوح کاربری ویژه با امکانات افزوده و محتوای تولید شده توسط کاربر (UGC) شامل آواتار، نام کاربری، ویدیوها و چت‌ها که مسئولیت صحت و اخلاقی بودن آنها بر عهده مجری آن است.</span>
                      </div>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۲: شرایط عمومی ثبت‌نام و حساب کاربری</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۲.۱.</strong> کاربران موظفند اطلاعات صحیح، کامل و به‌روز در زمان ثبت‌نام ارائه دهند. مسئولیت هرگونه اشتباه در ارائه اطلاعات به عهده کاربر است.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۲.۲.</strong> هر کاربر مجاز به داشتن تنها یک حساب کاربری اصلی است. ایجاد حساب‌های متعدد با هدف سوءاستفاده یا دور زدن محدودیت‌ها ممنوع است.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۲.۳.</strong> حفظ و امنیت اطلاعات حساب کاربری (نام کاربری و رمز عبور) به عهده کاربر است. هرگونه مسئولیت ناشی از افشای اطلاعات حساب به شخص ثالث بر عهده کاربر خواهد بود.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۲.۴.</strong> پلتفرم لوکس حق رد درخواست ثبت‌نام، تعلیق یا حذف حساب کاربری در صورت تشخیص عدم رعایت قوانین یا رفتار غیرمتعارف را برای خود محفوظ می‌دارد.
                      </p>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۳: قوانین مربوط به خدمات و پلتفرم</span>
                    </h3>
                    <div className="space-y-4 pr-3 text-sm">
                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">۳.۱. سیستم Zero-TUN و کلاینت ویندوز:</h4>
                        <ul className="space-y-2 text-gray-300 pr-4 list-disc">
                          <li>الف) کلاینت ویندوز لوکس صرفاً برای تسهیل اتصال در بازی‌های مجاز طراحی شده است. هرگونه تلاش برای مهندسی معکوس، هک، تزریق کد مخرب یا استفاده غیرمجاز از این سیستم اکیداً ممنوع است.</li>
                          <li>ب) مسئولیت انطباق پورت‌های مورد استفاده بازی با قوانین آنتی‌ویروس یا فایروال سیستم کاربر، به عهده کاربر است. لوکس راهنمایی‌های لازم را در صورت بروز تداخل ارائه خواهد داد.</li>
                          <li>پ) استفاده از سیستم Zero-TUN صرفاً برای اتصال به بازی‌های قانونی مجاز است. هرگونه استفاده برای مقاصد تجاری، دسترسی غیرمجاز به شبکه‌ها یا فعالیت‌های غیرقانونی، منجر به پیگرد قانونی خواهد شد.</li>
                        </ul>
                      </div>

                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">۳.۲. محتوای چت و ارتباطات:</h4>
                        <ul className="space-y-2 text-gray-300 pr-4 list-disc">
                          <li>الف) استفاده از زبان توهین‌آمیز، نژادپرستانه، تبعیض‌آمیز، تهدیدآمیز، حاوی محتوای جنسی یا نفرت‌پراکنی در تمامی بخش‌های ارتباطی پلتفرم (چت لابی، چت سراسری، پیام خصوصی) ممنوع است.</li>
                          <li>ب) انتشار اطلاعات خصوصی دیگران بدون رضایت آنها، ممنوع است.</li>
                          <li>پ) اسپم کردن، ارسال پیام‌های تکراری یا تبلیغات غیرمجاز در چت‌ها ممنوع است.</li>
                        </ul>
                      </div>

                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">۳.۳. سیستم اشتراک VIP/PLUS:</h4>
                        <ul className="space-y-2 text-gray-300 pr-4 list-disc">
                          <li>الف) اشتراک‌های VIP و PLUS پس از فعال‌سازی، غیرقابل استرداد (Non-refundable) هستند، مگر در مواردی که پلتفرم لوکس قادر به ارائه خدمات نباشد.</li>
                          <li>ب) فروش، انتقال یا اشتراک‌گذاری حساب کاربری یا اشتراک ویژه با دیگران بدون مجوز رسمی، تخلف محسوب می‌شود.</li>
                          <li>پ) لوکس حق تغییر، تعدیل یا حذف برخی از امکانات اشتراک‌ها را با اطلاع‌رسانی قبلی برای خود محفوظ می‌دارد.</li>
                        </ul>
                      </div>

                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">۳.۴. حفظ حریم خصوصی و داده‌ها:</h4>
                        <ul className="space-y-2 text-gray-300 pr-4 list-disc">
                          <li>الف) اطلاعات کاربری شما مطابق با «سیاست حفظ حریم خصوصی لوکس» جمع‌آوری، استفاده و محافظت می‌شود.</li>
                          <li>ب) مکالمات صوتی (Voice Chat) از طریق پروتکل P2P (Peer-to-Peer) و به صورت End-to-End Encrypted انجام شده و در سرورهای لوکس ذخیره یا شنود نمی‌شوند.</li>
                          <li>پ) لوکس از کوکی‌ها و توکن‌های امنیتی برای بهبود تجربه کاربری و حفظ امنیت جلسات استفاده می‌کند.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Section 4 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۴: حقوق مالکیت معنوی</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۴.۱.</strong> کلیه حقوق مادی و معنوی مربوط به پلتفرم لوکس، شامل طراحی رابط کاربری، کدها، لوگوها، نام تجاری، محتوای متنی و گرافیکی اختصاصی، متعلق به خانواده و تیم توسعه‌دهنده لوکس است.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۴.۲.</strong> ایجاد هرگونه کپی، توزیع، تغییر یا استفاده تجاری از بخش‌هایی از پلتفرم بدون کسب اجازه کتبی ممنوع است.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۴.۳.</strong> امتیاز و حق استفاده از فونت‌های فارسی (مانند فونت کلامه) و سایر دارایی‌های گرافیکی مطابق با لایسنس‌های مربوطه رعایت خواهد شد.
                      </p>
                    </div>
                  </section>

                  {/* Section 5 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۵: مسئولیت‌ها و محدودیت‌ها</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۵.۱.</strong> پلتفرم لوکس تلاش می‌کند تا حداکثر پایداری و در دسترس بودن خدمات را فراهم آورد، اما هیچ تضمینی در خصوص عدم قطعی یا خطاهای احتمالی در سرویس‌ها، به‌ویژه در شرایط فورس ماژور (مانند حملات DDoS، قطعی اینترنت جهانی، بلایای طبیعی) ارائه نمی‌دهد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۵.۲.</strong> لوکس هیچگونه مسئولیتی در قبال محتوای تولید شده توسط کاربران، از جمله صحت، کامل بودن یا قانونی بودن آن ندارد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۵.۳.</strong> لوکس مسئولیتی در قبال خسارات احتمالی ناشی از استفاده نادرست کاربر از پلتفرم، نقص در سیستم‌های کاربر (مانند آنتی‌ویروس) یا استفاده از نسخه‌های دستکاری شده کلاینت ندارد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۵.۴.</strong> در صورت نیاز به ارتقاء یا نگهداری فنی، ممکن است دسترسی موقت به بخشی از خدمات محدود شود. لوکس تلاش خواهد کرد این محدودیت‌ها را در ساعات کم‌ترافیک اعمال و اطلاع‌رسانی نماید.
                      </p>
                    </div>
                  </section>

                  {/* Section 6 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۶: قوانین مربوط به پرداخت و اشتراک</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۶.۱.</strong> تمامی پرداخت‌ها از طریق درگاه‌های امن بانکی و با رعایت استانداردهای امنیتی صورت می‌گیرد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۶.۲.</strong> اطلاعات کارت بانکی کاربران در سرورهای لوکس ذخیره نمی‌شود.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۶.۳.</strong> کاربران موظفند از کارت‌های بانکی معتبر و متعلق به خود برای انجام تراکنش‌ها استفاده نمایند. هرگونه تراکنش از طریق کارت‌های سرقتی، پیگرد قانونی دارد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۶.۴.</strong> قوانین مربوط به بازگشت وجه صرفاً در شرایط اضطراری خاص و با تایید مدیریت کل لوکس بررسی خواهد شد.
                      </p>
                    </div>
                  </section>

                  {/* Section 7 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۷: رسیدگی به تخلفات و جرائم</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۷.۱.</strong> در صورت نقض هر یک از مواد این توافقنامه، لوکس حق دارد به صلاحدید خود، اقداماتی چون اخطار کتبی، محدودسازی موقت دسترسی، تعلیق موقت یا دائم حساب کاربری، و پیگیری حقوقی و قضایی در مراجع ذیصلاح را در پیش گیرد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۷.۲.</strong> لوکس با نهادهای قضایی و امنیتی در چارچوب قوانین جمهوری اسلامی ایران همکاری کامل خواهد کرد.
                      </p>
                    </div>
                  </section>

                  {/* Section 8 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۸: تغییرات در قوانین</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۸.۱.</strong> لوکس حق بازنگری و اعمال تغییرات در این قوانین را در هر زمان برای خود محفوظ می‌دارد. تغییرات پس از انتشار در صفحه قوانین و مقررات پلتفرم، لازم‌الاجرا خواهند بود.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۸.۲.</strong> ادامه استفاده شما از پلتفرم پس از اعمال تغییرات، به منزله پذیرش قوانین جدید است.
                      </p>
                    </div>
                  </section>

                  {/* Section 9 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۹: قوانین مربوط به به‌روزرسانی خودکار (Auto-Updater)</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۹.۱.</strong> سیستم به‌روزرسانی خودکار برای کلاینت ویندوز لوکس طراحی شده است تا تجربه کاربری بدون وقفه را تضمین کند.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۹.۲.</strong> فرآیند دانلود و نصب به‌روزرسانی‌ها ممکن است نیازمند دسترسی ادمین (Administrator Privileges) باشد.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۹.۳.</strong> لوکس هیچ مسئولیتی در قبال اختلال در فرآیند به‌روزرسانی به دلیل مشکلات سیستم‌عامل کاربر ندارد.
                      </p>
                    </div>
                  </section>

                  {/* Section 10 */}
                  <section className="space-y-3.5 border-b border-white/5 pb-8">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-r-4 border-neon-pink pr-3">
                      <span>ماده ۱۰: قوانین متفرقه</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pr-3">
                      <p>
                        <strong className="text-white ml-1">۱۰.۱.</strong> این قوانین تابع قوانین جمهوری اسلامی ایران هستند.
                      </p>
                      <p>
                        <strong className="text-white ml-1">۱۰.۲.</strong> در صورت بروز هرگونه اختلاف، تلاش برای حل دوستانه در اولویت است و در غیر این صورت، از طریق مراجع قانونی صالحه پیگیری خواهد شد.
                      </p>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  {/* English Section 1 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-l-4 border-neon-pink pl-3">
                      <span>Article 1: Definitions</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">LOXX Platform:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">Consists of the website, Windows launcher app, dynamic lobby channels, state managers, and integrated network multiplayer connection tunnels.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">User:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">Any physical or legal entity completing the registration flow and utilising client-side interface tools.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">Windows Client:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">Dedicated desktop software integrating advanced Zero-TUN tunneling features.</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                        <strong className="text-neon-pink block mb-1">Zero-TUN Node:</strong>
                        <span className="text-sm text-gray-300 leading-relaxed">Custom gaming-oriented VPN tunnels to simulate immediate local LAN servers over distant backbones.</span>
                      </div>
                    </div>
                  </section>

                  {/* English Section 2 */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-l-4 border-neon-pink pl-3">
                      <span>Article 2: General Account Rules</span>
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300 leading-relaxed pl-3">
                      <p>
                        <strong className="text-white mr-1">2.1.</strong> Users are required to support reliable and accurate data inside forms. Incorrect details can lead to temporal locks.
                      </p>
                      <p>
                        <strong className="text-white mr-1">2.2.</strong> Single master profile limit exists per person. Creating multi-client bots or shadow accounts is restricted.
                      </p>
                      <p>
                        <strong className="text-white mr-1">2.3.</strong> User maintains absolute accountability over details, access keys, and passwords.
                      </p>
                    </div>
                  </section>

                  {/* English Section 3 */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-l-4 border-neon-pink pl-3">
                      <span>Article 3: Service Compliance</span>
                    </h3>
                    <div className="space-y-4 pl-3 text-sm">
                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">3.1. Tunnel Integrity:</h4>
                        <p className="text-gray-300">Any active attempts to reverse-engineer files, hook native processes, manipulate game states, or bypass licensing lead to permanent hardware and IP restrictions.</p>
                      </div>
                      <div className="space-y-2 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white mb-2">3.2. Community Interaction:</h4>
                        <p className="text-gray-300">Offensive, abusive, or spammy remarks inside active chat logs, voice channels, or custom lobbies are strictly forbidden.</p>
                      </div>
                    </div>
                  </section>

                  {/* English Section 4: Intellectual Property */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-l-4 border-neon-pink pl-3">
                      <span>Article 4: Intellectual Property</span>
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed pl-3">
                      All systems, designs, vector interfaces, code fragments, fonts, and assets are properties of LOXX engineering teams.
                    </p>
                  </section>

                  {/* English Section 5: Limits */}
                  <section className="space-y-3.5">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-3 border-l-4 border-neon-pink pl-3">
                      <span>Article 5: Limitation of Liability</span>
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed pl-3">
                      We secure maximum host uptime, yet system failures arising from DDoS, national gateway interruptions, or acts of God represent force majeure exceptions.
                    </p>
                  </section>
                </>
              )}
            </div>
            
            <div className="mt-8 text-center text-gray-400 font-sans border-t border-white/5 pt-6 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-bold">
                {isRtl ? "با تشکر از همراهی شما با پلتفرم لوکس." : "Thank you for riding with the LOXX global gaming network."}
              </p>
              <div className="px-6 py-2 rounded-2xl bg-neon-pink/5 border border-neon-pink/20 text-xs font-black text-neon-pink tracking-widest uppercase">
                {isRtl ? "تیم توسعه لوکس" : "LOXX core development team"}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};
