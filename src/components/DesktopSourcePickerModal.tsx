import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Monitor, AppWindow } from 'lucide-react';
import { GlowButton } from './ui/GlowButton';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: { toDataURL: () => string } | string;
  display_id: string;
  appIcon: { toDataURL: () => string } | string;
}

export const DesktopSourcePickerModal = ({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sourceId: string) => void;
}) => {
  const [sources, setSources] = useState<DesktopSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'screen' | 'window'>('screen');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const api = (window as any).electronAPI;
      if (api && api.getDesktopSources) {
        api.getDesktopSources({ types: ['window', 'screen'] }).then((res: DesktopSource[]) => {
          setSources(res);
          setLoading(false);
        }).catch((err: any) => {
          console.error("Failed to get desktop sources", err);
          toast.error("خطا در دریافت لیست مانیتورها. لطفا دسترسی های لازم را بررسی کنید.");
          setLoading(false);
        });
      } else {
        // Fallback for non-electron or undefined getDesktopSources
        toast.error("آی پی آی دریافت صفحه نمایش در این نسخه موجود نیست");
        setLoading(false);
      }
    } else {
      setSources([]);
      setSelectedSourceId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedSourceId) {
      onSelect(selectedSourceId);
      onClose();
    }
  };

  const screens = sources.filter(s => s.id.startsWith('screen'));
  const windows = sources.filter(s => s.id.startsWith('window'));

  const renderSourceImage = (thumbnail: any) => {
    if (typeof thumbnail === 'string') return thumbnail;
    if (thumbnail && typeof thumbnail.toDataURL === 'function') return thumbnail.toDataURL();
    return undefined; // fallback
  };

  return (
    <Modal isOpen={isOpen} title="انتخاب منبع اشتراک گذاری" onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col gap-4 max-h-[70vh]">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button 
            onClick={() => { setActiveTab('screen'); setSelectedSourceId(null); }}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'screen' ? "bg-neon-blue/20 text-neon-blue" : "text-gray-400 hover:bg-white/5")}
          >
            <Monitor size={18} />
            تمامی صفحات (مانیتورها)
          </button>
          <button 
            onClick={() => { setActiveTab('window'); setSelectedSourceId(null); }}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'window' ? "bg-neon-blue/20 text-neon-blue" : "text-gray-400 hover:bg-white/5")}
          >
            <AppWindow size={18} />
            پنجره‌های خاص
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-neon-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pr-2 py-2">
            {(activeTab === 'screen' ? screens : windows).map((source) => {
              const thu = renderSourceImage(source.thumbnail);
              const isSelected = selectedSourceId === source.id;

              return (
                <div 
                  key={source.id} 
                  onClick={() => setSelectedSourceId(source.id)}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 bg-black",
                    isSelected ? "border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="aspect-video w-full bg-gray-900 relative">
                    {thu ? (
                      <img src={thu} alt={source.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Monitor size={24} />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[#0a0a0f] border-t border-white/10 truncate text-xs text-center text-gray-300">
                    {source.name}
                  </div>
                </div>
              );
            })}
            
            {(activeTab === 'screen' && screens.length === 0) && (
              <div className="col-span-full py-8 text-center text-gray-500 text-sm">مانیتوری یافت نشد</div>
            )}
            {(activeTab === 'window' && windows.length === 0) && (
              <div className="col-span-full py-8 text-center text-gray-500 text-sm">پنجره‌ای یافت نشد</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end">
           <GlowButton 
             variant="blue" 
             onClick={handleSelect} 
             disabled={!selectedSourceId}
             className={cn("px-8", !selectedSourceId && "opacity-50 grayscale cursor-not-allowed")}
           >
             تایید و اشتراک
           </GlowButton>
        </div>
      </div>
    </Modal>
  );
};
