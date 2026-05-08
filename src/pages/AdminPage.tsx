import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Users, Shield, Plus, Trash2, Edit2, Search, X, Gamepad, Globe, ShieldAlert } from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { GameAdminModal } from "../components/modals/GameAdminModal";

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<"users" | "games">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);

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
      } else {
        const res = await api.get("/games");
        setGames(res.data.data || []);
      }
    } catch (err) {
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
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
          ) : (
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
          )}
        </div>
      </div>

      <GameAdminModal 
        isOpen={isGameModalOpen} 
        onClose={() => setIsGameModalOpen(false)} 
        game={selectedGame}
        onSuccess={fetchData}
      />
    </div>
  );
};
