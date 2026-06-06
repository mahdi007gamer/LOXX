const fs = require('fs');

const path = 'src/pages/LobbyRoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic ones look like: className="${...}"
// We need to change that to: className={\`\${...}\`}
// OR: cn(\`\${...}\`)
content = content.replace(/className="\$\{([^"]*)"/g, (match, p1) => `className={\`\${${p1}\`}`);
// Actually, some have extra space/classes afterwards: className="${...} p-1.5 transition-all outline-none"
content = content.replace(/className="\$\{([^\}]*)\}([^"]*)"/g, (match, p1, p2) => `className={\`\$\{${p1}\}${p2}\`}`);

// Equalizer
// className={cn("w-1 rounded-sm", musicBotState?.isPlaying ? bg-gradient-to-t " + (musicBotState?.botType === "melody" ? "from-[#FFC107] to-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.8)]" : "from-[#00bfff] to-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]") + " animate-pulse" : (musicBotState?.botType === "melody" ? "bg-[#FFD700]/20" : "bg-[#00e5ff]/20")} 
// I generated: `bg-gradient-to-t " + (musicBotState?.botType === "melody" ... + "
content = content.replace(/bg-gradient-to-t " \+ \(musicBotState/g, `"bg-gradient-to-t " + (musicBotState`);
content = content.replace(/\) \+ " animate-pulse" : /g, `) + " animate-pulse" : `);

// For Main play button, since it was already evaluating without a template string:
// isHost ? (musicBotState...) => this is inside {}, so it's fine.

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax!');
