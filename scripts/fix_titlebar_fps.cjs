const fs = require('fs');
let txt = fs.readFileSync('src/components/layout/ElectronTitlebar.tsx', 'utf8');

const hook = `  const [fps, setFps] = useState<number>(60);
  const [showFps, setShowFps] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loxx_show_fps") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "loxx_show_fps" && e.newValue !== null) {
        setShowFps(e.newValue === "true");
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);`;

txt = txt.replace('const [fps, setFps] = useState<number>(60);', hook);

const renderOld = `<span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1 flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
          <span>{fps} FPS</span>
        </span>`;

const renderNew = `{showFps && (<span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 px-1.5 py-0.5 rounded-md font-mono font-bold ml-1 flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
          <span>{fps} FPS</span>
        </span>)}`;

txt = txt.replace(renderOld, renderNew);

fs.writeFileSync('src/components/layout/ElectronTitlebar.tsx', txt);
