import React from 'react';
import { Modal } from './ui/Modal';
import { ShareQuality, SHARE_QUALITIES } from '../hooks/useSmartScreenShare';
import { Check, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlowButton } from './ui/GlowButton';

export const ScreenShareModal = ({ 
  isOpen, 
  onClose, 
  userPlan, 
  onStartShare,
  estimatedUploadMbps,
  numViewers
}: {
  isOpen: boolean;
  onClose: () => void;
  userPlan: "NORMAL" | "PLUS" | "VIP";
  onStartShare: (quality: ShareQuality) => void;
  estimatedUploadMbps: number | null;
  numViewers: number;
}) => {
  const [selectedQuality, setSelectedQuality] = React.useState<ShareQuality | null>(null);

  if (!isOpen) return null;

  const planLevel = userPlan === "VIP" ? 3 : userPlan === "PLUS" ? 2 : 1;

  const handleStart = () => {
    if (selectedQuality) {
      onStartShare(selectedQuality);
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} title="انتخاب کیفیت اسکرین شیر" onClose={onClose}>
      <div className="space-y-4">
        {estimatedUploadMbps !== null && (
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-gray-300 flex items-center justify-between">
            <span>تعداد بیننده: {numViewers}</span>
            <span>سرعت آپلود تخمینی: {estimatedUploadMbps.toFixed(1)} Mbps</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2" dir="ltr">
          {SHARE_QUALITIES.map(q => {
            const reqLevel = q.requiredPlan === "VIP" ? 3 : q.requiredPlan === "PLUS" ? 2 : 1;
            const isPlanLocked = planLevel < reqLevel;
            
            const requiredMbps = q.requiredBandwidthPerViewerMbps * numViewers;
            const isBandwidthWarning = estimatedUploadMbps !== null && estimatedUploadMbps < requiredMbps;
            
            const isSelectable = !isPlanLocked;

            return (
              <div 
                key={q.id}
                onClick={isSelectable ? () => setSelectedQuality(q) : undefined}
                className={cn(
                  "relative p-4 rounded-2xl border transition-all flex flex-col gap-2",
                  isSelectable ? "cursor-pointer" : "opacity-60 cursor-not-allowed bg-black/40",
                  selectedQuality?.id === q.id 
                    ? "border-neon-blue bg-neon-blue/10" 
                    : "border-white/10 hover:border-white/20 bg-white/5",
                  isPlanLocked && "border-red-500/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-white text-sm">{q.resolution}</span>
                  {selectedQuality?.id === q.id && <Check size={16} className="text-neon-blue" />}
                  {isPlanLocked && <Lock size={14} className="text-red-500" />}
                </div>
                
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">{q.framerate} FPS</span>
                  
                  {q.requiredPlan === "VIP" && (
                    <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md">VIP</span>
                  )}
                  {q.requiredPlan === "PLUS" && (
                    <span className="text-neon-blue font-bold bg-neon-blue/10 px-2 py-0.5 rounded-md">PLUS</span>
                  )}
                </div>

                {isBandwidthWarning && !isPlanLocked && (
                  <div className="absolute -top-2 -left-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg z-10" title="احتمال لگ">
                    <AlertTriangle size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10">
          <GlowButton 
            variant="blue" 
            onClick={handleStart} 
            disabled={!selectedQuality}
            className={cn("w-full h-12", !selectedQuality && "opacity-50 grayscale cursor-not-allowed")}
          >
            شروع اشتراک گذاری
          </GlowButton>
        </div>
      </div>
    </Modal>
  );
}
