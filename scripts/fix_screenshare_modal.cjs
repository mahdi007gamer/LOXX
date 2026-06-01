const fs = require('fs');
let txt = fs.readFileSync('src/components/ScreenShareModal.tsx', 'utf8');

// Reduce vertical spacing and padding
txt = txt.replace('space-y-5 text-gray-200', 'space-y-3 text-gray-200');
txt = txt.replace('p-4 relative overflow-hidden', 'p-3 relative overflow-hidden'); // for banner
txt = txt.replace('p-4 rounded-xl border', 'p-3 rounded-xl border'); // for quality cards
txt = txt.replace('space-y-2', 'space-y-1'); 
txt = txt.replace('p-6 bg-[#16181c] border-t', 'p-4 bg-[#16181c] border-t'); // bottom bar

fs.writeFileSync('src/components/ScreenShareModal.tsx', txt);
