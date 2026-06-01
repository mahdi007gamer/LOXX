const fs = require('fs');
let txt = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

const lines = txt.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  // auto-archive lobby after 1 hour is at line 538, input is at 539
  if (lines[i].includes('autoArchive: !p.autoArchive')) {
    // we want to remove the whole <label> wrapping it. Let's just remove 6 lines before it up to the label end
    newLines.splice(newLines.length - 4, 4); // remove previous lines belonging to this label
    skip = true;
  }
  if (skip) {
    if (lines[i].includes('</label>')) {
      skip = false;
      continue;
    }
    continue;
  }
  newLines.push(lines[i]);
}

txt = newLines.join('\n');
fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', txt);
