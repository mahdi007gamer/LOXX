const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'dist', 'assets', 'index-KWbw9lnY.js');
if (!fs.existsSync(jsPath)) {
  console.log('Production asset index-KWbw9lnY.js not found.');
  process.exit(1);
}

const code = fs.readFileSync(jsPath, 'utf8');
const searchString = 'اتصال مستقیم شما به سرور اصلی لوکس';
const idx = code.indexOf(searchString);

if (idx === -1) {
  console.log('Search string not found in asset bundle.');
  // Let's try another Persian word
  const altString = 'سیستم پل ارتباطی لوکس';
  const idx2 = code.indexOf(altString);
  if (idx2 === -1) {
    console.log('Alternate string also not found.');
  } else {
    console.log('Found alternate string at index:', idx2);
    const excerpt = code.slice(Math.max(0, idx2 - 50000), idx2 + 150000);
    fs.writeFileSync('extracted_lobby_js.js', excerpt, 'utf8');
    console.log('Wrote 200KB excerpt to extracted_lobby_js.js successfully!');
  }
} else {
  console.log('Found search string at index:', idx);
  const excerpt = code.slice(Math.max(0, idx - 50000), idx + 150000);
  fs.writeFileSync('extracted_lobby_js.js', excerpt, 'utf8');
  console.log('Wrote 200KB excerpt to extracted_lobby_js.js successfully!');
}
