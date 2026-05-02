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
import { GoogleGenAI } from "@google/genai";

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GAME_DATA = {
  "Counter Strike 2": {
    modes: ["Competitive", "Casual", "Wingman", "Premier", "Custom"],
    maps: ["Mirage", "Inferno", "Dust 2", "Nuke", "Ancient", "Anubis", "Vertigo"],
    icon: "🔫",
    color: "blue"
  },
  "Dota 2": {
    modes: ["Ranked All Pick", "Captain's Mode", "Turbo", "Ability Draft"],
    maps: ["Standard Map"],
    icon: "⚔️",
    color: "pink"
  },
  "Valorant": {
    modes: ["Competitive", "Unrated", "Swiftplay", "Spike Rush", "Premier"],
    maps: ["Ascent", "Bind", "Haven", "Icebox", "Breeze", "Fracture", "Lotus", "Sunset"],
    icon: "🎯",
    color: "purple"
  },
  "Apex Legends": {
    modes: ["Battle Royale", "Ranked Leagues", "Arenas", "Control"],
    maps: ["Kings Canyon", "World's Edge", "Olympus", "Storm Point", "Broken Moon"],
    icon: "🏃‍♂️",
    color: "blue"
  }
};

const REGIONS = ["Middle East", "Europe", "Asia", "North America", "Auto"];
const SKILL_LEVELS = ["مبتدی", "متوسط", "حرفه‌ای", "نخبه (Elite)"];

export const CreateLobbyModal = ({ isOpen, onClose, onSuccess }: CreateLobbyModalProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    game: "Counter Strike 2",
    mode: "Competitive",
    capacity: 5,
    skill: "متوسط",
    region: "Middle East",
    description: "",
    isPrivate: false,
    micRequired: false,
    discordRequired: false,
    age18Plus: false,
    selectedMaps: [] as string[]
  });

  const activeGame = GAME_DATA[formData.game as keyof typeof GAME_DATA];

  const handleMapToggle = (mapName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.includes(mapName)
        ? prev.selectedMaps.filter(m => m !== mapName)
        : [...prev.selectedMaps, mapName]
    }));
  };

  const generateAiDescription = async () => {
    if (!process.env.GEMINI_API_KEY) return;
    
    setIsGeneratingAi(true);
    try {
      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Write a short, professional, and cool gaming lobby description for LOXX gaming platform. 
      Game: ${formData.game}
      Mode: ${formData.mode}
      Skill Level: ${formData.skill}
      Title: ${formData.title || "Looking for Teammates"}
      Tone: Serious and competitive. 
      Keep it under 30 words. Return ONLY the text of the description in Persian (Farsi).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setFormData(prev => ({ ...prev, description: response.text().trim() }));
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 2000);
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
        className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0a0f] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row h-[85vh] md:h-auto max-h-[90vh]"
      >
        {/* Left: Form Flow */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">ایجاد لابی حرفه‌ای</h2>
              <p className="text-gray-400 text-sm mt-1">تیم رویایی خود را پیدا كنيد</p>
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
                        value={formData.game}
                        onChange={(e) => setFormData(prev => ({ ...prev, game: e.target.value, mode: GAME_DATA[e.target.value as keyof typeof GAME_DATA].modes[0] }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-white focus:border-neon-blue/50 focus:outline-none transition-all appearance-none"
                      >
                        {Object.keys(GAME_DATA).map(game => (
                          <option key={game} value={game} className="bg-dark-card">{game}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">مود بازی</label>
                    <div className="flex flex-wrap gap-3">
                      {activeGame.modes.map((mode) => (
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

                  {activeGame.maps.length > 1 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">انتخاب مپ‌ها</label>
                      <div className="flex flex-wrap gap-2">
                        {activeGame.maps.map((map) => (
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
                        value={formData.skill}
                        onChange={(e) => setFormData(prev => ({ ...prev, skill: e.target.value }))}
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
        <div className="w-full md:w-[420px] bg-white/5 p-8 border-r border-white/10 flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 text-[10px] uppercase font-black text-gray-600 tracking-widest flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-neon-blue" 
            />
            Live Preview
          </div>

          <div className="w-full max-w-[320px] relative perspective-[1000px]">
            {/* The Actual Lobby Card Preview */}
            <motion.div
              layout
              className="relative rounded-2xl border border-white/20 bg-slate-900 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-y-[-5deg]"
            >
              {/* Card Header Background */}
              <div className="h-24 w-full bg-[#0d0d14] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                 <span className="text-4xl filter blur-[1px] opacity-20 select-none">{activeGame.icon}</span>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] to-transparent opacity-60" />
              </div>

              <div className="p-6 relative">
                 <div className="mb-4 flex items-center justify-between">
                   <div className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[9px] font-black uppercase text-gray-400">
                     {activeGame.color === "blue" ? "Counter-Strike 2" : formData.game}
                   </div>
                   <div className="flex items-center gap-1.5 text-neon-blue">
                     <Users size={12} />
                     <span className="text-[10px] font-black">1 / {formData.capacity}</span>
                   </div>
                 </div>

                 <h3 className="mb-2 text-lg font-black text-white line-clamp-1">
                   {formData.title || "عنوان لابی شما"}
                 </h3>

                 <div className="mb-6 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <Clock size={10} />
                      <span>Just now</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neon-pink">
                      <Shield size={10} />
                      <span>{formData.skill}</span>
                    </div>
                 </div>

                 <div className="relative py-4 border-y border-white/5 group-hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Region</span>
                      <span className="text-xs font-bold text-white">{formData.region}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Mode</span>
                      <span className="text-xs font-bold text-neon-blue">{formData.mode}</span>
                    </div>
                 </div>

                 <div className="mt-4 flex items-center gap-2">
                    {formData.micRequired && <Mic size={14} className="p-0.5 rounded bg-neon-blue/20 text-neon-blue" />}
                    {formData.discordRequired && <MessageSquare size={14} className="p-0.5 rounded bg-indigo-500/20 text-indigo-400" />}
                    {formData.isPrivate && <Lock size={14} className="p-0.5 rounded bg-neon-pink/20 text-neon-pink" />}
                 </div>
              </div>
            </motion.div>

            {/* Decorative background element for card */}
            <div className="absolute -inset-4 border border-neon-blue/5 rounded-[40px] -z-10 blur-xl opacity-30" />
            
            {/* Status indicators */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 justify-center">
                 <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                   <Globe size={11} className="text-gray-500" />
                   <span className="text-[10px] font-bold text-gray-400">{formData.isPrivate ? "Closed" : "Open to All"}</span>
                 </div>
                 <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                   <Gamepad2 size={11} className="text-gray-500" />
                   <span className="text-[10px] font-bold text-gray-400">{formData.mode}</span>
                 </div>
              </div>
              
              <div className="text-center">
                <p className="text-[10px] text-gray-600 font-medium italic opacity-60">
                  " {formData.description || "Looking for some serious gameplay. Join up!"} "
                </p>
              </div>
            </div>
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
