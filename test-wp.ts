import axios from "axios";

async function testWp() {
    try {
        const query = "Mehrad Hidden Maar";
        const url = `https://mokhtalefmusic.com/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link`;
        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        console.log("mokhtalefmusic WP:", res.data);
    } catch(e) {
        console.log("mokhtalefmusic error", e.message);
    }
    
    try {
        const query = "Mehrad Hidden Maar";
        const url = `https://pop-music.ir/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=title,link`;
        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        console.log("pop-music WP:", res.data);
    } catch(e) {
        console.log("pop-music error", e.message);
    }

    try {
        const query = "Mehrad Hidden Maar";
        const url = `https://music-fa.com/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=title,link`;
        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        console.log("music-fa WP:", res.data);
    } catch(e) {
        console.log("music-fa error", e.message);
    }
}
testWp();
