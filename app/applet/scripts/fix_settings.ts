import fs from 'fs';

let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// 1. Rename tab
content = content.replace('{ id: "support" as const, icon: MessageSquare, label: isRtlStyle ? "تماس با مدیریت" : "Support Ticket" },', '{ id: "support" as const, icon: MessageSquare, label: isRtlStyle ? "سوالات متداول" : "FAQ" },');

// 2. Remove rules tab
content = content.replace('{ id: "rules" as const, icon: BookOpen, label: isRtlStyle ? "قوانین و مقررات" : "Platform Terms" },', '');

// 3. Remove rules component rendering
content = content.replace('{activeTab === "rules" && renderRules()}', '');

// 4. Remove Ticket Box
const ticketStart = content.indexOf('{/* Ticket Box */}');
const ticketEnd = content.indexOf('</div>\n  );\n\n  const renderRules');
if (ticketStart !== -1 && ticketEnd !== -1) {
    content = content.slice(0, ticketStart) + content.slice(ticketEnd);
}

// 5. Remove renderRules
const rulesStart = content.indexOf('const renderRules = () => {');
const rulesEnd = content.indexOf('return (\n    <div className="flex h-screen bg-black overflow-hidden"');
if (rulesStart !== -1 && rulesEnd !== -1) {
    content = content.slice(0, rulesStart) + content.slice(rulesEnd);
}

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
console.log('Fixed SettingsPage.tsx');
