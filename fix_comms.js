import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

code = code.replace(/document\.documentElement\.clientHeight - 48/g, 'document.documentElement.clientHeight - 100');
code = code.replace(/absolute bottom-6 right-6 z-40 bg-black\/80/g, 'absolute bottom-6 right-6 z-[100] bg-black/80');

fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Fixed Comms size and layer");
