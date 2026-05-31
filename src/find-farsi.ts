import fs from 'fs';
const lines = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (/[\u0600-\u06FF]/.test(l) && !l.includes('isRtl')) {
    console.log(i + 1, l.trim());
  }
});
