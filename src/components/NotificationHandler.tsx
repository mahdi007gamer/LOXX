import { useEffect, useState, useRef } from "react";
import { notifySocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";

const InviteToast = ({ t, inviteData, navigate }: { t: any, inviteData: any, navigate: any }) => {
 const [status, setStatus] = useState<'idle' | 'joining' | 'rejected'>('idle');
 
 const lobbyId = inviteData.lobbyId || inviteData.data?.lobbyId;
 const username = inviteData.fromUsername || inviteData.data?.sender?.username;
 const lobbyName = inviteData.gameTitle || inviteData.data?.lobbyName || "لابی جدید";

 const handleJoin = async () => {
 if (status !== 'idle') return;
 
 setStatus('joining');
 // Dismiss immediately to give immediate feedback
 toast.dismiss(t.id);
 
 const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
 const isOverlayWidget = isElectron && (
 window.location.pathname === '/overlay' || 
 window.location.pathname === '/lobby/overlay-widget' ||
 window.location.hash.includes('/overlay')
 );

 if (isOverlayWidget && (window as any).electronAPI?.sendOverlayAction) {
 toast.dismiss(t.id);
 (window as any).electronAPI.sendOverlayAction({ type: 'join-lobby', lobbyId });
 return;
 }

 try {
 await api.post(`/lobby/${lobbyId}/join`);
 navigate(`/lobby/${lobbyId}`);
 toast.success("وارد لابی شدید", { id: 'join-success' });
 } catch (err) {
 toast.error("لابی در دسترس نیست یا بسته شده است");
 setStatus('idle');
 }
 };

 const handleReject = () => {
 setStatus('rejected');
 toast.dismiss(t.id);
 };

 return (
 <motion.div 
 initial={{ opacity: 0, y: 40, scale: 0.95 }}
 animate={{ 
 opacity: t.visible ? 1 : 0, 
 y: t.visible ? 0 : 40, 
 scale: t.visible ? 1 : 0.95,
 }}
 transition={{ 
 type: "spring", 
 damping: 20, 
 stiffness: 300,
 opacity: { duration: 0.15 }
 }}
 className="modern-glass-toast relative flex flex-col gap-5 w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] min-w-[280px] sm:min-w-[360px] shrink-0 p-6 bg-[#0d0d14]/80 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden group" 
 dir="rtl"
 >
 {/* Top Accent Line */}
 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent" />
 
 {/* Glow Effect */}
 <div className="absolute -top-12 -right-12 w-40 h-40 bg-neon-pink/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-neon-blue/15 transition-colors duration-500" />

 <div className="flex items-center gap-4 relative z-10">
 <div className="w-14 h-14 rounded-2xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 overflow-hidden shrink-0 shadow-[0_0_25px_rgba(0,229,255,0.15)] ring-1 ring-white/5">
 <div className="text-neon-blue font-black text-xl ">{(username || "A")[0].toUpperCase()}</div>
 </div>
 <div className="flex-1 text-right">
 <div className="flex flex-col">
 <span className="text-neon-blue text-[10px] uppercase font-black mb-1">{username}</span>
 <div className="text-sm font-bold text-white/95 leading-tight">شما را به لابی دعوت کرد</div>
 </div>
 <div className="text-[11px] text-white/40 font-medium mt-1 bg-white/5 w-fit px-2 py-0.5 rounded-full border border-white/5">
 {lobbyName}
 </div>
 </div>
 </div>

 <div className="flex gap-3 mt-1 relative z-10">
 <button 
 disabled={status !== 'idle'}
 onClick={handleJoin}
 className="flex-1 py-3.5 rounded-2xl bg-neon-blue text-dark-bg text-[11px] font-black uppercase shadow-[0_8px_25px_rgba(0,229,255,0.35)] hover:shadow-[0_12px_35px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
 >
 {status === 'joining' ? (
 <div className="w-4 h-4 border-2 border-dark-bg/30 border-t-dark-bg rounded-full animate-spin" />
 ) : "قبول دعوت"}
 </button>
 <button 
 disabled={status !== 'idle'}
 onClick={handleReject}
 className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase text-white/50 hover:text-white/90 border border-white/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
 >
 رد کردن
 </button>
 </div>
 </motion.div>
 );
};

export const NotificationHandler = () => {
 const navigate = useNavigate();
 const { user, refreshUser } = useAuth();
 const checkedAdminAlerts = useRef<string | null>(null);

 const isAdmin = !!(user && (user.role === "ADMIN" || user.email === "admin@loxx.ir" || user.email === "admin@test.com"));

 useEffect(() => {
 if (isAdmin && user && checkedAdminAlerts.current !== user.id) {
 checkedAdminAlerts.current = user.id;
 api.get("/admin/alerts")
 .then((res) => {
 if (res.data && res.data.status === "success") {
 const { pendingPaymentsCount, pendingReportsCount } = res.data.data;
 if (pendingPaymentsCount > 0 || pendingReportsCount > 0) {
 toast.custom((t) => (
 <div 
 className="modern-glass-toast p-6 bg-[#0c0c12]/95 border border-red-500/30 rounded-[24px] flex flex-col gap-4 text-white hover:border-red-500/60 transition-all duration-300 w-[360px] md:w-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden group" 
 dir="rtl"
 >
 <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
 
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-100 shrink-0">
 <Shield size={20} className="text-red-400 animate-pulse" />
 </div>
 <div className="text-right">
 <h4 className="font-black text-sm text-white">مدیریت گرامی لوکس</h4>
 <p className="text-[10px] text-gray-400 font-bold mt-0.5">بخش‌های معلق منتظر بررسی شما:</p>
 </div>
 </div>

 <div className="flex flex-col gap-2 mt-1">
 {pendingPaymentsCount > 0 && (
 <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-3 rounded-xl text-xs text-right">
 <span className="text-gray-300 font-bold">💰 تراکنش‌های معلق تأیید اشتراک</span>
 <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
 {pendingPaymentsCount} مورد
 </span>
 </div>
 )}
 {pendingReportsCount > 0 && (
 <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-3 rounded-xl text-xs text-right">
 <span className="text-gray-300 font-bold">🚨 گزارش‌های تخلف جدید کاربران</span>
 <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
 {pendingReportsCount} مورد
 </span>
 </div>
 )}
 </div>

 <div className="flex gap-2.5 mt-2">
 <button
 onClick={() => {
 toast.dismiss(t.id);
 navigate("/admin");
 }}
 className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] cursor-pointer text-center"
 >
 ورود به پنل مدیریت
 </button>
 <button
 onClick={() => toast.dismiss(t.id)}
 className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-gray-400 font-medium text-xs cursor-pointer"
 >
 بستن
 </button>
 </div>
 </div>
 ), { id: "admin-alert", duration: 15000, position: "top-center" });
 }
 }
 })
 .catch((e) => console.error("Error fetching admin alerts:", e));
 } else if (!user) {
 checkedAdminAlerts.current = null;
 }
 }, [user, isAdmin, navigate]);

 useEffect(() => {
 const playNotifySFX = () => {
 try {
 const audio = new Audio('/notifsound.mp3');
 audio.volume = 0.4;
 audio.play().catch(e => console.log("Notification audio playback requires prior user interaction: ", e));
 } catch (err) {
 console.error("Audio playback error:", err);
 }
 };

 const handleLobbyInvite = (inviteData: any) => {
 const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
 const isOverlayWidget = isElectron && (
 window.location.pathname === '/overlay' || 
 window.location.pathname === '/lobby/overlay-widget' ||
 window.location.hash.includes('/overlay')
 );

 if (isElectron && !isOverlayWidget) {
 // Suppress in-app toast for Windows client (it goes to the overlay instead!)
 return;
 }

 playNotifySFX();
 
 const lobbyId = inviteData.lobbyId || inviteData.data?.lobbyId;
 const senderId = inviteData.fromId || inviteData.data?.sender?.id;

 toast.custom((t) => (
 <InviteToast t={t} inviteData={inviteData} navigate={navigate} />
 ), { 
 duration: 15000,
 position: "bottom-right",
 id: `invite-${lobbyId}-${senderId}`,
 });
 };

 const handleWarning = (data: any) => {
 const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
 const isOverlayWidget = isElectron && (
 window.location.pathname === '/overlay' || 
 window.location.pathname === '/lobby/overlay-widget' ||
 window.location.hash.includes('/overlay')
 );

 if (isElectron && !isOverlayWidget) {
 return;
 }

 playNotifySFX();
 toast.error(data.message, { 
 duration: 10000, 
 icon: '⚠️',
 style: {
 borderRadius: '16px',
 background: '#1a0505',
 color: '#ef4444',
 border: '1px solid rgba(239, 68, 68, 0.2)',
 fontWeight: '900',
 padding: '16px',
 }
 });
 };

 const handleMembershipUpdated = (data: any) => {
 const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
 const isOverlayWidget = isElectron && (
 window.location.pathname === '/overlay' || 
 window.location.pathname === '/lobby/overlay-widget' ||
 window.location.hash.includes('/overlay')
 );

 if (isElectron && !isOverlayWidget) {
 return;
 }

 if (typeof refreshUser === "function") {
 refreshUser();
 }
 playNotifySFX();

 toast.custom((t) => (
 <div 
 className="p-6 bg-[#0c0c12]/95 border border-yellow-500/40 rounded-[24px] flex flex-col gap-4 text-white hover:border-yellow-500/80 transition-all duration-300 w-[360px] md:w-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden text-right"
 dir="rtl"
 >
 <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-[40px] pointer-events-none" />
 
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/30 text-yellow-300 shrink-0 text-2xl">
 👑
 </div>
 <div>
 <h4 className="font-extrabold text-sm text-yellow-400">تبریک ارتقای اشتراک! 🎉</h4>
 <p className="text-[10px] text-gray-400 mt-0.5">یک حساب کاربری لوکس جدید!</p>
 </div>
 </div>
 <div className="text-sm font-bold text-gray-200 mt-1 leading-relaxed">
 {data.message || "حساب شما ارتقا یافت!"}
 </div>
 <p className="text-xs text-yellow-400 font-bold bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/10 text-center">
 {data.membershipType === "VIP" 
 ? "🌟 به جمع نخبگان لوکس خوش آمدید! امکانات ویژه و بخش Elite هم‌اکنون برای شما فعال است."
 : "⚡ به جمع مشترکین ویژه (Plus) لوکس خوش آمدید! اسکرین شیر ۷۲۰پی، قفل کانال‌ها، و آیکون‌های ویژه آماده استفاده هستند."
 }
 </p>
 <button 
 onClick={() => toast.dismiss(t.id)}
 className="w-full py-2.5 rounded-xl bg-gradient-to-l from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 font-black text-white text-xs transition-all cursor-pointer text-center"
 >
 بسیار عالی! ❤️
 </button>
 </div>
 ), { duration: 15000, position: "top-center", id: `membership-upgrade-congrats` });
 };

 notifySocket.on("lobby.invite", handleLobbyInvite);
 notifySocket.on("moderation.warning", handleWarning);
 notifySocket.on("membership.updated", handleMembershipUpdated);
 notifySocket.on("notification", (data: any) => {
 const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
 const isOverlayWidget = isElectron && (
 window.location.pathname === '/overlay' || 
 window.location.pathname === '/lobby/overlay-widget' ||
 window.location.hash.includes('/overlay')
 );

 if (isElectron && !isOverlayWidget) {
 // Suppress standard in-app notification toasts inside Windows client
 return;
 }

 if (data.type === "LOBBY_INVITE") {
 handleLobbyInvite(data);
 } else if (data.type === "MESSAGE_RECEIVED") {
 // Ignored to avoid duplicate toasts as FriendsContext handles DM rendering beautifully with sender and body
 return;
 } else {
 playNotifySFX();
 toast(data.message || "اطلاعیه جدید دریافت شد");
 }
 });

 return () => {
 notifySocket.off("lobby.invite");
 notifySocket.off("moderation.warning");
 notifySocket.off("membership.updated");
 notifySocket.off("notification");
 };
 }, [navigate, refreshUser]);

 return null;
};
