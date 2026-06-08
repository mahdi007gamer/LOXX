const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

content = content.replace('{ id: "support" as const, icon: MessageSquare, label: isRtlStyle ? "تماس با مدیریت" : "Support Ticket" },', '{ id: "support" as const, icon: MessageSquare, label: isRtlStyle ? "سوالات متداول" : "FAQ" },');
content = content.replace('{ id: "rules" as const, icon: BookOpen, label: isRtlStyle ? "قوانین و مقررات" : "Platform Terms" },\n', '');
content = content.replace('{activeTab === "rules" && renderRules()}\n', '');

// Remove Ticket Box from renderSupport
const ticketBoxRegex = /\{\/\* Ticket Box \*\/\}[^]+?(?=<\/div>\s+\);\s+const renderRules)/;
content = content.replace(ticketBoxRegex, '');

// Remove renderRules completely
const renderRulesRegex = /const renderRules = \(\) => \{\s+if \(!isRtl\) \{[^]+?(?=return \(\s*<div className="flex h-screen bg-black overflow-hidden"\s*>)/;
content = content.replace(renderRulesRegex, '');

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
console.log("SettingsPage tabs updated!");
