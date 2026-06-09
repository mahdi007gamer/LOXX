import fs from 'fs';

let code = fs.readFileSync('src/components/ui/FriendChatOverlay.tsx', 'utf8');
code = code.replace(/z-\[9999\]/g, 'z-[2147483647]');

fs.writeFileSync('src/components/ui/FriendChatOverlay.tsx', code);
console.log("Updated FriendChatOverlay z-[9999] to maximum");
