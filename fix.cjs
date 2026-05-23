const fs = require('fs');
const path = require('path');
function walkDir(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === 'dist' || file === '.git' || file === '.next') return;
        let fullPath = path.join(dir, file);
        let stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(fullPath));
        } else { 
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walkDir('src');
for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/ \|\| \`https:\/\/api\.dicebear\.com\/7\.x\/[^\`]+\`/g, ' || ""')
                          .replace(/ \|\| \"https:\/\/api\.dicebear\.com[^\"]+\"/g, ' || ""');
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
}
