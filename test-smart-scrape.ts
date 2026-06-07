import axios from "axios";

async function scrapeSmart(query: string) {
    const urls: string[] = [];
    
    // PMC Music
    try {
        const res = await axios.get(`https://pmcmusic.tv/?s=${encodeURIComponent(query)}`);
        const html = res.data;
        const articles = html.match(/<article[^>]*>.*?<\/article>/gis);
        if (articles) {
            for (const article of articles) {
                const link = article.match(/href="(https:\/\/pmcmusic\.tv\/[^"']+)"/);
                if (link && !urls.includes(link[1])) {
                    urls.push(link[1]);
                }
            }
        }
    } catch {}

    // Mokhtalef Music
    try {
        const res = await axios.get(`https://mokhtalefmusic.com/?s=${encodeURIComponent(query)}`);
        const html = res.data;
        // mokhtalef uses article tags too? Or post divs?
        const mainPosts = html.match(/<article[^>]*>.*?<\/article>/gis) || html.match(/<div[^>]*class="[^"]*post[^"]*"[^>]*>.*?<\/div>/gis);
        if (mainPosts) {
             for (const post of mainPosts) {
                const link = post.match(/href="(https:\/\/mokhtalefmusic\.com\/[^"']+)"/);
                if (link && !urls.includes(link[1])) {
                    urls.push(link[1]);
                }
            }
        } else {
             // Fallback for mokhtalef: exact regex for their post titles usually have -
             const allLinks = html.matchAll(/href="(https:\/\/mokhtalefmusic\.com\/[^"']+)"/gi);
             for (const m of allLinks) {
                  const u = m[1];
                  if (u.includes("%")) { // persian links are urlencoded with %
                      if (!urls.includes(u)) urls.push(u);
                  }
             }
        }
    } catch {}

    console.log("SMART URLS:", urls.slice(0, 10));
}
scrapeSmart("Mehrad Hidden Maar");
