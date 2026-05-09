import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { GlowButton } from "../ui/GlowButton";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

interface GenreData {
  id?: string;
  name: string;
}

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (genre) {
      setName(genre.name);
    } else {
      setName("");
    }
  }, [genre, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("نام ژانر الزامی است");
    
    setLoading(true);
    try {
      if (genre?.id) {
        await api.patch(`/admin/genres/${genre.id}`, { name });
        toast.success("ژانر بروزرسانی شد");
      } else {
        await api.post("/admin/genres", { name });
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
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6" dir="rtl">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">نام ژانر</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neon-blue transition-all text-white font-bold"
            placeholder="مثال: شلیک اول شخص (FPS)"
          />
        </div>

        <GlowButton 
          type="submit" 
          loading={loading} 
          className="w-full h-12"
        >
          ذخیره تغییرات
        </GlowButton>
      </form>
    </Modal>
  );
};
