import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';

export const PrivacyPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-bg pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">حریم خصوصی و امنیت</h1>
            <p className="text-gray-400">سیاست‌های حفاظت از اطلاعات شما در لوکس</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none prose-p:text-gray-400 prose-headings:text-white bg-whtie/5 p-8 rounded-3xl border border-white/10"
          >
            <h2>چگونه از داده‌های شما محافظت می‌کنیم؟</h2>
            <p>در پلتفرم گیمینگ لوکس، امنیت و حفظ حریم خصوصی کاربران بالاترین اولویت ماست. تمام داده‌های متنی شما به صورت رمزنگاری شده در دیتابیس ذخیره می‌شوند.</p>
            
            <h2>مکالمات صوتی (Voice Chat)</h2>
            <p>مکالمات صوتی شما در لوکس از طریق تکنولوژی WebRTC و به صورت نقطه-به-نقطه (Peer-to-Peer) محافظت می‌شوند. ما صدای شما را ضبط نمی‌کنیم.</p>
            
            <h2>کوکی‌ها و نشست‌ها</h2>
            <p>لوکس برای حفظ ورود شما و ارائه تجربه‌ای روان از توکن‌های امن (Secure Tokens) استفاده می‌کند که فقط در مرورگر و برنامه شما معتبر هستند.</p>
            
            <h2>اشتراک گذاری اطلاعات</h2>
            <p>اطلاعات شما بدون اجازه صریح شما در اختیار هیچ شخص سومی قرار نخواهد گرفت مگر در صورت درخواست قضایی از مراجع قانونی کشور.</p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};
