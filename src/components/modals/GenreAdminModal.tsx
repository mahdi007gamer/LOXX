import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { GlowButton } from "../ui/GlowButton";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

interface GenreData {
  id?: string;
  name: string;
  icon?: string;
}

const AVAILABLE_ICONS = [
  "Target", "Swords", "Trophy", "Activity", "Users", "Dices", "Network", 
  "Sword", "Box", "Cpu", "Car", "Ghost", "Mic2", "Layers", "Music", 
  "Gamepad2", "Zap", "Shield", "Skull", "Flame"
];

export const GenreAdminModal = ({ 
  isOpen, 
  onClose, 
  genre, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  genre?: GenreData | null;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Gamepad2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (genre) {
      setName(genre.name);
      setIcon(genre.icon || "Gamepad2");
    } else {
      setName("");
      setIcon("Gamepad2");
    }
  }, [genre, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("نام ژانر الزامی است");
    
    setLoading(true);
    try {
      if (genre?.id) {
        await api.patch(`/admin/genres/${genre.id}`, { name, icon });
        toast.success("ژانر بروزرسانی شد");
      } else {
        await api.post("/admin/genres", { name, icon });
        toast.success("ژانر جدید اضافه شد");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("خطا در ذخیره سازی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={genre ? "ویرایش ژانر" : "افزودن ژانر جدید"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-8" dir="rtl">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">نام ژانر</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neon-blue transition-all text-white font-bold"
              placeholder="مثال: شلیک اول شخص (FPS)"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">انتخاب آیکون متناسب</label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
              {AVAILABLE_ICONS.map(iconName => {
                const IconComponent = (Icons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 group",
                      icon === iconName 
                        ? "bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.2)]" 
                        : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {IconComponent && <IconComponent size={20} className={cn(icon === iconName ? "scale-110" : "group-hover:scale-110 transition-transform")} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <GlowButton 
          type="submit" 
          loading={loading} 
          className="w-full h-14 rounded-2xl font-black text-sm uppercase italic tracking-widest"
        >
          {genre ? "بروزرسانی نهایی" : "تایید و اضافه کردن"}
        </GlowButton>
      </form>
    </Modal>
  );
};
