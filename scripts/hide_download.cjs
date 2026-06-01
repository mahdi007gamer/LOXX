const fs = require('fs');
let txt = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

txt = txt.replace(/<NavLink\s*to="\/download"[\s\S]*?<\/NavLink>/, match => '{!(isElectron) && (\n' + match + '\n)}');

fs.writeFileSync('src/components/layout/Navbar.tsx', txt);
