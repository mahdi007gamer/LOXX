import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/landing/Footer';
import { useLanguage } from '../context/LanguageContext';

export const PrivacyPage = () => {
 const { language } = useLanguage();
 const isRtl = language === "fa";

 return (
 <>
 <Navbar />
 <main className="min-h-screen bg-[#050507] pt-32 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
 <div className="container mx-auto px-4 max-w-4xl">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
 <h1 className="text-4xl font-black text-white mb-4">
 {isRtl ? "حریم خصوصی و امنیت" : "Privacy Policy & Security"}
 </h1>
 <p className="text-gray-400 font-sans">
 {isRtl ? "سیاست‌های حفاظت از اطلاعات شما در لوکس" : "How we guard and secure your data inside the LOXX platform"}
 </p>
 </motion.div>
 
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 transition={{ delay: 0.2 }}
 className={`prose prose-invert max-w-none prose-p:text-gray-400 prose-headings:text-white bg-white/5 p-8 rounded-3xl border border-white/10 ${isRtl ? 'text-right' : 'text-left'}`}
 >
 {isRtl ? (
 <>
 <h2>چگونه از داده‌های شما محافظت می‌کنیم؟</h2>
 <p>در پلتفرم گیمینگ لوکس، امنیت و حفظ حریم خصوصی کاربران بالاترین اولویت ماست. تمام داده‌های متنی شما به صورت رمزنگاری شده در دیتابیس ذخیره می‌شوند.</p>
 
 <h2>مکالمات صوتی (Voice Chat)</h2>
 <p>مکالمات صوتی شما در لوکس از طریق تکنولوژی WebRTC و به صورت نقطه-به-نقطه (Peer-to-Peer) محافظت می‌شوند. ما صدای شما را ضبط نمی‌کنیم.</p>
 
 <h2>کوکی‌ها و نشست‌ها</h2>
 <p>لوکس برای حفظ ورود شما و ارائه تجربه‌ای روان از توکن‌های امن (Secure Tokens) استفاده می‌کند که فقط در مرورگر و برنامه شما معتبر هستند.</p>
 
 <h2>اشتراک گذاری اطلاعات</h2>
 <p>اطلاعات شما بدون اجازه صریح شما در اختیار هیچ شخص سومی قرار نخواهد گرفت مگر در صورت درخواست قضایی از مراجع قانونی کشور.</p>
 </>
 ) : (
 <>
 <h2>How do we protect your data?</h2>
 <p>On LOXX gaming hub, user security and privacy are our top directives. All of your textual messages, session files, and keys are heavily encrypted in our secure databases.</p>
 
 <h2>Voice Server & Audio Comms (Voice Chat)</h2>
 <p>Your audio communication flows are fully secured using WebRTC secure connections on peer-to-peer (P2P) protocol architectures. We do not recording, tapping or logs your private voice signals on our servers.</p>
 
 <h2>Cookies & Safe Sessions</h2>
 <p>Loxx utilizes security tokens browser local storage and secure context browser cookies only to maintain seamless authentication. These sessions are restricted to your device and sandbox container.</p>
 
 <h2>Data Disclosing Policy</h2>
 <p>Your personal data or connected game library metadata is never open, shared, or distributed to any 3rd-party vendor, except the strict requirements specified under governmental judicial orders.</p>
 </>
 )}
 </motion.div>
 </div>
 </main>
 <Footer />
 </>
 );
};
