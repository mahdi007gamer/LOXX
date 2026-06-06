import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Shield, Radio, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface MusicBotCardProps {
  bot: {
    id: string;
    name: string;
    avatar: string;
    avatarUrl?: string;
    level: number;
    membership?: string;
    vipMetadata?: { borderNeonColor?: string };
    bannerUrl?: string;
    bio?: string;
    miniProfileBg?: string;
    rank: string;
    isMuted: boolean;
    volume: number;
    isSpeaking: boolean;
  };
  onProfile: () => void;
  onAdjustVolume: (val: number) => void;
}

export const MusicBotCard = ({ bot, onProfile, onAdjustVolume }: MusicBotCardProps) => {
  const { language } = useLanguage();
  const isRtl = language === "fa";
  const [localVol, setLocalVol] = useState(bot.volume);
  const [showSlider, setShowSlider] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalVol(val);
    onAdjustVolume(val);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetVal = localVol === 0 ? 100 : 0;
    setLocalVol(targetVal);
    onAdjustVolume(targetVal);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onProfile}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300",
        "bg-gradient-to-br from-[#0c1424]/90 via-[#0a0f1d]/95 to-[#050811]/98",
        "border border-cyan-500/30 hover:border-cyan-400 shadow-lg hover:shadow-cyan-500/10",
        "w-[140px] sm:w-[160px] md:w-[172px] lg:w-[185px] p-3.5 flex flex-col justify-between items-center group touch-none"
      )}
    >
      {/* Dynamic Backglow */}
      <div 
        className={cn(
          "absolute -inset-10 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-500",
          bot.isSpeaking && "animate-pulse"
        )} 
      />

      {/* Cybernetic Accents */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 shadow-[0_0_8px_#00f0ff]" />

      {/* Music Bot Tag Badge */}
      <div className="w-full flex items-center justify-between mb-2.5 relative z-10">
        <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          <Sparkles size={8} className="animate-spin text-cyan-300" style={{ animationDuration: "3s" }} />
          <span>{isRtl ? "ربات لابی" : "Lobby Bot"}</span>
        </span>
        <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] animate-ping" />
      </div>

      {/* Specialized Rotating Vinyl Deck Container */}
      <div className="relative w-18 h-18 sm:w-20 sm:w-20 rounded-full flex items-center justify-center p-1.5 bg-[#090e15] border border-cyan-500/20 shadow-md group-hover:border-cyan-400/40 transition-colors duration-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
          className="w-full h-full rounded-full bg-[#111] overflow-hidden flex items-center justify-center relative shadow-inner"
        >
          {/* Vinyl tracks */}
          <div className="absolute inset-2 border border-white/5 rounded-full" />
          <div className="absolute inset-4 border border-white/5 rounded-full" />
          <div className="absolute inset-6 border border-white/5 rounded-full" />
          <div className="absolute inset-8 border border-white/5 rounded-full" />

          {/* Album artwork cover or generic representation */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-500/30 to-indigo-500/20 border border-cyan-400/30 flex items-center justify-center text-lg shadow-md z-10">
            💿
          </div>
        </motion.div>

        {/* Dynamic Equalizer Pillar Overlay speaking indicator */}
        {bot.isSpeaking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0.5 bg-black/80 px-2 py-0.5 rounded-full border border-cyan-500/30 backdrop-blur-sm z-20">
            <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <span className="w-0.5 h-3.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {/* Info labels */}
      <div className="w-full text-center mt-3 mb-2.5 relative z-10 flex flex-col items-center">
        <h4 className="text-white font-black text-xs sm:text-sm tracking-tight truncate max-w-full drop-shadow">
          {bot.name}
        </h4>
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1 select-none">
          <Music size={11} className="text-cyan-400 shrink-0" />
          <span>{bot.rank}</span>
        </span>
      </div>

      {/* Custom Volume Controls Slider Panel */}
      <div 
        className="w-full flex flex-col items-center gap-1.5 relative z-10 bg-black/40 border border-white/5 rounded-xl p-1.5 hover:bg-black/60 transition-colors"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
      >
        <div className="flex items-center gap-2 justify-center w-full">
          <button
            onClick={handleMuteToggle}
            className={cn(
              "p-1.5 rounded-lg border text-white transition-colors cursor-pointer",
              localVol === 0 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400"
            )}
          >
            {localVol === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          
          <span className="text-[9px] font-mono text-gray-400 font-bold select-none min-w-[20px] text-center">
            {localVol}%
          </span>
        </div>

        {/* Floating/Collapsible smooth visual volume slider */}
        <div className={cn(
          "w-full px-1 overflow-hidden transition-all duration-300 flex items-center",
          showSlider ? "max-h-8 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
        )}>
          <input
            type="range"
            min="0"
            max="100"
            value={localVol}
            onChange={handleSliderChange}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
            style={{ backgroundImage: `linear-gradient(to right, #00f0ff ${localVol}%, rgba(255,255,255,0.1) ${localVol}%)` }}
          />
        </div>
      </div>
    </motion.div>
  );
};
