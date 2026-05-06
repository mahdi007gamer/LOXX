import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Modal } from "../components/ui/Modal";
import { Users, Gamepad2, Settings, Shield, Plus, Trash2, Edit2, Search, X } from "lucide-react";
import api from "../lib/api";
import { toast } from "react-hot-toast";

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<"users" | "games">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        // Assume there is an admin endpoint for users
        const res = await api.get("/admin/users").catch(() => ({ data: { data: [] } }));
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

  const updateMembership = async (id: string, membershipType: string) => {
    try {
      await api.patch(`/admin/users/${id}/membership`, { membershipType });
      toast.success("عضویت بروزرسانی شد");
      fetchData();
    } catch {
      toast.error("خطا در بروزرسانی");
    }
  };

  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
  const [newGame, setNewGame] = useState({
    title: "",
    bannerUrl: "",
    icon: "",
    genres: [] as string[],
    regions: ["IR", "ME", "EU"] as string[],
    maxPlayers: 5,
    modes: [] as string[]
  });

  const availableGenres = ["شوتر اول شخص", "بتل رویال", "استراتژی", "ورزشی", "موبا", "نقش آفرینی", "مسابقه‌ای", "بقا", "کارتی", "پازل", "سندباکس", "مخفی کاری"];
  const availableRegions = ["IR", "ME", "EU", "TR", "NA", "AS"];

  const handleCreateGame = async () => {
    if (!newGame.title) return toast.error("نام بازی الزامی است");
    try {
      await api.post("/admin/games", { 
        title: newGame.title, 
        bannerUrl: newGame.bannerUrl, 
        metadata: {
          icon: newGame.icon,
          genres: newGame.genres,
          regions: newGame.regions,
          maxPlayers: newGame.maxPlayers,
          modes: newGame.modes
        }
      });
      toast.success("بازی اضافه شد");
      setIsAddGameModalOpen(false);
      fetchData();
    } catch {
      toast.error("خطا در افزودن بازی");
    }
  };

  const removeGame = async (id: string) => {
    if (!window.confirm("حذف شود؟")) return;
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
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Shield className="text-neon-blue" />
                پنل مدیریت لوکس
              </h1>
              <p className="text-gray-400 mt-1">مدیریت کاربران، بازی‌ها و تنظیمات سیستم</p>
            </div>
          </header>

          <div className="flex gap-4 border-b border-white/5 pb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${
                activeTab === "users" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              مدیریت کاربران
              {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_10px_#00E5FF]" />}
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${
                activeTab === "games" ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              مدیریت بازی‌ها
              {activeTab === "games" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_10px_#00E5FF]" />}
            </button>
          </div>

          {activeTab === "users" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                   <input 
                      type="text" 
                      placeholder="جستجوی کاربر..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-neon-blue outline-none transition-all"
                   />
                </div>
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">کاربر</th>
                      <th className="px-6 py-4">ایمیل</th>
                      <th className="px-6 py-4">نقش</th>
                      <th className="px-6 py-4">عضویت ویژه</th>
                      <th className="px-6 py-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">کاربری یافت نشد (دیتابیس تازه بازنشانی شده است)</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue font-black" style={{ backgroundImage: user.profile?.avatarUrl ? `url(${user.profile.avatarUrl})` : undefined, backgroundSize: 'cover' }}>
                                {!user.profile?.avatarUrl && user.username[0]}
                              </div>
                              <span className="font-bold">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                          <td className="px-6 py-4">
                             <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" value={user.role} onChange={e => updateRole(user.id, e.target.value)}>
                               <option value="USER">کاربر عادی</option>
                               <option value="ADMIN">مدیر</option>
                             </select>
                          </td>
                          <td className="px-6 py-4">
                             <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-neon-purple focus:border-neon-purple outline-none" value={user.profile?.membershipType || "NONE"} onChange={e => updateMembership(user.id, e.target.value)}>
                               <option value="NONE" className="text-gray-400">عادی</option>
                               <option value="PLUS" className="text-neon-blue">سطح Plus</option>
                               <option value="VIP" className="text-neon-pink">سطح VIP</option>
                             </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">لیست بازی‌های فعال</h2>
                  <GlowButton onClick={() => setIsAddGameModalOpen(true)}>
                    <Plus size={16} className="ml-2" /> افزودن بازی جدید
                  </GlowButton>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {games.length === 0 ? (
                 <div className="text-center py-12 text-gray-500">موردی یافت نشد</div>
               ) : games.map((game) => {
                 let meta: any = {};
                 try { meta = JSON.parse(game.metadata || "{}"); } catch(e){}
                 return (
                   <NeonCard key={game.id} className="p-4 flex gap-4">
                     <div className="h-16 w-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-blue font-black overflow-hidden relative">
                       {game.bannerUrl && <img src={game.bannerUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />}
                       {meta.icon && <img src={meta.icon} className="w-10 h-10 object-contain relative z-10 drop-shadow-lg" />}
                       {!meta.icon && game.title[0]}
                     </div>
                     <div className="flex-1">
                       <h3 className="font-black text-white">{game.title}</h3>
                       <p className="text-[10px] text-gray-500 line-clamp-1">{meta.genres?.join(", ") || game.genre}</p>
                       <div className="flex gap-2 mt-2">
                         <button onClick={() => toast("بزودی...")} className="text-[10px] font-black text-neon-blue hover:underline">ویرایش</button>
                         <button onClick={() => removeGame(game.id)} className="text-[10px] font-black text-red-500 hover:underline">حذف</button>
                       </div>
                     </div>
                   </NeonCard>
                 );
               })}
               </div>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isAddGameModalOpen} title="افزودن بازی جدید" onClose={() => setIsAddGameModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">نام بازی</label>
            <input type="text" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none transition-all" placeholder="مثال: مافیا آنلاین..." />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">آدرس تصویر کاور (Banner - 1920x1080)</label>
            <input type="text" value={newGame.bannerUrl} onChange={e => setNewGame({...newGame, bannerUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none transition-all" placeholder="لینک تصویر پس‌زمینه" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">آدرس آیکن ساز (Icon - PNG شفاف 512x512)</label>
            <input type="text" value={newGame.icon} onChange={e => setNewGame({...newGame, icon: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none transition-all" placeholder="لینک آیکن" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">ژانرها (چند انتخاب)</label>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map(g => (
                <button 
                  key={g} 
                  onClick={() => setNewGame(prev => ({ ...prev, genres: prev.genres.includes(g) ? prev.genres.filter(x => x !== g) : [...prev.genres, g] }))} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${newGame.genres.includes(g) ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">ریجن‌های پشتیبانی شده</label>
            <div className="flex flex-wrap gap-2">
              {availableRegions.map(r => (
                <button 
                  key={r} 
                  onClick={() => setNewGame(prev => ({ ...prev, regions: prev.regions.includes(r) ? prev.regions.filter(x => x !== r) : [...prev.regions, r] }))} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${newGame.regions.includes(r) ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">حداکثر بازیکن در هر لابی</label>
              <input type="number" min="2" max="100" value={newGame.maxPlayers} onChange={e => setNewGame({...newGame, maxPlayers: parseInt(e.target.value) || 5})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none transition-all" />
            </div>
            <div>
               <label className="text-xs font-bold text-gray-400 mb-1 block">مودهای بازی</label>
               <input 
                 type="text" 
                 placeholder="با کاما جدا کنید..." 
                 value={newGame.modes.join(', ')} 
                 onChange={e => setNewGame({...newGame, modes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue focus:outline-none transition-all" 
               />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex justify-end gap-3">
             <button onClick={() => setIsAddGameModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors">انصراف</button>
             <GlowButton onClick={handleCreateGame}>ایجاد بازی</GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
