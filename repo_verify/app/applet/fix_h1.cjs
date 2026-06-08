const fs = require('fs');
let c = fs.readFileSync('src/components/landing/HeroSection.tsx', 'utf8');
const oldH1Regex = /<h1 className="[^"]+hidden">[\s\S]*?<\/h1>/;
const newH1 = `<h1 className="sr-only">LOXX | لوکس / لاکس | پلتفرم هوشمند LOXX اولین پلتفرم پیشرفته فارسی | پلتفرم گیمینگ فارسی | پیام‌رسان گیمینگ فارسی | پیام رسانه گیمر ها | شبکه اجتماعی گیمر ایرانی | پلتفرم آنلاین لوکس | سامانه LOXX | خدمات LOXX | ثبت‌نام LOXX | ورود به LOXX</h1>`;
c = c.replace(oldH1Regex, newH1);
fs.writeFileSync('src/components/landing/HeroSection.tsx', c);
