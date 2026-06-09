import fs from 'fs';

let code = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

// Fix 1: Add draggable=false to the image inside the minimized player
code = code.replace(
  /<img src=\{musicBotState\.currentTrackCover\} className=\{cn\("w-full h-full object-cover rounded-full", musicBotState\?\.isPlaying && "animate-\[spin_6s_linear_infinite\]"\)\} \/>/g,
  '<img src={musicBotState.currentTrackCover} draggable={false} className={cn("w-full h-full object-cover rounded-full pointer-events-none", musicBotState?.isPlaying && "animate-[spin_6s_linear_infinite]")} />'
);

// Fix 2: Change onClick to onDoubleClick to make dragging much less buggy if we accidentally click
code = code.replace(
  /onClick=\{\(\) => setIsMusicPlayerExpanded\(true\)\}/,
  'onClick={() => setIsMusicPlayerExpanded(true)} onDoubleClick={() => setIsMusicPlayerExpanded(true)}'
);

code = code.replace(
  /Music Player \(Click to expand\)/,
  'Music Player (Double click or tap to expand)'
);


fs.writeFileSync('src/pages/LobbyRoomPage.tsx', code);
console.log("Fixed music player drag issue");
