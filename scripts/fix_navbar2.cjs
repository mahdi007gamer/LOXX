const fs = require('fs');
const filePath = 'src/components/layout/Navbar.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

const target = `<NavLink 
            to="/download"`;
if (txt.includes(target)) {
    txt = txt.replace(target, '{!isElectron && (\n          <NavLink \n            to="/download"');
    
    const endTarget = `{!(isLanding && isScrolled) && <span>{isRtl ? "دانلود" : "Download"}</span>}
          </NavLink>`;
    txt = txt.replace(endTarget, endTarget + '\n          )}');
}

fs.writeFileSync(filePath, txt);
