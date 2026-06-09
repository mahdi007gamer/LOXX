import fs from 'fs';

let code = fs.readFileSync('src/pages/DesktopOverlayWidget.tsx', 'utf8');

code = code.replace(/className=\{cn\(\n\s*"px-3 py-1 rounded-lg transition-all duration-150 border w-\[130px\]",/g, 'className={cn(\n "px-3 py-1 rounded-lg transition-all duration-150 border",');

code = code.replace(/<span className="font-sans truncate flex-1">/g, '<span className="font-sans text-xs truncate max-w-[120px]">');

fs.writeFileSync('src/pages/DesktopOverlayWidget.tsx', code);
console.log("Reverted overlay alignment");
