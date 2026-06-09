import fs from 'fs';

let code = fs.readFileSync('src/components/ui/FriendChatOverlay.tsx', 'utf8');

code = code.replace(/zIndex: 8000/g, 'zIndex: 2147483645');
code = code.replace(/z-\[999999999\]/g, 'z-[2147483647]');

fs.writeFileSync('src/components/ui/FriendChatOverlay.tsx', code);
console.log("Updated FriendChatOverlay z-indices to maximum");
