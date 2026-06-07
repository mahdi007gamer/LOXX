const fs = require('fs');

const targetFile = 'src/pages/LobbyRoomPage.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Play button onClick condition
code = code.replace(
  'if (!isHost) return;\r\n          if (musicBotState?.isPlaying) {',
  'if (!canControlMusic) return;\r\n          if (musicBotState?.isPlaying) {'
).replace(
  'if (!isHost) return;\n          if (musicBotState?.isPlaying) {',
  'if (!canControlMusic) return;\n          if (musicBotState?.isPlaying) {'
);

// 2. Play button className
code = code.replace(
  'isHost ? "bg-gradient-to-br from-[#0c4a60] to-[#042431]/80 border-[1.5px] border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_35px_rgba(0,229,255,0.45),inset_0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] hover:brightness-110" : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"',
  'canControlMusic ? (isMelodyBot ? "bg-gradient-to-br from-[#54410a] to-[#271d03]/90 border-[1.5px] border-[#FFD700]/50 text-[#FFD700] shadow-[0_0_35px_rgba(255,215,0,0.45),inset_0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_45px_rgba(255,215,0,0.6)] hover:brightness-110" : "bg-gradient-to-br from-[#0c4a60] to-[#042431]/80 border-[1.5px] border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_35px_rgba(0,229,255,0.45),inset_0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] hover:brightness-110") : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"'
);

// 3. Play svg custom class
code = code.replace(
  'className="drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"><path d="M7 19h4V5H7v14zm6-14v14h4V5h-4z"',
  'className={isMelodyBot ? "drop-shadow-[0_0_5px_rgba(255,215,0,0.85)]" : "drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"}><path d="M7 19h4V5H7v14zm6-14v14h4V5h-4z"'
).replace(
  'className="ml-1 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"><path d="M8 5v14l11-7z"',
  'className={cn("ml-1", isMelodyBot ? "drop-shadow-[0_0_5px_rgba(255,215,0,0.85)]" : "drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]")}><path d="M8 5v14l11-7z"'
);

// 4. Skip forward click trigger
code = code.replace(
  'if (isHost && musicBotState?.queue && musicBotState.queue.length > 0) {\r\n          const nextIdx',
  'if (canControlMusic && musicBotState?.queue && musicBotState.queue.length > 0) {\r\n          const nextIdx'
).replace(
  'if (isHost && musicBotState?.queue && musicBotState.queue.length > 0) {\n          const nextIdx',
  'if (canControlMusic && musicBotState?.queue && musicBotState.queue.length > 0) {\n          const nextIdx'
);

// 5. Skip Forward design details
code = code.replace(
  '"p-2 flex items-center justify-center rounded-full text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 active:scale-90 transition-all",\r\n         (!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1) && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]"',
  '"p-2 flex items-center justify-center rounded-full active:scale-90 transition-all",\r\n         isMelodyBot ? "text-[#e6c66d] hover:text-[#FFD700] hover:bg-[#FFD700]/10" : "text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10",\r\n         (!canControlMusic || !musicBotState?.queue || musicBotState.queue.length <= 1) && (isMelodyBot ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#e6c66d]" : "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]")'
).replace(
  '"p-2 flex items-center justify-center rounded-full text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 active:scale-90 transition-all",\n         (!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1) && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]"',
  '"p-2 flex items-center justify-center rounded-full active:scale-90 transition-all",\n         isMelodyBot ? "text-[#e6c66d] hover:text-[#FFD700] hover:bg-[#FFD700]/10" : "text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10",\n         (!canControlMusic || !musicBotState?.queue || musicBotState.queue.length <= 1) && (isMelodyBot ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#e6c66d]" : "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]")'
).replace(
  'disabled={!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1}\r\n       >\r\n        <SkipForward size={26} fill="currentColor" strokeWidth={1.5} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"',
  'disabled={!canControlMusic || !musicBotState?.queue || musicBotState.queue.length <= 1}\r\n       >\r\n        <SkipForward size={26} fill="currentColor" strokeWidth={1.5} className={isMelodyBot ? "drop-shadow-[0_0_5px_rgba(255,215,0,0.55)]" : "drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"}'
).replace(
  'disabled={!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1}\n       >\n        <SkipForward size={26} fill="currentColor" strokeWidth={1.5} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"',
  'disabled={!canControlMusic || !musicBotState?.queue || musicBotState.queue.length <= 1}\n       >\n        <SkipForward size={26} fill="currentColor" strokeWidth={1.5} className={isMelodyBot ? "drop-shadow-[0_0_5px_rgba(255,215,0,0.55)]" : "drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"}'
);

// 6. Support queue list item host selection overrides and styling
code = code.replace(
  'isHost && "cursor-pointer hover:bg-white/10",',
  'canControlMusic && "cursor-pointer hover:bg-white/10",'
).replace(
  'isPlayingTrack && "border border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] font-bold flex-row-reverse text-right shadow-[0_0_10px_rgba(0,229,255,0.1)]"',
  'isPlayingTrack && (isMelodyBot ? "border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] font-bold flex-row-reverse text-right shadow-[0_0_10px_rgba(255,215,0,0.15)]" : "border border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] font-bold flex-row-reverse text-right shadow-[0_0_10px_rgba(0,229,255,0.1)]")'
).replace(
  'isPlayingTrack ? "text-[#00e5ff]" : "text-white/80"',
  'isPlayingTrack ? (isMelodyBot ? "text-[#FFD700]" : "text-[#00e5ff]") : "text-white/80"'
).replace(
  'if (isHost) {\r\n                 controlMusicBot("update-queue"',
  'if (canControlMusic) {\r\n                 controlMusicBot("update-queue"'
).replace(
  'if (isHost) {\n                 controlMusicBot("update-queue"',
  'if (canControlMusic) {\n                 controlMusicBot("update-queue"'
);

// 7. Track Queue List dynamic title counter styling
code = code.replace(
  'className="text-[#00e5ff] font-bold text-[16px] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"',
  'className={cn("font-bold text-[16px]", isMelodyBot ? "text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" : "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]")}'
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully completed control fixes!');
