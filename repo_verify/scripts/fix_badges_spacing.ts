import fs from 'fs';
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Increase spacing for profile section
content = content.replace(/<hr className="border-white\/5" \/>/g, '<hr className="border-white/5 my-8" />');

// Now inside renderBadges handling
// Badges:
content = content.replace(/className=\{cn\(\"w-12 h-12/g, 'className={cn("w-16 h-16 sm:w-20 sm:h-20');
content = content.replace(/!badge.isPinned && "grayscale opacity-50"/g, '!badge.isPinned && "opacity-80"');
content = content.replace(/!hasBadge && "grayscale opacity-50"/g, '!hasBadge && "opacity-80"');
// Title fixing
content = content.replace(/hasBadge \? "text-white" : "text-gray-600"/g, 'hasBadge ? "text-neon-pink" : "text-white"');
// Same for user badges pins:
content = content.replace(/badge.isPinned \? "text-white" : "text-gray-600"/g, 'badge.isPinned ? "text-neon-blue" : "text-white"');

// Fix "Add/Remove" overlay
content = content.replace(
    /"absolute inset-0 rounded-\[22px\] flex items-center justify-center bg-dark-bg\/80 opacity-0 group-hover:opacity-100 transition-opacity",\s+hasBadge \? "bg-red-500\/20" : "bg-neon-pink\/20"/g,
    '"absolute inset-0 rounded-[22px] flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent"'
);
content = content.replace(
    /"absolute inset-0 rounded-\[22px\] flex items-center justify-center bg-dark-bg\/80 opacity-0 group-hover:opacity-100 transition-opacity",\s+badge.isPinned \? "bg-red-500\/20" : "bg-neon-blue\/20"/g,
    '"absolute inset-0 rounded-[22px] flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent"'
);


fs.writeFileSync('src/pages/SettingsPage.tsx', content);
console.log('Fixed profile spacing and badges design!');
