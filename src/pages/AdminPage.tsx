import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Users, Gamepad2, Settings, Shield, Plus, Trash2, Edit2, Search } from "lucide-react";
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
                      <th className="px-6 py-4">وضعیت</th>
                      <th className="px-6 py-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">کاربری یافت نشد (دیتابیس تازه بازنشانی شده است)</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue font-black">{user.username[0]}</div>
                              <span className="font-bold">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-black uppercase">فعال</span>
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
                  <GlowButton onClick={() => toast("بزودی...")}>
                    <Plus size={16} className="ml-2" /> افزودن بازی جدید
                  </GlowButton>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map((game) => (
                    <NeonCard key={game.id} className="p-4 flex gap-4 items-center">
                      <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                        {game.title[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-white">{game.title}</h3>
                        <p className="text-xs text-gray-500">{game.genre}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="text-[10px] font-black text-neon-blue hover:underline">ویرایش</button>
                          <button className="text-[10px] font-black text-red-500 hover:underline">حذف</button>
                        </div>
                      </div>
                    </NeonCard>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
