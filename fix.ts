import fs from 'fs';
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const regex = /<\/div>enter gap-4 z-10 w-full sm:w-auto">[\s\S]*?<div className="min-w-0 pr-2">/m;

if (regex.test(code)) {
    code = code.replace(regex, '</div>\n <div className="min-w-0 pr-2">');
    fs.writeFileSync('src/pages/DashboardPage.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Not matched!");
}
