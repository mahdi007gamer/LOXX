import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

const modalCode = `
{showHighPingModal && (
  <Modal title={isRtl ? "پینگ بالا تشخیص داده شد" : "High Ping Detected"} onClose={() => setShowHighPingModal(false)} maxWidth="max-w-md">
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-4" dir="rtl">
      <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500">
        <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-white">بهینه‌سازی پینگ پیشنهاد می‌شود</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          پینگ شما در حال حاضر روی <b>{peerPings[user?.id || ""] || 0}ms</b> قرار دارد که ممکن است باعث تاخیر شود. برای بهبود سرعت و کاهش تحریم‌های گیمینگ، پیشنهاد می‌کنیم دو گزینه هوشمند زیر را فعال کنید.
        </p>
      </div>

      <div className="w-full bg-[#0a0a0f] p-4 rounded-xl border border-white/5 space-y-3 mt-2 text-right">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">دور زدن پروکسی و پینگ کاتورها</span>
          <button 
            onClick={() => {
              updateLauncherSettings({ bypassSystemProxy: true });
              toast.success("حالت دور زدن پروکسی فعال شد!");
            }}
            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded hover:bg-emerald-500/30 transition border border-emerald-500/30">
            فعال‌سازی سریع
          </button>
        </div>
        <div className="h-[1px] w-full bg-white/5" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">سرویس DNS شکن DoH</span>
          <button 
            onClick={() => {
              updateLauncherSettings({ appDnsProvider: "shecan" });
              toast.success("سرویس DNS روی شکن تنظیم شد!");
            }}
            className="px-3 py-1 bg-[#00e5ff]/20 text-[#00e5ff] font-bold rounded hover:bg-[#00e5ff]/30 transition border border-[#00e5ff]/30">
            اعمال سرویس
          </button>
        </div>
      </div>

      <GlowButton onClick={() => setShowHighPingModal(false)} className="w-full py-3.5 mt-4">
        <span className="text-white font-bold">{isRtl ? "باشه فهمیدم" : "Got it"}</span>
      </GlowButton>
    </div>
  </Modal>
)}
`;

code = code.replace('{showFallbackModal && (', modalCode + '\n{showFallbackModal && (');
fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Fixed Ping Modal");
