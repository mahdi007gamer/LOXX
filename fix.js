const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const regex = /<\/div>enter gap-4 z-10 w-full sm:w-auto">[\s\S]*?(<img src=\{item\.game\.iconUrl\} alt="icon" className="absolute bottom-1\.5 left-1\.5 w-6 h-6 rounded-md object-cover shadow-md border border-white\/20" \/>\s*?<\/div>)\n/m;

code = code.replace(regex, '</div>\n');

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
console.log("Fixed!");
