import axios from "axios";

const query = "Billie Eilish";
const sites = [
  { name: "PopMusic (پاپ موزیک)", domain: "https://pop-music.ir" },
  { name: "MusicFa (موزیک فا)", domain: "https://music-fa.com" },
  { name: "GolsarMusic (گلسار موزیک)", domain: "https://golsarmusic.ir" },
  { name: "MokhtalefMusic (مختلف موزیک)", domain: "https://mokhtalefmusic.com" },
  { name: "RozMusic (رز موزیک)", domain: "https://rozmusic.com" }
];

async function main() {
  for (const site of sites) {
    try {
      const wpUrl = `${site.domain}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link&per_page=5`;
      const res = await axios.get(wpUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        timeout: 5000,
        proxy: false
      });
      console.log(`[${site.name}] results:`, res.data.map((p: any) => p.title.rendered));
    } catch (e: any) {
      console.log(`[${site.name}] Error: ${e.message}`);
    }
  }
}

main();
