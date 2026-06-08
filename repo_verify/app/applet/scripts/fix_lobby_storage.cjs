const fs = require('fs');
let txt = fs.readFileSync('src/context/LobbyContext.tsx', 'utf8');

const listener = `
  // Sync overlay settings across electron windows in real-time via storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "loxx_overlay_members_visible" && e.newValue !== null) {
        setOverlayMembersVisible(e.newValue === "true");
      } else if (e.key === "loxx_overlay_normal_opacity" && e.newValue !== null) {
        setOverlayNormalOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_speaking_opacity" && e.newValue !== null) {
        setOverlaySpeakingOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_position" && e.newValue !== null) {
        setOverlayPosition(e.newValue as any);
      } else if (e.key === "loxx_overlay_size" && e.newValue !== null) {
        setOverlaySize(e.newValue as any);
      } else if (e.key === "loxx_overlay_only_talking" && e.newValue !== null) {
        setOverlayOnlyTalking(e.newValue === "true");
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);
`;

txt = txt.replace('// Sync PTT status and speaking indicator to Electron', listener + '\n\n  // Sync PTT status and speaking indicator to Electron');

fs.writeFileSync('src/context/LobbyContext.tsx', txt);
