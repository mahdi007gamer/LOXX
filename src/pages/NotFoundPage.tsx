import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { Sidebar } from "../components/layout/Sidebar";
import { GlowButton } from "../components/ui/GlowButton";
import { 
 Gamepad2, 
 Home, 
 Ghost, 
 Settings, 
 HelpCircle, 
 Bug,
 ShieldAlert
} from "lucide-react";
import { motion } from "motion/react";

const NotFoundPage = () => {
 const navigate = useNavigate();
 const { isSidebarCollapsed } = useAuth();

 return (
 <div className="flex min-h-[calc(100vh-64px)] overflow-x-hidden pt-16 md:pt-0">
 <Sidebar />
 <main className={cn("flex-1 flex items-center justify-center p-6 relative overflow-hidden transition-all duration-300", !isSidebarCollapsed ? "md:mr-64 mr-0" : "md:mr-20 mr-0")}>
 {/* Background Decor */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/10 rounded-full blur-[120px] pointer-events-none" />
 <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-neon-purple/10 rounded-full blur-[80px] pointer-events-none" />
 
 <div className="relative z-10 max-w-2xl w-full text-center">
 <motion.div
 initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
 animate={{ opacity: 1, scale: 1, rotate: 0 }}
 transition={{ type: "spring", damping: 10 }}
 className="inline-flex h-32 w-32 items-center justify-center rounded-[40px] bg-white/5 border border-white/10 text-neon-blue shadow-[0_0_50px_rgba(0,229,255,0.2)] mb-8"
 >
 <Ghost size={64} className="animate-bounce" />
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 >
 <h1 className="text-8xl md:text-9xl font-black text-white mb-4 opacity-20 select-none">404</h1>
 <h2 className="text-3xl md:text-5xl font-black text-white uppercase mb-6 drop-shadow-2xl">
 خطای مرحله <span className="text-neon-blue">پیدا نشد!</span>
 </h2>
 <p className="text-gray-500 font-bold mb-10 max-w-md mx-auto leading-relaxed">
 متاسفیم! این صفحه انگار از بازی حذف شده یا هیچ‌وقت وجود نداشته. شاید بهتر باشه برگردی به بیس خودت!
 </p>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="flex flex-col sm:flex-row items-center justify-center gap-4"
 >
 <GlowButton 
 variant="blue" 
 className="w-full sm:w-auto px-10 h-14 rounded-2xl group flex items-center justify-center gap-3"
 onClick={() => navigate("/")}
 >
 <Home size={20} />
 <span className="font-black uppercase ">بازگشت به خانه</span>
 </GlowButton>
 
 <button 
 onClick={() => navigate(-1)}
 className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3"
 >
 <ShieldAlert size={20} className="text-neon-pink" />
 <span>مرحله قبل</span>
 </button>
 </motion.div>

 {/* Glitch Grid Decorations */}
 <div className="grid grid-cols-4 gap-4 mt-20 opacity-10">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className="h-1 bg-white/20 rounded-full overflow-hidden">
 <motion.div 
 animate={{ x: ["-100%", "100%"] }}
 transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
 className="h-full w-1/2 bg-neon-blue"
 />
 </div>
 ))}
 </div>
 </div>

 {/* Cyberpunk Accents */}
 <div className="absolute top-10 right-10 flex flex-col gap-2 opacity-20 hidden md:flex">
 <Gamepad2 size={24} className="text-neon-blue" />
 <div className="h-20 w-px bg-gradient-to-b from-neon-blue to-transparent mx-auto" />
 </div>
 <div className="absolute bottom-10 left-10 flex flex-col gap-2 opacity-20 hidden md:flex">
 <div className="h-20 w-px bg-gradient-to-t from-neon-purple to-transparent mx-auto" />
 <Settings size={24} className="text-neon-purple" />
 </div>
 </main>
 </div>
 );
};

export default NotFoundPage;
