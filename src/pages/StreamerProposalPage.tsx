import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, HeadphonesIcon, MessageSquare, Award, ArrowLeft, Phone, Mail, Instagram, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// We can build a reusable template in case they want it for other streamers.
const StreamerProposalPage = () => {
  const { name } = useParams<{ name?: string }>();
  
  // Default values for Rest_in_Peace
  const streamerId = name || 'Rest_in_Peace';
  const streamerName = streamerId === 'Rest_in_Peace' ? 'امیر' : streamerId;

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-neon-pink/30 relative overflow-x-hidden" dir="rtl">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[-10%] w-[30%] h-[40%] bg-neon-purple/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-neon-pink/10 rounded-full blur-[150px]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-12 lg:py-20">
        
        {/* Header content */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col-reverse md:flex-row justify-between items-center mb-16 gap-8"
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-right">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink mb-4 leading-tight">
              پیشنهاد همکاری استراتژیک <br className="hidden md:block"/> و اختصاصی
            </h1>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold text-sm">
              <Award className="w-4 h-4 ml-2 text-neon-pink" />
              پکیج اختصاصی Elite Streamer
            </div>
          </div>
          
          <div className="w-32 h-32 md:w-32 md:h-32 rounded-[28px] border border-white/10 shadow-[0_0_50px_rgba(0,229,255,0.1)] flex items-center justify-center p-2 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
            <img src="/logo.png" alt="LOXX Logo" className="w-full h-full object-cover rounded-[20px] relative z-10" />
          </div>
        </motion.header>

        {/* Introduction */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
            سلام {streamerName} عزیز ({streamerId})،
          </h2>
          <div className="text-lg text-gray-300 font-medium leading-relaxed max-w-4xl space-y-4">
            <p>امیدوارم حالت عالی باشه.</p>
            <p>
              ما در تیم <span className="text-white font-black">LOXX</span>، به عنوان پیشروترین پلتفرم زیرساختی و تعاملی گیمینگ ایران، در حال توسعه محیطی هوشمند و فوق‌العاده سریع هستیم تا استرس‌های فنی استریم از جمله پینگ بالا، عدم پایداری شبکه و دغدغه‌های مدیریت کامیونیتی رو به صفر برسونیم. با بررسی دقیق استریم‌های حرفه‌ای تو و پتانسیل بی‌نظیر کامیونیتی بزرگت، پکیج ویژه و اختصاصی <span className="text-neon-pink font-bold">Elite Streamer</span> رو متناسب با نیازهای تو طراحی کردیم.
            </p>
          </div>
        </motion.section>

        {/* What is LOXX */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1.5 h-8 bg-neon-pink rounded-full"></div>
            <h3 className="text-2xl font-black text-white">پلتفرم LOXX دقیقاً چیه؟</h3>
          </div>
          
          <div className="bg-[#0b0c10]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-gradient-to-l from-neon-blue/5 to-transparent pointer-events-none"></div>
             <p className="text-gray-300 font-medium text-lg leading-relaxed relative z-10">
               یک اکوسیستم جامع و چندپلتفرمی <span className="text-neon-blue font-bold px-1 py-0.5 rounded bg-neon-blue/10">(Windows, Android, Web)</span> که با بهره‌گیری از تکنولوژی پیشرفته <span className="text-neon-blue font-bold">Zero-TUN</span> و سرورهای داخلی اختصاصی، پایین‌ترین پینگ ممکن، ثبات بی‌نظیر در اتصال و بالاترین سطح امنیت را برای پلیرهای ایرانی فراهم می‌کنه. لوکس علاوه بر بهینه‌سازی شبکه، ابزارهای تعاملی کاملاً حرفه‌ای (فراتر از دیسکورد) برای کلن‌ها، لابی‌ها و چت سراسری در لحظه ارائه میده.
             </p>
          </div>
        </motion.section>

        {/* Why LOXX */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-8 bg-neon-pink rounded-full"></div>
            <h3 className="text-2xl font-black text-white">چرا همکاری با LOXX برای تو یه بازی برد-برده؟</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#0b0c10]/60 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-blue/10 rounded-full blur-[40px] group-hover:bg-neon-blue/20 transition-all"></div>
               <div className="flex items-start justify-between mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 text-neon-blue flex items-center justify-center">
                   <span className="font-black text-xl">۱</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl">
                   <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3">درآمد مستقیم و شفاف</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[15px]">
                 اعطای کد تخفیف اختصاصی با نام خودت که <span className="text-neon-blue font-bold px-1 rounded bg-neon-blue/10">۵۰٪ از کل فروش</span> رو به عنوان سهم درآمدی (Revenue Share) به صورت مستقیم، شفاف و آنی به حساب تو اختصاص میده.
               </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#0b0c10]/60 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-purple/10 rounded-full blur-[40px] group-hover:bg-neon-purple/20 transition-all"></div>
               <div className="flex items-start justify-between mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 text-neon-purple flex items-center justify-center">
                   <span className="font-black text-xl">۲</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl">
                   <HeadphonesIcon className="w-6 h-6 text-gray-400" />
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3">پشتیبانی VIP اختصاصی</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[15px]">
                 یک تیم فنی مجرب در تمام طول زمان استریم‌های تو کاملاً گوش‌به‌زنگ هستن تا هرگونه اختلال یا مشکل فنی احتمالی رو در <span className="text-neon-purple font-bold px-1 rounded bg-neon-purple/10">کمتر از ۳ دقیقه</span> برطرف و مدیریت کنن.
               </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0b0c10]/60 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden">
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-neon-pink/10 rounded-full blur-[40px] group-hover:bg-neon-pink/20 transition-all"></div>
               <div className="flex items-start justify-between mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-neon-pink/10 text-neon-pink flex items-center justify-center">
                   <span className="font-black text-xl">۳</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl">
                   <MessageSquare className="w-6 h-6 text-gray-400" />
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3">تکنولوژی Chat-Sync</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[15px]">
                 چت سراسری بسیار پرسرعت و لابی‌های هوشمند مدیریت‌شده که تعامل لحظه‌ای تو با بینندگان و سازماندهی اسکوادها و کلن‌ها رو به سطح جدیدی از حرفه‌ای بودن می‌بره.
               </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#0b0c10]/60 backdrop-blur-xl border border-white/5 hover:border-white/20 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden">
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#ffaa00]/10 rounded-full blur-[40px] group-hover:bg-[#ffaa00]/20 transition-all"></div>
               <div className="flex items-start justify-between mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-[#ffaa00]/10 text-[#ffaa00] flex items-center justify-center">
                   <span className="font-black text-xl">۴</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl">
                   <Award className="w-6 h-6 text-gray-400" />
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3">پنل هوشمند و اختصاصی Elite</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[15px]">
                 پروفایل کاملاً شخصی‌سازی شده با بالاترین سطح لول، نشان (Badge) منحصربه‌فرد بر روی پلتفرم و دسترسی به سیستم اطلاع‌رسانی پیشرفته برای هدایت و مدیریت کامیونیتی.
               </p>
            </div>

          </div>
        </motion.section>

        {/* Conclusion & Contact */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
             
             <div className="max-w-3xl mx-auto">
               <p className="text-xl text-gray-200 font-medium leading-relaxed mb-6">
                 تیم توسعه ما اینجاست تا هر قابلیت اختصاصی که برای مدیریت لابی‌ها یا اسپانسرشیپ‌هات نیاز داری رو در کوتاه‌ترین زمان ممکن برات پیاده‌سازی کنه.
               </p>
               <p className="text-xl text-white font-black leading-relaxed mb-10">
                 اگر مایل بودی، خوشحال می‌شیم یه تایم کوتاه برای یک جلسه آنلاین داشته باشیم تا جزئیات فنی و مالی این «آینده‌نگری مشترک» رو برات باز کنیم.
               </p>

               <div className="flex flex-col items-center justify-center gap-8 border-t border-white/10 pt-10">
                 <div>
                   <h5 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">لوکس؛ فراتر از یک اتصال.</h5>
                   <p className="text-sm text-gray-400 font-bold">تیم مدیریت LOXX</p>
                 </div>

                 {/* Contact Actions */}
                 <div className="flex flex-wrap items-center justify-center gap-4 w-full mt-2">
                   <a 
                     href="https://t.me/LOXXSUPPORT" 
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#00e5ff] font-bold transition-all"
                   >
                     <Send className="w-5 h-5" />
                     <span dir="ltr">@LOXXSUPPORT</span>
                   </a>
                   
                   <a 
                     href="mailto:partner@loxx.ir" 
                     className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
                   >
                     <Mail className="w-5 h-5" />
                     <span dir="ltr">partner@loxx.ir</span>
                   </a>

                   <div className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                     <Phone className="w-5 h-5 text-gray-400" />
                     <span dir="ltr">+98 902 000 0000</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </motion.section>
        
        {/* Footer */}
        <div className="text-center mt-12 pb-8">
           <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white font-bold transition-colors">
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به سایت اصلی
           </Link>
        </div>

      </div>
    </div>
  );
};

export default StreamerProposalPage;
