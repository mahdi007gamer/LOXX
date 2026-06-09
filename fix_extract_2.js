import fs from 'fs';

let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

code = code.replace(/isMediasoupSFU\n \} \= useLobby\(\);/, 'isMediasoupSFU,\n  bypassSystemProxy,\n  appDnsProvider\n} = useLobby();');

fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Extracted bypassSystemProxy and appDnsProvider");
