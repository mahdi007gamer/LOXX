const fs = require('fs');

const path = 'src/pages/LobbyRoomPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Expanded Player Top Header
content = content.replace(
  /hover:bg-\[\#00e5ff\]\/20 rounded-full text-\[\#00e5ff\]/g,
  `\${musicBotState?.botType === "melody" ? "hover:bg-[#FFD700]/20 text-[#FFD700]" : "hover:bg-[#00e5ff]/20 text-[#00e5ff]"}`
);

// Expanded Player LIVE AUDIO CHUNK text
content = content.replace(
  /text-\[\#00e5ff\] font-mono leading-none select-none uppercase tracking-widest mt-1\.5 font-bold drop-shadow-\[0_0_5px_rgba\(0,229,255,0\.6\)\]/g,
  `\${musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.6)]" : "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.6)]"} font-mono leading-none select-none uppercase tracking-widest mt-1.5 font-bold`
);

// Expanded Player Music icon
content = content.replace(
  /text-\[\#00e5ff\] ml-2 shrink-0 drop-shadow-\[0_0_12px_rgba\(0,229,255,0\.8\)\]/g,
  `\${musicBotState?.botType === "melody" ? "text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" : "text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]"} ml-2 shrink-0`
);

// Vinyl Glows
content = content.replace(
  /shadow-\[0_0_40px_rgba\(0,229,255,0\.2\)\]/g,
  `\${musicBotState?.botType === "melody" ? "shadow-[0_0_40px_rgba(255,215,0,0.2)]" : "shadow-[0_0_40px_rgba(0,229,255,0.2)]"}`
);
content = content.replace(
  /border-\[\#00e5ff\]\/30 shadow-\[inset_0_0_20px_rgba\(0,229,255,0\.2\)\]/g,
  `\${musicBotState?.botType === "melody" ? "border-[#FFD700]/30 shadow-[inset_0_0_20px_rgba(255,215,0,0.2)]" : "border-[#00e5ff]/30 shadow-[inset_0_0_20px_rgba(0,229,255,0.2)]"}`
);
content = content.replace(
  /shadow-\[0_0_10px_rgba\(0,229,255,0\.3\)\]/g,
  `\${musicBotState?.botType === "melody" ? "shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "shadow-[0_0_10px_rgba(0,229,255,0.3)]"}`
);
content = content.replace(
  /bg-\[\#00e5ff\] shadow-\[0_0_5px_\#00e5ff\]/g,
  `\${musicBotState?.botType === "melody" ? "bg-[#FFD700] shadow-[0_0_5px_#FFD700]" : "bg-[#00e5ff] shadow-[0_0_5px_#00e5ff]"}`
);

// Equalizer
content = content.replace(
  /bg-gradient-to-t from-\[\#00bfff\] to-\[\#00e5ff\] shadow-\[0_0_8px_rgba\(0,229,255,0\.8\)\] animate-pulse" : "bg-\[\#00e5ff\]\/20/g,
  `bg-gradient-to-t " + (musicBotState?.botType === "melody" ? "from-[#FFC107] to-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.8)]" : "from-[#00bfff] to-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]") + " animate-pulse" : (musicBotState?.botType === "melody" ? "bg-[#FFD700]/20" : "bg-[#00e5ff]/20")`
);

// Slider progress
content = content.replace(
  /accent-\[\#00e5ff\]/g,
  `\${musicBotState?.botType === "melody" ? "accent-[#FFD700]" : "accent-[#00e5ff]"}`
);
content = content.replace(
  /\[&::-webkit-slider-thumb\]:bg-\[\#00e5ff\]/g,
  `\${musicBotState?.botType === "melody" ? "[&::-webkit-slider-thumb]:bg-[#FFD700]" : "[&::-webkit-slider-thumb]:bg-[#00e5ff]"}`
);
content = content.replace(
  /\[&::-webkit-slider-thumb\]:shadow-\[0_0_12px_rgba\(0,229,255,0\.9\)\]/g,
  `\${musicBotState?.botType === "melody" ? "[&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,215,0,0.9)]" : "[&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,229,255,0.9)]"}`
);

// Controls (Play, pause prev next)
content = content.replace(
  /text-\[\#81cad6\] hover:text-\[\#00e5ff\] hover:bg-\[\#00e5ff\]\/10/g,
  `\${musicBotState?.botType === "melody" ? "text-yellow-200 hover:text-[#FFD700] hover:bg-[#FFD700]/10" : "text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10"}`
);

// Main play button
content = content.replace(
  /isHost \? "bg-gradient-to-br from-\[\#0c4a60\] to-\[\#042431\]\/80 border-\[1\.5px\] border-\[\#00e5ff\]\/50 text-\[\#00e5ff\] shadow-\[0_0_35px_rgba\(0,229,255,0\.45\),inset_0_0_20px_rgba\(0,229,255,0\.2\)\] hover:shadow-\[0_0_45px_rgba\(0,229,255,0\.6\)\] hover:brightness-110" : "bg-white\/5 border border-white\/10 text-white\/40 cursor-not-allowed"/g,
  `isHost ? (musicBotState?.botType === "melody" ? "bg-gradient-to-br from-[#604a0c] to-[#312404]/80 border-[1.5px] border-[#FFD700]/50 text-[#FFD700] shadow-[0_0_35px_rgba(255,215,0,0.45),inset_0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_45px_rgba(255,215,0,0.6)] hover:brightness-110" : "bg-gradient-to-br from-[#0c4a60] to-[#042431]/80 border-[1.5px] border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_35px_rgba(0,229,255,0.45),inset_0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] hover:brightness-110") : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"`
);

// Wait, the Melody bot has PUBLIC control ("همه می‌تونن پلیر رو کنترل کنن! 😎").
// We need to change `!isHost` checks to `(!isHost && musicBotState?.botType !== "melody")` for control buttons.
content = content.replace(
  /\(!isHost \|\| !musicBotState\?\.queue/g,
  `((!isHost && musicBotState?.botType !== "melody") || !musicBotState?.queue`
);
content = content.replace(
  /disabled=\{!isHost \|\| !musicBotState\?\.queue/g,
  `disabled={(!isHost && musicBotState?.botType !== "melody") || !musicBotState?.queue`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Colors and permissions updated!');
