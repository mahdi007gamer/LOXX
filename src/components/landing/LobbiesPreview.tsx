import React from "react";
import { motion } from "motion/react";
import { NeonCard } from "../ui/NeonCard";
import { Users, Info, ArrowLeft } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";

const sampleLobbies = [
  { game: "Counter Strike 2", players: 8, max: 10, host: "Ghost_Rider", ping: 15 },
  { game: "Dota 2", players: 4, max: 10, host: "NightWalker", ping: 22 },
  { game: "Valorant", players: 9, max: 10, host: "CyberPunX", ping: 18 },
  { game: "League of Legends", players: 5, max: 10, host: "PersianKing", ping: 25 },
];

export const LobbiesPreview = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-right">
            <h2 className="text-3xl font-black text-white sm:text-4xl">لابی‌های در حال انتظار</h2>
            <p className="mt-4 text-gray-400">همین حالا به یکی از جوخه‌ها ملحق شوید و نبرد را آغاز کنید.</p>
          </div>
          <GlowButton variant="blue" size="sm" className="hidden md:flex">
             مشاهده همه لابی‌ها
          </GlowButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleLobbies.map((lobby, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <NeonCard variant={i % 2 === 0 ? "blue" : "pink"} className="p-6 h-full flex flex-col justify-between group">
                <div>
                   <div className="flex justify-between items-start mb-4">
                      <div className="rounded-lg bg-white/5 p-2 text-white group-hover:neon-text-blue transition-all">
                         <span className="text-xs font-bold uppercase">{lobby.game}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-green-400">
                         <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                         {lobby.ping}ms
                      </div>
                   </div>
                   
                   <h3 className="text-lg font-black text-white mb-2">{lobby.host}</h3>
                   
                   <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                      <Users size={14} />
                      <span>{lobby.players} / {lobby.max} بازیکن</span>
                   </div>
                </div>

                <GlowButton variant={i % 2 === 0 ? "blue" : "pink"} size="sm" className="w-full text-xs">
                   درخواست ورود
                </GlowButton>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
