import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

code = code.replace(/if \(\!isHost\) return;/g, '');

fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Removed isHost strict checks for bots");
