import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

const anchor = `  isMediasoupSFU\n } = useLobby();`;
const replacement = `  isMediasoupSFU,\n  updateLauncherSettings\n } = useLobby();`;

code = code.replace(anchor, replacement);
fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Extracted updateLauncherSettings");
