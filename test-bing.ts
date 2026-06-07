import axios from "axios";

async function testBing() {
    try {
        const query = "دانلود آهنگ mehrad hidden maar";
        const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });
        const html = res.data;
        const urls = [];
        const matches = html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"/gi);
        for(const m of matches){
            if(!m[1].includes("bing.com") && !m[1].includes("microsoft.com")) {
                urls.push(m[1]);
            }
        }
        console.log("Bing links:", urls.slice(0, 10));
    } catch(e) {
        console.log("Bing Error:", e.message);
    }
}
testBing();
