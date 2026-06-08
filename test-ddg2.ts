import axios from "axios";

async function test() {
    const query = "Mehrad Hidden Maar";
    const searchQuery = `${query} site:pop-music.ir OR site:nex1music.ir OR site:music-fa.com OR site:upmusics.com`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      },
      timeout: 4500
    });
    const html = response.data || "";
    const urls: string[] = [];
    const matchAll = html.matchAll(/uddg=([^&"]+)/g);
    for (const m of matchAll) {
      urls.push(decodeURIComponent(m[1]));
    }
    console.log("DDG Local:", urls);
}

test();
