const fs = require('fs');
let content = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

// For classNames that got messed up with literal `${...}` instead of being inside {}
// Example: className="w-full ${musicBotState...} bg-black/40 h-1.5 rounded-lg..."

content = content.replace(/className="([^"]*)\$\{musicBotState\?.botType === "melody" \? "([!#-~ ]*)" : "([!#-~ ]*)"\}([^"]*)"/g, (match, before, melodyClass, defaultClass, after) => {
  return `className={cn("${before}", musicBotState?.botType === "melody" ? "${melodyClass}" : "${defaultClass}", "${after}")}`;
});

content = content.replace(/className={cn\("([^"]*)", musicBotState\?.botType === "melody" \? "([^"]*)" : "([^"]*)", "([^"]*)"\)}/g, (match, b, m, d, a) => {
    // clean up empty strings
    const parts = [];
    if(b.trim()) parts.push(`"${b.trim()}"`);
    parts.push(`musicBotState?.botType === "melody" ? "${m}" : "${d}"`);
    if(a.trim()) parts.push(`"${a.trim()}"`);
    return `className={cn(${parts.join(', ')})}`;
});


fs.writeFileSync('src/pages/LobbyRoomPage.tsx', content, 'utf8');

