import axios from "axios";

async function testY() {
    try {
      const query = "mehrad hidden maar";
      const searchQuery = `دانلود آهنگ ${query}`;
      const url = `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        },
        timeout: 4500
      });
      const html = response.data || "";
      const urls: string[] = [];
      const matchAll = html.matchAll(/RU=([^/&]+)/g);
      for (const m of matchAll) {
         urls.push(decodeURIComponent(m[1]));
      }
      console.log(urls.slice(0, 5));
    } catch(e) {
      console.log("Yahoo err", e.message);
    }
}
testY();
