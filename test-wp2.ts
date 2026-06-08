import axios from "axios";

async function testWp(query) {
    const sites = [
        "https://mokhtalefmusic.com",
        "https://music-fa.com",
        "https://pop-music.ir",
        "https://golsarmusic.ir",
        "https://navazesh.com",
        "https://rozmusic.com",
        "https://upmusics.com"
    ];
    
    for (const site of sites) {
        try {
            const url = `${site}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link&per_page=3`;
            const res = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 3000
            });
            console.log(`${site} returned ${res.data.length} results.`);
            if (res.data.length > 0) {
               console.log(res.data[0].link);
            }
        } catch(e) {
            console.log(`${site} error:`, e.message);
        }
    }
}
testWp("گل سرخ");
testWp("Mehrad Hidden Maar");
