const fs = require('fs');
let txt = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

const lines = txt.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  // Found start of automation settings block
  if (lines[i].includes('className="bg-[#16181c] border border-white/5 rounded-2xl p-5 mt-6"')) {
    skip = true;
  }
  
  if (skip) {
    if (lines[i].includes('</motion.div>')) {
      // Reached the end of the step3 block, stop skipping, BUT keep this line
      skip = false;
      newLines.push(lines[i]);
      continue;
    }
    continue;
  }
  
  newLines.push(lines[i]);
}

txt = newLines.join('\n');
fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', txt);
