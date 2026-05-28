import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, HeadphonesIcon, MessageSquare, Award, ArrowLeft, Phone, Mail, Instagram, Send, CheckCircle2, AlertCircle, User, Zap, Play, Pause, Volume2, VolumeX, Volume1, Forward, Rewind } from 'lucide-react';
import api from '../lib/api';

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
    const [decryptText, setDecryptText] = useState("DECRYPTING DATA...");
    
    useEffect(() => {
        const interval = setInterval(() => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%*";
            let res = "";
            for (let i = 0; i < 15; i++) {
                res += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            setDecryptText(res);
        }, 50);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            setDecryptText("ACCESS GRANTED");
        }, 1500);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);
    
    const handleOpenClick = () => {
        if (decryptText !== "ACCESS GRANTED") return;
        setOpening(true);
        setTimeout(() => {
            onOpen();
        }, 1000);
    };

    return (
        <motion.div 
           initial={{ opacity: 1 }}
           exit={{ opacity: 0, filter: "blur(40px)", scale: 1.5 }}
           transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
           className="fixed inset-0 z-50 bg-[#020204] flex items-center justify-center overflow-hidden"
        >
             {/* Dynamic Hex Background */}
             <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDBMNjAgMTVWMzBMMzAgNDVMMCAzMFYxNUwzMCAwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-30"></div>
                <motion.div 
                   animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   className="w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-neon-blue/5 rounded-full blur-[120px]"
                />
             </div>
             
             {/* Center Box Wrapper */}
             <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={opening ? { y: -100, opacity: 0, scale: 1.1 } : { y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="relative z-10 flex flex-col items-center px-4 w-full max-w-lg"
             >
                 {/* High-Tech Container */}
                 <div 
                    onClick={!opening ? handleOpenClick : undefined}
                    className="relative w-full aspect-[4/3] bg-black/60 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden cursor-pointer group flex flex-col items-center justify-center group"
                 >
                     {/* Corner acccents */}
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-blue rounded-tl-xl"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-purple rounded-tr-xl"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-pink rounded-bl-xl"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#ffaa00] rounded-br-xl"></div>

                     {/* Scanner line */}
                     <motion.div 
                        animate={{ y: ['-100%', '300%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-transparent via-neon-blue/10 to-neon-blue/30 border-b border-neon-blue/50"
                     />
                     
                     {/* Glowing Orbs in background */}
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -right-20 -top-20 w-64 h-64 bg-neon-blue/10 blur-[60px] rounded-full pointer-events-none" />
                     <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -left-20 -bottom-20 w-64 h-64 bg-neon-pink/10 blur-[60px] rounded-full pointer-events-none" />

                     {/* Main Center UI */}
                     <div className="relative z-10 flex flex-col items-center transition-transform duration-700 w-full px-6">
                         <div className="mb-8 relative">
                             <div className="absolute inset-0 border-[3px] border-neon-blue rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                             <div className="absolute inset-2 border-[2px] border-neon-purple rounded-full border-b-transparent animate-spin-reverse" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                             <div className="w-20 h-20 bg-neon-blue/10 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(0,229,255,0.4)] m-4">
                                <Award className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                             </div>
                         </div>
                         
                         <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-center tracking-tight mb-2 uppercase" dir="ltr">
                            SECRET DOSSIER
                         </h2>
                         
                         <div className="h-6 overflow-hidden mb-6">
                            <AnimatePresence mode="popLayout">
                                <motion.div 
                                    key={decryptText}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`font-mono text-sm tracking-[0.2em] font-bold ${decryptText === "ACCESS GRANTED" ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,1)]" : "text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,128,1)]"}`}
                                    dir="ltr"
                                >
                                    {decryptText}
                                </motion.div>
                            </AnimatePresence>
                         </div>

                         <div className="py-2 px-6 bg-[#12141a]/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col items-center shadow-[inset_0_2px_20px_rgba(255,255,255,0.05)] w-full max-w-[280px]">
                            <span className="text-xs text-gray-400 font-bold mb-1 tracking-widest uppercase">Target Identity</span>
                            <span className="text-white font-black text-lg tracking-wider" dir="ltr">@{streamerName}</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* Open Button */}
                 <motion.button 
                    whileHover={decryptText === "ACCESS GRANTED" ? { scale: 1.05 } : {}}
                    whileTap={decryptText === "ACCESS GRANTED" ? { scale: 0.95 } : {}}
                    onClick={!opening ? handleOpenClick : undefined}
                    disabled={decryptText !== "ACCESS GRANTED"}
                    className={`mt-10 px-10 py-5 rounded-xl font-black text-lg w-full max-w-[320px] shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all overflow-hidden relative group border ${decryptText === "ACCESS GRANTED" ? "bg-white text-black border-white hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] cursor-pointer" : "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"}`}
                 >
                    {decryptText === "ACCESS GRANTED" && (
                       <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                       {decryptText === "ACCESS GRANTED" ? (
                          <><span>باز کردن قرارداد استراتژیک</span> <ArrowLeft className="w-5 h-5 ml-2" /></>
                       ) : (
                          "در حال پردازش..."
                       )}
                    </span>
                 </motion.button>
             </motion.div>
        </motion.div>
    )
}

const FloatingAudioPlayer = ({ src, streamerName, isOpened }: { src: string, streamerName: string, isOpened: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpened) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                // Attempt to auto play
                if (audioRef.current) {
                   audioRef.current.volume = volume;
                   audioRef.current.play().catch(() => {
                       // autoplay prevented, user needs to click play
                   });
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpened]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const setAudioData = () => {
            if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                setDuration(audio.duration);
            }
        };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnd = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnd);

        if (audio.readyState >= 1) {
            setAudioData();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnd);
        }
    }, [isVisible]);

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setVolume(value);
        if (audioRef.current) {
            audioRef.current.volume = value;
            setIsMuted(value === 0);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
        }
    };

    const skipBackward = () => {
        if (audioRef.current) {
           audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
        }
    };

    const formatTime = (time: number) => {
        if (time && !isNaN(time)) {
            const minutes = Math.floor(time / 60);
            const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
            const seconds = Math.floor(time % 60);
            const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
            return `${formatMinutes}:${formatSeconds}`;
        }
        return '00:00';
    };

    return (
        <>
            {/* Audio Element hidden */}
            <audio ref={audioRef} src={src} preload="metadata" />
            <AnimatePresence>
                {isVisible && (
                    <motion.div 
                        initial={{ y: 200, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 200, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="fixed bottom-[130px] left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] lg:bottom-8 lg:right-8 lg:left-auto lg:translate-x-0 z-[60] pointer-events-auto"
                    >
                        <div className="bg-[#0b0c10]/80 backdrop-blur-3xl border border-white/15 rounded-[2rem] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.8),_inset_0_2px_20px_rgba(255,255,255,0.05)] overflow-hidden relative group">
                            {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none"></div>

                        {/* Glow effect based on playstate */}
                        <motion.div 
                           animate={{ opacity: isPlaying ? [0.1, 0.3, 0.1] : 0, scale: isPlaying ? [1, 1.2, 1] : 1 }}
                           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                           className="absolute -top-10 -right-10 w-40 h-40 bg-neon-purple/40 rounded-full blur-[50px] pointer-events-none"
                        />
                        <motion.div 
                           animate={{ opacity: isPlaying ? [0.05, 0.2, 0.05] : 0, scale: isPlaying ? [1, 1.3, 1] : 1 }}
                           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                           className="absolute -bottom-10 -left-10 w-40 h-40 bg-neon-blue/40 rounded-full blur-[50px] pointer-events-none"
                        />

                        <div className="flex justify-between items-center mb-5 relative z-10">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full border border-white/20 bg-black p-[3px] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex-shrink-0 relative">
                                    {/* Spinner Border */}
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-neon-blue border-r-transparent opacity-50"></motion.div>
                                     <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center relative overflow-hidden">
                                        <AnimatePresence>
                                            {isPlaying && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="flex gap-1 items-end h-3"
                                                >
                                                    <motion.div animate={{ height: ['30%', '100%', '40%'] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 bg-neon-blue rounded-full shadow-[0_0_5px_#00e5ff]"></motion.div>
                                                    <motion.div animate={{ height: ['60%', '20%', '80%'] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-neon-purple rounded-full shadow-[0_0_5px_#b026ff]"></motion.div>
                                                    <motion.div animate={{ height: ['40%', '90%', '50%'] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-1 bg-neon-pink rounded-full shadow-[0_0_5px_#ff0080]"></motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {!isPlaying && <Volume1 className="w-5 h-5 text-gray-500" />}
                                     </div>
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-white font-black text-sm tracking-wide mb-0.5" dir="ltr">Voice Message</span>
                                     <span className="text-neon-pink/80 text-[11px] font-bold tracking-wider" dir="ltr">FROM @{streamerName}</span>
                                 </div>
                             </div>
                             
                             {/* Volume Desktop */}
                             <div className="hidden md:flex items-center gap-2 group/vol bg-white/5 rounded-full px-3 py-1.5 border border-white/5 hover:border-white/20 transition-all cursor-pointer" dir="ltr">
                                 <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                                     {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-neon-blue" />}
                                 </button>
                                 <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-300 ease-out flex items-center">
                                     <input 
                                         type="range" 
                                         min={0} max={1} step={0.01} 
                                         value={isMuted ? 0 : volume} 
                                         onChange={handleVolumeChange}
                                         className="w-full h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer ml-1"
                                     />
                                 </div>
                             </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mb-4 relative z-10" dir="ltr">
                            <span className="text-[11px] text-gray-400 font-mono font-bold w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                            <div className="flex-1 relative flex items-center group/slider h-5 cursor-pointer">
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={duration || 100} 
                                    value={currentTime} 
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 group-hover/slider:h-2 transition-all">
                                    <div 
                                        className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-full relative shadow-[0_0_10px_rgba(176,38,255,0.5)]"
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full lg:opacity-0 group-hover/slider:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono font-bold w-10 tabular-nums">{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-8 relative z-10" dir="ltr">
                            <button onClick={skipBackward} className="text-gray-400 hover:text-white transition-all transform hover:-translate-x-1 hover:scale-110">
                                <Rewind className="w-6 h-6 fill-current" />
                            </button>
                            
                            <button 
                                onClick={togglePlayPause} 
                                className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all hover:scale-105 active:scale-95 text-black border-[3px] border-white/20 bg-clip-padding"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>

                            <button onClick={skipForward} className="text-gray-400 hover:text-white transition-all transform hover:translate-x-1 hover:scale-110">
                                <Forward className="w-6 h-6 fill-current" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
}

// Main Page
const StreamerProposalPage = () => {
  const { name } = useParams<{ name?: string }>();
  
  const [inviteData, setInviteData] = useState<any>(null);
  const [isOpened, setIsOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const alias = name || 'Rest_in_Peace';
        const res = await api.get(`/streamers/invite/${alias}`);
        const result = res.data;
        
        if (result.status === "success" && result.data) {
           setInviteData(result.data);
        } else {
           // Fallback to static for backwards compatibility
           setInviteData({
             alias: alias,
             streamerName: alias === 'Rest_in_Peace' ? 'امیر' : alias,
             voiceUrl: alias === 'Rest_in_Peace' ? '/Rest_in_Peace.mp3' : ''
           });
        }
      } catch (e) {
         setInviteData({
           alias: name || 'Rest_in_Peace',
           streamerName: name === 'Rest_in_Peace' ? 'امیر' : (name || 'کاربر'),
           voiceUrl: name === 'Rest_in_Peace' ? '/Rest_in_Peace.mp3' : ''
         });
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [name]);

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-b-2 border-neon-blue animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-neon-pink/30 relative overflow-x-hidden flex flex-col" dir="rtl">
      
      {/* Envelope Overlay */}
      <AnimatePresence>
        {!isOpened && (
           <EnvelopeIntro onOpen={() => setIsOpened(true)} streamerName={inviteData.streamerName} />
        )}
      </AnimatePresence>

      <FloatingAudioPlayer src={inviteData.voiceUrl || "/Rest_in_Peace.mp3"} streamerName={inviteData.streamerName} isOpened={isOpened} />

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
            سلام {inviteData.streamerName} عزیز <span className="opacity-50 text-xl font-mono mx-1">({inviteData.alias})</span>،
          </h2>
          <div className="text-lg text-gray-300 font-medium leading-loose max-w-4xl space-y-6 bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
            <p>امیدوارم حالت عالی باشه.</p>
            <p>
              ما در تیم <span className="text-white font-black tracking-wider">LOXX</span>، فراتر از یک پلتفرم کاهش پینگ، در حال ساخت <strong>یک شبکه عظیم و قدرتمند از گیمرهای ایرانی</strong> هستیم؛ محیطی با زیرساخت عالی که کاربران می‌تونن به راحتی <strong>چت کنن، دوستای جدید پیدا کنن، تیم‌های حرفه‌ای بسازن</strong> و کامیونیتی خودشون رو گسترش بدن.
            </p>
            <p>
              با بررسی دقیق استریم‌های حرفه‌ای تو و پتانسیل بی‌نظیر کامیونیتی بزرگت، پکیج ویژه و اختصاصی <span className="text-neon-pink font-black uppercase tracking-wide">Elite Streamer</span> رو برای پیوستن تو به این اکوسیستم طراحی کردیم تا دغدغه‌های مدیریت لابی‌ها و پایداری شبکه‌ت رو به صفر برسونیم.
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
               یک اکوسیستم جامع و چندپلتفرمی <span className="inline-flex items-center text-neon-blue font-bold px-2 py-1 rounded bg-neon-blue/10 text-sm mx-1 border border-neon-blue/20 shadow-inner">Windows, Android, Web</span> که به عنوان <strong>پایگاه اصلی شبکه‌سازی گیمرها</strong> عمل می‌کنه. ما با بهره‌گیری از تکنولوژی اختصاصی <span className="inline-flex items-center text-neon-blue font-bold px-2 py-1 rounded bg-neon-blue/10 text-sm mx-1 border border-neon-blue/20 shadow-inner">Zero-TUN</span> علاوه بر فراهم کردن پایین‌ترین پینگ ممکن، قدرتمندترین ابزارهای تعاملی رو برای چت سراسری، یافتن هم‌بازی و مدیریت کلن‌ها در یک محیط کاملا حرفه‌ای مجهز کرده‌ایم.
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
               <ProfileAnimation name={inviteData.streamerName} />
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
