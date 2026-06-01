const fs = require('fs');
const filePath = 'src/pages/DashboardPage.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

// Replace {visibleFriends.map((friend) => ( with {visibleFriends.map((friend, idx) => (
txt = txt.replace('{visibleFriends.map((friend) => (', '{visibleFriends.map((friend, idx) => { \n const isFaded = !isFriendsExpanded && idx === 2;\n return (');
txt = txt.replace('className="group relative flex items-center justify-between rounded-xl p-2 transition-all hover:bg-white/5"', 
'className={`group relative flex items-center justify-between rounded-xl p-2 transition-all ${isFaded ? "opacity-30 blur-[1px] pointer-events-none select-none" : "hover:bg-white/5"}`}');

// Replace closing brace of map
txt = txt.replace(/<\/motion\.div>\s*\)\)\}\s*<\/AnimatePresence>/m, '</motion.div>\n )})}\n </AnimatePresence>');

// Make the space-y-1 scrollable
txt = txt.replace('<div className="space-y-1">', '<div className={`space-y-1 ${isFriendsExpanded ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}>');

fs.writeFileSync(filePath, txt);
