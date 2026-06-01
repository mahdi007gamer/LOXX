const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// Replace min-h-[400px] h-full
content = content.replace('<div className="flex flex-col h-full min-h-[400px]">', '<div className="flex flex-col">');

// Replace flex-1 in NeonCard
content = content.replace('<NeonCard variant="purple" className="flex flex-col flex-1 p-2">', '<NeonCard variant="purple" className="flex flex-col p-2">');

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
