import fs from 'fs';

let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

const regex = /updateLauncherSettings\s*\n\s*\} \= useLobby\(\);/;
const match = code.match(regex);

if (match) {
  code = code.replace(match[0], 'updateLauncherSettings,\n  bypassSystemProxy,\n  appDnsProvider\n} = useLobby();');
  fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
  console.log("Extracted bypassSystemProxy and appDnsProvider");
} else {
  console.log("Could not find updateLauncherSettings in useLobby");
}
