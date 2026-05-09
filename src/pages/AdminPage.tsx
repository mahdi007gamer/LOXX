import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import * as Icons from "lucide-react";
import { 
  Users, Shield, Plus, Trash2, Edit2, Search, X, 
  Gamepad, Globe, ShieldAlert, CreditCard, 
  Check, XCircle, Eye, Clock, AlertCircle
} from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { GameAdminModal } from "../components/modals/GameAdminModal";
import { GenreAdminModal } from "../components/modals/GenreAdminModal";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<"users" | "games" | "payments" | "genres">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await api.get(`/admin/users?search=${searchTerm}`).catch(() => ({ data: { data: [] } }));
        setUsers(res.data.data || []);
      } else if (activeTab === "games") {
        const res = await api.get("/games");
        setGames(res.data.data || []);
      } else if (activeTab === "payments") {
        const res = await api.get("/payments/admin/pending");
        setPayments(res.data.data || []);
      } else if (activeTab === "genres") {
        const res = await api.get("/admin/genres");
        setGenres(res.data.data || []);
      }
    } catch (err) {
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  const deleteGenre = async (id: string) => {
    if (!window.confirm("آیا از حذف این ژانر اطمینان دارید؟")) return;
    try {
      await api.delete(`/admin/genres/${id}`);
      toast.success("ژانر با موفقیت حذف شد");
      fetchData();
    } catch (err) {
      toast.error("خطا در حذف ژانر");
    }
  };

  const handleApprovePayment = async (id: string) => {
    if (!confirm("آیا از تایید این تراکنش اطمینان دارید؟")) return;
    try {
      await api.post("/payments/admin/approve", { paymentId: id });
      toast.success("تراکنش با موفقیت تایید و اشتراک فعال شد");
      fetchData();
    } catch (err) {
      toast.error("خطا در تایید تراکنش");
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason = prompt("علت رد تراکنش را بنویسید (اختیاری):");
    if (reason === null) return;
    
    try {
      await api.post("/payments/admin/reject", { paymentId: id, reason });
      toast.success("تراکنش رد شد");
      fetchData();
    } catch (err) {
      toast.error("خطا در رد تراکنش");
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("آیا از حذف این کاربر اطمینان دارید؟")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("کاربر با موفقیت حذف شد");
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      toast.error("خطا در حذف کاربر");
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      toast.success("نقش بروزرسانی شد");
      fetchData();
    } catch {
      toast.error("خطا در بروزرسانی");
    }
  };

  const handleEditGame = async (id: string) => {
    try {
      const res = await api.get(`/admin/games/${id}`);
      setSelectedGame(res.data.data);
      setIsGameModalOpen(true);
    } catch {
      toast.error("خطا در دریافت اطلاعات بازی");
    }
  };

  const removeGame = async (id: string) => {
    if (!window.confirm("از حذف بازی اطمینان دارید؟ تمام لابی‌های مربوطه حذف خواهند شد.")) return;
    try {
      await api.delete(`/admin/games/${id}`);
      toast.success("بازی حذف شد");
      fetchData();
    } catch {
      toast.error("خطا در حذف بازی");
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                  <Shield size={24} />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">پنل مدیریت پیشرفته</h1>
              </div>
              <p className="text-gray-400 font-bold">پلتفرم مدیریت جامع بازی‌ها و اعضای لوکس</p>
            </div>
          </header>

          <div className="flex gap-4 border-b border-white/5 pb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                activeTab === "users" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              کاربران سیستم
              {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                activeTab === "games" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              دیتابیس بازی‌ها
              {activeTab === "games" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
            </button>
             <button
                onClick={() => setActiveTab("payments")}
                className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                  activeTab === "payments" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                تراکنش‌های بانکی
                {activeTab === "payments" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
             <button
               onClick={() => setActiveTab("genres")}
               className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                 activeTab === "genres" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
               }`}
             >
               ژانرها
               {activeTab === "genres" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
          </div>

          {activeTab === "users" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در نام کاربری یا ایمیل..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 text-sm text-white focus:outline-none focus:border-neon-blue/50 transition-all font-bold"
                />
              </div>

              <div className="glass rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                <table className="w-full text-right">
                <thead>
                  <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">کاربر</th>
                    <th className="px-6 py-4">ایمیل</th>
                    <th className="px-6 py-4">نقش و اشتراک</th>
                    <th className="px-6 py-4">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-4 font-bold">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 flex gap-2">
                         <select 
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-blue" 
                          value={user.role} 
                          onChange={e => updateRole(user.id, e.target.value)}
                         >
                           <option value="USER" className="bg-dark-card">کاربر عادی</option>
                           <option value="ADMIN" className="bg-dark-card">مدیر ارشد</option>
                         </select>
                         <select 
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-pink" 
                          value={user.profile?.membershipType || "NONE"} 
                          onChange={async (e) => {
                             try {
                               await api.patch(`/admin/users/${user.id}/membership`, { membershipType: e.target.value });
                               toast.success("اشتراک کاربر بروزرسانی شد");
                               fetchData();
                             } catch {
                               toast.error("خطا در بروزرسانی");
                             }
                          }}
                         >
                           <option value="NONE" className="bg-dark-card">معمولی</option>
                           <option value="PLUS" className="bg-dark-card">کاربر PLUS</option>
                           <option value="VIP" className="bg-dark-card">کاربر VIP</option>
                         </select>
                      </td>
                      <td className="px-6 py-4">
                         <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </div>
          ) : activeTab === "games" ? (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <div>
                    <h2 className="text-2xl font-black text-white">مدیریت کتابخانه بازی</h2>
                    <p className="text-gray-500 text-sm">بروزرسانی ویژگی‌ها، مپ‌ها و متادیتای بازی‌ها</p>
                  </div>
                  <GlowButton onClick={() => { setSelectedGame(null); setIsGameModalOpen(true); }}>
                    <Plus size={20} className="ml-2" /> افزودن بازی جدید
                  </GlowButton>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <NeonCard key={game.id} className="p-0 overflow-hidden group">
                    <div className="h-32 w-full relative bg-gray-900">
                      {game.bannerUrl && <img src={game.bannerUrl} className="h-full w-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500" alt={game.title} />}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent" />
                      <div className="absolute bottom-4 right-4 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#0a0a0f] border border-white/10 p-1">
                          {game.iconUrl && <img src={game.iconUrl} className="h-full w-full rounded-xl object-cover" alt="icon" />}
                        </div>
                        <h3 className="font-black text-xl text-white drop-shadow-lg">{game.title}</h3>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {game.genres && (() => {
                          try {
                            const parsed = JSON.parse(game.genres);
                            return Array.isArray(parsed) ? parsed.slice(0, 2).map((g: string) => (
                               <span key={g} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 uppercase">{g}</span>
                            )) : null;
                          } catch (e) {
                            return <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 uppercase">{game.genres}</span>;
                          }
                        })()}
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/5">
                        <GlowButton variant="secondary" className="flex-1 py-2.5 text-[10px]" onClick={() => handleEditGame(game.id)}>
                          <Edit2 size={14} className="ml-2" /> ویرایش ویژگی‌ها
                        </GlowButton>
                        <button 
                          onClick={() => removeGame(game.id)}
                          className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </NeonCard>
                ))}
               </div>
            </div>
          ) : activeTab === "genres" ? (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <div>
                    <h2 className="text-2xl font-black text-white">مدیریت ژانرها</h2>
                    <p className="text-gray-500 text-sm italic font-bold">افزودن و ویرایش دسته‌بندی‌های بازی</p>
                  </div>
                  <GlowButton onClick={() => { setSelectedGenre(null); setIsGenreModalOpen(true); }}>
                    <Plus size={20} className="ml-2" /> افزودن ژانر جدید
                  </GlowButton>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {genres.map(genre => {
                    const IconComponent = (Icons as any)[genre.icon || "Gamepad2"] || Icons.Gamepad2;
                    return (
                      <div key={genre.id} className="relative group">
                        <div className="absolute inset-0 bg-neon-blue/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all group-hover:border-neon-blue/30 group-hover:bg-white/10">
                           <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-blue group-hover:scale-110 transition-transform">
                              <IconComponent size={20} />
                           </div>
                           <span className="font-black text-white italic text-[11px] uppercase tracking-tighter">{genre.name}</span>
                           
                           <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setSelectedGenre(genre); setIsGenreModalOpen(true); }} className="p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-neon-blue transition-colors">
                                 <Edit2 size={12} />
                              </button>
                              <button onClick={() => deleteGenre(genre.id)} className="p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-red-500 transition-colors">
                                 <Trash2 size={12} />
                              </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
               {genres.length === 0 && (
                 <div className="p-20 text-center text-gray-500 uppercase font-black italic tracking-widest text-xs opacity-50">
                    ژانری یافت نشد
                 </div>
               )}
            </div>
          ) : (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                   <div>
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">درخواست‌های تایید تراکنش</h2>
                     <p className="text-gray-500 text-sm font-bold">بررسی رسیدهای بانکی و فعال‌سازی اشتراک کاربران</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 animate-pulse border border-yellow-400/20">
                         <Clock size={20} />
                      </div>
                      <span className="text-white font-black italic">{payments.length} مورد معلق</span>
                   </div>
                </div>

                <div className="glass rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                   {payments.length === 0 ? (
                      <div className="p-20 text-center text-gray-500 uppercase font-black italic tracking-widest text-xs opacity-50">
                         تراکنش معلقی وجود ندارد
                      </div>
                   ) : (
                      <table className="w-full text-right font-bold">
                         <thead>
                           <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                             <th className="px-6 py-5">کاربر</th>
                             <th className="px-6 py-5">طرح انتخابی</th>
                             <th className="px-6 py-5">تاریخ ثبت</th>
                             <th className="px-6 py-5">رسید پرداخت</th>
                             <th className="px-6 py-5">عملیات</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {payments.map(req => (
                               <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="flex flex-col">
                                        <span className="text-white font-black italic">{req.user.username}</span>
                                        <span className="text-[10px] text-gray-500">{req.user.email}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest border",
                                        req.type === "VIP" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : "bg-neon-blue/10 text-neon-blue border-neon-blue/20"
                                     )}>
                                        {req.type}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-400 italic">
                                     {new Date(req.createdAt).toLocaleString('fa-IR')}
                                  </td>
                                  <td className="px-6 py-4">
                                     <button 
                                        onClick={() => setPreviewImage(req.receiptImageUrl)}
                                        className="h-10 w-20 rounded-xl bg-white/5 overflow-hidden border border-white/10 hover:border-neon-blue transition-all group"
                                     >
                                        <img src={req.receiptImageUrl} className="h-full w-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                     </button>
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleApprovePayment(req.id)}
                                          className="h-10 w-10 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center border border-green-500/20"
                                          title="تایید تراکنش"
                                        >
                                           <Check size={18} />
                                        </button>
                                        <button 
                                          onClick={() => handleRejectPayment(req.id)}
                                          className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                                          title="رد تراکنش"
                                        >
                                           <X size={18} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   )}
                </div>
                
                <AnimatePresence>
                   {previewImage && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl cursor-zoom-out"
                      >
                         <motion.img 
                           initial={{ scale: 0.9, rotateY: -10 }}
                           animate={{ scale: 1, rotateY: 0 }}
                           exit={{ scale: 0.9 }}
                           src={previewImage}
                           className="max-w-full max-h-full rounded-3xl shadow-2xl border border-white/20"
                         />
                         <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                            <X size={32} />
                         </button>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          )}
        </div>
      </div>

      <GameAdminModal 
        isOpen={isGameModalOpen} 
        onClose={() => setIsGameModalOpen(false)} 
        game={selectedGame}
        onSuccess={fetchData}
      />

      <GenreAdminModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        genre={selectedGenre}
        onSuccess={fetchData}
      />
    </div>
  );
};
