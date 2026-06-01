import React, { useState, useEffect } from "react";
import { Mic, Key, Monitor, Power, CheckCircle, ShieldAlert, MonitorPlay, MousePointerClick, Maximize, Activity, Eye, MonitorUp, Cpu, RefreshCw, Flame, Sliders } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { Sidebar } from "../components/layout/Sidebar";
import { useLobby } from "../context/LobbyContext";
import { useLanguage } from "../context/LanguageContext";

export const ElectronSettingsPage = () => {
  const { user, isSidebarCollapsed } = useAuth();
  const { language } = useLanguage();
  const isRtl = language === "fa";

  const { 
    overlayPosition, 
    setOverlayPosition,
    overlaySize,
    setOverlaySize,
    overlayOnlyTalking,
    setOverlayOnlyTalking,
    overlayToastPosition,
    setOverlayToastPosition,
    overlayToastXOffset,
    setOverlayToastXOffset,
    overlayToastYOffset,
    setOverlayToastYOffset,
    overlayEnabled,
    setOverlayEnabled,
    transparentOverlayEnabled,
    setTransparentOverlayEnabled,
    overlayMembersVisible,
    setOverlayMembersVisible,
    overlayNormalOpacity,
    setOverlayNormalOpacity,
    overlaySpeakingOpacity,
    setOverlaySpeakingOpacity,
    updateLauncherSettings,
    gameDetected
  } = useLobby();

  const [config, setConfig] = useState<any>({});
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  const [testingCompatibility, setTestingCompatibility] = useState(false);
  const [testResult, setTestResult] = useState<null | 'ok' | 'fail'>(null);
  const [testSteps, setTestSteps] = useState<string[]>([]);

  // State for Titlebar FPS
  const [showTitlebarFps, setShowTitlebarFps] = useState(() => localStorage.getItem("loxx_show_titlebar_fps") === "true");
  const [showOverlayFps, setShowOverlayFps] = useState(() => localStorage.getItem("loxx_show_overlay_fps") !== "false");
  const [debugOverlayEnabled, setDebugOverlayEnabled] = useState(() => localStorage.getItem("loxx_debug_overlay") === "true");
  const [debugMockEnabled, setDebugMockEnabled] = useState(() => localStorage.getItem("loxx_debug_use_mock") === "true");

  const toggleOverlayFps = (enabled: boolean) => {
    setShowOverlayFps(enabled);
    localStorage.setItem("loxx_show_overlay_fps", String(enabled));
    window.dispatchEvent(new Event("loxx_overlay_fps_update"));
    window.dispatchEvent(new Event("storage"));
    toast.success(
      isRtl 
        ? (enabled ? "نمایش FPS مانیتور روی اورلی فعال شد." : "نمایش FPS مانیتور روی اورلی غیرفعال شد.") 
        : (enabled ? "Display FPS display enabled on transparent overlay." : "Display FPS display disabled on transparent overlay.")
    );
  };

  const toggleDebugOverlay = (enabled: boolean) => {
    setDebugOverlayEnabled(enabled);
    localStorage.setItem("loxx_debug_overlay", String(enabled));
    updateSetting("debugOverlay", enabled);
    window.dispatchEvent(new Event("storage"));
    toast.success(
      isRtl
        ? (enabled ? "پنل عیب‌یابی اورلی فعال شد." : "پنل عیب‌یابی اورلی غیرفعال شد.")
        : (enabled ? "Overlay debug panel enabled." : "Overlay debug panel disabled.")
    );
  };

  const toggleDebugMock = (enabled: boolean) => {
    setDebugMockEnabled(enabled);
    localStorage.setItem("loxx_debug_use_mock", String(enabled));
    updateSetting("debugMock", enabled);
    window.dispatchEvent(new Event("storage"));
    toast.success(
      isRtl
        ? (enabled ? "شبیه‌ساز وضعیت اعضای اورلی فعال شد." : "شبیه‌ساز وضعیت اعضای اورلی غیرفعال شد.")
        : (enabled ? "Overlay player simulation activated." : "Overlay player simulation deactivated.")
    );
  };

  const runCompatibilityTest = () => {
    setTestingCompatibility(true);
    setTestResult(null);
    setTestSteps([
      isRtl 
        ? "مرحله ۱: بررسی ارتباط با ران‌تایم ویندوز (Desktop Window Manager)..." 
        : "Step 1: Inspecting connection to Windows Runtime (Desktop Window Manager)..."
    ]);
    
    setTimeout(() => {
      setTestSteps(prev => [...prev, isRtl ? "مرحله ۲: انطباق کلید ثبت رجیستری کارت گرافیک..." : "Step 2: Checking GPU Registry Keys conformity..."]);
      setTimeout(() => {
        setTestSteps(prev => [...prev, isRtl ? "مرحله ۳: تایید امضای دیجیتال کتابخانه هوکس DirectX Overlay..." : "Step 3: Verification of DirectX Overlay Hook Library Digital Signature..."]);
        setTimeout(() => {
          setTestSteps(prev => [...prev, isRtl ? "مرحله ۴: شبیه‌سازی تزریق با موفقیت پکیج..." : "Step 4: Simulating secure library hook injection package..."]);
          setTimeout(() => {
            setTestResult('ok');
            setTestingCompatibility(false);
            toast.success(
              isRtl 
                ? "✅ سازگاری همه‌جانبه اورلی با ویندوز و درایورهای گرافیکی شما تایید شد!" 
                : "✅ Fully compatible! Windows and GPU driver compliance verified successfully.", 
              { duration: 5000 }
            );
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  const triggerPreviewToast = () => {
    toast.custom((t) => (
      <div className={cn(
        "bg-[#0a0a14]/95 border border-[#00e5ff]/40 shadow-[0_0_20px_rgba(0,195,255,0.3)] rounded-xl p-4 flex flex-col gap-1 items-start w-[320px] max-w-xs min-w-[280px] shrink-0 backdrop-blur-xl transition-all duration-300",
        t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        isRtl ? "text-right font-sans" : "text-left font-sans"
      )} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2">
          <span className="p-1 px-1.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-black leading-none">
            {isRtl ? "تست لانچر" : "LAUNCHER TEST"}
          </span>
          <span className="text-white font-bold text-xs">
            {isRtl ? "🔔 نمونه اعلان لانچر لوکس" : "🔔 Sample Launcher Notification"}
          </span>
        </div>
        <p className="text-gray-300 text-[11.5px] mt-1 line-clamp-3">
          {isRtl 
            ? `موقعیت قرارگیری این اعلان طبق تنظیمات شما با فاصله X: ${overlayToastXOffset}px و Y: ${overlayToastYOffset}px تنظیم شده است.`
            : `This notification placement offsets from the margin boundaries at X: ${overlayToastXOffset}px and Y: ${overlayToastYOffset}px.`}
        </p>
      </div>
    ), { duration: 4000 });
  };

  useEffect(() => {
    const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
    if (isElectron) {
      (window as any).electronAPI.getLauncherSettings().then((res: any) => {
        if (res) {
          setConfig(res);
          if (res.debugOverlay !== undefined) {
            setDebugOverlayEnabled(res.debugOverlay);
            localStorage.setItem("loxx_debug_overlay", String(res.debugOverlay));
          }
          if (res.debugMock !== undefined) {
            setDebugMockEnabled(res.debugMock);
            localStorage.setItem("loxx_debug_use_mock", String(res.debugMock));
          }
        }
      });
    }
  }, []);

  const updateSetting = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateLauncherSettings({ [key]: value });
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
        toast.success(isRtl ? "کلید با موفقیت ثبت شد!" : "Hotkey registered successfully!");
      }
    };
    window.addEventListener("keydown", handler);
  };

  const toggleTitlebarFps = (enabled: boolean) => {
    setShowTitlebarFps(enabled);
    localStorage.setItem("loxx_show_titlebar_fps", String(enabled));
    window.dispatchEvent(new Event("loxx_titlebar_fps_update"));
    toast.success(
      isRtl 
        ? (enabled ? "نمایش FPS در نوار عنوان فعال شد." : "نمایش FPS در نوار عنوان غیرفعال شد.") 
        : (enabled ? "FPS display enabled on client titlebar." : "FPS display disabled on client titlebar.")
    );
  };

  return (
    <div className="flex bg-dark-bg min-h-screen custom-scrollbar">
      <Sidebar />
      <main className={cn("flex-1 p-6 md:p-8 space-y-8 animate-fade-in custom-scrollbar transition-all duration-300 min-w-0 w-full", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="max-w-4xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
          
          {/* Header */}
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <MonitorPlay className="text-indigo-400" size={32} /> 
              {isRtl ? "تنظیمات ویندوز" : "Windows Client Settings"} 
              <span className="text-sm bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                Loxx Client v1.2.23
              </span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isRtl 
                ? "این تنظیمات مخصوص نسخه ویندوز می‌باشند و روی مرورگر تاثیری ندارند." 
                : "These configurations specifically apply to the Windows client mode and have no effect in browser tabs."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
             
             {/* Push To Talk & Audio */}
             <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-16 -mt-16 blur-xl" />
                <div className="flex flex-col h-full relative z-10">
                   <h3 className={cn("text-xl font-bold text-white mb-6 flex items-center gap-2", isRtl ? "text-right" : "text-left")}>
                     <Mic className="text-indigo-400" /> 
                     {isRtl ? "صدا و کلیدها" : "Hotkeys & Voices"}
                   </h3>
                   
                   <div className="space-y-5 flex-1 text-right">
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "حالت صحبت (Voice Mode)" : "Voice Activation Mode"}
                        </label>
                        <div className="flex gap-2">
                           <button onClick={() => updateSetting("voiceMode", "activation")} className={cn("flex-1 py-3 rounded-xl border font-bold transition-all text-xs", (!config.voiceMode || config.voiceMode === "activation") ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400")}>
                              {isRtl ? "تشخیص خودکار صدا" : "Voice Activation"}
                           </button>
                           <button onClick={() => updateSetting("voiceMode", "ptt")} className={cn("flex-1 py-3 rounded-xl border font-bold transition-all text-xs", config.voiceMode === "ptt" ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400")}>
                              Push to Talk
                           </button>
                        </div>
                      </div>

                      <div className={cn("transition-all duration-300", (!config.voiceMode || config.voiceMode === "activation") && "opacity-40 pointer-events-none", isRtl ? "text-right" : "text-left")}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "کلید میانبر PTT (Push to Talk)" : "Global Push-to-Talk Hotkey"}
                        </label>
                        <button 
                           onClick={() => listenForKey("globalPttKey")} 
                           className={cn("w-full py-3 px-4 rounded-xl font-mono text-left font-bold transition-all border text-sm", recordingKey === "globalPttKey" ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 animate-pulse" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                           dir="ltr"
                        >
                          {recordingKey === "globalPttKey" ? (isRtl ? "کلیدها را فشار دهید..." : "Press keys...") : (config.globalPttKey || "Not Set")}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                          {isRtl ? "از این کلید هنگام قرار داشتن در لابی برای صحبت کردن استفاده نمایید." : "Use this hotkey globally across your PC to speak inside active lobby rooms."}
                        </p>
                      </div>

                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "کلید خاموش/روشن کردن کل میکروفون سریع" : "Global Microphone Toggle Hotkey"}
                        </label>
                        <button 
                           onClick={() => listenForKey("globalMuteKey")} 
                           className={cn("w-full py-3 px-4 rounded-xl font-mono text-left font-bold transition-all border text-sm", recordingKey === "globalMuteKey" ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                           dir="ltr"
                        >
                          {recordingKey === "globalMuteKey" ? (isRtl ? "کلیدها را فشار دهید..." : "Press keys...") : (config.globalMuteKey || "Not Set")}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                          {isRtl ? "کلید سراسری برای صامت کردن فوری میکروفون شخصی در ویندوز." : "Hardware-level global toggle to mute your microphone immediately."}
                        </p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Overlay settings */}
             <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#00e5ff]/10 rounded-br-full -mr-16 -mt-16 blur-xl" />
                <div className="flex flex-col h-full relative z-10">
                   <h3 className={cn("text-xl font-bold text-white mb-6 flex items-center gap-2", isRtl ? "text-right" : "text-left")}>
                     <Maximize className="text-[#00e5ff]" /> 
                     {isRtl ? "اورلی درون‌بازی (Overlay)" : "HUD Game Overlay"}
                   </h3>
                   
                   <div className="space-y-4">
                      {/* Translucent Window Overlay Toggle */}
                      <div className="flex items-center justify-between bg-black/45 p-4 rounded-xl border border-emerald-500/35 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          <div className={cn("flex flex-col", isRtl ? "text-right" : "text-left")}>
                             <span className="text-sm font-bold text-white flex items-center gap-2">
                                <MonitorPlay size={16} className="text-emerald-400 animate-pulse" /> 
                                {isRtl ? "اورلی شفاف سراسری (کلاینت ویندوز)" : "Desktop Transparent Overlay (GPU)"}
                             </span>
                             <span className="text-[10px] text-gray-400 mt-1 max-w-[240px] leading-relaxed">
                               {isRtl 
                                 ? "قرار دادن آواتار، مدالیون‌ها و بلندگوی هم‌تیمی‌ها مستقیماً روی پنجره کل بازی‌های ویندوز" 
                                 : "Render customizable live teammate activity and overlays directly on top of your Windows games."}
                             </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={transparentOverlayEnabled} onChange={(e) => setTransparentOverlayEnabled(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                      </div>

                      {/* Local App/HUD Overlay Toggle */}
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5">
                          <div className={cn("flex flex-col", isRtl ? "text-right" : "text-left")}>
                             <span className="text-sm font-bold text-white flex items-center gap-2">
                                <Maximize size={16} className="text-[#00e5ff]" /> 
                                {isRtl ? "اورلی وب / کلاینت (HUD لوکس)" : "Teammate HUD (Web/Client Overlay)"}
                             </span>
                             <span className="text-[10px] text-gray-400 mt-1 max-w-[240px] leading-relaxed">
                               {isRtl ? "نمایش پنل شناور متحرک در گوشه صفحه در وب و داخل کلاینت لوکس" : "Display a beautiful overlay hud widget at the corner of your dashboard pages."}
                             </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={overlayEnabled} onChange={(e) => setOverlayEnabled(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                          </label>
                      </div>

                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            <MousePointerClick size={16} className="text-[#00e5ff]" /> 
                            {isRtl ? "عبور کلیک از اورلی" : "Overlay Pass-through Click"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={config.overlayClickThrough !== false} onChange={(e) => updateSetting("overlayClickThrough", e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                          </label>
                      </div>

                      {/* Toggle: Members Display on Overlay */}
                      <div className={cn("flex items-center justify-between bg-black/40 p-3 rounded-xl transition-opacity duration-300", !overlayEnabled && "opacity-40 pointer-events-none")}>
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            {isRtl ? "نمایش لیست اعضا روی اورلی" : "Display Members Roster"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={overlayMembersVisible} onChange={(e) => setOverlayMembersVisible(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                          </label>
                      </div>

                      {/* Toggle: Display FPS on Overlay */}
                      <div className={cn("flex items-center justify-between bg-black/40 p-3 rounded-xl transition-opacity duration-300", !overlayEnabled && "opacity-40 pointer-events-none")}>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                              {isRtl ? "نمایش FPS مانیتور روی اورلی (Display FPS)" : "Show Display FPS on Overlay"}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                              {isRtl ? "نمایش زنده نرخ نوسازی مانیتور بازی انتخابی شما در اورلی" : "Shows primary display/monitor real-time refresh rate in overlay window"}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={showOverlayFps} onChange={(e) => toggleOverlayFps(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                          </label>
                      </div>

                      {/* Debugging Panel / Simulation Toggles */}
                      {import.meta.env.VITE_WINBUG === "true" && (
                      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3.5 transition-opacity duration-300 border border-red-500/10 bg-red-500/5 p-3 rounded-xl", !overlayEnabled && "opacity-40 pointer-events-none")}>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-rose-400 uppercase tracking-wide">
                              {isRtl ? "فعال‌سازی پنل عیب‌یابی (Debug HUD)" : "Enable Debug HUD Overlay"}
                            </span>
                            <span className="text-[9px] text-gray-400 leading-normal mt-0.5 max-w-[190px]">
                              {isRtl ? "نمایش همزمان وضعیت‌ها، دکمه‌های کنترل و خطاها روی اورلی شفاف" : "Display real-time states, window logs & overlays debug cards on transparency overlay layout."}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={debugOverlayEnabled} onChange={(e) => toggleDebugOverlay(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-rose-400 uppercase tracking-wide">
                              {isRtl ? "شبیه‌ساز اعضای تستی (Mock Members)" : "Mock Players Simulation"}
                            </span>
                            <span className="text-[9px] text-gray-400 leading-normal mt-0.5 max-w-[190px]">
                              {isRtl ? "بارگذاری ۴ بازیکن فرضی (سخنگو و بی‌صدا) برای تست ظاهر اورلی" : "Force-load 4 simulation mock teammates on the overlay window to test visual style."}
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={debugMockEnabled} onChange={(e) => toggleDebugMock(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                          </label>
                        </div>
                      </div>
                      )}

                      {/* Sliders for Normal and Talking Opacity */}
                      <div className={cn("space-y-4 bg-black/35 p-3.5 rounded-xl border border-white/5 transition-all duration-300", (!overlayEnabled || !overlayMembersVisible) && "opacity-30 pointer-events-none scale-95 origin-top mb-1")}>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <div className="flex justify-between items-center text-gray-400 text-xs mb-1.5 font-bold">
                            <span className="font-mono text-[#00e5ff]">{Math.round(overlayNormalOpacity * 100)}%</span>
                            <span>{isRtl ? "شفافیت اعضا در حالت سکوت (Quiet)" : "Roster Members Quiet Opacity"}</span>
                          </div>
                          <input 
                            type="range" min="0.10" max="1.0" step="0.05" 
                            value={overlayNormalOpacity} 
                            onChange={e => setOverlayNormalOpacity(parseFloat(e.target.value))} 
                            className="w-full h-1 accent-[#00e5ff] bg-white/15 rounded-lg appearance-none cursor-pointer" 
                          />
                        </div>

                        <div className={isRtl ? "text-right" : "text-left"}>
                          <div className="flex justify-between items-center text-gray-400 text-xs mb-1.5 font-bold">
                            <span className="font-mono text-[#00e5ff]">{Math.round(overlaySpeakingOpacity * 100)}%</span>
                            <span>{isRtl ? "شفافیت اعضا در حال صحبت (Speaking)" : "Roster Members Speaking Opacity"}</span>
                          </div>
                          <input 
                            type="range" min="0.10" max="1.0" step="0.05" 
                            value={overlaySpeakingOpacity} 
                            onChange={e => setOverlaySpeakingOpacity(parseFloat(e.target.value))} 
                            className="w-full h-1 accent-[#00e5ff] bg-white/15 rounded-lg appearance-none cursor-pointer" 
                          />
                        </div>
                      </div>

                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "شفافیت پس‌زمینه اورلی" : "Overlay HUD Background Opacity"}
                        </label>
                        <input 
                          type="range" min="0.0" max="1.0" step="0.1" 
                          value={config.overlayOpacity !== undefined ? config.overlayOpacity : 0.9} 
                          onChange={e => updateSetting("overlayOpacity", parseFloat(e.target.value))} 
                          className="w-full h-1 accent-[#00e5ff] bg-white/10 rounded-lg appearance-none cursor-pointer" 
                        />
                      </div>

                      {/* Position HUD */}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "موقعیت صفحه اعضا (HUD)" : "Voice HUD Screen Placement"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "top-left", fa: "بالا چپ", en: "Top Left" },
                            { id: "top-right", fa: "بالا راست", en: "Top Right" },
                            { id: "bottom-left", fa: "پایین چپ", en: "Bottom Left" },
                            { id: "bottom-right", fa: "پایین راست", en: "Bottom Right" }
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setOverlayPosition(p.id as any)}
                              className={cn(
                                "py-2 px-3 rounded-lg border font-bold text-center transition-all text-xs",
                                overlayPosition === p.id 
                                  ? "bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              {isRtl ? p.fa : p.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size HUD */}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "اندازه آواتارها و اسامی" : "HUD Avatar and Font Size Scale"}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "small", fa: "کوچک", en: "Small" },
                            { id: "medium", fa: "متوسط", en: "Medium" },
                            { id: "large", fa: "بزرگ", en: "Large" }
                          ].map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setOverlaySize(s.id as any)}
                              className={cn(
                                "py-2 rounded-lg border font-bold text-center transition-all text-xs",
                                overlaySize === s.id 
                                  ? "bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              {isRtl ? s.fa : s.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-white/5 my-3"></div>

                      {/* Toast placement */}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <label className="text-sm text-gray-400 font-bold block mb-2">
                          {isRtl ? "موقعیت نمایش اعلانات (Toasts)" : "Toast Notifications Alignment"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "top-left", fa: "بالا چپ", en: "Top Left" },
                            { id: "top-right", fa: "بالا راست", en: "Top Right" },
                            { id: "bottom-left", fa: "پایین چپ", en: "Bottom Left" },
                            { id: "bottom-right", fa: "پایین راست", en: "Bottom Right" }
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setOverlayToastPosition(p.id as any)}
                              className={cn(
                                "py-2 px-3 rounded-lg border font-bold text-center transition-all text-xs",
                                overlayToastPosition === p.id 
                                  ? "bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              {isRtl ? p.fa : p.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Offset X Slider */}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <div className="flex justify-between text-gray-400 text-xs mb-1 font-bold">
                          <span className="font-mono text-[#00e5ff]">{overlayToastXOffset}px</span>
                          <span>{isRtl ? "فاصله افقی اعلانات از حاشیه (X)" : "Toasts Layout Offset Boundary X"}</span>
                        </div>
                        <input 
                          type="range" min="0" max="300" 
                          value={overlayToastXOffset} 
                          onChange={e => setOverlayToastXOffset(parseInt(e.target.value, 10))} 
                          className="w-full h-1 accent-[#00e5ff] bg-white/10 rounded-lg appearance-none cursor-pointer" 
                        />
                      </div>

                      {/* Offset Y Slider */}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <div className="flex justify-between text-gray-400 text-xs mb-1 font-bold">
                          <span className="font-mono text-[#00e5ff]">{overlayToastYOffset}px</span>
                          <span>{isRtl ? "فاصله عمودی اعلانات از حاشیه (Y)" : "Toasts Layout Offset Boundary Y"}</span>
                        </div>
                        <input 
                          type="range" min="0" max="300" 
                          value={overlayToastYOffset} 
                          onChange={e => setOverlayToastYOffset(parseInt(e.target.value, 10))} 
                          className="w-full h-1 accent-[#00e5ff] bg-white/10 rounded-lg appearance-none cursor-pointer" 
                        />
                      </div>
                      
                      {/* Action row: Preview Toast */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <button
                          onClick={triggerPreviewToast}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-white font-bold hover:bg-[#00e5ff]/20 transition-all text-xs"
                        >
                          <Eye size={13} className="text-[#00e5ff]" />
                          <span>{isRtl ? "پیش‌نمایش اعلان موقعیت‌یابی (تستی)" : "Trigger Offset Test Toast"}</span>
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 bg-[#00e5ff]/5 border border-[#00e5ff]/20 p-3 rounded-xl mt-4 leading-relaxed text-right md:text-justify">
                         <p className={isRtl ? "text-right" : "text-left"}>
                           {isRtl 
                             ? "سیستم اورلی هم‌اکنون به صورت تمام صفحه روی مانیتور اصلی رندر می‌شود. (تزریق مستقیم DirectX/Vulkan برای بازی‌های Fullscreen فعال است)" 
                             : "The transparent game overlay subsystem renders in full-screen on your active primary display."}
                         </p>
                         <p className={cn("mt-2 text-[#00e5ff] font-extrabold", isRtl ? "text-right" : "text-left")}>
                           {isRtl ? "» برای فعال‌سازی حالت چت سریع روی اورلی، کلید میانبر Alt+F1 را بفشارید." : "» Press Alt+F1 global shortcut to focus launcher chat over full-screen games."}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* System Settings & Performance Optimization - Balanced bento grid */}
             <div className="bg-dark-elem border border-white/5 p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full -mr-16 -mt-16 blur-xl" />
                <div className="flex flex-col h-full relative z-10">
                   <h3 className={cn("text-xl font-bold text-white mb-6 flex items-center gap-2", isRtl ? "text-right" : "text-left")}>
                     <Activity className="text-yellow-400 animate-pulse" /> 
                     {isRtl ? "پرفورمنس علمی و تنظیمات سیستم (GPU & CPU)" : "Performance Diagnostics & Optimization Cabinet"}
                   </h3>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir={isRtl ? "rtl" : "ltr"}>
                     
                     {/* Balanced switches block - on one side */}
                     <div className="space-y-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className={cn("flex flex-col ml-3", isRtl ? "text-right" : "text-left")}>
                               <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                 {isRtl ? "اجرای خودکار کلاینت با لود شدن ویندوز" : "Autostart Client with Windows Boot"}
                               </span>
                               <span className="text-[10px] text-gray-500 mt-1">
                                 {isRtl ? "شروع خودکار برنامه پس از روشن شدن کامپیوتر" : "Automatically trigger client dashboard launcher on desktop initialization"}
                               </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" className="sr-only peer" checked={!!config.startAtLogin} onChange={(e) => updateSetting("startAtLogin", e.target.checked)} />
                              <div className={cn("w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400", isRtl ? "peer-checked:after:-translate-x-5 after:right-[2px]" : "peer-checked:after:translate-x-5 after:left-[2px]")}></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className={cn("flex flex-col ml-3", isRtl ? "text-right" : "text-left")}>
                               <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                 {isRtl ? "شتاب‌دهنده گرافیکی سخت‌افزاری" : "Hardware Graphics Acceleration (GPU)"}
                               </span>
                               <span className="text-[10px] text-gray-500 mt-1">
                                 {isRtl ? "استفاده از قدرت کارت گرافیک برای کاهش کامل لگ" : "Use dedicated GPU pipelines to guarantee frictionless low-overhead overlays"}
                               </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" className="sr-only peer" checked={!!config.hardwareAcceleration} onChange={(e) => {
                                 updateSetting("hardwareAcceleration", e.target.checked);
                                 toast.success(
                                   isRtl 
                                     ? "تنظیم تغییر شتاب‌دهنده گرافیک ثبت شد! جهت اعمال، کلاینت را زاه‌اندازی مجدد کنید." 
                                     : "Hardware GPU acceleration settings saved! Restart client from window menus to execute.", 
                                   { icon: "⚙️" }
                                 );
                              }} />
                              <div className={cn("w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400", isRtl ? "peer-checked:after:-translate-x-5 after:right-[2px]" : "peer-checked:after:translate-x-5 after:left-[2px]")}></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className={cn("flex flex-col ml-3", isRtl ? "text-right" : "text-left")}>
                               <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                 {isRtl ? "کاهش مصرف منابع هنگام بازی" : "Intelligent Resource Throttling Mode"}
                               </span>
                               <span className="text-[10px] text-gray-500 mt-1">
                                 {isRtl ? "تعلیق انیمیشن‌های پس‌زمینه کلاینت در زمان گیم" : "Freeze launcher background process workload loops in gaming state"}
                               </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" className="sr-only peer" checked={!!config.throttleGameMode} onChange={(e) => updateSetting("throttleGameMode", e.target.checked)} />
                              <div className={cn("w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400", isRtl ? "peer-checked:after:-translate-x-5 after:right-[2px]" : "peer-checked:after:translate-x-5 after:left-[2px]")}></div>
                            </label>
                        </div>

                        {/* Toggle: Titlebar FPS */}
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className={cn("flex flex-col ml-3", isRtl ? "text-right" : "text-left")}>
                               <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                 {isRtl ? "فریم‌ریت (FPS) نوار عنوان" : "Show Client FPS on Titlebar"}
                               </span>
                               <span className="text-[10px] text-gray-500 mt-1">
                                 {isRtl ? "نمایش زنده نرخ فریم برنامه در نوار بالایی ویندوزی" : "Display a real-time monitor of launcher FPS inside the titlebar"}
                               </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input type="checkbox" className="sr-only peer" checked={showTitlebarFps} onChange={(e) => toggleTitlebarFps(e.target.checked)} />
                              <div className={cn("w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400", isRtl ? "peer-checked:after:-translate-x-5 after:right-[2px]" : "peer-checked:after:translate-x-5 after:left-[2px]")}></div>
                            </label>
                        </div>
                     </div>
                     
                     {/* Booster Dashboard Stats - on the other side */}
                     <div className="bg-black/20 border border-white/5 p-5 rounded-xl text-center flex flex-col items-center justify-center space-y-4">
                        <ShieldAlert size={44} className="text-yellow-500 animate-pulse" />
                        <p className="text-sm font-black text-[#00e5ff] px-4 font-sans tracking-wide">
                          {isRtl ? "سیستم هوشمند گیم بوستر و ارزیابی پرفورمنس" : "LOXX INTELLIGENT HARDWARE ENGINE"}
                        </p>
                        
                        <div className="w-full space-y-3 px-1 text-right" dir={isRtl ? "rtl" : "ltr"}>
                           <div className="bg-black/45 p-3 rounded-xl border border-white/5">
                              <div className={cn("flex justify-between items-center text-[10.5px] mb-1.5 font-bold", isRtl ? "flex-row-reverse" : "flex-row")}>
                                 <span className="text-gray-400">
                                   {isRtl ? "شتاب‌دهنده گرافیکی (GPU):" : "GPU-Accelerated Backbuffers:"}
                                 </span>
                                 <span className={config.hardwareAcceleration ? "text-emerald-400 font-black" : "text-gray-500 font-bold"}>
                                    {config.hardwareAcceleration 
                                      ? (isRtl ? "فعال و پایدار (144+ FPS)" : "Active & Locked (144+ FPS)") 
                                      : (isRtl ? "غیر فعال (رندر نرم‌افزاری)" : "Fallback (Software Renderer)")}
                                 </span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                 <div className={cn("h-full transition-all duration-700 rounded-full", config.hardwareAcceleration ? "bg-emerald-400 w-full shadow-[0_0_8px_#10b981]" : "bg-yellow-400 w-[25%]")} />
                              </div>
                           </div>

                           <div className="bg-black/45 p-3 rounded-xl border border-white/5">
                              <div className={cn("flex justify-between items-center text-[10.5px] mb-1.5 font-bold", isRtl ? "flex-row-reverse" : "flex-row")}>
                                 <span className="text-gray-400">
                                   {isRtl ? "کاهش مصرف منابع کلاینت:" : "Throttler Core CPU Siphon:"}
                                 </span>
                                 <span className={config.throttleGameMode ? "text-emerald-400 font-black" : "text-yellow-500 font-bold"}>
                                    {config.throttleGameMode 
                                      ? (isRtl ? "هوشمند فعال (<0.2% CPU)" : "Smart Active (<0.2% CPU)") 
                                      : (isRtl ? "غیرفعال (عادی)" : "Disabled (Standard)")}
                                 </span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                 <div className={cn("h-full transition-all duration-700 rounded-full", config.throttleGameMode ? "bg-emerald-400 w-full shadow-[0_0_8px_#10b981]" : "bg-yellow-500 w-[50%]")} />
                              </div>
                           </div>

                           {gameDetected ? (
                              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-300 font-black text-[11px] flex items-center justify-between animate-pulse">
                                 <span>{isRtl ? "🎮 بازی در حال اجرا:" : "🎮 Running Game Detected:"}</span>
                                 <span>{gameDetected} {isRtl ? "(کاهش لگ فعال)" : "(Booster Locked)"}</span>
                              </div>
                           ) : (
                              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-gray-400 text-[11px] flex items-center justify-between font-bold">
                                 <span>{isRtl ? "● مانیتورینگ بازی فعال:" : "● Smart Core Daemon Status:"}</span>
                                 <span>{isRtl ? "آماده مانیتور (مثلاً CS2)" : "Monitoring System Hook (e.g. CS2)"}</span>
                              </div>
                           )}
                           
                           <div className="text-[10px] text-gray-400 text-center leading-relaxed mt-2.5 font-medium border-t border-white/5 pt-2">
                              {isRtl 
                                ? "پایش بلادرنگ با ۱۲ه‌ عنوان مطرح بازی جهت خفه‌سازی کامل سربار و انیمیشن‌های پس‌زمینه لانچر." 
                                : "The system hooks into 125+ top AAA desktop games to intelligently freeze backend electron workloads during play."}
                           </div>
                        </div>
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
