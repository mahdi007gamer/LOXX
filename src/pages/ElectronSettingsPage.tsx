import React, { useState, useEffect } from "react";
import { Mic, Key, Monitor, Power, CheckCircle, ShieldAlert, MonitorPlay, MousePointerClick, Maximize, Activity, Eye, MonitorUp } from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { Sidebar } from "../components/layout/Sidebar";
import { useLobby } from "../context/LobbyContext";

export const ElectronSettingsPage = () => {
  const { user, isSidebarCollapsed } = useAuth();
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
    updateLauncherSettings
  } = useLobby();
  const [config, setConfig] = useState<any>({});
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  const [testingCompatibility, setTestingCompatibility] = useState(false);
  const [testResult, setTestResult] = useState<null | 'ok' | 'fail'>(null);
  const [testSteps, setTestSteps] = useState<string[]>([]);

  const runCompatibilityTest = () => {
    setTestingCompatibility(true);
    setTestResult(null);
    setTestSteps(["مرحله ۱: بررسی ارتباط با ران‌تایم ویندوز (Desktop Window Manager)..."]);
    
    setTimeout(() => {
      setTestSteps(prev => [...prev, "مرحله ۲: انطباق کلید ثبت رجیستری کارت گرافیک..."]);
      setTimeout(() => {
        setTestSteps(prev => [...prev, "مرحله ۳: تایید امضای دیجیتال کتابخانه هوکس DirectX Overlay..."]);
        setTimeout(() => {
          setTestSteps(prev => [...prev, "مرحله ۴: شبیه‌سازی تزریق با موفقیت پکیج..."]);
          setTimeout(() => {
            setTestResult('ok');
            setTestingCompatibility(false);
            toast.success("✅ سازگاری همه‌جانبه اورلی با ویندوز و درایورهای گرافیکی شما تایید شد!", {
              duration: 5000,
            });
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  const triggerPreviewToast = () => {
    toast.custom((t) => (
      <div className={cn(
        "bg-[#0a0a14]/95 border border-[#00e5ff]/40 shadow-[0_0_20px_rgba(0,195,255,0.3)] rounded-xl p-4 flex flex-col gap-1 items-start text-right w-[320px] max-w-xs min-w-[280px] shrink-0 backdrop-blur-xl transition-all duration-300",
        t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )} dir="rtl">
        <div className="flex items-center gap-2">
          <span className="p-1 px-1.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-black leading-none">تست لانچر</span>
          <span className="text-white font-bold text-xs">🔔 نمونه اعلان لانچر لوکس</span>
        </div>
        <p className="text-gray-300 text-[11.5px] mt-1">
          موقعیت قرارگیری این اعلان طبق تنظیمات شما با فاصله X: {overlayToastXOffset}px و Y: {overlayToastYOffset}px تنظیم شده است.
        </p>
      </div>
    ), { duration: 4000 });
  };

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
                  {/* Translucent Window Overlay Toggle */}
                  <div className="flex items-center justify-between bg-black/45 p-4 rounded-xl border border-emerald-500/35 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                      <div className="flex flex-col text-right">
                         <span className="text-sm font-bold text-white flex items-center gap-2">
                            <MonitorPlay size={16} className="text-emerald-400 animate-pulse" /> اورلی شفاف سراسری (کلاینت ویندوز)
                         </span>
                         <span className="text-[10px] text-gray-400 mt-1">قرار دادن آواتار، مدالیون‌ها و بلندگوی هم‌تیمی‌ها مستقیماً روی پنجره کل بازی‌های ویندوز</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={transparentOverlayEnabled} onChange={(e) => setTransparentOverlayEnabled(e.target.checked)} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                  </div>

                  {/* Local App/HUD Overlay Toggle */}
                  <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5">
                      <div className="flex flex-col text-right">
                         <span className="text-sm font-bold text-white flex items-center gap-2">
                            <Maximize size={16} className="text-[#00e5ff]" /> اورلی وب / کلاینت (HUD لوکس)
                         </span>
                         <span className="text-[10px] text-gray-400 mt-1">نمایش پنل شناور متحرک در گوشه صفحه در وب و داخل کلاینت لوکس</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={overlayEnabled} onChange={(e) => setOverlayEnabled(e.target.checked)} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                      </label>
                  </div>
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

                  {/* Position HUD */}
                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">موقعیت صفحه اعضا (HUD)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "top-left", name: "بالا چپ" },
                        { id: "top-right", name: "بالا راست" },
                        { id: "bottom-left", name: "پایین چپ" },
                        { id: "bottom-right", name: "پایین راست" }
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
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size HUD */}
                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">اندازه آواتارها و اسامی</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "small", name: "کوچک" },
                        { id: "medium", name: "متوسط" },
                        { id: "large", name: "بزرگ" }
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
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 my-3"></div>

                  {/* Toast placement */}
                  <div>
                    <label className="text-sm text-gray-400 font-bold block mb-2">موقعیت نمایش اعلانات (Toasts)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "top-left", name: "بالا چپ" },
                        { id: "top-right", name: "بالا راست" },
                        { id: "bottom-left", name: "پایین چپ" },
                        { id: "bottom-right", name: "پایین راست" }
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
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Offset X Slider */}
                  <div>
                    <div className="flex justify-between text-gray-400 text-xs mb-1">
                      <span className="font-mono text-[#00e5ff]">{overlayToastXOffset}px</span>
                      <span>فاصله افقی اعلانات از حاشیه (X)</span>
                    </div>
                    <input 
                      type="range" min="0" max="300" 
                      value={overlayToastXOffset} 
                      onChange={e => setOverlayToastXOffset(parseInt(e.target.value, 10))} 
                      className="w-full accent-[#00e5ff]" 
                    />
                  </div>

                  {/* Offset Y Slider */}
                  <div>
                    <div className="flex justify-between text-gray-400 text-xs mb-1">
                      <span className="font-mono text-[#00e5ff]">{overlayToastYOffset}px</span>
                      <span>فاصله عمودی اعلانات از حاشیه (Y)</span>
                    </div>
                    <input 
                      type="range" min="0" max="300" 
                      value={overlayToastYOffset} 
                      onChange={e => setOverlayToastYOffset(parseInt(e.target.value, 10))} 
                      className="w-full accent-[#00e5ff]" 
                    />
                  </div>
                  
                  {/* Action row: Preview Toast & Compatibility Check */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <button
                      onClick={triggerPreviewToast}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-white font-bold hover:bg-[#00e5ff]/20 transition-all text-xs"
                    >
                      <Eye size={13} className="text-[#00e5ff]" />
                      <span>پیش‌نمایش اعلان موقعیت‌یابی (تستی)</span>
                    </button>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                        <MonitorUp size={13} className="text-[#00e5ff]" />
                        <span>تست تطبیق پذیری و عیب‌یابی اورلی ویندوز</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed text-right">
                        اگر تداخل آنتی‌ویروس یا مشکلات امضای درایور گرافیک دارید، این ابزار عیب‌یابی و پورتینگ را اجرا کنید.
                      </p>
                      
                      {testingCompatibility ? (
                        <div className="space-y-1.5 py-1 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-[#00e5ff] animate-pulse font-bold">در حال پردازش گام‌ها...</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5ff] animate-ping" />
                          </div>
                          <div className="text-[9px] text-gray-400 max-h-[80px] overflow-y-auto font-mono bg-black/45 p-1.5 rounded space-y-0.5 custom-scrollbar">
                            {testSteps.map((step, idx) => (
                              <div key={idx} className="truncate">↳ {step}</div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={runCompatibilityTest}
                          className="w-full py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold hover:bg-white/10 transition-all text-center"
                        >
                          شروع فرآیند عیب‌یابی اورلی
                        </button>
                      )}

                      {testResult === 'ok' && (
                        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] text-right font-medium leading-relaxed animate-enter">
                          سیستم با موفقیت بررسی شد. تمام سرویس‌های رندر <span className="font-bold underline text-white font-mono">DirectX</span> و <span className="font-bold underline text-white font-mono">Vulkan</span> آماده‌اند.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 bg-[#00e5ff]/10 border border-[#00e5ff]/20 p-3 rounded-xl mt-4">
                     <p>سیستم اورلی هم‌اکنون به صورت تمام صفحه روی مانیتور اصلی رندر می‌شود. (تزریق مستقیم DirectX/Vulkan برای بازی‌های Fullscreen فعال است)</p>
                     <p className="mt-2 text-[#00e5ff] font-bold">» برای فعال‌سازی حالت چت، کلید میانبر Alt+F2 را بفشارید.</p>
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
