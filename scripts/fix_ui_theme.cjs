import fs from 'fs';
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const regexUI = /<div className="grid grid-cols-2 gap-4">[\s\S]*?\{.*?\['dark', 'high-contrast'\].map[^\}]+?\}[\s\S]*?<\/div>/;

const newUI = `<div className="grid grid-cols-1 gap-4">
 {['dark'].map((t) => (
 <button 
 key={t}
 onClick={() => updateSetting("theme", t)}
 className={cn(
 "py-3 rounded-xl border font-black text-[11px] uppercase transition-all",
 settings.theme === t ? "bg-neon-blue/10 border-neon-blue text-neon-blue" : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
 )}
 >
 {t === 'dark' ? (isRtl ? 'حالت تاریک' : 'Dark Mode') : ''}
 </button>
 ))}
 </div>`;

content = content.replace(regexUI, newUI);
fs.writeFileSync('src/pages/SettingsPage.tsx', content);
