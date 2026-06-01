import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { ShareQuality, SHARE_QUALITIES } from '../hooks/useSmartScreenShare';
import { Check, Lock, AlertTriangle, Users, Wifi, Gauge, Info, Crown, Sliders, Play, Rocket } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlowButton } from './ui/GlowButton';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export const ScreenShareModal = ({ 
 isOpen, 
 onClose, 
 userPlan, 
 onStartShare,
 estimatedUploadMbps: parentEstimatedUploadMbps,
 numViewers: parentNumViewers
}: {
 isOpen: boolean;
 onClose: () => void;
 userPlan: "NORMAL" | "PLUS" | "VIP";
 onStartShare: (quality: ShareQuality) => void;
 estimatedUploadMbps: number | null;
 numViewers: number;
}) => {
 const { language, t } = useLanguage();
 const isRtl = language === "fa";

 // Use state indicators: Default 5 viewers & 5.0 Mbps estimated upload
 const [viewersSim, setViewersSim] = useState<number>(5);
 const [uploadSim, setUploadSim] = useState<number>(5.0);
 const [selectedQuality, setSelectedQuality] = useState<ShareQuality | null>(null);
 const [hoveredQuality, setHoveredQuality] = useState<ShareQuality | null>(null);

 // Synchronize initial simulation values with actual lobby status (excluding themselves, i.e., lobby size - 1)
 useEffect(() => {
 if (parentNumViewers && parentNumViewers > 1) {
 // Calculate active potential viewers excluding the sharing user
 setViewersSim(Math.max(1, parentNumViewers - 1));
 } else {
 setViewersSim(1); // Default to 1 if only themselves is in lobby to save resources initial
 }
 }, [parentNumViewers]);

 useEffect(() => {
 if (parentEstimatedUploadMbps !== null) {
 setUploadSim(parentEstimatedUploadMbps);
 } else {
 setUploadSim(5.0); // Default to 5.0 Mbps as requested
 }
 }, [parentEstimatedUploadMbps]);

 // Select recommended stable quality initially
 useEffect(() => {
 if (isOpen) {
 const planLevel = userPlan === "VIP" ? 3 : userPlan === "PLUS" ? 2 : 1;
 
 // Auto recommend quality that matches requirements
 const selectable = SHARE_QUALITIES.filter(q => {
 const reqLevel = q.requiredPlan === "VIP" ? 3 : q.requiredPlan === "PLUS" ? 2 : 1;
 const requiredBandwidth = q.requiredBandwidthPerViewerMbps * viewersSim;
 return planLevel >= reqLevel && uploadSim >= requiredBandwidth;
 });

 if (selectable.length > 0) {
 setSelectedQuality(selectable[selectable.length - 1]);
 } else {
 // Fallback to highest unlocked quality
 const baseSelectable = SHARE_QUALITIES.filter(q => {
 const reqLevel = q.requiredPlan === "VIP" ? 3 : q.requiredPlan === "PLUS" ? 2 : 1;
 return planLevel >= reqLevel;
 });
 if (baseSelectable.length > 0) {
 setSelectedQuality(baseSelectable[baseSelectable.length - 1] || baseSelectable[0]);
 }
 }
 }
 }, [isOpen, userPlan, viewersSim, uploadSim]);

 if (!isOpen) return null;

 const planLevel = userPlan === "VIP" ? 3 : userPlan === "PLUS" ? 2 : 1;

 const handleStart = () => {
 if (selectedQuality) {
 onStartShare(selectedQuality);
 onClose();
 }
 };

 const activeQuality = hoveredQuality || selectedQuality;

 return (
 <Modal isOpen={isOpen} title={t("betaShieldTitle")} onClose={onClose} maxWidth="max-w-2xl">
 <div className={cn("space-y-5 text-gray-200", isRtl ? "text-right font-sans" : "text-left font-sans")} dir={isRtl ? "rtl" : "ltr"}>
 
 {/* Banner with Beta version details and upcoming optimization features explanation */}
 <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-24 h-24 bg-orange-500/5 rounded-br-full -ml-8 -mt-8 blur-xl pointer-events-none" />
 <div className="flex gap-3 items-start relative z-10">
 <span className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/20 font-extrabold text-xs shrink-0 self-center animate-pulse">
 BETA
 </span>
 <div className="space-y-1">
 <h4 className="text-sm font-black text-white flex items-center gap-1.5">
 <span>{t("betaShieldTitle")}</span>
 <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded leading-none">LOXX BETA</span>
 </h4>
 <p className="text-[11px] text-gray-400 leading-relaxed">
 {t("betaShieldDesc")}
 </p>
 </div>
 </div>
 </div>

 {/* Connection status monitoring and simulation parameters */}
 <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
 <div className="absolute top-0 left-0 w-32 h-32 bg-neon-blue/5 rounded-br-full -ml-8 -mt-8 blur-xl pointer-events-none" />
 <div className="flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-neon-blue/10 rounded-xl border border-neon-blue/20 text-neon-blue animate-pulse">
 <Gauge size={22} />
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <h4 className="text-sm font-black text-white">{t("realtimeMonitoring")}</h4>
 <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
 {isRtl 
 ? "سرعت آپلود و تعداد بینندگان فعال در لابی، جهت تحلیل ثبات استریم ارزیابی می‌شوند." 
 : "Real-time bandwidth simulation to calculate optimal frames for lobby members."}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap gap-4 w-full md:w-auto mt-2 md:mt-0 justify-end">
 {/* Upload Speed Slider */}
 <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col min-w-[140px] flex-1 md:flex-none">
 <div className="flex justify-between items-center text-xs font-mono text-gray-300 px-1 mb-1">
 <span className="text-gray-400 text-[10px] font-sans">{t("uploadSpeedLabel")}</span>
 <span className="text-emerald-400 font-extrabold">{uploadSim.toFixed(1)} Mbps</span>
 </div>
 <input 
 type="range" 
 min="1.0" 
 max="15.0" 
 step="0.5"
 value={uploadSim}
 onChange={(e) => setUploadSim(parseFloat(e.target.value))}
 className="w-full accent-neon-blue bg-white/10 h-1 rounded cursor-pointer animate-pulse"
 />
 </div>

 {/* Viewers Simulated Slider */}
 <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex flex-col min-w-[140px] flex-1 md:flex-none">
 <div className="flex justify-between items-center text-xs font-mono text-gray-300 px-1 mb-1">
 <span className="text-gray-400 text-[10px] font-sans">{t("activeViewersLabel")}</span>
 <span className="text-yellow-400 font-extrabold">{viewersSim} {isRtl ? "نفر" : "viewers"}</span>
 </div>
 <input 
 type="range" 
 min="1" 
 max="15" 
 step="1"
 value={viewersSim}
 onChange={(e) => setViewersSim(parseInt(e.target.value))}
 className="w-full accent-yellow-500 bg-white/10 h-1 rounded cursor-pointer"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Selector Grid */}
 <div className="space-y-2">
 <label className="text-[11px] font-bold text-gray-400 uppercase block mr-1">
 {isRtl ? "گزینه‌های انتخاب هوشمند کیفیت پخش (بدون دکمه‌های غیرفعال)" : "Smart Screen Share Resolution Quality options"}
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
 {SHARE_QUALITIES.map(q => {
 const reqLevel = q.requiredPlan === "VIP" ? 3 : q.requiredPlan === "PLUS" ? 2 : 1;
 const isPlanLocked = planLevel < reqLevel;
 
 const requiredTotalBandwidth = q.requiredBandwidthPerViewerMbps * viewersSim;
 const isBandwidthExceeded = uploadSim < requiredTotalBandwidth;
 
 const maxViewers = Math.floor(uploadSim / q.requiredBandwidthPerViewerMbps);
 const isUnsupportable = maxViewers === 0;

 // Actionable selection rules as requested: NONE OF THE BUTTONS are disabled because of bandwidth limits anymore. 
 const isSelected = selectedQuality?.id === q.id;

 return (
 <div 
 key={q.id}
 onMouseEnter={() => setHoveredQuality(q)}
 onMouseLeave={() => setHoveredQuality(null)}
 onClick={() => {
 if (isPlanLocked) {
 toast.error(
 isRtl 
 ? `کیفیت ${q.resolution} نیازمند تهیه اشتراک ${q.requiredPlan} برای کلاینت است.` 
 : `${q.resolution} quality requires ${q.requiredPlan} tier.`, 
 { icon: "👑" }
 );
 return;
 }
 setSelectedQuality(q);
 }}
 className={cn(
 "relative p-4 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between overflow-hidden group cursor-pointer",
 isPlanLocked 
 ? "bg-black/50 border-red-500/10 opacity-65 cursor-not-allowed" 
 : "bg-white/5 border-white/5 hover:bg-white/10",
 isSelected 
 ? "border-neon-blue bg-neon-blue/15 shadow-[0_0_15px_rgba(0,229,255,0.15)]" 
 : "hover:border-white/10"
 )}
 >
 {/* Glowing active outline */}
 {isBandwidthExceeded && !isPlanLocked && (
 <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
 )}

 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="font-extrabold font-mono text-white text-base leading-none">{q.resolution}</span>
 <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{q.framerate} FPS</span>
 </div>

 <div className="flex items-center gap-1.5">
 {isSelected && (
 <span className="p-1 bg-neon-blue/20 rounded-full text-neon-blue">
 <Check size={12} className="stroke-[3]" />
 </span>
 )}
 {isPlanLocked && (
 <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400/10 rounded text-[9px] font-extrabold text-yellow-400 border border-yellow-400/20">
 <Crown size={10} />
 <span>{q.requiredPlan}</span>
 </div>
 )}
 
 {/* Red symbol instead of yellow warning icons, as requested */}
 {(isBandwidthExceeded || isUnsupportable) && !isPlanLocked && (
 <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/15 rounded text-[9px] font-black text-red-500 border border-red-500/30 animate-pulse">
 <AlertTriangle size={10} className="stroke-[3] text-red-500" />
 <span>{isRtl ? "ترافیک بالا" : "High Load"}</span>
 </div>
 )}
 </div>
 </div>

 {/* Viewer support capacity calculation text */}
 <div className="mt-3 flex items-center justify-between text-[11px]">
 <span className="text-gray-400 font-sans">{t("lobbyTrafficTotal")}</span>
 <span className={cn(
 "font-mono font-bold", 
 isBandwidthExceeded ? "text-red-500" : "text-emerald-400"
 )}>
 {requiredTotalBandwidth.toFixed(1)} Mbps
 </span>
 </div>

 {/* Progress ratio indicators */}
 <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
 <div 
 className={cn(
 "h-full transition-all duration-300", 
 isBandwidthExceeded ? "bg-red-550 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 animate-pulse"
 )}
 style={{ width: `${Math.min((requiredTotalBandwidth / uploadSim) * 100, 100)}%` }}
 />
 </div>

 {/* Interactive Viewer count recommendation badge as requested */}
 <div className="mt-2.5 flex items-center justify-between text-[11px]" dir={isRtl ? "rtl" : "ltr"}>
 <span className="text-[10px] text-gray-500">{isRtl ? "پشتیبانی آپلود شما:" : "Upload Capacity:"}</span>
 {maxViewers > 0 ? (
 <span className={cn(
 "font-sans text-[10px] font-extrabold px-2 py-0.5 rounded-full",
 maxViewers >= viewersSim 
 ? "text-emerald-450 bg-emerald-500/10" 
 : "text-red-400 bg-red-500/10 animate-pulse border border-red-500/20"
 )}>
 {isRtl ? `برای ${maxViewers} بیننده اوکیه ✅` : `${maxViewers} viewers supported ✅`}
 </span>
 ) : (
 <span className="font-sans text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full leading-none border border-red-500/20 animate-pulse">
 {t("unsupportableSpeed")}
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Real-time smart advice & feedback container (hover & selection feedback) */}
 {activeQuality && (
 <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden transition-all duration-300">
 <div className="flex items-center gap-2 mb-1">
 <Info size={16} className="text-neon-blue font-bold animate-pulse animate-bounce" />
 <h5 className="text-xs font-black text-white">
 {isRtl 
 ? `آنالیز هوشمند برای کیفیت ${activeQuality.resolution} (${activeQuality.framerate} FPS)` 
 : `Smart Analysis for ${activeQuality.resolution}`}
 </h5>
 </div>

 {/* If selected Quality exceeds capacity */}
 {uploadSim < (activeQuality.requiredBandwidthPerViewerMbps * viewersSim) ? (
 <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.05)] animate-shake">
 <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="font-black text-red-500">
 {t("lowUploadAdvice")}
 </p>
 <p className="text-[11px] text-gray-400 leading-relaxed">
 {isRtl 
 ? <>سرعت آپلود تخمینی شما <strong className="text-white">{uploadSim.toFixed(1)} Mbps</strong> است، درحالی که ترافیک کلی پخش با این کیفیت برای <strong className="text-white">{viewersSim} نفر بیننده فعال در لابی</strong> به حداقل <strong className="text-red-500 font-extrabold">{(activeQuality.requiredBandwidthPerViewerMbps * viewersSim).toFixed(1)} Mbps</strong> پهنای باند آپلود پایدار نیاز دارد. این تنظیم ممکن است باعث تاخیر و لک در جریان بازی هم تیمی‌هایتان شود.</>
 : <>Your estimated upload (<strong>{uploadSim.toFixed(1)} Mbps</strong>) is lower than requirements (<strong>{(activeQuality.requiredBandwidthPerViewerMbps * viewersSim).toFixed(1)} Mbps</strong>) for <strong>{viewersSim} viewers</strong>. Teammates may encounter buffering.</>}
 </p>
 </div>
 </div>
 ) : (
 <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2.5">
 <Check size={20} className="text-emerald-400 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="font-extrabold text-emerald-400">
 {t("stableUploadAdvice")}
 </p>
 <p className="text-[11px] text-gray-400 leading-relaxed">
 {isRtl 
 ? <>ترافیک مصرفی کل استریم (<strong className="text-white">{(activeQuality.requiredBandwidthPerViewerMbps * viewersSim).toFixed(1)} Mbps</strong>) به مراتب کمتر از توان خروجی اینترنت شما (<strong className="text-white">{uploadSim.toFixed(1)} Mbps</strong>) است. پخش روان و بدون از دست رفتن پکت‌ها تضمین می‌شود.</>
 : <>Excellent! Required bandwidth (<strong>{(activeQuality.requiredBandwidthPerViewerMbps * viewersSim).toFixed(1)} Mbps</strong>) is well below your speed limit (<strong>{uploadSim.toFixed(1)} Mbps</strong>). Ultra-stable stream output guaranteed! ✅</>}
 </p>
 </div>
 </div>
 )}

 {/* Performance suggestions metrics */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 pt-1">
 <div className="flex items-center justify-between p-2 bg-black/20 rounded-xl px-3 border border-white/5 font-mono">
 <span className="font-sans text-[11px]">{isRtl ? "مصرف پهنای باند به ازای هر بیننده:" : "Bandwidth output per viewer:"}</span>
 <span className="text-white font-bold">{activeQuality.requiredBandwidthPerViewerMbps} Mbps</span>
 </div>
 <div className="flex items-center justify-between p-2 bg-black/20 rounded-xl px-3 border border-white/5 font-mono">
 <span className="font-sans text-[11px]">{isRtl ? "سقف ظرفیت پاسخگویی در این سرعت:" : "Theoretical max concurrent viewers:"}</span>
 <span className={cn(
 "font-bold",
 Math.floor(uploadSim / activeQuality.requiredBandwidthPerViewerMbps) >= viewersSim ? "text-emerald-400" : "text-red-400 animate-pulse"
 )}>
 {Math.floor(uploadSim / activeQuality.requiredBandwidthPerViewerMbps)} {isRtl ? "بیننده همزمان" : "viewers concurrent"}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* Action Panel: button is NEVER locked, as requested */}
 <div className="pt-2 border-t border-white/5 flex gap-3 items-center">
 <GlowButton 
 variant="blue" 
 onClick={handleStart} 
 disabled={!selectedQuality}
 className={cn(
 "w-full h-12 flex items-center justify-center gap-2 font-black text-xs uppercase ", 
 !selectedQuality && "opacity-50 grayscale cursor-not-allowed"
 )}
 >
 <Play size={16} className="fill-current shrink-0" />
 <span>{t("startShare")}</span>
 </GlowButton>
 </div>
 </div>
 </Modal>
 );
};
