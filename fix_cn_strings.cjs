const fs = require('fs');
let content = fs.readFileSync('src/pages/LobbyRoomPage.tsx', 'utf8');

content = content.replace(/\$\{musicBotState\?.botType === "melody" \? "([^"]*)" : "([^"]*)"\}/g, (match, m, d) => {
    return `" + (musicBotState?.botType === "melody" ? "${m}" : "${d}") + "`;
});

// For instances where it resulted in "" +... or ...+ ""
content = content.replace(/"" \+/g, '" +');
content = content.replace(/\+ ""/g, '+ "');


fs.writeFileSync('src/pages/LobbyRoomPage.tsx', content, 'utf8');
