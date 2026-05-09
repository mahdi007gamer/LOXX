import React, { useState, useEffect } from "react";
import { X, Shield, Crown, User, Calendar, Save, Trash2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlowButton } from "../ui/GlowButton";
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
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role || "USER");
      setMembership(user.profile?.membershipType || "NONE");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update Role
      await api.patch(`/admin/users/${user.id}/role`, { role });
      
      // 2. Update Membership
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
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
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">مدیریت کاربر</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.username}</p>
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
                    <img src={user.profile?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} className="h-full w-full object-cover" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white">{user.profile?.displayName || user.username}</h3>
                    <p className="text-gray-500 text-xs font-bold mb-2">{user.email}</p>
                    <div className="flex gap-2">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                         user.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                       )}>
                          {user.role}
                       </span>
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                         user.profile?.membershipType === "VIP" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : 
                         user.profile?.membershipType === "PLUS" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/20" : 
                         "bg-white/5 text-gray-500 border-white/10"
                       )}>
                          {user.profile?.membershipType || "NONE"}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Editing Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] italic pr-2">نقش سیستمی کاربر</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["USER", "ADMIN"].map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={cn(
                          "h-14 rounded-2xl border transition-all duration-300 text-[11px] font-black uppercase italic relative overflow-hidden group",
                          role === r 
                            ? "bg-neon-blue/10 border-neon-blue text-white shadow-[0_0_20px_rgba(0,229,255,0.15)]" 
                            : "bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-center gap-2 relative z-10">
                           {r === "ADMIN" ? <Shield size={14} /> : <User size={14} />}
                           <span>{r === "ADMIN" ? "مدیر کل" : "کاربر عادی"}</span>
                        </div>
                        {role === r && <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/5 to-transparent" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] italic pr-2">سطح اشتراک ویژه</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["NONE", "PLUS", "VIP"].map(m => (
                      <button
                        key={m}
                        onClick={() => setMembership(m)}
                        className={cn(
                          "h-14 rounded-2xl border transition-all duration-300 text-[11px] font-black uppercase italic relative overflow-hidden",
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
                          <span className="text-sm font-black text-white italic">مدت اعتبار (روز)</span>
                        </div>
                        <span className="text-2xl font-black text-neon-blue italic">{days} <span className="text-xs">روز</span></span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="365"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                      />
                      <div className="flex justify-between mt-2 text-[8px] font-black text-gray-600 uppercase italic tracking-widest">
                        <span>۱ روز</span>
                        <span>۱ سال</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-yellow-400/50 bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/10">
                       <ShieldAlert size={14} />
                       <span className="font-bold italic">توجه: اشتراک بلافاصله فعال شده و از امروز محاسبه می‌شود.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-4">
                <GlowButton 
                  onClick={handleSave} 
                  loading={loading}
                  className="flex-1 h-14 text-xs font-black uppercase italic"
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
