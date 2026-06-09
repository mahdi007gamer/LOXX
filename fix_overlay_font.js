import fs from 'fs';

let code = fs.readFileSync('src/pages/DesktopOverlayWidget.tsx', 'utf8');

code = code.replace(/<span className="font-sans text-xs truncate max-w-\[120px\]">/g, '<span className="font-sans truncate max-w-[120px]">');

fs.writeFileSync('src/pages/DesktopOverlayWidget.tsx', code);
console.log("Fixed overlay font size bug");
