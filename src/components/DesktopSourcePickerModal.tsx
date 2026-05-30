import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Monitor, AppWindow, Search, RefreshCw } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSources = () => {
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
      toast.error("دریافت منابع فقط در اپلیکیشن دسکتاپ امکان‌پذیر است");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      fetchSources();
    } else {
      setSources([]);
      setSelectedSourceId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedSourceId) {
      onSelect(selectedSourceId);
      // Do not call onClose() here, as LobbyRoomPage's handleSourceSelected already closes the modal. 
      // Calling onClose() was triggering setPendingSourceId(null) unexpectedly.
    }
  };

  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const screens = filteredSources.filter(s => s.id.startsWith('screen'));
  const windows = filteredSources.filter(s => s.id.startsWith('window'));

  const renderSourceImage = (thumbnail: any) => {
    if (typeof thumbnail === 'string') return thumbnail;
    if (thumbnail && typeof thumbnail.toDataURL === 'function') return thumbnail.toDataURL();
    return undefined; // fallback
  };

  return (
    <Modal isOpen={isOpen} title="انتخاب منبع اشتراک گذاری" onClose={onClose} maxWidth="max-w-5xl">
      <div className="flex flex-col gap-4 max-h-[80vh] min-h-[50vh]">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('screen'); setSelectedSourceId(null); }}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'screen' ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30" : "text-gray-400 hover:bg-white/5 border border-transparent")}
            >
              <Monitor size={18} />
              تمامی صفحات (مانیتورها)
              <span className="ml-1 bg-white/10 text-xs px-2 py-0.5 rounded-full">{sources.filter(s => s.id.startsWith('screen')).length}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('window'); setSelectedSourceId(null); }}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'window' ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30" : "text-gray-400 hover:bg-white/5 border border-transparent")}
            >
              <AppWindow size={18} />
              پنجره‌های خاص
              <span className="ml-1 bg-white/10 text-xs px-2 py-0.5 rounded-full">{sources.filter(s => s.id.startsWith('window')).length}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="جستجوی نام..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl pr-9 pl-4 py-1.5 text-sm w-48 md:w-64 focus:outline-none focus:border-neon-blue text-white"
                dir="rtl"
              />
            </div>
            <button onClick={fetchSources} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="بروزرسانی لیست">
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && sources.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12">
            <div className="animate-spin w-10 h-10 rounded-full border-t-2 border-b-2 border-neon-blue mb-4"></div>
            <span className="text-gray-400 text-sm animate-pulse">در حال دریافت صفحه‌ها...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(activeTab === 'screen' ? screens : windows).map((source) => {
                const thu = renderSourceImage(source.thumbnail);
                const isSelected = selectedSourceId === source.id;

                return (
                  <div 
                    key={source.id} 
                    onClick={() => setSelectedSourceId(source.id)}
                    onDoubleClick={() => { setSelectedSourceId(source.id); setTimeout(handleSelect, 50); }}
                    className={cn(
                      "relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 bg-black group",
                      isSelected ? "border-neon-blue shadow-[0_0_20px_rgba(0,240,255,0.3)] transform scale-[1.02]" : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                    )}
                  >
                    <div className="aspect-video w-full bg-gray-900 relative flex items-center justify-center overflow-hidden">
                      {thu ? (
                        <img src={thu} alt={source.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Monitor size={32} className="text-gray-600" />
                      )}
                      
                      {/* Hover Overlay */}
                      {!isSelected && (
                         <div className="absolute inset-0 bg-neon-blue/0 group-hover:bg-neon-blue/10 transition-colors pointer-events-none" />
                      )}
                      {isSelected && (
                         <div className="absolute inset-0 ring-4 ring-inset ring-neon-blue/50 pointer-events-none" />
                      )}
                    </div>
                    
                    <div className="p-3 bg-gradient-to-t from-black to-[#0a0a0f] border-t border-white/10 truncate font-medium text-sm text-center text-gray-200">
                      {source.name}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {(activeTab === 'screen' && screens.length === 0) && (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Monitor size={48} className="mb-4 opacity-30" />
                <span className="text-sm">مانیتوری یافت نشد</span>
              </div>
            )}
            {(activeTab === 'window' && windows.length === 0) && (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <AppWindow size={48} className="mb-4 opacity-30" />
                <span className="text-sm">پنجره‌ای یافت نشد</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
           <span className="text-xs text-gray-500">
             {selectedSourceId ? "برای انتخاب سریع دوبار کلیک کنید" : "لطفاً یک صفحه را برای ادامه انتخاب کنید"}
           </span>
           <GlowButton 
             variant="blue" 
             onClick={handleSelect} 
             disabled={!selectedSourceId}
             className={cn("px-8 py-2.5", !selectedSourceId && "opacity-50 grayscale cursor-not-allowed")}
           >
             تایید و اشتراک
           </GlowButton>
        </div>
      </div>
    </Modal>
  );
};

