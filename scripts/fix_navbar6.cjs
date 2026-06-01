const fs = require('fs');
let txt = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
txt = txt.replace('const { openProfile } = useProfilePopover();\n  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;', 'const { openProfile } = useProfilePopover();');
fs.writeFileSync('src/components/layout/Navbar.tsx', txt);
