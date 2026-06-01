const fs = require('fs');

let txt = fs.readFileSync('src/components/modals/CreateLobbyModal.tsx', 'utf8');

// Change md:h-auto to md:min-h-[650px]
txt = txt.replace('md:h-auto md:max-h-[90vh]', 'md:min-h-[650px] md:max-h-[90vh]');

// Remove Discord Required button
// The button starts at <button type="button" onClick={() => setFormData(p => ({...p, discordRequired: !p.discordRequired}))} 
// and ends at </button>
const discordBtnRegex = /<button type="button"[^>]*discordRequired.*?<\/button>/s;
txt = txt.replace(discordBtnRegex, '');

// Also remove the discord required tag from view
const discordTagRegex = /\{formData\.discordRequired && \(\s*<div[^>]*>.*?<\/svg>\s*\{isRtl \? "دیسکورد" : "Discord"\}\s*<\/div>\s*\)\}/s;
txt = txt.replace(discordTagRegex, '');

// Remove Auto Archive checkbox
const autoArchiveRegex = /<label className={`flex items-center gap-2 cursor-pointer group[^{]*\{isRtl \? "flex-row" : "flex-row-reverse"\}`\}>\s*<span[^>]*>\s*\{isRtl \? "آرشیو خودکار[^}]*\}[^{]*\{formData\.autoArchive[^>]*>[\s\S]*?<\/label>/s;
txt = txt.replace(autoArchiveRegex, '');

// Change the grid columns in step 3 if needed
// <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// since we removed discord required, there are 3 items left (Private, Lan, Mic, Age) - wait, 4 items. So grid is fine.

fs.writeFileSync('src/components/modals/CreateLobbyModal.tsx', txt);
