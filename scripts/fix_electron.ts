import fs from 'fs';
let content = fs.readFileSync('src/pages/ElectronSettingsPage.tsx', 'utf8');

const targetStr = '<div className="bg-black/20 border border-white/5 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-4">';
const replaceStr = '<div className="bg-black/20 border border-white/5 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-4 lg:col-span-2">';

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/pages/ElectronSettingsPage.tsx', content);
console.log('Fixed electron spacing!');
