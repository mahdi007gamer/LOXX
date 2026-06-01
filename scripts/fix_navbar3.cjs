const fs = require('fs');
const filePath = 'src/components/layout/Navbar.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

txt = txt.replace('<Link to="/" className="flex items-center gap-4 group">', '<Link to="/dashboard" className="flex items-center gap-4 group">');
fs.writeFileSync(filePath, txt);
