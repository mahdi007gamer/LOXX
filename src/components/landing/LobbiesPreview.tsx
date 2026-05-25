import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { NeonCard } from "../ui/NeonCard";
import { Users, Info, ArrowLeft, Loader2 } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { Link } from "react-router-dom";

export const LobbiesPreview = () => {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const res = await fetch("/api/lobbies");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.items) {
            setLobbies(json.data.items.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to fetch lobbies for preview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLobbies();
  }, []);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-right">
            <h2 className="text-3xl font-black text-white sm:text-4xl">لابی‌های فعال در پلتفرم</h2>
            <p className="mt-4 text-gray-400">بازی‌های زنده را پیدا کنید و با بهترین بازیکن‌های ایرانی وارد رقابت شوید.</p>
          </div>
          <Link to="/lobbies">
            <GlowButton variant="blue" size="sm" className="hidden md:flex">
               مشاهده همه لابی‌ها
            </GlowButton>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-neon-blue">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : lobbies.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
            لابی برای نمایش یافت نشد. می‌توانید لابی خود را بسازید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lobbies.map((lobby, i) => (
              <motion.div
                key={lobby.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <NeonCard variant={i % 2 === 0 ? "blue" : "pink"} className="p-6 h-full flex flex-col justify-between group">
                  <div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="rounded-lg bg-white/5 p-2 text-white group-hover:neon-text-blue transition-all">
                           <span className="text-xs font-bold uppercase">{lobby.game?.title || "بازی نامشخص"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-green-400">
                           <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                           {lobby.region || "IR"}
                        </div>
                     </div>
                     
                     <h3 className="text-lg font-black text-white mb-2 truncate" title={lobby.title}>{lobby.title}</h3>
                     
                     <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Users size={14} />
                        <span>{lobby._count?.players || 1} / {lobby.maxPlayers} بازیکن</span>
                     </div>
                  </div>

                  <Link to={`/rooms/${lobby.id}`}>
                    <GlowButton variant={i % 2 === 0 ? "blue" : "pink"} size="sm" className="w-full text-xs justify-center">
                       مشاهده لابی
                    </GlowButton>
                  </Link>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
