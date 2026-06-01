const fs = require('fs');
const filePath = 'src/components/layout/Navbar.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

// Add isElectron
txt = txt.replace('const { openProfile } = useProfilePopover();', 'const { openProfile } = useProfilePopover();\n  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;');

// Change logo link to /dashboard
txt = txt.replace('<Link to="/" className="flex items-center gap-2 group flex-shrink-0">', '<Link to="/dashboard" className="flex items-center gap-2 group flex-shrink-0">');

// Hide Download NavLink if isElectron
txt = txt.replace('<NavLink \n            to="/download"', '{!isElectron && (\n          <NavLink \n            to="/download"');
txt = txt.replace('{!(isLanding && isScrolled) && <span>{isRtl ? "دانلود" : "Download"}</span>}\n          </NavLink>', '{!(isLanding && isScrolled) && <span>{isRtl ? "دانلود" : "Download"}</span>}\n          </NavLink>\n          )}');

fs.writeFileSync(filePath, txt);
