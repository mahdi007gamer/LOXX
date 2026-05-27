import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, HeadphonesIcon, MessageSquare, Award, ArrowLeft, Phone, Mail, Instagram, Send, CheckCircle2, AlertCircle, User, Zap } from 'lucide-react';

// Mini Components for Animations
const RevenueAnimation = () => {
    const [amount, setAmount] = useState(12500000);
    const [isMax, setIsMax] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setAmount(prev => {
                const next = prev + Math.floor(Math.random() * 8000000) + 4000000;
                if (next > 100000000) {
                    setIsMax(true);
                    clearInterval(interval);
                    return 105000000;
                }
                return next;
            });
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-6 border-t border-white/10 pt-4 h-32 flex flex-col justify-center items-center relative overflow-hidden rounded-xl bg-black/40">
           {isMax && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute inset-0 bg-green-500/20 blur-xl"
              />
           )}
           <p className="text-gray-400 text-[13px] mb-2 font-bold z-10">درجهت رشد درآمد شما</p>
           <motion.div 
               key={amount}
               initial={{ y: 5, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className={`text-2xl font-black z-10 flex flex-col items-center transition-colors duration-500 ${isMax ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-neon-blue'}`}
           >
              <span dir="ltr">+{new Intl.NumberFormat('fa-IR').format(amount)} تومان</span>
           </motion.div>
           <AnimatePresence>
             {isMax && (
                 <motion.span 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-green-400 text-xs mt-2 font-black z-10 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full flex items-center gap-1"
                 >
                   <Zap className="w-3 h-3" /> حد نصاب تسویه فوری
                 </motion.span>
             )}
           </AnimatePresence>
        </div>
    );
};

