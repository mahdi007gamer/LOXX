import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';

export const TermsPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-bg pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-4">قوانین و مقررات</h1>
            <p className="text-gray-400">آخرین بروزرسانی: اردیبهشت ۲۰۲۶</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none prose-p:text-gray-400 prose-headings:text-white bg-white/5 p-8 rounded-3xl border border-white/10"
          >
            <h2>۱. شرایط استفاده</h2>
            <p>کاربر محترم لطفا موارد زیر را جهت استفاده بهینه از خدمات لوکس به دقت ملاحظه فرمایید. ورود شما به لوکس و ایجاد حساب کاربری به معنای آگاه بودن و پذیرفتن شرایط و قوانین است.</p>
            
            <h2>۲. حریم خصوصی</h2>
            <p>ما متعهد هستیم که از حریم خصوصی شما محافظت کنیم. اطلاعات شخصی شما نزد ما محفوظ بوده و صرفا جهت ارائه خدمات بهتر مورد استفاده قرار می‌گیرد.</p>
            
            <h2>۳. رفتار کاربران</h2>
            <p>کاربران موظفند در تعامل با سایر کاربران در محیط اتاق‌های صوتی و متنی شئونات اخلاقی را رعایت نمایند. هرگونه توهین، تهدید و نقض قوانین منجر به مسدودی حساب کاربری خواهد شد.</p>

            <h2>۴. بازپرداخت و مالی</h2>
            <p>هزینه‌های مربوط به اشتراک ویژه و سرویس‌ها غیر قابل استرداد می‌باشند. لطفاً در خرید خود دقت کافی را داشته باشید.</p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};
