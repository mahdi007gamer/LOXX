import React, { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { 
  User, 
  Settings, 
  Award, 
  Gamepad2, 
  Calendar, 
  Zap,
  Star,
  Target,
  Edit2,
  Share2
} from "lucide-react";
import { cn } from "../lib/utils";

export const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    avatarUrl: user?.avatarUrl || "",
    bannerUrl: user?.bannerUrl || "",
  });

  const handleUpdateProfile = async () => {
    try {
      await api.patch('/user/update', editForm);
      setUser(prev => ({ ...prev!, profile: { ...prev!.profile, ...editForm } }));
      toast.success("پروفایل بروزرسانی شد");
      setIsEditModalOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || "خطا در بروزرسانی");
    }
  };

  const isVip = user?.membershipType === "VIP" || user?.membershipType === "PLUS";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error("حجم تصویر نباید بیشتر از ۱ مگابایت باشد");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      toast.error("فقط فرمت‌های jpg و png مجاز هستند");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditForm(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success("تصویر با موفقیت آپلود شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در آپلود تصویر");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className={`relative mb-8 overflow-hidden rounded-3xl bg-white/[0.02] border transition-all duration-500 ${isVip ? "border-neon-purple/50 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]" : "border-white/10"}`}>
            <div className={`h-48 w-full bg-gradient-to-r ${isVip ? "from-neon-purple/30 via-neon-pink/30 to-neon-blue/30" : "from-neon-blue/10 via-neon-purple/10 to-neon-pink/10"}`}>
               {user?.bannerUrl && <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover mix-blend-overlay opacity-50" />}
            </div>
            
            <div className="px-8 pb-8">
              <div className="relative -mt-16 flex flex-col items-end gap-6 sm:flex-row">
                <div className="relative group mx-auto sm:mx-0">
                  <div className={`h-32 w-32 rounded-3xl border-4 ${isVip ? "border-neon-purple/80" : "border-dark-bg"} bg-dark-card shadow-2xl overflow-hidden relative`}>
                    <div className="flex h-full w-full items-center justify-center bg-neon-blue/20 text-neon-blue">
                      {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" /> : <User size={64} />}
                    </div>
                  </div>
                  {isVip && (
                    <div className="absolute -top-3 -right-3 text-2xl drop-shadow-[0_0_10px_rgba(255,215,0,1)]">👑</div>
                  )}
                  <button onClick={() => setIsEditModalOpen(true)} className="absolute -bottom-2 -left-2 rounded-xl bg-neon-blue p-2 text-dark-bg shadow-lg hover:scale-110 transition-transform">
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="flex-1 pt-4 text-center sm:text-right w-full">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h1 className={`text-3xl font-black ${isVip ? "text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "text-white"}`}>{user?.displayName || user?.username}</h1>
                    {user?.membershipType && user.membershipType !== 'NONE' && (
                      <div className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${user.membershipType === "VIP" ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 border-yellow-500/50" : "bg-neon-purple/10 text-neon-purple border-neon-purple/30"}`}>
                        {user.membershipType}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-gray-400">{user?.bio || "بایوگرافی هنوز تنظیم نشده است"}</p>
                </div>

                <div className="flex items-center gap-3 self-center sm:self-end mt-4 sm:mt-0">
                  <GlowButton variant="blue" size="sm" className="gap-2" onClick={() => setIsEditModalOpen(true)}>
                    <Edit2 size={16} />
                    <span>ویرایش پروفایل</span>
                  </GlowButton>
                </div>
              </div>
            </div>
          </div>
          {/* ... Rest of stats ... */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6">
              <NeonCard variant="blue" className="space-y-6">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Target size={18} className="text-neon-blue" />
                  <span>آمار خلاصه</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-gray-500">میزان برد</p>
                    <p className="text-xl font-black text-neon-blue">۶۸٪</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-gray-500">K/D Ratio</p>
                    <p className="text-xl font-black text-neon-pink">۱.۴۵</p>
                  </div>
                </div>
              </NeonCard>
            </div>
            <div className="lg:col-span-2 space-y-6">
               <NeonCard>
                 <h3 className="text-xl font-black text-white mb-4">پیش‌نمایش مینی‌پروفایل لوکس</h3>
                 <div className="relative w-64 mx-auto mt-8 bg-dark-bg/50 backdrop-blur border border-white/5 p-6 rounded-3xl flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-neon-blue/20 flex items-center justify-center -mt-12 mb-4 border-2 border-dark-card overflow-hidden shadow-2xl">
                      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={32} className="text-neon-blue" />}
                    </div>
                    <h3 className="font-black text-white text-lg">{user?.displayName || user?.username}</h3>
                    <p className="text-neon-blue font-black text-xs mb-4 uppercase">{user?.membershipType === 'VIP' ? 'GLOBAL ELITE' : 'PLAYER'}</p>
                    
                    <div className="w-full grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/5 rounded-xl flex flex-col items-center py-2 border border-white/10">
                        <span className="text-[8px] text-gray-500">ساعت</span>
                        <span className="text-white font-bold text-xs">3.5K</span>
                      </div>
                      <div className="bg-white/5 rounded-xl flex flex-col items-center py-2 border border-white/10">
                        <span className="text-[8px] text-gray-500">K/D</span>
                        <span className="text-white font-bold text-xs">1.42</span>
                      </div>
                      <div className="bg-white/5 rounded-xl flex flex-col items-center py-2 border border-white/10">
                        <span className="text-[8px] text-gray-500">بُردها</span>
                        <span className="text-white font-bold text-xs">1,242</span>
                      </div>
                    </div>
                 </div>
               </NeonCard>
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={isEditModalOpen} title="ویرایش پروفایل شخصی" onClose={() => setIsEditModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">نام نمایشی</label>
            <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">بایوگرافی</label>
            <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none" rows={3} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">تصویر پروفایل</label>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {editForm.avatarUrl ? <img src={editForm.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User size={20} className="text-gray-500" />}
              </div>
              <input type="file" accept="image/png, image/jpeg" onChange={handleAvatarUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-neon-blue/10 file:text-neon-blue hover:file:bg-neon-blue/20 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">لینک کاور پروفایل (Banner)</label>
            <input type="text" value={editForm.bannerUrl} onChange={e => setEditForm({...editForm, bannerUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none" />
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
             <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">انصراف</button>
             <GlowButton onClick={handleUpdateProfile}>ذخیره تغییرات</GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
