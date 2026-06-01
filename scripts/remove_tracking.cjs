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
      
      // Remove all tracking-[*] 
      let newContent = content.replace(/tracking-\[[^\]]+\]/g, '');
      
      if (content !== newContent) {
         // Clean up double spaces left behind
         newContent = newContent.replace(/  +/g, ' ');
         newContent = newContent.replace(/className=" /g, 'className="');
         newContent = newContent.replace(/className=' /g, "className='");
         newContent = newContent.replace(/className=\{` /g, "className={`");
         
         fs.writeFileSync(fullPath, newContent);
         console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, '../src'));
console.log('Done.');
