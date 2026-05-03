import React, { useState } from "react";
import { GlowButton } from "./GlowButton";
import { motion } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { BadgeType } from "../../types";
import { cn } from "../../lib/utils";
import { Award, Star, Zap, Crown } from "lucide-react";

export interface QuickProfileUser {
  senderName: string;
  senderAvatar?: string;
  senderLevel: number;
  senderBadges?: BadgeType[];
  id?: string;
}

interface QuickProfilePopoverProps {
  onClose: () => void;
  user: QuickProfileUser;
  isSelf: boolean;
}

export const QuickProfilePopover: React.FC<QuickProfilePopoverProps> = ({ onClose, user, isSelf }) => {
  const { addFriend } = useFriends();
  const [sentRequest, setSentRequest] = useState(false);

  const handleAddFriend = () => {
    addFriend(user.senderName);
    setSentRequest(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="w-72 bg-[#0a0a0f] rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden cursor-default rtl text-right transition-all backdrop-blur-2xl px-0 relative z-[20002]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Banner */}
      <div className="h-24 bg-gradient-to-l from-neon-blue to-neon-pink relative overflow-hidden">
         <div className="absolute inset-0 bg-black/20"></div>
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
         <button 
          onClick={onClose}
          className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
         >
           ×
         </button>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 pt-0 relative">
        {/* Avatar */}
        <div className="h-20 w-20 rounded-3xl bg-[#0d0d12] border-[6px] border-[#0d0d12] -mt-10 mb-2 relative overflow-hidden shadow-xl">
          <div className="h-full w-full rounded-2xl bg-white/5 flex items-center justify-center text-4xl">
            {user.senderAvatar || "👤"}
          </div>
          <div className="absolute bottom-1 left-1 h-4 w-4 bg-green-500 rounded-full border-2 border-[#0d0d12]"></div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-black text-white">{user.senderName}</h4>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-none">تایید شده در LOXX</p>
          </div>

          <div className="flex gap-2 mb-2">
            {user.senderBadges?.map((badge, i) => (
              <BadgeIcon key={i} type={badge} />
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] text-gray-500 font-black uppercase mb-1">رنک LOXX</p>
              <p className="text-sm font-black text-white">Supreme</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] text-gray-500 font-black uppercase mb-1">سطح جهانی</p>
              <p className="text-sm font-black text-neon-blue">{user.senderLevel}</p>
            </div>
          </div>

          {/* Favorite Games */}
          <div>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2 px-1">بازی‌های مورد علاقه</p>
            <div className="flex gap-2">
              {["🎮", "🎯", "🔫"].map((emoji, i) => (
                <div key={i} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{emoji}</div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            {!isSelf && (
              <GlowButton 
                variant={sentRequest ? "purple" : "blue"} 
                className="w-full h-12 !rounded-2xl font-black text-sm shadow-neon-blue/10"
                onClick={handleAddFriend}
                disabled={sentRequest}
              >
                {sentRequest ? "درخواست ارسال شد" : "افزودن به دوستان"}
              </GlowButton>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BadgeIcon: React.FC<{ type: BadgeType }> = ({ type }) => {
  switch(type) {
    case BadgeType.STREAMER: return <div title="Streamer" className="text-neon-blue"><Zap size={14} fill="currentColor" /></div>;
    case BadgeType.PRO: return <div title="Pro Player" className="text-neon-pink"><Award size={14} fill="currentColor" /></div>;
    case BadgeType.LOBBY_MASTER: return <div title="Lobby Master" className="text-yellow-500"><Star size={14} fill="currentColor" /></div>;
    case BadgeType.VIP: return <div title="VIP" className="text-purple-500"><Crown size={14} fill="currentColor" /></div>;
    default: return null;
  }
};
