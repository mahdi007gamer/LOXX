const fs = require('fs');
const filePath = 'src/pages/DashboardPage.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

txt = txt.replace('className="relative min-h-[160px] md:h-40 w-full rounded-[48px] overflow-hidden bg-[#0d0d12]', 'className="relative w-full rounded-[48px] overflow-hidden bg-[#0d0d12]');

txt = txt.replace('className="absolute inset-0 flex flex-col md:flex-row divide-y', 'className="relative z-10 flex flex-col md:flex-row divide-y');

fs.writeFileSync(filePath, txt);
