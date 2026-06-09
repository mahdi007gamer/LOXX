import fs from 'fs';

let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

const modalRegex = /<div className="flex justify-between items-center text-sm">\s*<span className="text-gray-300">دور زدن پروکسی و پینگ کاتورها<\/span>\s*<button[\s\S]*?<\/button>\s*<\/div>\s*<div className="h-\[1px\] w-full bg-white\/5" \/>\s*<div className="flex justify-between items-center text-sm">\s*<span className="text-gray-300">سرویس DNS شکن DoH<\/span>\s*<button[\s\S]*?<\/button>\s*<\/div>/;

const newButtons = `<div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">دور زدن پروکسی و پینگ کاتورها</span>
          <button 
            onClick={() => {
              updateLauncherSettings({ bypassSystemProxy: !bypassSystemProxy });
              toast.success(bypassSystemProxy ? "حالت دور زدن پروکسی غیرفعال شد!" : "حالت دور زدن پروکسی فعال شد!");
            }}
            className={cn("px-3 py-1 font-bold rounded transition border", bypassSystemProxy ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30")}>
            {bypassSystemProxy ? 'تغییر به غیرفعال' : 'فعال‌سازی سریع'}
          </button>
        </div>
        <div className="h-[1px] w-full bg-white/5" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">سرویس DNS شکن DoH</span>
          <button 
            onClick={() => {
              const newVal = appDnsProvider === "shecan" ? "system" : "shecan";
              updateLauncherSettings({ appDnsProvider: newVal });
              toast.success(newVal === "shecan" ? "سرویس DNS روی شکن تنظیم شد!" : "سرویس DNS به حالت سیستم بازگشت!");
            }}
            className={cn("px-3 py-1 font-bold rounded transition border", appDnsProvider === "shecan" ? "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/60 shadow-[0_0_10px_rgba(0,229,255,0.3)] hover:bg-[#00e5ff]/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30")}>
            {appDnsProvider === "shecan" ? 'بازنشانی دی‌ان‌اس' : 'اعمال سرویس شکن'}
          </button>
        </div>`;

code = code.replace(modalRegex, newButtons);
fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Updated high ping modal to be interactive");
