const fs = require('fs');

const path = 'src/pages/LobbyRoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /className=\{cn\(\s*"([^"]*)border-\[\#00e5ff\]([^"]*)",/g,
  (match, p1, p2) => `className={cn(\n       "${p1}" + (musicBotState?.botType === "melody" ? "border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.45)] hover:shadow-[0_0_35px_rgba(255,215,0,0.7)]" : "border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)]"),`
);

content = content.replace(
  /<div className="absolute inset-0 rounded-full bg-\[\#00e5ff\]\/5 animate-pulse" \/>/g,
  `<div className={cn("absolute inset-0 rounded-full animate-pulse", musicBotState?.botType === "melody" ? "bg-[#FFD700]/5" : "bg-[#00e5ff]/5")} />`
);

content = content.replace(
  /<span className="w-1\.5 h-3\.5 bg-\[\#00e5ff\] rounded animate-bounce" style=\{\{ animationDelay: "0ms" \}\} \/>/g,
  `<span className={cn("w-1.5 h-3.5 rounded animate-bounce", musicBotState?.botType === "melody" ? "bg-[#FFD700]" : "bg-[#00e5ff]")} style={{ animationDelay: "0ms" }} />`
);
content = content.replace(
  /<span className="w-1\.5 h-4\.5 bg-\[\#00e5ff\] rounded animate-bounce" style=\{\{ animationDelay: "150ms" \}\} \/>/g,
  `<span className={cn("w-1.5 h-4.5 rounded animate-bounce", musicBotState?.botType === "melody" ? "bg-[#FFD700]" : "bg-[#00e5ff]")} style={{ animationDelay: "150ms" }} />`
);
content = content.replace(
  /<span className="w-1\.5 h-2\.5 bg-\[\#00e5ff\] rounded animate-bounce" style=\{\{ animationDelay: "300ms" \}\} \/>/g,
  `<span className={cn("w-1.5 h-2.5 rounded animate-bounce", musicBotState?.botType === "melody" ? "bg-[#FFD700]" : "bg-[#00e5ff]")} style={{ animationDelay: "300ms" }} />`
);

// Expanded UI Header Color
content = content.replace(/text-\[\#00e5ff\] ml-2 shrink-0 drop-shadow-\[0_0_12px_rgba\(0,229,255,0\.8\)\]/g, 
  `\${musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" : "text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]"} ml-2 shrink-0`);


fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
