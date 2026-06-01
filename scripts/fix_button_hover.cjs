const fs = require('fs');
const filePath = 'src/components/ui/GlowButton.tsx';
let txt = fs.readFileSync(filePath, 'utf8');
txt = txt.replace('whileHover={{ scale: 1.02, y: -1 }}', 'whileHover={{ scale: 1.02 }}');
fs.writeFileSync(filePath, txt);