const SupportAnimation = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const sequence = async () => {
            await new Promise(r => setTimeout(r, 1000));
            setStep(1);
            await new Promise(r => setTimeout(r, 1500));
            setStep(2);
            await new Promise(r => setTimeout(r, 2000));
            setStep(3);
            await new Promise(r => setTimeout(r, 3500));
            setStep(0);
        };
        const interval = setInterval(sequence, 8500);
        sequence();
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-6 border-t border-white/10 pt-4 h-36 flex flex-col justify-center gap-2 relative overflow-hidden rounded-xl bg-black/40 p-3">
            <AnimatePresence mode="popLayout">
                {step >= 1 && (
                    <motion.div initial={{opacity:0, scale:0.9, x:-20}} animate={{opacity:1, scale:1, x:0}} exit={{opacity:0}} className="self-end bg-red-500/10 border border-red-500/20 rounded-xl rounded-tr-sm p-2.5 max-w-[90%]">
                        <p className="text-xs text-red-300 font-bold flex items-center gap-1.5">
                           <AlertCircle className="w-3.5 h-3.5"/> پینگم تو لابی بالا رفت!
                        </p>
                    </motion.div>
                )}
                {step >= 2 && (
                    <motion.div initial={{opacity:0, scale:0.9, x:20}} animate={{opacity:1, scale:1, x:0}} exit={{opacity:0}} className="self-start bg-neon-purple/10 border border-neon-purple/20 rounded-xl rounded-tl-sm p-2.5 max-w-[90%] mt-1">
                        <p className="text-[11px] text-neon-purple font-bold flex items-center gap-1">
                          <Shield className="w-3 h-3" /> در حال بررسی و تغییر مسیر...
                        </p>
                    </motion.div>
                )}
                {step >= 3 && (
                    <motion.div initial={{opacity:0, scale:0.9, x:20}} animate={{opacity:1, scale:1, x:0}} exit={{opacity:0}} className="self-start bg-green-500/10 border border-green-500/20 rounded-xl rounded-tl-sm p-2.5 max-w-[90%] mt-1">
                        <p className="text-[11px] text-green-300 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5"/> روتینگ بهینه‌تر جایگزین شد، مانیتور کنید.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ChatAnimation = () => {
    const [msgs, setMsgs] = useState([
       { u: 'Parsa', text: 'بچه‌ها استریم کی شروع میشه؟' }
    ]);

    useEffect(() => {
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count === 1) setMsgs(p => [...p, { u: 'Amir_Pro', text: 'لابی اختصاصی باز شد بیاید جوین شید' }]);
            if (count === 2) setMsgs(p => [...p, { u: 'Mehdi', text: 'من اینوایت ری‌کوئست دادم' }]);
            if (count === 4) { 
                setMsgs([{ u: 'Parsa', text: 'بچه‌ها استریم کی شروع میشه؟' }]); 
                count = 0; 
            }
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-6 border-t border-white/10 pt-4 h-36 flex flex-col gap-2 relative overflow-hidden rounded-xl bg-black/40 p-3">
           <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-neon-pink/10 px-2.5 py-1 rounded-md border border-neon-pink/30 z-10 shadow-[0_0_15px_rgba(255,0,128,0.2)]">
               <motion.div animate={{scale:[1, 1.3, 1], opacity: [1, 0.5, 1]}} transition={{repeat: Infinity, duration: 1.5}} className="w-1.5 h-1.5 bg-neon-pink rounded-full shadow-[0_0_5px_#ff0080]"/>
               <span className="text-[10px] text-neon-pink font-black tracking-wider">1,248 ONLINE</span>
           </div>
           
           <div className="flex flex-col gap-2 justify-end h-full mask-image:linear-gradient(to_bottom,transparent,black_20%)">
              <AnimatePresence mode="popLayout">
                {msgs.map((m, i) => (
                    <motion.div 
                        key={i + m.text} 
                        initial={{opacity:0, y:10, scale:0.95}} 
                        animate={{opacity:1, y:0, scale:1}} 
                        layout
                        className="flex gap-2 items-center"
                    >
                       <div className="w-5 h-5 rounded overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 flex items-center justify-center border border-white/10">
                         <User className="w-3 h-3 text-gray-400" />
                       </div>
                       <span className="text-[11px] text-gray-300 font-bold flex-shrink-0">{m.u}:</span>
                       <span className="text-[11px] text-gray-400 truncate">{m.text}</span>
                    </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
    );
};

const ProfileAnimation = ({ name }: { name: string }) => {
    return (
        <div className="mt-6 border-t border-white/10 pt-4 h-36 flex items-center justify-center relative overflow-hidden rounded-xl bg-black/40 p-3">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,170,0,0.1),transparent_70%)]"></div>
             
             <div className="w-full max-w-[220px] rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-3 relative overflow-hidden group shadow-xl">
                 <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-transparent via-[#ffaa00] to-transparent opacity-50"></div>
                 <div className="absolute bottom-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent opacity-50"></div>
                 
                 <div className="flex gap-4 items-center relative z-10">
                     <div className="w-12 h-12 rounded-full border-2 border-[#ffaa00] relative flex-shrink-0 bg-[#12121a] p-0.5 shadow-[0_0_15px_rgba(255,170,0,0.3)]">
                         <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                            <User className="w-6 h-6 text-gray-400" />
                         </div>
                         <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-[#0b0c10] z-20"></div>
                     </div>
                     <div className="flex flex-col flex-1 pb-1">
                         <span className="text-white font-black text-xs truncate max-w-[100px]" title={name}>{name}</span>
                         <span className="text-[#ffaa00] text-[9px] font-black tracking-widest mt-0.5 flex items-center gap-1 uppercase">
                            <Award className="w-2.5 h-2.5"/> ELITE PARTNER
                         </span>
                         <div className="mt-2 w-full flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div animate={{width: ['10%', '98%', '98%']}} transition={{duration: 4, repeat: Infinity, ease: 'linear'}} className="h-full bg-gradient-to-l from-[#ffaa00] to-yellow-300 rounded-full"></motion.div>
                            </div>
                            <span className="text-[8px] text-gray-400 font-mono font-bold">Lvl.99</span>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const EnvelopeIntro = ({ onOpen, streamerName }: { onOpen: () => void, streamerName: string }) => {
    const [opening, setOpening] = useState(false);
    
    const handleOpenClick = () => {
        setOpening(true);
        setTimeout(() => {
            onOpen();
        }, 800);
    };

    return (
        <motion.div 
           initial={{ opacity: 1 }}
           exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="fixed inset-0 z-50 bg-[#050508] flex items-center justify-center overflow-hidden"
        >
             {/* Background Particles/Glow */}
             <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] bg-neon-blue/10 rounded-full blur-[100px]"
                />
             </div>
             
             <motion.div 
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={opening ? { y: -50, opacity: 0, scale: 1.2 } : { y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "anticipate" }}
                className="relative z-10 flex flex-col items-center px-4"
             >
                 {/* The Envelope */}
                 <div 
                    onClick={!opening ? handleOpenClick : undefined}
                    className="relative w-[320px] h-[220px] md:w-[420px] md:h-[280px] bg-gradient-to-b from-[#12141a] to-[#0a0a0f] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer group flex flex-col items-center justify-center group"
                 >
                     <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
                     
                     <motion.div 
                         animate={{ rotate: 360 }}
                         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                         className="absolute -right-20 -top-20 w-40 h-40 bg-neon-blue/20 blur-[50px] rounded-full"
                     />
                     <motion.div 
                         animate={{ rotate: -360 }}
                         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                         className="absolute -left-20 -bottom-20 w-40 h-40 bg-neon-pink/20 blur-[50px] rounded-full"
                     />

                     <div className="relative z-10 flex flex-col items-center transition-transform duration-500 group-hover:scale-105">
                         <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-neon-blue/40 bg-neon-blue/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,255,0.3)] backdrop-blur-md">
                             <Mail className="w-6 h-6 md:w-8 md:h-8 text-neon-blue" />
                         </div>
                         <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-center tracking-tight">دعوت‌نامه اختصاصی</h2>
                         <div className="mt-4 py-1.5 px-4 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-sm text-gray-300 font-bold">برای: <span className="text-white font-black ml-1">{streamerName}</span></span>
                         </div>
                     </div>
                 </div>
                 
                 <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={!opening ? handleOpenClick : undefined}
                    className="mt-12 px-8 py-4 bg-white text-[#050508] rounded-full font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-shadow overflow-hidden relative group"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <span className="relative z-10">باز کردن پیشنهاد استراتژیک</span>
                 </motion.button>
             </motion.div>
        </motion.div>
    )
}

// Main Page
const StreamerProposalPage = () => {
  const { name } = useParams<{ name?: string }>();
  
  const streamerId = name || 'Rest_in_Peace';
  const streamerName = streamerId === 'Rest_in_Peace' ? 'امیر' : streamerId;

  const [isOpened, setIsOpened] = useState(false);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-neon-pink/30 relative overflow-x-hidden flex flex-col" dir="rtl">
      
      {/* Envelope Overlay */}
      <AnimatePresence>
        {!isOpened && (
           <EnvelopeIntro onOpen={() => setIsOpened(true)} streamerName={streamerName} />
        )}
      </AnimatePresence>

      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[150px]" />
        <motion.div animate={{ opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 7, repeat: Infinity }} className="absolute top-[40%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 rounded-full blur-[150px]" />
        <motion.div animate={{ opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 6, repeat: Infinity }} className="absolute bottom-[-10%] right-[20%] w-[50%] h-[50%] bg-neon-pink/10 rounded-full blur-[150px]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-12 lg:py-20 relative z-10 flex-1">
        
        {/* Header content */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col-reverse md:flex-row justify-between items-center mb-16 gap-8"
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-right">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink mb-4 leading-tight drop-shadow-sm">
              پیشنهاد همکاری استراتژیک <br className="hidden md:block"/> و اختصاصی
            </h1>
            <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white shadow-lg backdrop-blur-sm">
              <Award className="w-4 h-4 ml-2 text-[#ffaa00]" />
              <span className="font-bold text-sm tracking-wide mt-0.5">پکیج اختصاصی <span className="text-[#ffaa00] font-black uppercase tracking-wider mx-1">Elite Streamer</span></span>
            </div>
          </div>
          
          <div className="w-40 h-16 md:w-56 md:h-20 flex items-center justify-center relative group overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl rounded-3xl"></div>
            <img src="/logo.png" alt="LOXX Logo" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>
        </motion.header>

        {/* Introduction */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
            سلام {streamerName} عزیز <span className="opacity-50 text-xl font-mono mx-1">({streamerId})</span>،
          </h2>
          <div className="text-lg text-gray-300 font-medium leading-loose max-w-4xl space-y-6 bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
            <p>امیدوارم حالت عالی باشه.</p>
            <p>
              ما در تیم <span className="text-white font-black tracking-wider">LOXX</span>، به عنوان پیشروترین پلتفرم زیرساختی و تعاملی گیمینگ ایران، در حال توسعه محیطی هوشمند و فوق‌العاده سریع هستیم تا استرس‌های فنی استریم از جمله پینگ بالا، عدم پایداری شبکه و دغدغه‌های مدیریت کامیونیتی رو به صفر برسونیم.
            </p>
            <p>
              با بررسی دقیق استریم‌های حرفه‌ای تو و پتانسیل بی‌نظیر کامیونیتی بزرگت، پکیج ویژه و اختصاصی <span className="text-neon-pink font-black uppercase tracking-wide">Elite Streamer</span> رو متناسب با نیازهای تو طراحی کردیم.
            </p>
          </div>
        </motion.section>

        {/* What is LOXX */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1.5 h-8 bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,128,0.5)]"></div>
            <h3 className="text-2xl font-black text-white">پلتفرم LOXX دقیقاً چیه؟</h3>
          </div>
          
          <div className="bg-gradient-to-br from-[#0b0c10]/80 to-[#12121a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
             <div className="absolute top-0 right-0 w-[50%] h-[150%] bg-gradient-to-l from-neon-blue/5 to-transparent pointer-events-none transform rotate-12 translate-x-20 -translate-y-10"></div>
             
             <p className="text-gray-300 font-medium text-[17px] leading-loose relative z-10 mb-8">
               یک اکوسیستم جامع و چندپلتفرمی <span className="inline-flex items-center text-neon-blue font-bold px-2 py-1 rounded bg-neon-blue/10 text-sm mx-1 border border-neon-blue/20 shadow-inner">Windows, Android, Web</span> که با بهره‌گیری از تکنولوژی پیشرفته <span className="inline-flex items-center text-neon-blue font-bold px-2 py-1 rounded bg-neon-blue/10 text-sm mx-1 border border-neon-blue/20 shadow-inner">Zero-TUN</span> و سرورهای داخلی اختصاصی، پایین‌ترین پینگ ممکن، ثبات بی‌نظیر در اتصال و بالاترین سطح امنیت را برای پلیرهای ایرانی فراهم می‌کنه. لوکس علاوه بر بهینه‌سازی شبکه، ابزارهای تعاملی کاملاً حرفه‌ای (فراتر از دیسکورد) ارائه میده.
             </p>

             {/* Feature Checklist */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {[
                  "چت سراسری و پرسرعت جهت تعامل لحظه‌ای",
                  "ساخت و مدیریت لابی‌های اختصاصی (Public/Private)",
                  "سیستم مچ‌میکینگ و یافتن هم‌تیمی‌های حرفه‌ای",
                  "تعریف نقش‌ها و مدیریت پیشرفته کلن‌ها",
                  "چت‌روم‌های اختصاصی بازی‌های پرطرفدار",
                  "شخصی‌سازی گسترده پروفایل و آواتار متحرک",
                  "برگزاری ایونت‌ها و مسابقات منظم گیمینگ",
                  "سیستم دوستان پیشرفته با همگام‌سازی وضعیت"
                ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-[14px] font-bold text-gray-200 mt-0.5">{feature}</span>
                    </div>
                ))}
             </div>
          </div>
        </motion.section>

        {/* Why LOXX */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-8 bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,128,0.5)]"></div>
            <h3 className="text-2xl font-black text-white">چرا همکاری با LOXX برای تو یه بازی برد-برده؟</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Revenue */}
            <div className="bg-gradient-to-b from-[#0b0c10]/90 to-[#151821]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden shadow-xl">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-blue/10 rounded-full blur-[50px] group-hover:bg-neon-blue/20 transition-all"></div>
               <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue flex items-center justify-center shadow-inner">
                   <span className="font-black text-xl">۱</span>
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3 relative z-10">درآمد مستقیم و شفاف</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[14px] relative z-10">
                 اعطای کد تخفیف اختصاصی با نام خودت که <span className="text-neon-blue font-bold px-1.5 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/20">۵۰٪ از کل فروش</span> رو به عنوان سهم درآمدی (Revenue Share) به صورت مستقیم، شفاف و آنی به حساب تو اختصاص میده.
               </p>
               <RevenueAnimation />
            </div>

            {/* Card 2: VIP Support */}
            <div className="bg-gradient-to-b from-[#0b0c10]/90 to-[#151821]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden shadow-xl">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-purple/10 rounded-full blur-[50px] group-hover:bg-neon-purple/20 transition-all"></div>
               <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple flex items-center justify-center shadow-inner">
                   <span className="font-black text-xl">۲</span>
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3 relative z-10">پشتیبانی VIP اختصاصی</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[14px] relative z-10">
                 یک تیم فنی مجرب در تمام طول زمان استریم‌های تو کاملاً گوش‌به‌زنگ هستن تا هرگونه اختلال یا مشکل فنی احتمالی رو در <span className="text-neon-purple font-bold px-1.5 py-0.5 rounded bg-neon-purple/10 border border-neon-purple/20">کمتر از ۳ دقیقه</span> برطرف و مدیریت کنن.
               </p>
               <SupportAnimation />
            </div>

            {/* Card 3: Chat-Sync */}
            <div className="bg-gradient-to-b from-[#0b0c10]/90 to-[#151821]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden shadow-xl">
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-neon-pink/10 rounded-full blur-[50px] group-hover:bg-neon-pink/20 transition-all"></div>
               <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink flex items-center justify-center shadow-inner">
                   <span className="font-black text-xl">۳</span>
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3 relative z-10">تکنولوژی Chat-Sync</h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[14px] relative z-10">
                 چت سراسری بسیار پرسرعت و لابی‌های هوشمند مدیریت‌شده که تعامل لحظه‌ای تو با بینندگان و سازماندهی اسکوادها رو به سطح جدیدی می‌بره.
               </p>
               <ChatAnimation />
            </div>

            {/* Card 4: Elite Panel */}
            <div className="bg-gradient-to-b from-[#0b0c10]/90 to-[#151821]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-8 group relative overflow-hidden shadow-xl">
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#ffaa00]/10 rounded-full blur-[50px] group-hover:bg-[#ffaa00]/20 transition-all"></div>
               <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-[#ffaa00]/10 border border-[#ffaa00]/20 text-[#ffaa00] flex items-center justify-center shadow-inner">
                   <span className="font-black text-xl">۴</span>
                 </div>
               </div>
               <h4 className="text-xl font-black text-white mb-3 relative z-10">پروفایل هوشمند و <span className="uppercase tracking-wider font-sans">Elite</span></h4>
               <p className="text-gray-400 font-medium leading-relaxed text-[14px] relative z-10">
                 پروفایل کاملاً شخصی‌سازی شده با بالاترین سطح، نشان (Badge) منحصربه‌فرد بر روی پلتفرم و دسترسی به سیستم اطلاع‌رسانی پیشرفته برای هدایت کامیونیتی.
               </p>
               <ProfileAnimation name={streamerName} />
            </div>

          </div>
        </motion.section>

        {/* Conclusion & Contact */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 border border-white/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_80%)]"></div>
             
             <div className="max-w-3xl mx-auto relative z-10">
               <p className="text-xl text-gray-200 font-medium leading-relaxed mb-6">
                 تیم توسعه ما اینجاست تا هر قابلیت اختصاصی که برای مدیریت لابی‌ها یا اسپانسرشیپ‌هات نیاز داری رو در کوتاه‌ترین زمان ممکن برات پیاده‌سازی کنه.
               </p>
               <p className="text-2xl text-white font-black leading-relaxed mb-10 drop-shadow-md">
                 اگر مایل بودی، خوشحال می‌شیم یه تایم کوتاه برای یک جلسه آنلاین داشته باشیم تا جزئیات فنی و مالی این «آینده‌نگری مشترک» رو برات باز کنیم.
               </p>

               <div className="flex flex-col items-center justify-center gap-8 border-t border-white/10 pt-10">
                 <div>
                   <h5 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 tracking-tight">لوکس؛ فراتر از یک اتصال.</h5>
                   <p className="text-sm text-gray-400 font-bold bg-white/5 py-1.5 px-4 rounded-full inline-block">تیم مدیریت پلتفرم LOXX</p>
                 </div>

                 {/* Contact Actions */}
                 <div className="flex flex-wrap items-center justify-center gap-4 w-full mt-4">
                   <a 
                     href="https://t.me/loxxiran" 
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#00e5ff] hover:text-white font-bold transition-all group"
                   >
                     <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     <span dir="ltr" className="tracking-wide text-lg mt-0.5">@loxxiran</span>
                   </a>
                   
                   <div className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                     <Phone className="w-5 h-5 text-gray-400" />
                     <span dir="ltr" className="tracking-wide text-lg mt-0.5">09930893466</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </motion.section>
        
        {/* Footer */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={isOpened ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-center mt-12 pb-8"
        >
           <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/5 hover:border-white/10">
              <ArrowLeft className="w-4 h-4 ml-2" />
              <span className="mt-0.5">بازگشت به لابی LOXX</span>
           </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default StreamerProposalPage;
