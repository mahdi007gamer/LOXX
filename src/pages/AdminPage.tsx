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
import { BadgeAdminModal } from "../components/modals/BadgeAdminModal";
import { UserEditModal } from "../components/modals/UserEditModal";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { getFileUrl } from "../lib/constants";
import { AuthorizedImage } from "../components/ui/AuthorizedImage";

export const AdminPage = () => {
  const { isSidebarCollapsed } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "games" | "payments" | "paymentsHistory" | "genres" | "badges" | "reports" | "gifs" | "streamers">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [gifs, setGifs] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  
  // New Admin GIF States
  const [newGifFile, setNewGifFile] = useState<File | null>(null);
  const [newGifTitle, setNewGifTitle] = useState("");
  const [newGifTags, setNewGifTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  
  // Editing states
  const [editingGifId, setEditingGifId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");

  const [loading, setLoading] = useState(true);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<any | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
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
      } else if (activeTab === "paymentsHistory") {
        const res = await api.get("/payments/admin/history");
        setPaymentsHistory(res.data.data || []);
      } else if (activeTab === "genres") {
        const res = await api.get("/admin/genres");
        setGenres(res.data.data || []);
      } else if (activeTab === "badges") {
        const res = await api.get("/badges");
        setBadges(res.data.data || []);
      } else if (activeTab === "reports") {
        const res = await api.get("/reports/admin").catch(() => ({ data: { data: [] } }));
        setReports(res.data.data || []);
      } else if (activeTab === "gifs") {
        const res = await api.get(`/upload/gifs?q=${searchTerm}`).catch(() => ({ data: [] }));
        setGifs(res.data || []);
      } else if (activeTab === "streamers") {
        const res = await api.get(`/admin/streamers`).catch(() => ({ data: { data: [] } }));
        setStreamers(res.data.data || []);
      }
    } catch (err) {
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`, { isVerified: !currentStatus });
      toast.success("وضعیت تایید تغییر یافت");
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
    } catch (err: any) {
      toast.error("خطا در تغییر وضعیت تایید");
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
      <div className={cn("flex-1 min-w-0 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto custom-scrollbar transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                  <Shield size={24} />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter italic">پنل مدیریت</h1>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic opacity-60">Advanced Authority Controls</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <GlowButton 
                variant="purple"
                size="sm"
                className="h-12 px-6 text-[10px] uppercase font-black tracking-widest italic !rounded-2xl gap-2"
                onClick={() => {
                  window.location.href = '/admin/streamers';
                }}
              >
                <Icons.Zap size={16} /> <span>مدیریت ویژه استریمرها</span>
              </GlowButton>
              <GlowButton 
                variant="secondary"
                size="sm"
                className="h-12 px-6 text-[10px] uppercase font-black tracking-widest italic !rounded-2xl gap-2"
                onClick={() => {
                  window.location.href = `${api.defaults.baseURL}/admin/backup`;
                }}
              >
                <Icons.Download size={16} /> <span>پشتیبانی از دیتابیس</span>
              </GlowButton>
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
              کتابخانه بازی‌ها
              {activeTab === "games" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
            </button>
             <button
                onClick={() => setActiveTab("payments")}
                className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                  activeTab === "payments" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                تراکنش‌های معلق
                {activeTab === "payments" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
             <button
                onClick={() => setActiveTab("paymentsHistory")}
                className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                  activeTab === "paymentsHistory" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                تاریخچه تراکنش‌ها
                {activeTab === "paymentsHistory" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
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
             <button
               onClick={() => setActiveTab("badges")}
               className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                 activeTab === "badges" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
               }`}
             >
               نشان‌ها
               {activeTab === "badges" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
             <button
               onClick={() => setActiveTab("reports")}
               className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                 activeTab === "reports" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
               }`}
             >
               گزارش‌های تخلف
               {activeTab === "reports" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
             </button>
              <button
                onClick={() => setActiveTab("gifs")}
                className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all relative ${
                  activeTab === "gifs" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                گیف‌ها (گالری)
                {activeTab === "gifs" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_15px_#00E5FF]" />}
              </button>
          </div>

          {activeTab === "users" ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو در نام کاربری یا شماره همراه..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pr-12 text-sm text-white focus:outline-none focus:border-neon-blue/50 transition-all font-bold"
                  />
                </div>
                <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                   <Users size={16} className="text-neon-blue" />
                   <span className="text-white font-black italic">{users.length} <span className="text-[10px] text-gray-500 uppercase">کاربر</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {users.map(user => (
                   <motion.div 
                     key={user.id} 
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-[#0a0a0f] border border-white/5 rounded-[32px] p-6 hover:border-white/10 transition-all group relative overflow-hidden"
                   >
                     <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-gray-900">
                            {user.profile?.avatarUrl || user.username ? (
                              <img 
                                src={getFileUrl(user.profile?.avatarUrl || "")} 
                                className="h-full w-full object-cover" 
                                alt="avatar" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
                                }}
                              />
                            ) : (
                               <div className="flex h-full w-full items-center justify-center text-gray-500">
                                  <Users size={24} />
                               </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="text-white font-black italic truncate">{user.username}</h3>
                           <p className="text-[10px] text-gray-500 font-bold italic truncate uppercase">{user.phone}</p>
                        </div>
                     </div>

                     <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-1">
                           <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">وضعیت عضویت</span>
                           <span className={cn(
                             "text-[10px] font-black uppercase italic px-3 py-1 rounded-full border w-fit",
                             user.profile?.membershipType === "VIP" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20 shadow-[0_0_10px_#facc1522]" : 
                             user.profile?.membershipType === "PLUS" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/20 shadow-[0_0_10px_#00e5ff22]" : 
                             "bg-white/5 text-gray-500 border-white/5"
                           )}>
                              {user.profile?.membershipType || "NONE"}
                           </span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                           <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">تاییدیه</span>
                           <button 
                             onClick={() => toggleVerification(user.id, user.isVerified)}
                             className={cn(
                               "h-8 w-8 rounded-xl flex items-center justify-center transition-all border",
                               user.isVerified ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                             )}
                           >
                             <Icons.ShieldCheck size={16} />
                           </button>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">نقش</span>
                           <span className={cn(
                             "text-[10px] font-black uppercase italic px-3 py-1 rounded-full border w-fit",
                             user.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-gray-500 border-white/5"
                           )}>
                              {user.role}
                           </span>
                        </div>
                     </div>

                     <GlowButton 
                       variant="secondary" 
                       className="w-full h-12 text-[10px] font-black uppercase italic tracking-widest"
                       onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }}
                     >
                       <Edit2 size={14} className="ml-2" /> مدیریت و ویرایش
                     </GlowButton>
                     
                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Shield size={80} />
                     </div>
                   </motion.div>
                 ))}
              </div>
              
              {users.length === 0 && !loading && (
                <div className="py-20 text-center opacity-30">
                   <Search size={64} className="mx-auto mb-4 text-gray-500" />
                   <p className="font-black italic uppercase tracking-widest">هیچ کاربری یافت نشد</p>
                </div>
              )}
            </div>
          ) : activeTab === "games" ? (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <div>
                    <h2 className="text-2xl font-black text-white">مدیریت کتابخانه بازی</h2>
                    <p className="text-gray-500 text-sm">بروزرسانی ویژگی‌ها، مپ‌ها و متادیتای بازی‌ها</p>
                  </div>
                  <div className="flex gap-4">
                    <GlowButton 
                      variant="secondary" 
                      size="sm" 
                      onClick={async () => {
                        if (!confirm("آیا مایل به همگام‌سازی خودکار نشان‌ها با بازی‌ها هستید؟")) return;
                        setLoading(true);
                        try {
                          await api.post("/admin/games/auto-link-badges");
                          toast.success("همگام‌سازی با موفقیت انجام شد");
                          fetchData();
                        } catch {
                          toast.error("خطا در همگام‌سازی");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-6 h-12 text-[10px] font-black uppercase italic !rounded-2xl gap-2"
                    >
                      <Icons.RefreshCw size={16} /> <span>همگام‌سازی نشان‌ها</span>
                    </GlowButton>
                    <GlowButton onClick={() => { setSelectedGame(null); setIsGameModalOpen(true); }}>
                      <Plus size={20} className="ml-2" /> افزودن بازی جدید
                    </GlowButton>
                  </div>
                </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <NeonCard key={game.id} className="p-0 overflow-hidden group">
                    <div className="h-32 w-full relative bg-gray-900">
                      {game.bannerUrl && <img src={getFileUrl(game.bannerUrl)} className="h-full w-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500" alt={game.title} />}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent" />
                      <div className="absolute bottom-4 right-4 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#0a0a0f] border border-white/10 p-1">
                          {game.iconUrl && <img src={getFileUrl(game.iconUrl)} className="h-full w-full rounded-xl object-cover" alt={game.title} />}
                        </div>
                        <h3 className="font-black text-xl text-white drop-shadow-lg">{game.title}</h3>
                        {game.badge && (
                          <div className="h-6 w-6 ml-2" title={game.badge.name}>
                            <img src={getFileUrl(game.badge.iconUrl)} className="h-full w-full object-contain filter drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" alt={game.badge.name} />
                          </div>
                        )}
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
            <div className="space-y-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0d0d12] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Icons.Gamepad2 size={120} />
                  </div>
                  <div className="text-center md:text-right relative z-10">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">مدیریت ژانرهای بازی</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] italic">دسته‌بندی‌های موضوعی و المان‌های بصری بازی‌ها را شخصی‌سازی کنید</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 relative z-10">
                    <GlowButton 
                      variant="blue" 
                      size="sm" 
                      className="px-6 h-12 text-[10px] font-black uppercase italic !rounded-2xl gap-2"
                      onClick={async () => {
                        if (!confirm("آیا مایل به افزودن ژانرهای پیش‌فرض هستید؟ (ژانرهای تکراری اضافه نخواهند شد)")) return;
                        try {
                          await api.post("/admin/genres/seed-default");
                          toast.success("ژانرهای پیش‌فرض با موفقیت افزوده شدند");
                          fetchData();
                        } catch {
                          toast.error("خطا در افزودن ژانرها");
                        }
                      }}
                    >
                      <Icons.Sparkles size={16} /> <span>افزودن موارد پیش‌فرض</span>
                    </GlowButton>
                    <GlowButton 
                      variant="purple"
                      size="sm"
                      className="px-8 h-12 text-[10px] font-black uppercase italic !rounded-2xl gap-2"
                      onClick={() => { setSelectedGenre(null); setIsGenreModalOpen(true); }}
                    >
                      <Plus size={16} /> <span>ایجاد ژانر جدید</span>
                    </GlowButton>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {genres.map(genre => {
                    const IconComponent = (Icons as any)[genre.icon || "Gamepad2"] || Icons.Gamepad2;
                    return (
                      <motion.div 
                        key={genre.id} 
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="relative group h-full"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                        <div className="relative h-full bg-[#0d0d12] border border-white/5 rounded-[32px] p-6 flex flex-col items-center text-center transition-all group-hover:border-neon-blue/40 group-hover:bg-[#12121a]">
                           <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-neon-blue group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl border border-white/5 group-hover:border-neon-blue/20 mb-4">
                              <IconComponent size={32} />
                           </div>
                           <h4 className="font-black text-white italic text-base uppercase tracking-tighter mb-1 line-clamp-1">{genre.name}</h4>
                           <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">{genre.slug}</span>
                           
                           <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setSelectedGenre(genre); setIsGenreModalOpen(true); }} 
                                className="h-8 w-8 rounded-lg bg-black/40 text-gray-400 hover:text-neon-blue transition-colors flex items-center justify-center border border-white/5"
                              >
                                 <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => deleteGenre(genre.id)} 
                                className="h-8 w-8 rounded-lg bg-black/40 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center border border-white/5"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
               </div>
               {genres.length === 0 && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="py-32 flex flex-col items-center justify-center text-center opacity-40 group"
                 >
                    <div className="h-24 w-24 rounded-[40px] bg-white/5 border border-white/5 flex items-center justify-center text-gray-700 mb-6 group-hover:scale-110 transition-transform">
                       <Icons.Ghost size={64} />
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.2em]">ژانری یافت نشد</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mt-2 italic tracking-widest">برای شروع، روی "افزودن ژانرهای پیش‌فرض" کلیک کنید</p>
                 </motion.div>
               )}
            </div>
          ) : activeTab === "badges" ? (
            <div className="space-y-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0d0d12] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Icons.Award size={120} />
                  </div>
                  <div className="text-center md:text-right relative z-10">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">مدیریت نشان‌ها (Badges)</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] italic">نشان‌های بازی، عمومی و ویژه را مدیریت کنید</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 relative z-10">
                    <GlowButton 
                      variant="blue" 
                      size="sm" 
                      className="px-6 h-12 text-[10px] font-black uppercase italic !rounded-2xl gap-2"
                      onClick={async () => {
                        if (!confirm("آیا مایل به افزودن نشان‌های پیش‌فرض هستید؟")) return;
                        try {
                          await api.post("/admin/badges/seed-default");
                          toast.success("نشان‌های پیش‌فرض با موفقیت افزوده شدند");
                          fetchData();
                        } catch {
                          toast.error("خطا در افزودن نشان‌ها");
                        }
                      }}
                    >
                      <Icons.Sparkles size={16} /> <span>افزودن موارد پیش‌فرض</span>
                    </GlowButton>
                    <GlowButton 
                      variant="purple"
                      size="sm"
                      className="px-8 h-12 text-[10px] font-black uppercase italic !rounded-2xl gap-2 relative z-10"
                      onClick={() => { setSelectedBadge(null); setIsBadgeModalOpen(true); }}
                    >
                      <Plus size={16} /> <span>ایجاد نشان جدید</span>
                    </GlowButton>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {badges.map(badge => (
                    <motion.div 
                      key={badge.id} 
                      whileHover={{ scale: 1.05 }}
                      className="relative group bg-[#0d0d12] border border-white/5 rounded-[32px] p-6 flex flex-col items-center text-center transition-all hover:border-white/20"
                    >
                       <div className="h-16 w-16 mb-4 relative flex items-center justify-center">
                          <img src={getFileUrl(badge.iconUrl)} className="h-full w-full object-contain" alt={badge.name} />
                          {badge.isSpecial && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center text-black border-2 border-[#0d0d12]">
                               <Icons.Shield size={12} fill="currentColor" />
                            </div>
                          )}
                       </div>
                       <h4 className="font-black text-white italic text-xs uppercase tracking-tighter mb-1 line-clamp-1">{badge.name}</h4>
                       <span className={cn(
                         "text-[8px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded-full border",
                         badge.category === "SPECIAL" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" :
                         badge.category === "GAME" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/20" :
                         "bg-white/5 text-gray-500 border-white/5"
                       )}>
                          {badge.category}
                       </span>

                       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[32px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedBadge(badge); setIsBadgeModalOpen(true); }}
                            className="h-10 w-10 rounded-xl bg-white/10 text-white hover:text-neon-purple transition-colors flex items-center justify-center"
                          >
                             <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm("آیا از حذف این نشان اطمینان دارید؟")) return;
                              try {
                                await api.delete(`/badges/${badge.id}`);
                                toast.success("نشان حذف شد");
                                fetchData();
                              } catch {
                                toast.error("خطا در حذف نشان");
                              }
                            }}
                            className="h-10 w-10 rounded-xl bg-white/10 text-white hover:text-red-500 transition-colors flex items-center justify-center"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          ) : activeTab === "reports" ? (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                   <div>
                     <h3 className="text-xl tracking-tighter uppercase font-black italic">گزارش‌های تخلف</h3>
                     <p className="text-gray-400 text-sm tracking-widest mt-1">بررسی شکایات و اعمال محدودیت</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {reports.map((report) => (
                    <NeonCard key={report.id} className="p-4 flex flex-col justify-between">
                      <div className="flex flex-col gap-4 h-full">
                        <div className="space-y-3 flex-1">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-sm text-[10px] uppercase font-black italic border",
                                  report.status === "PENDING" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" :
                                  "bg-green-500/10 text-green-500 border-green-500/20"
                                )}>
                                  {report.status}
                                </span>
                                <span className="text-[10px] text-gray-500 tracking-widest">{new Date(report.createdAt).toLocaleString("fa-IR")}</span>
                              </div>
                              <h4 className="font-bold text-white uppercase text-xs">{report.targetType}</h4>
                           </div>
                           
                           <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                             <div>
                               <p className="text-[9px] text-gray-500 uppercase font-black mb-0.5">ثبت کننده</p>
                               <span className="font-bold text-white text-xs">{report.reporter?.username}</span>
                             </div>
                             {report.reportedUser && (
                               <div className="text-right">
                                 <p className="text-[9px] text-red-400/80 uppercase font-black mb-0.5">متخلف</p>
                                 <span className="font-black text-red-400 italic text-xs">{report.reportedUser.username}</span>
                               </div>
                             )}
                           </div>
                           
                           <div className="bg-[#0a0a0f] p-3 rounded-lg border border-white/5 relative">
                             <div className="absolute top-0 right-0 w-0.5 bg-neon-coral h-full opacity-50"></div>
                             <p className="text-[9px] text-neon-coral uppercase font-black mb-1">دلیل گزارش</p>
                             <p className="text-xs text-gray-300 font-bold">{report.reason}</p>
                           </div>

                           {/* Display Target Data contextually */}
                           {report.targetType === "MESSAGE" && report.targetData && (
                             <div className="bg-[#0a0a0f] p-3 rounded-lg border border-white/5 relative">
                               <div className="absolute top-0 right-0 w-0.5 bg-neon-blue h-full opacity-50"></div>
                               <p className="text-[9px] text-neon-blue uppercase font-black mb-1">متن پیام گزارش شده</p>
                               <p className="text-xs text-white italic">« {report.targetData.content} »</p>
                               {report.targetData.isDeleted && <span className="text-[10px] text-red-500 mt-1 block">(پیام اکنون حذف شده است)</span>}
                             </div>
                           )}

                           {report.targetType === "PROFILE" && report.reportedUser?.profile && (
                             <div className="bg-[#0a0a0f] p-3 rounded-lg border border-white/5 relative overflow-x-auto">
                               <div className="absolute top-0 right-0 w-0.5 bg-purple-500 h-full opacity-50"></div>
                               <p className="text-[9px] text-purple-500 uppercase font-black mb-2">تصاویر پروفایل متخلف</p>
                               <div className="flex gap-2">
                                 {report.reportedUser.profile.avatarUrl && (
                                    <div className="flex flex-col items-center gap-1 min-w-12">
                                      <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
                                         <AuthorizedImage src={report.reportedUser.profile.avatarUrl} className="h-full w-full object-cover" />
                                      </div>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.post(`/reports/admin/${report.id}/action`, { action: "CLEAR_ASSET", assetType: "AVATAR" });
                                            toast.success("آواتار حذف شد");
                                            fetchData();
                                          } catch { toast.error("خطا"); }
                                        }}
                                        className="text-[9px] text-red-400 hover:text-red-300 transition-colors uppercase font-black"
                                      >حذف</button>
                                    </div>
                                 )}
                                 {report.reportedUser.profile.bannerUrl && (
                                    <div className="flex flex-col items-center gap-1 min-w-20">
                                      <div className="h-10 w-20 rounded-md overflow-hidden border border-white/10">
                                         <AuthorizedImage src={report.reportedUser.profile.bannerUrl} className="h-full w-full object-cover" />
                                      </div>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.post(`/reports/admin/${report.id}/action`, { action: "CLEAR_ASSET", assetType: "BANNER" });
                                            toast.success("بنر حذف شد");
                                            fetchData();
                                          } catch { toast.error("خطا"); }
                                        }}
                                        className="text-[9px] text-red-400 hover:text-red-300 transition-colors uppercase font-black"
                                      >حذف</button>
                                    </div>
                                 )}
                                 {report.reportedUser.profile.vipMetadata && JSON.parse(report.reportedUser.profile.vipMetadata).bgImage && (
                                    <div className="flex flex-col items-center gap-1 min-w-20">
                                      <div className="h-10 w-20 rounded-md overflow-hidden border border-white/10">
                                         <AuthorizedImage src={JSON.parse(report.reportedUser.profile.vipMetadata).bgImage} className="h-full w-full object-cover" />
                                      </div>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.post(`/reports/admin/${report.id}/action`, { action: "CLEAR_ASSET", assetType: "VIP_BG" });
                                            toast.success("بک‌گراند حذف شد");
                                            fetchData();
                                          } catch { toast.error("خطا"); }
                                        }}
                                        className="text-[9px] text-red-400 hover:text-red-300 transition-colors uppercase font-black"
                                      >حذف</button>
                                    </div>
                                 )}
                               </div>
                             </div>
                           )}
                        </div>

                        {report.status === "PENDING" && (
                          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">
                           {report.targetType === "MESSAGE" && report.targetId && !report.targetData?.isDeleted && (
                             <button
                               onClick={async () => {
                                 try {
                                   await api.post(`/reports/admin/${report.id}/action`, { action: "DELETE_MESSAGE" });
                                   toast.success("پیام حذف شد");
                                   fetchData();
                                 } catch {
                                   toast.error("خطا");
                                 }
                               }}
                               className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 col-span-2 rounded-lg text-[10px] font-black transition-colors"
                             >
                               حذف محتوا
                             </button>
                           )}
                           
                             <button
                               onClick={async () => {
                                 const duration = prompt("مدت محدودیت چت (به دقیقه):", "15");
                                 if (!duration) return;
                                 try {
                                   await api.post(`/reports/admin/${report.id}/action`, { 
                                     action: "PENALIZE", penaltyType: "CHAT_BAN", durationMinutes: duration, reason: report.reason 
                                   });
                                   toast.success("محدودیت چت اعمال شد");
                                   fetchData();
                                 } catch { toast.error("خطا"); }
                               }}
                               className="px-2 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded-lg text-[10px] font-black transition-colors text-center"
                             >
                               بن چت
                             </button>
                             <button
                               onClick={async () => {
                                 const duration = prompt("مدت مسدودیت کامل (به دقیقه):", "60");
                                 if (!duration) return;
                                 try {
                                   await api.post(`/reports/admin/${report.id}/action`, { 
                                     action: "PENALIZE", penaltyType: "GLOBAL_BAN", durationMinutes: duration, reason: report.reason 
                                   });
                                   toast.success("مسدودیت کامل اعمال شد");
                                   fetchData();
                                 } catch { toast.error("خطا"); }
                               }}
                               className="px-2 py-2 bg-neon-coral/10 hover:bg-neon-coral/20 text-neon-coral border border-neon-coral/20 rounded-lg text-[10px] font-black transition-colors text-center"
                             >
                               بن اکانت
                             </button>
                           <button
                             onClick={async () => {
                               try {
                                 await api.post(`/reports/admin/${report.id}/action`, { action: "DISMISS" });
                                 toast.success("گزارش بسته شد");
                                 fetchData();
                               } catch { toast.error("خطا"); }
                             }}
                             className="px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[10px] font-black transition-colors col-span-2 mt-1"
                           >
                             رد گزارش
                           </button>
                          </div>
                        )}
                      </div>
                    </NeonCard>
                  ))}
                  
                  {reports.length === 0 && (
                    <div className="col-span-full text-center p-8 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-gray-500 font-bold text-sm">گزارشی یافت نشد</p>
                    </div>
                  )}
                </div>
             </div>
          ) : activeTab === "payments" ? (
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
                                        onClick={() => setPreviewImage(getFileUrl(req.receiptImageUrl))}
                                        className="h-10 w-20 rounded-xl bg-white/5 overflow-hidden border border-white/10 hover:border-neon-blue transition-all group"
                                     >
                                        <AuthorizedImage src={req.receiptImageUrl} className="h-full w-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
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
                         <AuthorizedImage 
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
          ) : activeTab === "paymentsHistory" ? (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                   <div>
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">تاریخچه تراکنش‌ها</h2>
                     <p className="text-gray-500 text-sm font-bold">تراکنش‌های تایید شده و رد شده اخیر</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                         <Clock size={20} />
                      </div>
                      <span className="text-white font-black italic">{paymentsHistory.length} تراکنش</span>
                   </div>
                </div>

                <div className="glass rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                   {paymentsHistory.length === 0 ? (
                      <div className="p-20 text-center text-gray-500 uppercase font-black italic tracking-widest text-xs opacity-50">
                         تراکنشی یافت نشد
                      </div>
                   ) : (
                      <table className="w-full text-right font-bold">
                         <thead>
                           <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                             <th className="px-6 py-5">کاربر</th>
                             <th className="px-6 py-5">مبلغ</th>
                             <th className="px-6 py-5">تاریخ</th>
                             <th className="px-6 py-5">رسید پرداخت</th>
                             <th className="px-6 py-5">وضعیت</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {paymentsHistory.map(req => (
                               <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="flex flex-col">
                                        <span className="text-white font-black italic">{req.user.username}</span>
                                        <span className="text-[10px] text-gray-500">{req.user.email}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className="text-emerald-400 font-bold">{req.amount.toLocaleString()} تومان</span>
                                     <span className="text-gray-500 text-[10px] block mt-1">{req.roleRequested} - {req.durationDays} روز</span>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className="text-gray-300 text-xs">{new Date(req.updatedAt).toLocaleDateString('fa-IR')}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                     <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setPreviewImage(getFileUrl(req.receiptImageUrl));
                                       }}
                                       className="h-10 w-16 bg-white/5 rounded-lg border border-white/10 overflow-hidden relative group"
                                     >
                                        <AuthorizedImage src={req.receiptImageUrl} className="h-full w-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                     </button>
                                  </td>
                                  <td className="px-6 py-4">
                                     {req.status === "APPROVED" ? (
                                        <span className="text-green-500 text-xs font-black uppercase bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">تایید شده</span>
                                     ) : (
                                        <div className="flex flex-col items-start gap-1">
                                          <span className="text-red-500 text-xs font-black uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">رد شده</span>
                                          {req.reason && <span className="text-[9px] text-gray-500 w-32 truncate" title={req.reason}>{req.reason}</span>}
                                        </div>
                                     )}
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl cursor-zoom-out"
                      >
                         <AuthorizedImage 
                           src={previewImage}
                           className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl border border-white/20"
                         />
                         <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                            <X size={32} />
                         </button>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          ) : activeTab === "gifs" ? (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0d0d12] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icons.Image size={120} />
                   </div>
                   <div className="text-center md:text-right relative z-10">
                     <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1">گالری گیف‌های آماده لوکس</h2>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] italic">گیف‌های آماده‌ای که کاربران در چت به آن‌ها دسترسی دارند را مدیریت کنید</p>
                   </div>
                   <div className="flex flex-wrap justify-center gap-3 relative z-10">
                      <div className="h-10 w-10 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                         <Icons.Flame size={20} />
                      </div>
                      <span className="text-white font-black italic">{gifs.length} گیف در سیستم</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-[#0d0d12]/60 border border-white/5 p-6 rounded-[32px] space-y-6 h-fit">
                    <h3 className="text-lg font-black text-white italic">آپلود گیف جدید</h3>
                    <div 
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/[0.01] h-40 relative group ${newGifFile ? "border-neon-blue/50" : "border-white/10 hover:border-white/20"}`}
                      onClick={() => document.getElementById("admin-gif-file-picker")?.click()}
                    >
                      <input 
                        id="admin-gif-file-picker"
                        type="file" 
                        accept="image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== "image/gif") {
                              toast.error("فقط فایل‌های گیف مجاز هستند.");
                              return;
                            }
                            setNewGifFile(file);
                            if (!newGifTitle) {
                              setNewGifTitle(file.name.replace(/\\.gif$/i, ''));
                            }
                          }
                        }}
                      />
                      {newGifFile ? (
                        <div className="text-center space-y-2">
                          <Icons.FileCheck className="text-neon-blue mx-auto" size={36} />
                          <p className="text-xs text-white font-bold w-48 truncate">{newGifFile.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{(newGifFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Icons.UploadCloud className="text-gray-400 group-hover:text-white transition-colors mx-auto" size={36} />
                          <p className="text-xs text-gray-300 font-bold">انتخاب فایل گیف</p>
                          <p className="text-[10px] text-gray-500">یا فایل را اینجا بکشید و رها کنید</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold">عنوان گیف</label>
                      <input 
                        type="text" 
                        value={newGifTitle}
                        onChange={(e) => setNewGifTitle(e.target.value)}
                        placeholder="با این گیف چه احساسی بروز داده میشه؟"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/40 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-bold flex justify-between">
                        <span>تگ‌ها / کلمات کلیدی (فارسی/انگلیسی)</span>
                        <span className="text-[9px] text-gray-500">برای ثبت اینتر بزنید</span>
                      </label>
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = tagInput.trim().toLowerCase();
                            if (val && !newGifTags.includes(val)) {
                              setNewGifTags(prev => [...prev, val]);
                            }
                            setTagInput("");
                          }
                        }}
                        placeholder="ثبت با اینتر... (مثلا: خنده، شادی)"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neon-blue/40 font-bold"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {newGifTags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            onClick={() => setNewGifTags(prev => prev.filter(t => t !== tag))}
                            className="text-[10px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red/20 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>#{tag}</span>
                            <X size={10} />
                          </span>
                        ))}
                      </div>
                    </div>

                    <GlowButton 
                      variant="blue" 
                      className="w-full h-12 text-xs font-black"
                      disabled={isUploadingGif || !newGifFile}
                      onClick={async () => {
                        if (!newGifFile) return;
                        setIsUploadingGif(true);
                        const formData = new FormData();
                        formData.append("file", newGifFile);
                        formData.append("title", newGifTitle);
                        formData.append("tags", newGifTags.join(","));

                        try {
                          await api.post("/upload/gifs/store", formData, {
                            headers: { "Content-Type": "multipart/form-data" }
                          });
                          toast.success("گیف گالری با موفقیت ثبت شد.");
                          setNewGifFile(null);
                          setNewGifTitle("");
                          setNewGifTags([]);
                          fetchData();
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || "خطا در آپلود گیف");
                        } finally {
                          setIsUploadingGif(false);
                        }
                      }}
                    >
                      {isUploadingGif ? "در حال آپلود و بهینه‌سازی..." : "آپلود و ذخیره در گالری"}
                    </GlowButton>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                     <div className="flex justify-between items-center bg-[#0d0d12]/40 border border-white/5 px-6 py-4 rounded-2xl">
                        <span className="text-xs text-gray-400 font-bold">برای جستجو از کادر بالا استفاده کنید...</span>
                     </div>
                     
                     {gifs.length === 0 ? (
                       <div className="py-24 text-center text-gray-500 font-bold text-sm bg-[#0d0d12]/30 border border-white/5 rounded-3xl">
                         گیفی یافت نشد. تگ یا عنوان متفاوتی جستجو کنید یا گیف جدید بسازید.
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         {gifs.map((gif) => {
                           const isEditing = editingGifId === gif.id;
                           return (
                             <motion.div 
                               key={gif.id}
                               layout
                               className="bg-[#0d0d12] border border-white/5 rounded-2xl overflow-hidden shadow-xl p-3 relative group flex flex-col gap-2 transition-all hover:border-white/10"
                             >
                               <div className="h-32 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
                                 <img 
                                   src={gif.url} 
                                   alt={gif.title || gif.originalName} 
                                   className="max-h-full max-w-full object-contain" 
                                 />
                               </div>

                               {isEditing ? (
                                 <div className="space-y-2 mt-1">
                                    <input 
                                      type="text" 
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)} 
                                      placeholder="عنوان" 
                                      className="w-full bg-white/5 border border-white/10 text-xs px-2 py-1.5 rounded text-white font-bold"
                                    />
                                    <input 
                                      type="text" 
                                      value={editTags}
                                      onChange={(e) => setEditTags(e.target.value)} 
                                      placeholder="تگ‌ها (با کاما جدا کنید)" 
                                      className="w-full bg-white/5 border border-white/10 text-[10px] px-2 py-1.5 rounded text-gray-300 font-mono"
                                    />
                                    <div className="flex gap-1.5">
                                      <button 
                                        className="flex-1 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/20 rounded py-1 text-[10px] font-bold"
                                        onClick={async () => {
                                          try {
                                            await api.put(`/upload/gifs/${gif.id}`, { title: editTitle, tags: editTags });
                                            toast.success("ویرایش ذخیره شد");
                                            setEditingGifId(null);
                                            fetchData();
                                          } catch {
                                            toast.error("خطا در ذخیره ویرایش");
                                          }
                                        }}
                                      >
                                        ذخیره
                                      </button>
                                      <button 
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded py-1 text-[10px]"
                                        onClick={() => setEditingGifId(null)}
                                      >
                                        انصراف
                                      </button>
                                    </div>
                                 </div>
                               ) : (
                                 <div className="flex-1 flex flex-col justify-between mt-1 min-h-[50px]">
                                   <div>
                                      <h4 className="text-xs font-black text-white truncate w-full" title={gif.title}>
                                        {gif.title || "بدون عنوان"}
                                      </h4>
                                      <p className="text-[9px] text-gray-500 truncate font-mono mt-0.5">{gif.originalName}</p>
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-1 mt-1.5 h-6 overflow-hidden">
                                     {gif.tags ? gif.tags.split(",").map((tag, idx) => (
                                        <span key={idx} className="text-[8px] bg-white/[0.04] text-gray-400 px-1.5 py-0.5 rounded-md">
                                          #{tag}
                                        </span>
                                     )) : (
                                       <span className="text-[8px] text-gray-600 italic">بدون تگ</span>
                                     )}
                                   </div>
                                 </div>
                               )}

                               {!isEditing && (
                                 <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setEditingGifId(gif.id);
                                        setEditTitle(gif.title || "");
                                        setEditTags(gif.tags || "");
                                      }}
                                      className="h-8 w-8 rounded-lg bg-black/80 text-gray-400 hover:text-neon-blue hover:bg-black transition-all flex items-center justify-center border border-white/10"
                                      title="ویرایش تگ‌ها و عنوان"
                                    >
                                       <Edit2 size={12} />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (!confirm("آیا از حذف این گیف از سیستم دیتابیس و دیسک اطمینان دارید؟")) return;
                                        try {
                                          await api.delete(`/upload/gifs/${gif.id}`);
                                          toast.success("با موفقیت حذف شد");
                                          fetchData();
                                        } catch {
                                          toast.error("خطا رخ داد");
                                        }
                                      }}
                                      className="h-8 w-8 rounded-lg bg-black/80 text-gray-400 hover:text-neon-red hover:bg-black transition-all flex items-center justify-center border border-white/10"
                                      title="حذف گیف"
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                 </div>
                               )}
                             </motion.div>
                           );
                         })}
                       </div>
                     )}
                  </div>
                </div>
             </div>
           ) : null}

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

      <BadgeAdminModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        badge={selectedBadge}
        onSuccess={fetchData}
      />

      <UserEditModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        onSuccess={fetchData}
      />
    </div>
  );
};
