import axios from "axios";

const query = "Bad Guy Billie Eilish";
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
      const wpUrl = `${site.domain}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link&per_page=3`;
      console.log(`Querying WP API for ${site.name}: ${wpUrl}`);
      const res = await axios.get(wpUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        timeout: 5000,
        proxy: false
      });
      console.log(`[${site.name}] WP API response:`, res.data);
    } catch (e: any) {
      console.log(`[${site.name}] WP API Error: ${e.message}`);
    }

    try {
      const searchUrl = `${site.domain}/?s=${encodeURIComponent(query)}`;
      console.log(`Querying HTML Search for ${site.name}: ${searchUrl}`);
      const res = await axios.get(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        timeout: 5000,
        proxy: false
      });
      const html = res.data || "";
      const domainEscaped = site.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`href=["'](${domainEscaped}/[^"'/]+/?(?:\\.html)?)["']`, "gi");
      const matches = html.matchAll(regex);
      const links = [];
      for (const m of matches) {
        const u = m[1];
        if (!u.includes("/wp-") && !u.includes("/category/") && !u.includes("/page/") && !u.includes("/tag/") && u !== site.domain && u !== site.domain + "/") {
          if (!links.includes(u)) {
            links.push(u);
          }
        }
      }
      console.log(`[${site.name}] HTML search links:`, links.slice(0, 3));
    } catch (e: any) {
      console.log(`[${site.name}] HTML Search Error: ${e.message}`);
    }
  }

  // Also query iTunes
  try {
    const searchUrl = `https://itunes.apple.com/search?media=music&term=${encodeURIComponent(query)}&limit=1`;
    console.log(`Querying iTunes: ${searchUrl}`);
    const res = await axios.get(searchUrl, { timeout: 4000, proxy: false });
    console.log(`iTunes response:`, res.data?.results?.[0]);
  } catch (e: any) {
    console.log(`iTunes Error: ${e.message}`);
  }
}

main();
