import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const faqs = [
 { 
 questionFa: "چگونه می‌توانم حساب کاربری خود را شارژ کنم؟", 
 answerFa: "برای شارژ حساب، وارد بخش تنظیمات شده و از منوی مالی اقدام کنید.",
 questionEn: "How can I top up my credit or coins?",
 answerEn: "Go to launcher settings and open membership panel to purchase premium plans or manage balances."
 },
 { 
 questionFa: "آیا اپلیکیشن نسخه اندروید دارد؟", 
 answerFa: "بله، نسخه اندروید در حال توسعه است و به زودی منتشر می‌شود.",
 questionEn: "Is there an Android client available?",
 answerEn: "Yes, our mobile companion is currently in development and will be released very soon directly on local stores."
 },
 { 
 questionFa: "پینگ من در لابی‌ها چگونه محاسبه می‌شود؟", 
 answerFa: "پینگ شما با سرورهای ایران ما به صورت لحظه‌ای بررسی می‌شود.",
 questionEn: "How is my lobby ping calculated?",
 answerEn: "Your dynamic ping is real-time audited with our premium Iran telemetry hubs to ensure zero delay."
 },
 { 
 questionFa: "آیا استفاده از برنامه رایگان است؟", 
 answerFa: "استفاده از تمام امکانات پایه رایگان است، اما با اشتراک ویژه از امکانات بیشتری بهره‌مند می‌شوید.",
 questionEn: "Is LOXX completely free of charge?",
 answerEn: "Yes, standard matchmaking and sound lobby flows are 100% free. Optional features are tailored inside Loxx VIP."
 },
];

export const FAQPage = () => {
 const { language } = useLanguage();
 const isRtl = language === "fa";

 return (
 <>
 <Navbar />
 <main className="min-h-screen bg-[#050507] pt-32 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="container mx-auto px-4 max-w-3xl">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
 <h1 className="text-4xl font-black text-white mb-4">
 {isRtl ? "سوالات متداول" : "Frequently Asked Questions"}
 </h1>
 <p className="text-gray-400">
 {isRtl ? "پاسخ پرسش‌های پرتکرار شما درمورد لوکس" : "Quick answers to common questions about the LOXX platform"}
 </p>
 </motion.div>
 
 <div className="space-y-4">
 {faqs.map((faq, index) => (
 <motion.details
 key={index}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.1 }}
 className="group rounded-2xl bg-white/5 border border-white/10 p-6 [&_summary::-webkit-details-marker]:hidden"
 >
 <summary className={`flex cursor-pointer items-center justify-between font-bold text-white outline-none ${isRtl ? 'text-right' : 'text-left'}`}>
 <span>{isRtl ? faq.questionFa : faq.questionEn}</span>
 <ChevronDown className={`transition-transform group-open:rotate-180 ${isRtl ? 'mr-auto pl-2' : 'ml-auto pr-2'}`} size={20} />
 </summary>
 <div className={`mt-4 text-sm leading-relaxed text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>
 {isRtl ? faq.answerFa : faq.answerEn}
 </div>
 </motion.details>
 ))}
 </div>
 </div>
 </main>
 <Footer />
 </>
 );
};
