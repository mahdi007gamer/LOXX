import axios from "axios";

async function testPmc() {
    const query = "Mehrad Hidden Maar";
    const searchUrl = `https://pmcmusic.tv/?s=${encodeURIComponent(query)}`;
    try {
        const searchRes = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const searchHtml = searchRes.data || "";
        const postUrls = [];
        const matches = searchHtml.matchAll(/href="(https:\/\/pmcmusic\.tv\/[^"']+)"/gi);
        for (const m of matches) {
            const url = m[1];
            if (url.endsWith("/") && !url.includes("/category/") && !url.includes("/page/") && url !== "https://pmcmusic.tv/download-song/") {
                if (!postUrls.includes(url)) postUrls.push(url);
            }
        }
        console.log("pmc URLs:", postUrls);
    } catch(e) {
        console.log("pmc Error:", e.message);
    }
}
testPmc();
