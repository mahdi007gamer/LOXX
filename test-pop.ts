import axios from "axios";
async function testPop() {
    try {
        const query = "Mehrad Hidden Maar";
        const searchUrl = `https://pop-music.ir/?s=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 4000
        });
        const searchHtml = searchRes.data || "";
        const postUrls = [];
        const matches = searchHtml.matchAll(/href="(https:\/\/pop-music\.ir\/[^"']+)"/gi);
        for (const m of matches) {
            postUrls.push(m[1]);
        }
        console.log("pop URLs:", postUrls);
    } catch(e) {
        console.log("Error", e.message);
    }
}
testPop();
