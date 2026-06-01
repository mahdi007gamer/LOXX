const fs = require('fs');
const filePath = 'src/components/layout/Navbar.tsx';
let txt = fs.readFileSync(filePath, 'utf8');
txt = txt.replace('const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;\n  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;', 'const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;');
fs.writeFileSync(filePath, txt);
