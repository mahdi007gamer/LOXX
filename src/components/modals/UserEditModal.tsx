import React, { useState, useEffect } from "react";
import { X, Shield, Crown, User, Calendar, Save, Trash2, ShieldAlert, Clock, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlowButton } from "../ui/GlowButton";
import { SmartImage } from "../ui/SmartImage";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { cn } from "../../lib/utils";

interface UserEditModalProps {
 isOpen: boolean;
 onClose: () => void;
 user: any;
 onSuccess: () => void;
}

export const UserEditModal = ({ isOpen, onClose, user, onSuccess }: UserEditModalProps) => {
 const [role, setRole] = useState("USER");
 const [membership, setMembership] = useState("NONE");
 const [days, setDays] = useState(0); // Default to 0 so we don't accidentally add days
 const [remainingDays, setRemainingDays] = useState(0);
 const [loading, setLoading] = useState(false);
 const [username, setUsername] = useState("");
 const [phone, setPhone] = useState("");
 const [password, setPassword] = useState("");
 const [dbBadges, setDbBadges] = useState<any[]>([]);

 useEffect(() => {
 if (user) {
 setRole(user.role || "USER");
 setMembership(user.profile?.membershipType || "NONE");
 setUsername(user.username || "");
 setPhone(user.phone || "");
 setPassword("");

 // Calculate remaining days if sub exists
 const sub = user.subscriptions?.[0];
 if (sub && new Date(sub.expiresAt) > new Date()) {
 const diffTime = Math.abs(new Date(sub.expiresAt).getTime() - new Date().getTime());
 setRemainingDays(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
 } else {
 setRemainingDays(0);
 }
 }
 fetchSpecialBadges();
 }, [user]);

 const fetchSpecialBadges = async () => {
 try {
 const res = await api.get("/badges/category/SPECIAL");
 setDbBadges(res.data.data || []);
 } catch (error) {
 console.error("Error fetching special badges:", error);
 }
 };

 const handleAssignBadge = async (badgeId: string) => {
 try {
 await api.post("/badges/assign", { userId: user.id, badgeId });
 toast.success("نشان با موفقیت اهدا شد");
 onSuccess(); // Refresh user data to show new badges
 } catch (error) {
 toast.error("خطا در اهدای نشان");
 }
 };

 const handleRemoveBadge = async (badgeId: string) => {
 try {
 await api.post("/badges/remove", { userId: user.id, badgeId });
 toast.success("نشان حذف شد");
 onSuccess();
 } catch (error) {
 toast.error("خطا در حذف نشان");
 }
 };

 const handleSave = async () => {
 setLoading(true);
 try {
 // 1. Update Core Details
 await api.patch(`/admin/users/${user.id}`, { 
 username, 
 phone, 
 password: password || undefined 
 });

 // 2. Update Role
 await api.patch(`/admin/users/${user.id}/role`, { role });
 
 // 3. Update Membership
 await api.patch(`/admin/users/${user.id}/membership`, { 
 membershipType: membership,
 days: membership !== "NONE" ? Number(days) : 0
 });

 toast.success("اطلاعات کاربر با موفقیت بروزرسانی شد");
 onSuccess();
 onClose();
 } catch (error: any) {
 toast.error("خطا در بروزرسانی اطلاعات");
 } finally {
 setLoading(false);
 }
 };

 const handleDelete = async () => {
 if (!window.confirm("آیا از حذف دائمی این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) return;
 try {
 await api.delete(`/admin/users/${user.id}`);
 toast.success("کاربر حذف شد");
 onSuccess();
 onClose();
 } catch {
 toast.error("خطا در حذف کاربر");
 }
 };

 if (!user) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-black/80 "
 />
 
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative w-full max-w-xl bg-[#0d0d12] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
 dir="rtl"
 >
 {/* Header */}
 <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="h-14 w-14 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
 <User size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-white uppercase ">مدیریت کاربر</h2>
 <p className="text-[10px] text-gray-500 font-bold uppercase ">{user.username}</p>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
 {/* Profile Overview */}
 <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-6">
 <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0">
 <SmartImage src={user.profile?.avatarUrl || ""} className="h-full w-full object-cover" />
 </div>
 <div>
 <h3 className="text-lg font-black text-white">{user.profile?.displayName || user.username}</h3>
 <p className="text-gray-500 text-xs font-bold mb-2">{user.phone}</p>
 <div className="flex gap-2">
 <span className={cn(
 "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
 user.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
 )}>
 {user.role}
 </span>
 <span className={cn(
 "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
 user.profile?.membershipType === "VIP" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : 
 user.profile?.membershipType === "PLUS" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/20" : 
 "bg-white/5 text-gray-500 border-white/10"
 )}>
 {user.profile?.membershipType || "NONE"}
 </span>
 </div>
 </div>
 </div>

 {/* Core Details Edit */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-600 uppercase pr-2">نام کاربری</label>
 <input 
 value={username}
 onChange={e => setUsername(e.target.value)}
 className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:border-neon-blue/50 outline-none transition-all font-bold"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-600 uppercase pr-2">شماره همراه</label>
 <input 
 value={phone}
 onChange={e => setPhone(e.target.value)}
 className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:border-neon-blue/50 outline-none transition-all font-bold"
 />
 </div>
 <div className="space-y-2 md:col-span-2">
 <label className="text-[10px] font-black text-gray-600 uppercase pr-2">تغییر رمز عبور (خالی بگذارید تا تغییر نکند)</label>
 <input 
 type="password"
 value={password}
 onChange={e => setPassword(e.target.value)}
 className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:border-neon-blue/50 outline-none transition-all font-bold"
 />
 </div>
 </div>

 {/* Editing Controls */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <label className="text-[10px] font-black text-gray-600 uppercase pr-2">نقش سیستمی کاربر</label>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {["USER", "STREAMER", "HELPER", "ADMIN"].map(r => (
 <button
 key={r}
 onClick={() => setRole(r)}
 className={cn(
 "h-14 rounded-2xl border transition-all duration-300 text-[11px] font-black uppercase relative overflow-hidden group",
 role === r 
 ? (r === "ADMIN" ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
 : r === "STREAMER" ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
 : r === "HELPER" ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
 : "bg-neon-blue/10 border-neon-blue text-white shadow-[0_0_20px_rgba(0,229,255,0.15)]")
 : "bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10"
 )}
 >
 <div className="flex items-center justify-center gap-1.5 relative z-10">
 {r === "ADMIN" ? <Shield size={14} /> : r === "HELPER" ? <ShieldAlert size={14} /> : r === "STREAMER" ? <Zap size={14} /> : <User size={14} />}
 <span>{r === "ADMIN" ? "مدیر کل" : r === "HELPER" ? "هلپر (پشتیبان)" : r === "STREAMER" ? "استریمر" : "کاربر عادی"}</span>
 </div>
 {role === r && <div className="absolute inset-0 bg-gradient-to-tr from-current/5 to-transparent" />}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-4">
 <label className="text-[10px] font-black text-gray-600 uppercase pr-2">سطح اشتراک ویژه</label>
 <div className="grid grid-cols-3 gap-3">
 {["NONE", "PLUS", "VIP"].map(m => (
 <button
 key={m}
 onClick={() => setMembership(m)}
 className={cn(
 "h-14 rounded-2xl border transition-all duration-300 text-[11px] font-black uppercase relative overflow-hidden",
 membership === m 
 ? m === "VIP" ? "bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.15)]" : 
 m === "PLUS" ? "bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.15)]" : 
 "bg-gray-500/10 border-gray-500 text-white"
 : "bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10"
 )}
 >
 <div className="flex items-center justify-center gap-2 relative z-10">
 {m === "VIP" ? <Crown size={14} /> : m === "PLUS" ? <Zap size={14} /> : null}
 <span>{m}</span>
 </div>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Badges Section */}
 <div className="space-y-4 border-t border-white/5 pt-8">
 <div className="flex items-center gap-2 pr-2">
 <Shield className="text-neon-blue" size={20} />
 <label className="text-[10px] font-black text-gray-600 uppercase ">نشان‌های ویژه و اهدایی</label>
 </div>
 
 <div className="flex flex-wrap gap-3">
 {dbBadges.map(badge => {
 const isOwend = user.badges?.some((ub: any) => ub.badgeId === badge.id);
 return (
 <button
 key={badge.id}
 onClick={() => isOwend ? handleRemoveBadge(badge.id) : handleAssignBadge(badge.id)}
 className={cn(
 "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all relative overflow-hidden group",
 isOwend 
 ? "bg-yellow-400/10 border-yellow-400/50 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
 : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-white"
 )}
 >
 <img src={badge.iconUrl} className={cn("h-6 w-6 object-contain", !isOwend && "grayscale opacity-50")} />
 <span className="text-[10px] font-black ">{badge.name}</span>
 {isOwend && <div className="absolute top-0 right-0 p-1"><Check size={8} /></div>}
 </button>
 );
 })}
 </div>
 <p className="text-[9px] text-gray-500 ">برای اهدا یا پس گرفتن نشان‌های ویژه روی آن‌ها کلیک کنید.</p>
 </div>

 <AnimatePresence>
 {membership !== "NONE" && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden space-y-4 pt-4 border-t border-white/5"
 >
 <div className="p-6 rounded-3xl bg-neon-blue/5 border border-neon-blue/10">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-neon-blue" />
 <span className="text-sm font-black text-white ">اعتبار فعلی: {remainingDays} روز |افزودن اعتبار (روز)</span>
 </div>
 <div className="flex items-center gap-2">
 <input
 type="number"
 min="0"
 max="3650"
 value={days}
 onChange={(e) => setDays(Number(e.target.value))}
 className="w-16 bg-white/10 text-neon-blue font-black text-xl rounded-lg px-2 text-center outline-none border border-transparent focus:border-neon-blue/50"
 />
 <span className="text-xs font-black text-neon-blue ">روز</span>
 </div>
 </div>
 <input 
 type="range"
 min="0"
 max="365"
 value={days}
 onChange={(e) => setDays(Number(e.target.value))}
 className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
 />
 <div className="flex justify-between mt-2 text-[8px] font-black text-gray-600 uppercase ">
 <span>۰ روز</span>
 <span>۱ سال</span>
 </div>
 </div>
 <div className="flex items-center gap-2 text-[10px] text-yellow-400/50 bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/10">
 <ShieldAlert size={14} />
 <span className="font-bold ">توجه: اشتراک بلافاصله فعال شده و از امروز محاسبه می‌شود.</span>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="flex gap-4 pt-4">
 <GlowButton 
 onClick={handleSave} 
 loading={loading}
 className="flex-1 h-14 text-xs font-black uppercase "
 icon={<Save size={18} />}
 >
 ذخیره تغییرات
 </GlowButton>
 <button 
 onClick={handleDelete}
 className="h-14 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
 >
 <Trash2 size={20} />
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
};
