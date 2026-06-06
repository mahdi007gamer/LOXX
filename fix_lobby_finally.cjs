const fs = require('fs');
let content = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

content = content.replace(/className={`\$\{musicBotState\?.botType === `}melody" \? "hover:bg-\[#FFD700\]\/20 text-\[#FFD700\]" : "hover:bg-\[#00e5ff\]\/20 text-\[#00e5ff\]"} p-1.5 transition-all outline-none"/g,
  'className={cn(musicBotState?.botType === "melody" ? "hover:bg-[#FFD700]/20 text-[#FFD700]" : "hover:bg-[#00e5ff]/20 text-[#00e5ff]", "p-1.5 transition-all outline-none rounded-full")}');

content = content.replace(/className="\$\{musicBotState\?.botType === "melody" \? "hover:bg-\[#FFD700\]\/20 text-\[#FFD700\]" : "hover:bg-\[#00e5ff\]\/20 text-\[#00e5ff\]"} p-1.5 transition-all outline-none"/g,
  'className={cn(musicBotState?.botType === "melody" ? "hover:bg-[#FFD700]/20 text-[#FFD700]" : "hover:bg-[#00e5ff]/20 text-[#00e5ff]", "p-1.5 transition-all outline-none rounded-full")}');

content = content.replace(/<span className="\$\{musicBotState\?.botType === "melody" \? "text-\[#FFD700\] drop-shadow-\[0_0_5px_rgba\(255,215,0,0.6\)\]" : "text-\[#00e5ff\] drop-shadow-\[0_0_5px_rgba\(0,229,255,0.6\)\]"} font-mono leading-none select-none uppercase tracking-widest mt-1.5 font-bold">/g,
  '<span className={cn(musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.6)]" : "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.6)]", "font-mono leading-none select-none uppercase tracking-widest mt-1.5 font-bold")}>');

content = content.replace(/<div className="\$\{musicBotState\?.botType === "melody" \? "text-\[#FFD700\] drop-shadow-\[0_0_12px_rgba\(255,215,0,0.8\)\]" : "text-\[#00e5ff\] drop-shadow-\[0_0_12px_rgba\(0,229,255,0.8\)\]"} ml-2 shrink-0 filter">/g,
  '<div className={cn(musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" : "text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]", "ml-2 shrink-0 filter")}>');

content = content.replace(/<div className="text-\[\#00e5ff\] ml-2 shrink-0 drop-shadow-\[0_0_12px_rgba\(0,229,255,0.8\)\] filter">/g,
  '<div className={cn(musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" : "text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]", "ml-2 shrink-0 filter")}>');

content = content.replace(/className="\$\{musicBotState\?.botType === "melody" \? "text-yellow-200 hover:text-\[#FFD700\] hover:bg-\[#FFD700\]\/10" : "text-\[#81cad6\] hover:text-\[#00e5ff\] hover:bg-\[#00e5ff\]\/10"} p-2 flex items-center justify-center rounded-full active:scale-90 transition-all"/g,
  'className={cn(musicBotState?.botType === "melody" ? "text-yellow-200 hover:text-[#FFD700] hover:bg-[#FFD700]/10" : "text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10", "p-2 flex items-center justify-center rounded-full active:scale-90 transition-all")}');

fs.writeFileSync('src/pages/LobbyRoomPage.tsx', content, 'utf8');
