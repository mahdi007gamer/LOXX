const fs = require('fs');
let txt = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

const lines = txt.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('discordRequired: !p.discordRequired')) {
    skip = true;
  }
  if (skip) {
    if (lines[i].includes('</button>')) {
      skip = false;
      continue;
    }
    continue;
  }
  newLines.push(lines[i]);
}

txt = newLines.join('\n');
fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', txt);
