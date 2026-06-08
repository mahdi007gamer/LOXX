import axios from "axios";

async function testGoog() {
    try {
        const query = "دانلود آهنگ Mehrad Hidden Maar";
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                "Accept-Language": "fa,en-US;q=0.9,en;q=0.8"
            }
        });
        const html = res.data;
        const urls = [];
        const matches = html.matchAll(/href="(https:\/\/[^"&?]+)"/g);
        for(const m of matches){
            if(!m[1].includes("google.com")) {
                urls.push(m[1]);
            }
        }
        console.log("Goog links:", urls.filter(u=>u.includes("music") || u.includes("ahang")).slice(0, 5));
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testGoog();
