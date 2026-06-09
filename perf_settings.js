import fs from 'fs';
let code = fs.readFileSync('src/pages/ElectronSettingsPage.tsx', 'utf8');

code = code.replace(/config\.hardwareAcceleration \?/g, 'config.hardwareAcceleration !== false ?');
code = code.replace(/config\.throttleGameMode \?/g, 'config.throttleGameMode !== false ?');

fs.writeFileSync('src/pages/ElectronSettingsPage.tsx', code);
console.log("Fixed!");
