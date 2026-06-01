const fs = require('fs');
let text = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
text = text.replace('{ label: isRtl ? "لابی‌های آماده" : "Ready Lobbies", val: suggestedLobbies.length, icon: Trophy, color: "pink" },\n', '');
fs.writeFileSync('src/pages/DashboardPage.tsx', text);
