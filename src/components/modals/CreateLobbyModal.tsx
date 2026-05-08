import React, { useState, useEffect } from "react";
import { X, Users, Globe, Mic, Lock, ChevronRight, ChevronLeft, Gamepad, Sparkles, AlertCircle, Check, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowButton } from "../ui/GlowButton";
import { useGames } from "../../context/GamesContext";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLobbyModal = ({ isOpen, onClose, onSuccess }: CreateLobbyModalProps) => {
  const { allGames: games } = useGames();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGameData, setSelectedGameData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    gameId: "",
    maxPlayers: 5,
    region: "",
    isPrivate: false,
    micRequired: false,
    metadata: {} as Record<string, string>,
    skillLevel: "متوسط",
    description: "",
    discordRequired: false,
    ageRestricted: false,
    autoClose: true,
    autoArchive: true,
    mode: "",
    selectedMaps: ""
  });

  useEffect(() => {
    if (games?.length > 0 && !formData.gameId) {
      handleGameChange(games[0].id);
    }
  }, [games]);

  const handleGameChange = async (gameId: string) => {
    try {
      const res = await api.get(`/games/${gameId}`);
      const game = res.data.data;
      
      if (!game) {
        console.error("Game not found in API response");
        return;
      }
      
      setSelectedGameData(game);
      setFormData(prev => ({
        ...prev,
        gameId,
        region: game.regions?.[0] || "IR",
        metadata: {} // Reset dynamic metadata
      }));
    } catch (err) {
      console.error("Error fetching game data:", err);
      toast.error("خطا در دریافت اطلاعات بازی");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.gameId) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        metadata: JSON.stringify({
          ...formData.metadata,
          discordRequired: formData.discordRequired,
          ageRestricted: formData.ageRestricted,
          autoClose: formData.autoClose,
          autoArchive: formData.autoArchive
        })
      };
      const response = await api.post("/lobbies", payload);
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

  const handleAI = async () => {
     if (!formData.title && !selectedGameData?.title) return;
     toast.success("توضیحات توسط هوش مصنوعی ایجاد شد");
     setFormData(p => ({
       ...p, 
       description: `به لابی من برای بازی ${selectedGameData?.title || 'دوستانه'} خوش آمدید! لطفاً با احترام برخورد کنید و از بازی لذت ببرید.`
     }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md shadow-2xl" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-[#0b0c10] border border-white/5 rounded-3xl w-full max-w-[1000px] overflow-hidden shadow-2xl flex h-full md:h-auto md:max-h-[90vh] md:flex-row flex-col relative"
      >
        {/* Left Panel: Live Preview (Hidden on Mobile) */}
        <div className="hidden lg:flex w-[350px] bg-[#111216] border-l border-white/5 p-6 flex-col shrink-0 relative overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-neon-blue animate-pulse" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Preview</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Live Card Preview */}
            <div className="w-full rounded-3xl overflow-hidden bg-dark-card border border-white/5 relative shadow-xl">
               {/* Background Cover */}
               <div className="h-24 w-full relative">
                 {formData.isPrivate && (
                   <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] flex items-center justify-center transition-all">
                      <div className="flex flex-col items-center gap-2 text-white/50">
                        <Lock size={16} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">PRIVATE LOBBY</span>
                      </div>
                   </div>
                 )}
                 <img src={selectedGameData?.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070"} className="h-full w-full object-cover opacity-50" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#16181c] to-transparent z-0" />
                 <div className="absolute top-3 left-3 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 z-20">
                   <Sparkles size={12} /> جدید
                 </div>
               </div>
               
               {/* Content */}
               <div className="p-5 pt-0 relative z-10 flex flex-col items-center text-center -mt-8">
                 {/* App Icon */}
                 <div className="h-16 w-16 rounded-2xl bg-black border border-white/10 overflow-hidden shadow-lg p-1 mb-3">
                   <img src={selectedGameData?.iconUrl || ""} className="w-full h-full object-cover rounded-xl" />
                 </div>
                 
                 <div className="text-[10px] font-bold text-gray-400 flex items-center justify-center gap-1 mb-1">
                   <AlertCircle size={12}/> همین حالا
                 </div>
                 
                 <h3 className="font-black text-xl text-white mt-2 mb-1">
                   {formData.title || "عنوان لابی شما"}
                 </h3>
                 <div className="text-neon-blue text-xs font-black uppercase mb-4 px-3 py-1 bg-neon-blue/10 rounded-full border border-neon-blue/20">
                   {selectedGameData?.title || "انتخاب بازی"}
                 </div>

                 {/* Tags */}
                 <div className="flex flex-wrap items-center justify-center gap-2 mb-6 w-full text-right" dir="rtl">
                   {formData.region && <span className="px-2 py-1 flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300"><Globe size={10} className="text-neon-pink" /> {formData.region}</span>}
                   {formData.isPrivate && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-[10px] font-black text-neon-purple">
                        <Lock size={10} /> خصوصی
                      </div>
                   )}
                   {formData.micRequired && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-black text-neon-blue">
                        <Mic size={10} /> میکروفون
                      </div>
                   )}
                   {formData.discordRequired && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-[10px] font-black text-[#5865F2]">
                        <svg width="10" height="10" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/></svg>
                        دیسکورد
                      </div>
                   )}
                   {formData.ageRestricted && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500">
                        +18
                      </div>
                   )}
                   {Object.entries(formData.metadata).filter(([k]) => !['discordRequired', 'ageRestricted', 'autoClose', 'autoArchive'].includes(k)).slice(0, 2).map(([key, val]) => (
                     <span key={key} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">
                       {val as string}
                     </span>
                   ))}
                 </div>

                 {/* Stats */}
                 <div className="flex items-center justify-between w-full p-3 bg-black/40 rounded-xl border border-white/5 mb-4">
                   <div className="flex items-center gap-2 text-neon-blue font-bold text-xs">
                     <Users size={14} /> 1 / {formData.maxPlayers}
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                     سطح مهارت: {formData.skillLevel}
                   </div>
                 </div>

                 {/* Host Info */}
                 <div className="flex items-center justify-between w-full border-t border-white/5 pt-4">
                   <GlowButton size="sm" className="w-[100px] text-[10px]" disabled>JOIN NOW</GlowButton>
                   <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                     شما <img src={user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username}`} className="h-6 w-6 rounded-full border border-white/20" />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Content */}
        <div className="flex-1 flex flex-col h-full md:max-h-[90vh] overflow-hidden relative">
          <button onClick={onClose} className="absolute left-4 top-4 md:left-6 md:top-6 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-white/10 z-50">
            <X size={16} />
          </button>

          <div className="flex items-center justify-between p-6 md:p-8 pb-4">
            <div className="md:pr-0">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">ایجاد لابی حرفه‌ای</h2>
              <p className="text-gray-500 text-[11px] md:text-sm mt-1 font-bold">تیم رویایی خود را پیدا کنید</p>
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mt-4" dir="ltr">
               {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? "w-6 md:w-8 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]" : step > s ? "w-2.5 md:w-3 bg-neon-blue/50" : "w-2.5 md:w-3 bg-white/10"}`} />
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 text-right">انتخاب بازی</label>
                      <select 
                        className="w-full bg-[#16181c] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-white font-bold text-sm appearance-none cursor-pointer"
                        value={formData.gameId}
                        onChange={e => handleGameChange(e.target.value)}
                      >
                        {games?.map(game => (
                          <option key={game.id} value={game.id} className="bg-dark-card">{game.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 text-right">عنوان لابی</label>
                      <input 
                        type="text" 
                        placeholder="مثال: رنک‌آپ سریع"
                        className="w-full bg-[#16181c] border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-white font-bold text-sm"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Rendering Dynamic Features (Mapped loosely to game modes / maps if available in game metadata) */}
                  {selectedGameData?.metadata?.features?.map((feature: any, index: number) => (
                    <div key={feature.name} className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-right">{feature.name}</label>
                      <div className="flex flex-wrap gap-2 justify-end text-right">
                        {feature.options.map((opt: string) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({
                               ...formData, 
                               metadata: { ...formData.metadata, [feature.name]: opt }
                            })}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              formData.metadata[feature.name] === opt 
                                ? "bg-transparent border border-neon-blue text-neon-blue shadow-[inset_0_0_15px_rgba(0,229,255,0.2)]" 
                                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 text-right">ظرفیت کل لابی</label>
                      <div className="flex items-center gap-2 bg-[#16181c] border border-white/5 rounded-xl px-2 py-1.5 h-[50px]">
                        <button type="button" onClick={() => setFormData(p => ({...p, maxPlayers: Math.max(2, p.maxPlayers - 1)}))} className="h-full px-4 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"> - </button>
                        <span className="flex-1 text-center text-white font-black text-lg">{formData.maxPlayers}</span>
                        <button type="button" onClick={() => setFormData(p => ({...p, maxPlayers: Math.min(20, p.maxPlayers + 1)}))} className="h-full px-4 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"> + </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 text-right">سطح مهارت (SKILL)</label>
                      <select 
                        className="w-full bg-[#16181c] border border-white/5 rounded-xl px-4 py-3 h-[50px] outline-none focus:border-neon-blue transition-all text-white font-bold text-sm appearance-none cursor-pointer"
                        value={formData.skillLevel}
                        onChange={e => setFormData({...formData, skillLevel: e.target.value})}
                      >
                        <option value="مبتدی" className="bg-dark-card">مبتدی</option>
                        <option value="متوسط" className="bg-dark-card">متوسط</option>
                        <option value="حرفه‌ای" className="bg-dark-card">حرفه‌ای</option>
                        <option value="بدون محدودیت" className="bg-dark-card">بدون محدودیت</option>
                      </select>
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 text-right">ریجن سرور</label>
                     <div className="flex flex-wrap gap-2 justify-end">
                       {["Middle East", "Europe", "Asia", "North America", "Auto"].map(reg => (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => setFormData({...formData, region: reg})}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              formData.region === reg 
                                ? "bg-transparent border border-white/40 text-white" 
                                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                            }`}
                          >
                            {reg}
                          </button>
                       ))}
                     </div>
                  </div>

                  <div>
                     <div className="flex items-center justify-between mb-2">
                       <button type="button" onClick={handleAI} className="text-[10px] font-black text-neon-blue uppercase tracking-widest flex items-center gap-1 hover:text-neon-blue/80 transition-colors">
                         <Sparkles size={12}/> MAGIC AI GENERATE
                       </button>
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-right">توضیحات لابی</label>
                     </div>
                     <textarea 
                        rows={4}
                        placeholder="پیامی برای هم‌تیمی‌های آینده خود بنویسید..."
                        className="w-full bg-[#16181c] border border-white/5 rounded-xl p-4 outline-none focus:border-neon-blue transition-all text-white font-bold text-sm resize-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                     />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData(p => ({...p, isPrivate: !p.isPrivate}))} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.isPrivate ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-[#16181c] text-gray-500 hover:border-white/10"}`}>
                       <Globe size={20} className={formData.isPrivate ? "text-white" : ""} />
                       <span className="font-bold text-sm text-white">لابی خصوصی</span>
                       <span className="text-[10px]">فقط با کد دعوت یا لینک</span>
                    </button>
                    <button type="button" onClick={() => setFormData(p => ({...p, micRequired: !p.micRequired}))} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.micRequired ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-[#16181c] text-gray-500 hover:border-white/10"}`}>
                       <Mic size={20} className={formData.micRequired ? "text-white" : ""} />
                       <span className="font-bold text-sm text-white">میکروفون اجباری</span>
                       <span className="text-[10px]">ارتباط صوتی در طول بازی</span>
                    </button>
                    <button type="button" onClick={() => setFormData(p => ({...p, discordRequired: !p.discordRequired}))} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.discordRequired ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-[#16181c] text-gray-500 hover:border-white/10"}`}>
                       <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={formData.discordRequired ? "text-[#5865F2]" : ""}><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/></svg>
                       <span className="font-bold text-sm text-white">دیسکورد اجباری</span>
                       <span className="text-[10px]">اتصال به ویس چنل دیسکورد</span>
                    </button>
                    <button type="button" onClick={() => setFormData(p => ({...p, ageRestricted: !p.ageRestricted}))} className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.ageRestricted ? "border-white/20 bg-white/5 text-red-500" : "border-white/5 bg-[#16181c] text-gray-500 hover:border-white/10"}`}>
                       <span className={`text-xl font-black ${formData.ageRestricted ? "text-red-500" : ""}`}>+18</span>
                       <span className={`font-bold text-sm ${formData.ageRestricted ? "text-white" : "text-white"}`}>محدودیت سنی</span>
                       <span className="text-[10px]">فقط بازیکنان بالای 18 سال</span>
                    </button>
                  </div>

                  <div className="bg-[#16181c] border border-white/5 rounded-2xl p-5 mt-6">
                    <div className="flex items-center gap-2 mb-4 justify-end">
                       <span className="text-xs font-bold text-neon-blue">تنظیمات خودکار</span>
                       <Settings2 size={16} className="text-neon-blue" />
                    </div>
                    
                    <div className="flex items-center justify-end gap-6 text-sm">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <span className="text-xs text-gray-400 group-hover:text-white transition-colors">بستن لابی پس از تکمیل ظرفیت</span>
                          <div className={`h-5 w-5 rounded flex items-center justify-center transition-all ${formData.autoClose ? 'bg-neon-blue text-dark-bg' : 'bg-white/10 text-transparent'}`}>
                             <Check size={14} />
                          </div>
                          <input type="checkbox" className="hidden" checked={formData.autoClose} onChange={() => setFormData(p => ({...p, autoClose: !p.autoClose}))} />
                       </label>
                       
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <span className="text-xs text-gray-400 group-hover:text-white transition-colors">آرشیو خودکار پس از ۱ ساعت</span>
                          <div className={`h-5 w-5 rounded flex items-center justify-center transition-all ${formData.autoArchive ? 'bg-neon-blue text-dark-bg' : 'bg-white/10 text-transparent'}`}>
                             <Check size={14} />
                          </div>
                          <input type="checkbox" className="hidden" checked={formData.autoArchive} onChange={() => setFormData(p => ({...p, autoArchive: !p.autoArchive}))} />
                       </label>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 md:p-8 pt-4 flex items-center justify-between shrink-0 bg-[#0b0c10] border-t border-white/5">
             {step > 1 ? (
               <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
                 <ChevronLeft size={16} /> مرحله قبل
               </button>
             ) : (
               <div />
             )}

             {step < 3 ? (
               <GlowButton onClick={() => setStep(s => s + 1)} className="px-6 md:px-8 flex flex-row-reverse items-center justify-center gap-2 h-12" variant="blue">
                 مرحله بعد <ChevronLeft size={18} />
               </GlowButton>
             ) : (
               <GlowButton onClick={handleSubmit} disabled={loading} className="px-6 md:px-8 h-12" variant="blue">
                 {loading ? "در حال پردازش..." : "تایید و ساخت نهایی"}
               </GlowButton>
             )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
