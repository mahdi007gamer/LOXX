import React, { useState, useEffect } from "react";
import { X, Save, Award, Shield, Palette } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlowButton } from "../ui/GlowButton";
import { SmartImage } from "../ui/SmartImage";
import api from "../../lib/api";
import { toast } from "react-hot-toast";

interface BadgeAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge?: any;
  onSuccess: () => void;
}

export const BadgeAdminModal = ({ isOpen, onClose, badge, onSuccess }: BadgeAdminModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    iconUrl: "",
    category: "STANDARD",
    isSpecial: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (badge) {
      setFormData({
        name: badge.name || "",
        iconUrl: badge.iconUrl || "",
        category: badge.category || "STANDARD",
        isSpecial: badge.isSpecial || false
      });
    } else {
      setFormData({
        name: "",
        iconUrl: "",
        category: "STANDARD",
        isSpecial: false
      });
    }
  }, [badge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (badge) {
        await api.put(`/badges/${badge.id}`, formData);
        toast.success("نشان با موفقیت بروزرسانی شد");
      } else {
        await api.post("/badges", formData);
        toast.success("نشان جدید با موفقیت ایجاد شد");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ذخیره نشان");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const loadingToast = toast.loading("در حال آپلود نشان...");
      const res = await api.post("/upload", uploadData);
      setFormData(prev => ({ ...prev, iconUrl: res.data.url }));
      toast.dismiss(loadingToast);
      toast.success("نشان آپلود شد");
    } catch (err) {
      toast.dismiss();
      toast.error("خطا در آپلود");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            dir="rtl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                     <Award size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                      {badge ? "ویرایش نشان" : "ایجاد نشان جدید"}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Badge Configuration</p>
                  </div>
               </div>
               <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mr-2">نام نشان (Unique ID)</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-white font-bold focus:border-purple-500/50 transition-all font-mono"
                    required
                    placeholder="e.g. Streamer, RainbowSix"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mr-2">دسته‌بندی</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-white font-bold focus:border-purple-500/50 transition-all"
                    >
                       <option value="STANDARD">معمولی (قابل انتخاب توسط کاربر)</option>
                       <option value="GAME">بازی (مخصوص یک بازی خاص)</option>
                       <option value="SPECIAL">ویژه (فقط توسط ادمین)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mr-2">نمایش کنار نام</label>
                    <div 
                      onClick={() => setFormData(prev => ({ ...prev, isSpecial: !prev.isSpecial }))}
                      className={`h-14 w-full rounded-2xl border flex items-center justify-center gap-3 cursor-pointer transition-all ${
                        formData.isSpecial 
                        ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" 
                        : "bg-white/5 border-white/5 text-gray-500"
                      }`}
                    >
                       <Shield size={18} fill={formData.isSpecial ? "currentColor" : "none"} />
                       <span className="font-black italic text-xs uppercase">{formData.isSpecial ? "فعال (ویژه)" : "غیرفعال"}</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mr-2">آیکن نشان</label>
                  <div className="flex gap-4">
                     <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        <SmartImage 
                           src={formData.iconUrl} 
                           alt={formData.name} 
                           className="h-full w-full object-contain" 
                        />
                     </div>
                     <div className="flex-1 space-y-3">
                        <input 
                           type="text"
                           value={formData.iconUrl}
                           onChange={e => setFormData(prev => ({ ...prev, iconUrl: e.target.value }))}
                           className="w-full h-10 bg-white/5 border border-white/5 rounded-xl px-4 text-[10px] text-gray-400 font-mono"
                           placeholder="URL or Uploaded Path"
                        />
                        <div className="flex items-center gap-2">
                           <input type="file" id="badge-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
                           <label htmlFor="badge-upload" className="flex-1 h-8 rounded-xl bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase italic flex items-center justify-center cursor-pointer hover:bg-purple-500 hover:text-white transition-all border border-purple-500/20">
                              آپلود آیکن
                           </label>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-4">
                  <GlowButton 
                    type="submit" 
                    variant="purple" 
                    className="w-full h-16 text-sm font-black uppercase italic !rounded-3xl"
                    disabled={loading}
                  >
                    <Save size={20} className="ml-2" /> 
                    {loading ? "در حال ذخیره..." : "ذخیره تغییرات نشان"}
                  </GlowButton>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
