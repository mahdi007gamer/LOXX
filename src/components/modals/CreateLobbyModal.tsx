import React, { useState, useEffect } from "react";
import { X, Users, Globe, Mic, Lock, ChevronDown, Check, Gamepad, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowButton } from "../ui/GlowButton";
import { useGames } from "../../context/GamesContext";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLobbyModal = ({ isOpen, onClose, onSuccess }: CreateLobbyModalProps) => {
  const { allGames: games } = useGames();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedGameData, setSelectedGameData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    gameId: "",
    maxPlayers: 5,
    region: "",
    isPrivate: false,
    micRequired: false,
    metadata: {} as Record<string, string>
  });

  useEffect(() => {
    if (games?.length > 0 && !formData.gameId) {
      handleGameChange(games[0].id);
    }
  }, [games]);

  const handleGameChange = async (gameId: string) => {
    try {
      const res = await api.get(`/admin/games/${gameId}`);
      const game = res.data.data;
      setSelectedGameData(game);
      setFormData(prev => ({
        ...prev,
        gameId,
        region: game.regions?.[0] || "IR",
        metadata: {} // Reset dynamic metadata
      }));
    } catch {
      toast.error("خطا در دریافت اطلاعات بازی");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameId) return;
    setLoading(true);
    try {
      const response = await api.post("/lobbies", formData);
      if (response.data.status === "success") {
        toast.success("لابی با موفقیت ساخته شد");
        onSuccess();
        onClose();
        navigate(`/lobby/${response.data.data.id}`);
      }
    } catch (error) {
      toast.error("خطا در ساخت لابی");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md shadow-2xl">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-[#050508] border border-white/5 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2" dir="rtl">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">ایجاد پارتی جدید</h2>
            <p className="text-gray-500 text-xs mt-1 font-bold">تنظیمات لابی خود را شخصی‌سازی کنید</p>
          </div>
          <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" dir="rtl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Game Selection with visual preview */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">انتخاب بازی و پلتفرم</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {games?.map(game => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleGameChange(game.id)}
                    className={`relative aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-2 group ${
                      formData.gameId === game.id 
                        ? "border-neon-blue bg-neon-blue/10 shadow-[0_0_20px_rgba(0,229,255,0.2)]" 
                        : "border-white/5 bg-white/2 hover:border-white/10"
                    }`}
                  >
                    {game.iconUrl && <img src={game.iconUrl} className="h-full w-full object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" alt={game.title} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                      <span className={`text-[10px] font-black tracking-tighter truncate ${formData.gameId === game.id ? "text-neon-blue" : "text-white"}`}>{game.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">عنوان لابی (اختیاری)</label>
                <input 
                  type="text" 
                  placeholder="مثال: پلی بدید رنک‌آپ شیم"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neon-blue transition-all text-white font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">تعداد کل بازیکنان</label>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                  <button type="button" onClick={() => setFormData(p => ({...p, maxPlayers: Math.max(2, p.maxPlayers - 1)}))} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"> - </button>
                  <span className="flex-1 text-center text-white font-black text-lg">{formData.maxPlayers}</span>
                  <button type="button" onClick={() => setFormData(p => ({...p, maxPlayers: Math.min(20, p.maxPlayers + 1)}))} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"> + </button>
                </div>
              </div>
            </div>

            {/* Dynamic Features based on Game Metadata */}
            {selectedGameData?.metadata?.features?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/2 rounded-[32px] border border-white/5 animate-in slide-in-from-top-4 duration-500">
                {selectedGameData.metadata.features.map((feature: any) => (
                  <div key={feature.name}>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3">{feature.name}</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neon-pink transition-all text-white font-bold appearance-none cursor-pointer"
                      value={formData.metadata[feature.name] || ""}
                      onChange={e => setFormData({
                        ...formData, 
                        metadata: { ...formData.metadata, [feature.name]: e.target.value }
                      })}
                    >
                      <option value="" className="bg-dark-card">انتخاب کنید...</option>
                      {feature.options.map((opt: string) => (
                        <option key={opt} value={opt} className="bg-dark-card">{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3">ریجن سرور</label>
                  <div className="flex flex-wrap gap-2">
                    {(selectedGameData?.regions || ["IR", "ME", "EU"]).map((reg: string) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setFormData({...formData, region: reg})}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          formData.region === reg 
                            ? "bg-neon-blue text-dark-bg shadow-[0_0_15px_rgba(0,229,255,0.4)]" 
                            : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
                        }`}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3">دسترسی‌ها</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isPrivate: !formData.isPrivate})}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        formData.isPrivate ? "bg-neon-pink/10 border-neon-pink/50 text-neon-pink" : "bg-white/5 border-white/5 text-gray-500"
                      }`}
                    >
                      <Lock size={16} />
                      <span className="text-[10px] font-black uppercase">لابی خصوصی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, micRequired: !formData.micRequired})}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        formData.micRequired ? "bg-neon-blue/10 border-neon-blue/50 text-neon-blue" : "bg-white/5 border-white/5 text-gray-500"
                      }`}
                    >
                      <Mic size={16} />
                      <span className="text-[10px] font-black uppercase">میکروفون اجباری</span>
                    </button>
                  </div>
               </div>
            </div>
          </form>
        </div>

        <div className="p-8 bg-white/2 border-t border-white/5 shrink-0">
           <GlowButton onClick={handleSubmit} disabled={loading} className="w-full h-16 text-lg">
             {loading ? "در حال پردازش..." : "تایید و انتشار لابی"}
           </GlowButton>
        </div>
      </motion.div>
    </div>
  );
};
