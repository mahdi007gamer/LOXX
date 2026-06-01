const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove all italic
      content = content.replace(/\bitalic\b/g, '');
      
      // Remove all tracking-* classes
      content = content.replace(/\btracking-(tighter|tight|normal|wide|wider|widest)\b/g, '');
      
      // Clean up multiple spaces that might have been left
      content = content.replace(/  +/g, ' ');
      
      // Fix potential issues like className=" "
      content = content.replace(/className=" "/g, 'className=""');
      content = content.replace(/className=' '/g, "className=''");
      content = content.replace(/className=` /g, "className={`");
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, '../src'));
console.log('Fixed italic and tracking classes.');
