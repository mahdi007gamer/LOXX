import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Gamepad2, 
  Trophy, 
  Shield, 
  Globe, 
  Mic, 
  MessageSquare, 
  Sparkles,
  CheckCircle2,
  Lock,
  Clock,
  Target,
  ArrowRight
} from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { cn } from "@/src/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useGames } from "../../context/GamesContext";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REGIONS = ["Middle East", "Europe", "Asia", "North America", "Auto"];
const SKILL_LEVELS = ["مبتدی", "متوسط", "حرفه‌ای", "نخبه (Elite)"];

export const CreateLobbyModal = ({ isOpen, onClose, onSuccess }: CreateLobbyModalProps) => {
  const { allGames: games } = useGames();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    gameId: "",
    mode: "Competitive",
    capacity: 5,
    rankRange: "Silver - Global",
    region: "Middle East",
    description: "",
    isPrivate: false,
    micRequired: false,
    selectedMaps: [] as string[]
  });

  useEffect(() => {
    if (games && games.length > 0 && !formData.gameId) {
      setFormData(prev => ({ ...prev, gameId: games[0].id }));
    }
  }, [games]);

  const selectedGame = games?.find(g => g.id === formData.gameId);
  const activeGameInfo = selectedGame ? {
    modes: selectedGame.variants || ["Competitive", "Casual", "Ranked"],
    maps: selectedGame.maps || ["Mirage", "Inferno", "Dust 2", "Nuke", "Overpass", "Vertigo"],
    icon: (selectedGame as any).icon || "🎮",
    color: "blue",
    banner: selectedGame.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070"
  } : {
    modes: ["Competitive"],
    maps: [],
    icon: "🎮",
    color: "blue",
    banner: ""
  };

  const handleMapToggle = (mapName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.includes(mapName)
        ? prev.selectedMaps.filter(m => m !== mapName)
        : [...prev.selectedMaps, mapName]
    }));
  };

  const generateAiDescription = async () => {
    if (!process.env.GEMINI_API_KEY) {
      toast.error("Gemini API Key is not configured");
      return;
    }
    
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      
      const prompt = `Write a short, professional, and cool gaming lobby description for LOXX gaming platform. 
      Game: ${selectedGame?.title || "Gaming"}
      Mode: ${formData.mode}
      Title: ${formData.title || "Looking for Teammates"}
      Tone: Serious and competitive. 
      Keep it under 30 words. Return ONLY the text of the description in Persian (Farsi).`;

      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        setFormData(prev => {
           console.log("Setting AI description:", text);
           return { ...prev, description: text.trim() };
        });
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      toast.error("خطا در تولید هوشمند توضیحات");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post("/lobbies", {
        title: formData.title,
        gameId: formData.gameId,
        maxPlayers: formData.capacity,
        region: formData.region,
        skillLevel: formData.rankRange,
        micRequired: formData.micRequired,
        isPrivate: formData.isPrivate,
        description: formData.description,
        mode: formData.mode,
        selectedMaps: formData.selectedMaps
      });

      if (response.data.status === "success") {
        toast.success("لابی با موفقیت ساخته شد");
        onSuccess();
        navigate(`/lobby/${response.data.data.id}`);
      }
    } catch (error) {
      console.error("Failed to create lobby", error);
      toast.error("خطا در ساخت لابی");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset step on close
  useEffect(() => {
    if (!isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0a0f] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row h-[82vh] min-h-[660px]"
      >
        {/* Left: Form Flow */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
          <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">ایجاد لابی حرفه‌ای</h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1">تیم رویایی خود را پیدا كنيد</p>
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step >= i ? (step === i ? "w-8 bg-neon-blue" : "w-4 bg-neon-blue/40") : "w-4 bg-white/10"
                  )} 
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">انتخاب بازی و عنوان</label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="relative group">
                        <input
                          required
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="عنوان لابی (مثلاً: رنک‌آپ سریع)"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-white placeholder:text-gray-600 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/20 transition-all"
                        />
                      </div>
                        <select
                          value={formData.gameId}
                          onChange={(e) => {
                            const gId = e.target.value;
                            const game = games?.find(g => g.id === gId);
                            setFormData(prev => ({ 
                              ...prev, 
                              gameId: gId, 
                              mode: game?.variants?.[0] || "Competitive",
                              selectedMaps: [] 
                            }));
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-white focus:border-neon-blue/50 focus:outline-none transition-all appearance-none"
                        >
                          {games && games.map(game => (
                            <option key={game.id} value={game.id} className="bg-dark-card">{game.title}</option>
                          ))}
                        </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">مود بازی</label>
                    <div className="flex flex-wrap gap-3">
                      {activeGameInfo.modes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mode }))}
                          className={cn(
                            "px-6 py-2.5 rounded-xl border text-sm font-bold transition-all",
                            formData.mode === mode 
                              ? "bg-neon-blue/20 border-neon-blue text-neon-blue" 
                              : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-white"
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeGameInfo.maps.length > 1 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">انتخاب مپ‌ها</label>
                      <div className="flex flex-wrap gap-2">
                        {activeGameInfo.maps.map((map) => (
                          <button
                            key={map}
                            type="button"
                            onClick={() => handleMapToggle(map)}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-xs font-medium transition-all",
                              formData.selectedMaps.includes(map)
                                ? "bg-white/10 border-white/30 text-white"
                                : "bg-white/5 border-transparent text-gray-600 hover:border-white/10"
                            )}
                          >
                            {map}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">ظرفیت کل لابی</label>
                      <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 border border-white/10">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, capacity: Math.max(2, prev.capacity - 1) }))}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                          -
                        </button>
                        <div className="flex-1 text-center font-black text-xl text-white">{formData.capacity}</div>
                        <button 
                         type="button"
                          onClick={() => setFormData(prev => ({ ...prev, capacity: Math.min(50, prev.capacity + 1) }))}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">سطح مهارت (Skill)</label>
                      <select
                        value={formData.rankRange}
                        onChange={(e) => setFormData(prev => ({ ...prev, rankRange: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-white focus:border-neon-blue/50 focus:outline-none transition-all appearance-none"
                      >
                        {SKILL_LEVELS.map(skill => (
                          <option key={skill} value={skill} className="bg-dark-card">{skill}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">ریجن سرور</label>
                    <div className="flex flex-wrap gap-3">
                      {REGIONS.map(reg => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, region: reg }))}
                          className={cn(
                            "px-5 py-2.5 rounded-xl border text-sm font-bold transition-all",
                            formData.region === reg 
                              ? "bg-white/10 border-white/30 text-white shadow-lg" 
                              : "bg-white/5 border-transparent text-gray-500 hover:text-white"
                          )}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right block">توضیحات لابی</label>
                      <button
                        type="button"
                        onClick={generateAiDescription}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-black text-neon-blue hover:text-neon-blue/80 transition-colors disabled:opacity-50"
                      >
                        <Sparkles size={12} />
                        Magic AI Generate
                      </button>
                    </div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="پیامی برای هم‌تیمی‌های آینده خود بنویسید..."
                      className="w-full h-32 rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-white placeholder:text-gray-700 focus:border-neon-blue/50 focus:outline-none transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border transition-all text-right group",
                        formData.isPrivate 
                          ? "bg-neon-pink/10 border-neon-pink/40" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formData.isPrivate ? "bg-neon-pink/20 text-neon-pink" : "bg-white/10 text-gray-500 group-hover:text-white"
                      )}>
                        {formData.isPrivate ? <Lock size={20} /> : <Globe size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">لابی خصوصی</div>
                        <div className="text-[10px] text-gray-500 mt-1">فقط با کد دعوت یا لینک</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, micRequired: !prev.micRequired }))}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border transition-all text-right group",
                        formData.micRequired 
                          ? "bg-neon-blue/10 border-neon-blue/40" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formData.micRequired ? "bg-neon-blue/20 text-neon-blue" : "bg-white/10 text-gray-500 group-hover:text-white"
                      )}>
                        <Mic size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">میکروفون اجباری</div>
                        <div className="text-[10px] text-gray-500 mt-1">ارتباط صوتی در طول بازی</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discordRequired: !prev.discordRequired }))}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border transition-all text-right group",
                        formData.discordRequired 
                          ? "bg-indigo-500/10 border-indigo-500/40" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        formData.discordRequired ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-gray-500 group-hover:text-white"
                      )}>
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">دیسکورد اجباری</div>
                        <div className="text-[10px] text-gray-500 mt-1">اتصال به ویس چنل دیسکورد</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, age18Plus: !prev.age18Plus }))}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border transition-all text-right group",
                        formData.age18Plus 
                          ? "border-white/40 bg-white/10" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors font-black",
                        formData.age18Plus ? "text-white" : "text-gray-500 group-hover:text-white"
                      )}>
                        +18
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">محدودیت سنی</div>
                        <div className="text-[10px] text-gray-500 mt-1">فقط بازیکنان بالای ۱۸ سال</div>
                      </div>
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 border-dashed space-y-4">
                    <div className="flex items-center gap-2 text-neon-blue">
                      <Target size={16} />
                      <span className="text-xs font-bold uppercase">تنظیمات خودکار</span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" defaultChecked className="peer hidden" />
                          <div className="h-5 w-5 rounded border border-white/20 bg-white/5 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all" />
                          <CheckCircle2 className="absolute inset-0 m-auto text-dark-bg scale-0 peer-checked:scale-100 transition-transform" size={14} />
                        </div>
                        <span className="text-[11px] text-gray-500 group-hover:text-white transition-colors">بستن لابی پس از تکمیل ظرفیت</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" defaultChecked className="peer hidden" />
                          <div className="h-5 w-5 rounded border border-white/20 bg-white/5 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all" />
                          <CheckCircle2 className="absolute inset-0 m-auto text-dark-bg scale-0 peer-checked:scale-100 transition-transform" size={14} />
                        </div>
                        <span className="text-[11px] text-gray-500 group-hover:text-white transition-colors">آرشیو خودکار پس از ۱ ساعت</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 text-gray-500 hover:text-white font-bold transition-colors"
                >
                  <ChevronLeft size={20} />
                  <span>مرحله قبل</span>
                </button>
              ) : (
                <div />
              )}
              
              <GlowButton
                type="submit"
                variant={step === 3 ? "blue" : "blue"}
                disabled={isSubmitting}
                className="min-w-[180px] h-14"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-dark-bg border-t-transparent"
                    />
                    <span>در حال ساخت...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{step === 3 ? "تایید و ساخت نهایی" : "مرحله بعد"}</span>
                    {step < 3 && <ChevronRight size={20} />}
                  </div>
                )}
              </GlowButton>
            </div>
          </form>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden lg:flex w-full md:w-[400px] bg-white/[0.02] p-8 border-r border-white/10 flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 text-[10px] uppercase font-black text-gray-600 tracking-widest flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-neon-blue" 
            />
            Live Preview
          </div>

          <div className="w-full max-w-[320px] relative">
            {/* The Actual Lobby Card Preview */}
            <motion.div
              layout
              className="relative rounded-[24px] border border-white/5 bg-[#0a0a0f] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col"
            >
              {/* Game Banner */}
              <div className="relative h-36 w-full overflow-hidden shrink-0">
                <img 
                  src={activeGameInfo.banner} 
                  alt={selectedGame?.title} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-90" />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase bg-neon-blue/20 border border-neon-blue/30 text-neon-blue backdrop-blur-md">
                  <Sparkles size={14} />
                  <span>جدید</span>
                </div>

                {/* Time Badge */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-bold text-gray-300">
                  <Clock size={14} />
                  <span>همین حالا</span>
                </div>

                {/* Game Icon Overlay */}
                <div className="absolute -bottom-5 left-5 h-12 w-12 flex items-center justify-center rounded-xl bg-[#0a0a0f] border border-white/10 text-2xl shadow-2xl z-20">
                  {activeGameInfo.icon}
                </div>
              </div>

              <div className="p-8 pt-10 flex-1 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className={cn(
                    "rounded-full px-3 py-1 text-xs font-black uppercase tracking-tight border",
                    activeGameInfo.color === 'blue' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' : 
                    'bg-neon-purple/10 text-neon-purple border-neon-purple/20'
                  )}>
                    {selectedGame?.title}
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Users size={16} className="text-gray-500" />
                    <span className="text-sm font-black">۱ / {formData.capacity}</span>
                  </div>
                </div>
                
                <h3 className="mb-4 text-2xl font-black text-white line-clamp-1">
                  {formData.title || "عنوان لابی شما"}
                </h3>

                {/* Region & Mode Badges */}
                <div className="mb-5 flex flex-wrap gap-2.5 text-right" dir="rtl">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-400">
                    <Globe size={13} />
                    <span>{formData.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-neon-blue">
                    <Gamepad2 size={13} />
                    <span>{formData.mode}</span>
                  </div>
                </div>

                {/* Feature Icons Row */}
                <div className="mb-6 flex flex-wrap gap-3">
                  {formData.isPrivate && (
                    <div className="h-8 w-8 rounded-lg bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-neon-pink" title="لابی خصوصی">
                      <Lock size={14} />
                    </div>
                  )}
                  {formData.micRequired && (
                    <div className="h-8 w-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue" title="میکروفون اجباری">
                      <Mic size={14} />
                    </div>
                  )}
                  {formData.discordRequired && (
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400" title="دیسکورد اجباری">
                      <MessageSquare size={14} />
                    </div>
                  )}
                  {formData.age18Plus && (
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-[10px] font-black" title="محدودیت سنی +18">
                      18+
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-base text-gray-500 mt-auto">
                  <Shield size={18} className="text-green-500" />
                  <span className="font-bold">سطح مهارت: <span className="text-white">{formData.rankRange}</span></span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="mt-2 flex items-center justify-between border-t border-white/5 p-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2.5">
                    <div className="h-8 w-8 rounded-full border-2 border-dark-card bg-white/10 flex items-center justify-center text-xs">👤</div>
                  </div>
                  <span className="text-sm font-bold text-gray-500">+۱ آنلاین</span>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white/5 text-sm font-black text-neon-blue uppercase italic tracking-wider">
                  JOIN NOW
                </div>
              </div>
            </motion.div>

            {/* AI Description Tooltip */}
            {formData.description && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 text-center"
              >
                <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed">
                  " {formData.description} "
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Floating Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all z-[101]"
        >
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
};
