import fs from 'fs';

let code = fs.readFileSync('src/pages/DesktopOverlayWidget.tsx', 'utf8');

// Use the absolute highest possible z-index in web
code = code.replace(/z-\[9999\]/g, 'z-[2147483647]');
code = code.replace(/zIndex: 8000/g, 'zIndex: 2147483645');

fs.writeFileSync('src/pages/DesktopOverlayWidget.tsx', code);
console.log("Updated DesktopOverlayWidget z-indices to maximum");
