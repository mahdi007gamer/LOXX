import fs from 'fs';
let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

code = code.replace(/<input\s+type="range"\s+min="0"\s+max="200"\s+value=\{player\.volume\}\s*\n*\s*onChange=\{\(e\) => onVolumeChange\(parseInt\(e\.target\.value\)\)\}\s*\n*\s*className="(w-full.*accent-neon-blue)"\s*\/>/g, function(match, className) {
  return `<input type="range" min="0" max="200" value={player.volume} onChange={(e) => onVolumeChange(parseInt(e.target.value))} onClick={(e) => e.stopPropagation()} className="${className}" />`;
});

// Also fix button clicks if needed.
// E.g. Mute Bot button:
code = code.replace(/onClick=\{\(\) => \{\n\s*const isCurrentlyMuted = botVolumeLevel === 0;\n\s*handlePlayerVolume/g, 'onClick={(e) => { e.stopPropagation(); const isCurrentlyMuted = botVolumeLevel === 0; handlePlayerVolume');


fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Fixed inputs click propagation");
