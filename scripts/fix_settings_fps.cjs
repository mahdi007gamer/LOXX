const fs = require('fs');
let txt = fs.readFileSync('src/pages/ElectronSettingsPage.tsx', 'utf8');

const hook = `  const [showClientFps, setShowClientFps] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loxx_show_fps") === "true";
    }
    return false;
  });

  const toggleFps = (val: boolean) => {
    setShowClientFps(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("loxx_show_fps", String(val));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "loxx_show_fps",
        newValue: String(val)
      }));
    }
  };`;

txt = txt.replace('const [checkingAudio, setCheckingAudio] = useState(false);', 'const [checkingAudio, setCheckingAudio] = useState(false);\n' + hook);

// Now change the first column in the `GPU & CPU` section.
const oldColumn = `<div className="space-y-4">
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl">
                    <span className="text-sm font-bold text-white flex items-center gap-2">اجرای خودکار کلاینت با لود شدن ویندوز (Autostart)</span>`;

const newColumn = `<div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl col-span-1 md:col-span-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">نمایش FPS کلاینت لوکس</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showClientFps} onChange={(e) => toggleFps(e.target.checked)} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl md:col-span-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">اجرای خودکار کلاینت با لود شدن ویندوز (Autostart)</span>`;

txt = txt.replace(oldColumn, newColumn);

fs.writeFileSync('src/pages/ElectronSettingsPage.tsx', txt);
