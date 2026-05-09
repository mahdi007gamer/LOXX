import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import { GlowButton } from "../ui/GlowButton";
import { 
  Plus, Trash2, Image as ImageIcon, Map as MapIcon, 
  Gamepad, Globe, Layers, Settings2, Trash, X, Check, Upload
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

interface GameFeature {
  name: string;
  options: string[];
}

interface GameData {
  id?: string;
  title: string;
  iconUrl: string;
  bannerUrl: string;
  genres: string[];
  regions: string[];
  metadata: {
    features: GameFeature[];
  };
}

const COMMON_GENRES = [
  "FPS (شلیک اول شخص)", "MOBA (میدان نبرد آنلاین)", "Battle Royale", "RPG (نقش آفرینی)",
  "Sports", "Racing", "Strategy", "Tactical Shooter", "Survival", "Horror", "Card Game", "Fighting"
];

const COMMON_REGIONS = [
  { id: "IR", name: "ایران (IR)" },
  { id: "ME", name: "خاورمیانه (ME)" },
  { id: "EU", name: "اروپا (EU)" },
  { id: "US", name: "آمریکا (US)" },
  { id: "ASIA", name: "آسیا (ASIA)" }
];

export const GameAdminModal = ({ 
  isOpen, 
  onClose, 
  game, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  game?: GameData | null;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<GameData>({
    title: "",
    iconUrl: "",
    bannerUrl: "",
    genres: [],
    regions: [],
    metadata: { features: [] }
  });
  const [dbGenres, setDbGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "features" | "regions">("info");

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await api.get("/admin/genres");
      setDbGenres(res.data.data || []);
    } catch (err) {
      console.error("Error fetching genres:", err);
    }
  };

  useEffect(() => {
    if (game) {
      setFormData({
        ...game,
        metadata: (game.metadata && typeof game.metadata === 'object' && (game.metadata as any).features) 
          ? game.metadata 
          : { ...game.metadata, features: (game.metadata as any)?.features || [] },
        genres: Array.isArray(game.genres) ? game.genres : [],
        regions: Array.isArray(game.regions) ? game.regions : []
      });
    } else {
      setFormData({
        title: "",
        iconUrl: "",
        bannerUrl: "",
        genres: [],
        regions: [],
        metadata: { features: [] }
      });
    }
  }, [game, isOpen]);

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        features: [...(prev.metadata?.features || []), { name: "", options: [] }]
      }
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        features: (prev.metadata?.features || []).filter((_, i) => i !== index)
      }
    }));
  };

  const addOptionToFeature = (featureIndex: number, option: string) => {
    if (!option.trim()) return;
    setFormData(prev => {
      const newFeatures = [...(prev.metadata?.features || [])];
      const currentFeature = newFeatures[featureIndex];
      if (!currentFeature.options.includes(option)) {
        newFeatures[featureIndex] = {
           ...currentFeature,
           options: [...currentFeature.options, option]
        };
      }
      return { ...prev, metadata: { ...prev.metadata, features: newFeatures } };
    });
  };

  const removeOptionFromFeature = (featureIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newFeatures = [...(prev.metadata?.features || [])];
      newFeatures[featureIndex].options = newFeatures[featureIndex].options.filter((_, i) => i !== optionIndex);
      return { ...prev, metadata: { ...prev.metadata, features: newFeatures } };
    });
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const toggleRegion = (regionId: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(regionId)
        ? prev.regions.filter(r => r !== regionId)
        : [...prev.regions, regionId]
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "icon" | "banner") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate upload - in a real app, use a service or FormData to server
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [type === "icon" ? "iconUrl" : "bannerUrl"]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
    toast.success("تصویر با موفقیت انتخاب شد");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (game?.id) {
        await api.patch(`/admin/games/${game.id}`, formData);
        toast.success("بازی با موفقیت بروزرسانی شد");
      } else {
        await api.post("/admin/games", formData);
        toast.success("بازی جدید با موفقیت اضافه شد");
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
      title={game ? "ویرایش بازی" : "افزودن بازی جدید"}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col h-[70vh]" dir="rtl">
        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-white/2 px-4 shrink-0">
          {[
            { id: "info", label: "اطلاعات پایه", icon: Gamepad },
            { id: "features", label: "ویژگی‌ها (مود/مپ)", icon: Settings2 },
            { id: "regions", label: "ریجن و ژانر", icon: Globe }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id ? "text-neon-blue" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_10px_#00E5FF]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "info" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">نام بازی</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-neon-blue transition-all text-white font-bold"
                  placeholder="مثال: Counter-Strike 2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">آیکون بازی (1:1)</label>
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-[28px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-neon-blue/50">
                      {formData.iconUrl ? (
                        <img src={formData.iconUrl} className="h-full w-full object-cover" alt="icon" />
                      ) : (
                        <>
                          <ImageIcon className="text-gray-500 mb-2" size={24} />
                          <span className="text-[10px] text-gray-500">انتخاب فایل</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleFileUpload(e, "icon")}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">فرمت پیشنهادی PNG یا SVG با ابعاد حداقل 256x256</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">بنر بازی (16:9)</label>
                  <div className="relative group">
                    <div className="h-32 w-full rounded-[28px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-neon-blue/50">
                      {formData.bannerUrl ? (
                        <img src={formData.bannerUrl} className="h-full w-full object-cover" alt="banner" />
                      ) : (
                        <>
                          <Upload className="text-gray-500 mb-2" size={24} />
                          <span className="text-[10px] text-gray-500">انتخاب فایل بنر</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleFileUpload(e, "banner")}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">برای پس‌زمینه لابی‌ها استفاده می‌شود (۱۹۲۰x۱۰۸۰)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">ویژگی‌های داینامیک بازی (مثل لیست مودها، مپ‌ها، کاراکترها و ...)</p>
                <GlowButton size="sm" onClick={addFeature}>
                  <Plus size={14} className="ml-2" /> افزودن ویژگی
                </GlowButton>
              </div>

              <div className="space-y-4">
                {(formData.metadata?.features || []).map((feature, fIndex) => (
                  <div key={fIndex} className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 relative group">
                    <button 
                      onClick={() => removeFeature(fIndex)}
                      className="absolute top-4 left-4 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">نام ویژگی</label>
                        <input 
                          type="text"
                          value={feature.name}
                          onChange={e => {
                            const newFeatures = [...(formData.metadata?.features || [])];
                            newFeatures[fIndex].name = e.target.value;
                            setFormData({...formData, metadata: { ...formData.metadata, features: newFeatures }});
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neon-blue"
                          placeholder="مثال: Mode یا Map"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">گزینه‌ها</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(feature.options || []).map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center bg-neon-blue/10 border border-neon-blue/20 rounded-lg pr-3 pl-1 py-1 group/opt">
                            <span className="text-xs text-neon-blue font-bold ml-2">{opt}</span>
                            <button 
                              onClick={() => removeOptionFromFeature(fIndex, oIndex)}
                              className="text-neon-blue/50 hover:text-neon-pink p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-neon-blue"
                          placeholder="افزودن گزینه جدید..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOptionToFeature(fIndex, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                            addOptionToFeature(fIndex, input.value);
                            input.value = "";
                          }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.metadata.features.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <Settings2 className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 font-bold">هنوز هیچ ویژگی‌ای تعریف نکردید</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "regions" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">انتخاب ژانرها (چند انتخابی)</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {dbGenres.map(genre => (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.name)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        formData.genres.includes(genre.name)
                          ? "bg-neon-pink/10 border-neon-pink/50 text-neon-pink shadow-[0_0_15px_rgba(255,69,143,0.1)]"
                          : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      <span className="text-xs font-bold">{genre.name}</span>
                      {formData.genres.includes(genre.name) && <Check size={14} />}
                    </button>
                  ))}
                  {dbGenres.length === 0 && (
                    <div className="col-span-full py-4 text-center text-gray-500 text-xs italic">
                      ژانری در دیتابیس یافت نشد. ابتدا از بخش ژانرها اضافه کنید.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ریجن‌های تحت پوشش</label>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {COMMON_REGIONS.map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => toggleRegion(reg.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        formData.regions.includes(reg.id)
                          ? "bg-neon-blue/10 border-neon-blue/50 text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                          : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      <Globe size={20} />
                      <span className="text-[10px] font-black">{reg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/2 shrink-0">
          <GlowButton 
            onClick={handleSubmit} 
            loading={loading} 
            className="w-full h-14 text-lg"
          >
            {game ? "بروزرسانی نهایی بازی" : "ثبت و تایید نهایی بازی"}
          </GlowButton>
        </div>
      </div>
    </Modal>
  );
};
