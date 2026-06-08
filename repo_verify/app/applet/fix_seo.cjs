const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
const metaTags = `    <title>LOXX | لوکس / لاکس | پلتفرم هوشمند LOXX اولین پلتفرم پیشرفته فارسی</title>
    <meta name="description" content="LOXX (لوکس / لاکس) یک پلتفرم هوشمند و مدرن برای دسترسی سریع، مدیریت آسان و تجربه‌ای حرفه‌ای در فضای آنلاین است. وارد LOXX شوید، ثبت‌نام کنید و از خدمات پلتفرم استفاده کنید." />
    <meta name="keywords" content="LOXX, Loxx, لوکس, لاکس, پلتفرم LOXX, سامانه LOXX, پلتفرم آنلاین لوکس, خدمات LOXX, ثبت‌نام LOXX, ورود به LOXX, پلتفرم گیمینگ فارسی, پیام‌رسان گیمینگ فارسی, پیام رسانه گیمر ها, شبکه اجتماعی گیمر ایرانی" />
    <meta property="og:title" content="LOXX | لوکس / لاکس | پلتفرم هوشمند LOXX اولین پلتفرم پیشرفته فارسی" />
    <meta property="og:description" content="LOXX (لوکس / لاکس) یک پلتفرم هوشمند و مدرن برای دسترسی سریع، مدیریت آسان و تجربه‌ای حرفه‌ای در فضای آنلاین است. وارد LOXX شوید، ثبت‌نام کنید و از خدمات پلتفرم استفاده کنید." />
    <meta property="og:image" content="https://loxx.gg/adsbanner.png" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="LOXX | لوکس / لاکس" />
    <meta name="twitter:description" content="پلتفرم مدرن LOXX برای تجربه‌ای حرفه‌ای و سریع." />
    <meta name="twitter:image" content="https://loxx.gg/adsbanner.png" />
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "LOXX | لوکس / لاکس",
      "url": "https://loxx.gg/",
      "description": "پلتفرم هوشمند LOXX اولین پلتفرم پیشرفته فارسی."
    }
    </script>
`;
content = content.replace(/<title>.*?<\/title>/, metaTags);
fs.writeFileSync('index.html', content);
console.log('Fixed index.html!');
