const fs = require('fs');
let txt = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
txt = txt.replace('const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;\n  const isInvitePage', 'const isInvitePage');
fs.writeFileSync('src/components/layout/Navbar.tsx', txt);
