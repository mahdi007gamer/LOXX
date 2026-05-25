import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { question: "چگونه می‌توانم حساب کاربری خود را شارژ کنم؟", answer: "برای شارژ حساب، وارد بخش تنظیمات شده و از منوی مالی اقدام کنید." },
  { question: "آیا اپلیکیشن نسخه اندروید دارد؟", answer: "بله، نسخه اندروید در حال توسعه است و به زودی منتشر می‌شود." },
  { question: "پینگ من در لابی‌ها چگونه محاسبه می‌شود؟", answer: "پینگ شما با سرورهای ایران ما به صورت لحظه‌ای بررسی می‌شود." },
  { question: "آیا استفاده از برنامه رایگان است؟", answer: "استفاده از تمام امکانات پایه رایگان است، اما با اشتراک ویژه از امکانات بیشتری بهره‌مند می‌شوید." },
];

export const FAQPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-bg pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">سوالات متداول</h1>
            <p className="text-gray-400">پاسخ پرسش‌های پرتکرار شما درمورد لوکس</p>
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
                <summary className="flex cursor-pointer items-center justify-between font-bold text-white outline-none">
                  <span>{faq.question}</span>
                  <ChevronDown className="transition-transform group-open:rotate-180" size={20} />
                </summary>
                <div className="mt-4 text-sm leading-relaxed text-gray-400">
                  {faq.answer}
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
