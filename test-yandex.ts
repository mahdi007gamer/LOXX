import axios from "axios";
import * as cheerio from "cheerio";

async function testYandex() {
    try {
        const query = "دانلود آهنگ mehrad hidden maar";
        const url = `https://yandex.com/search/?text=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });
        const html = res.data;
        const urls = [];
        const matches = html.matchAll(/href="(https:\/\/[^"&?]+)"/g);
        for(const m of matches){
            if(!m[1].includes("yandex.") && !m[1].includes("yandex.com")) {
                urls.push(m[1]);
            }
        }
        console.log("Yandex links:", urls.filter(u=>u.includes("music") || u.includes("ahang")).slice(0, 10));
    } catch(e) {
        console.log("Yandex Error:", e.message);
    }
}
testYandex();
