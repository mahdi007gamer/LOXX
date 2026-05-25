import React, { useState, useEffect } from "react";
import { Mic, Key, Monitor, Power, CheckCircle, ShieldAlert, MonitorPlay, MousePointerClick, Maximize, Activity } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { Sidebar } from "../components/layout/Sidebar";

export const ElectronSettingsPage = () => {
  const { user, isSidebarCollapsed } = useAuth();
  const [config, setConfig] = useState<any>({});
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  useEffect(() => {
    const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
    if (isElectron) {
      (window as any).electronAPI.getLauncherSettings().then((res: any) => {
        setConfig(res);
      });
    }
  }, []);

  const updateSetting = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    if ((window as any).electronAPI) {
      (window as any).electronAPI.updateLauncherSettings({ [key]: value });
    }
  };

  const listenForKey = (settingKey: string) => {
    setRecordingKey(settingKey);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      let parts = [];
      if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      
      const keyMap: Record<string, string> = { " ": "Space" };
      let key = keyMap[e.key] || e.key.toUpperCase();
      if (!["CONTROL", "ALT", "SHIFT", "META"].includes(key)) {
        parts.push(key);
      }
      
      if (parts.length > 0) {
        const combo = parts.join("+");
        updateSetting(settingKey, combo);
        if (settingKey === "globalPttKey") {
          (window as any).electronAPI.registerGlobalPttShortcut(combo);
        } else if (settingKey === "globalMuteKey") {
          (window as any).electronAPI.registerGlobalMuteShortcut(combo);
        }
        setRecordingKey(null);
        window.removeEventListener("keydown", handler);
        toast.success("کلید با موفقیت ثبت شد!");
      }
    };
    window.addEventListener("keydown", handler);
  };

  return (
    <div className="flex bg-dark-bg min-h-screen custom-scrollbar">
      <Sidebar />
      <main className={cn("flex-1 p-6 md:p-8 space-y-8 animate-fade-in custom-scrollbar transition-all duration-300 min-w-0 w-full", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="max-w-4xl mx-auto" dir="rtl">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <MonitorPlay className="text-indigo-400" size={32} /> تنظیمات ویندوز <span className="text-sm bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">Loxx Client</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">این تنظیمات مخصوص نسخه ویندوز می‌باشند و روی مرورگر تاثیری ندارند.</p>
          </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Push To Talk & Audio */}
         <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-16 -mt-16 blur-xl" />
            <div className="flex flex-col h-full relative z-10">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Mic className="text-indigo-400" /> صدا و کلیدها</h3>
               
               <div className="space-y-5 flex-1">
                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">حالت صحبت (Voice Mode)</label>
                    <div className="flex gap-2">
                       <button onClick={() => updateSetting("voiceMode", "activation")} className={cn("flex-1 py-3 rounded-xl border font-bold transition-all", (!config.voiceMode || config.voiceMode === "activation") ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400")}>
                          Voice Activation
                       </button>
                       <button onClick={() => updateSetting("voiceMode", "ptt")} className={cn("flex-1 py-3 rounded-xl border font-bold transition-all", config.voiceMode === "ptt" ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400")}>
                          Push to Talk
                       </button>
                    </div>
                  </div>

                  <div className={cn("transition-opacity", (!config.voiceMode || config.voiceMode === "activation") && "opacity-50 pointer-events-none")}>
                    <label className="text-sm text-gray-400 font-bold block mb-2">کلید میانبر PTT (Push to Talk)</label>
                    <button 
                       onClick={() => listenForKey("globalPttKey")} 
                       className={cn("w-full py-3 px-4 rounded-xl font-mono text-left font-bold transition-all border", recordingKey === "globalPttKey" ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 animate-pulse" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                       dir="ltr"
                    >
                      {recordingKey === "globalPttKey" ? "Press keys..." : (config.globalPttKey || "Not Set")}
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1">از این کلید هنگام قرار داشتن در لابی برای صحبت کردن استفاده نمایید.</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">کلید خاموش/روشن کردن کل میکروفون سریع</label>
                    <button 
                       onClick={() => listenForKey("globalMuteKey")} 
                       className={cn("w-full py-3 px-4 rounded-xl font-mono text-left font-bold transition-all border", recordingKey === "globalMuteKey" ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                       dir="ltr"
                    >
                      {recordingKey === "globalMuteKey" ? "Press keys..." : (config.globalMuteKey || "Not Set")}
                    </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Overlay settings */}
         <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#00e5ff]/10 rounded-br-full -ml-16 -mt-16 blur-xl" />
            <div className="flex flex-col h-full relative z-10">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Maximize className="text-[#00e5ff]" /> اورلی درون‌بازی (Overlay)</h3>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                      <span className="text-sm font-bold text-white flex items-center gap-2"><MousePointerClick size={16} className="text-[#00e5ff]" /> عبور کلیک از اورلی</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={config.overlayClickThrough !== false} onChange={(e) => updateSetting("overlayClickThrough", e.target.checked)} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                      </label>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">شفافیت پس‌زمینه اورلی</label>
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={config.overlayOpacity !== undefined ? config.overlayOpacity : 0.9} 
                      onChange={e => updateSetting("overlayOpacity", parseFloat(e.target.value))} 
                      className="w-full accent-[#00e5ff]" 
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-[#00e5ff]/10 border border-[#00e5ff]/20 p-3 rounded-xl mt-4">
                     <p>سیستم اورلی هم‌اکنون به صورت Transparent Borderless Window روی بازی‌ها رندر می‌شود.</p>
                     <p className="mt-2 text-[#00e5ff] font-bold">» تزریق مستقیم DirectX/Vulkan در دست توسعه...</p>
                  </div>
               </div>
            </div>
         </div>
         
         {/* System Settings */}
         <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full -mr-16 -mt-16 blur-xl" />
            <div className="flex flex-col h-full relative z-10">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Activity className="text-yellow-400" /> پرفورمنس و سیستم</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                        <span className="text-sm font-bold text-white flex items-center gap-2">اجرای خودکار با ویندوز</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={!!config.startAtLogin} onChange={(e) => updateSetting("startAtLogin", e.target.checked)} />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                        <span className="text-sm font-bold text-white flex items-center gap-2">شتاب‌دهنده سخت‌افزاری (کاهش لگ گیم)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={!!config.hardwareAcceleration} onChange={(e) => {
                             updateSetting("hardwareAcceleration", e.target.checked);
                             toast("جهت اعمال نیاز به راه‌اندازی مجدد است.", { icon: "⚠️" });
                          }} />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                        <span className="text-sm font-bold text-white flex items-center gap-2">کاهش مصرف منابع هنگام بازی (Resource Throttling)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={!!config.throttleGameMode} onChange={(e) => updateSetting("throttleGameMode", e.target.checked)} />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                    </div>
                 </div>
                 
                 <div className="bg-black/20 border border-white/5 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-4">
                    <ShieldAlert size={48} className="text-gray-600" />
                    <p className="text-sm text-gray-400 px-4">هنگام اجرای بازی‌های سنگین، کلاینت به صورت خودکار انیمیشن‌ها و رندرهای اضافه را جهت بهبود FPS متوقف می‌کند.</p>
                 </div>
               </div>
            </div>
         </div>
      </div>
     </div>
    </main>
   </div>
  );
};
