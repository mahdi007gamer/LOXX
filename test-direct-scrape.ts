import axios from "axios";
import * as cheerio from "cheerio"; // We can use match or cheerio if available

async function scrapeSearchPmc(query: string) {
    const searchUrl = `https://pmcmusic.tv/?s=${encodeURIComponent(query)}`;
    try {
        const res = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        const html = res.data;
        const postUrls: string[] = [];
        const matches = html.matchAll(/href="(https:\/\/pmcmusic\.tv\/[^"']+)"/gi);
        for (const m of matches) {
            const url = m[1];
            if (url.endsWith("/") && !url.includes("/category/") && !url.includes("/page/") && !url.includes("/tag/") && url !== "https://pmcmusic.tv/download-song/") {
                if (!postUrls.includes(url)) postUrls.push(url);
            }
        }
        return postUrls.filter(u => u.length > 25);
    } catch {
        return [];
    }
}

async function scrapeSearchMokhtalef(query: string) {
     const searchUrl = `https://mokhtalefmusic.com/?s=${encodeURIComponent(query)}`;
    try {
        const res = await axios.get(searchUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        const html = res.data;
        const postUrls: string[] = [];
        const matches = html.matchAll(/href="(https:\/\/mokhtalefmusic\.com\/[^"']+)"/gi);
        for (const m of matches) {
            const url = m[1];
            if (url.endsWith("/") && !url.includes("/category/") && !url.includes("/page/") && !url.includes("/tag/")) {
                if (!postUrls.includes(url)) postUrls.push(url);
            }
        }
        return postUrls.filter(u => u.length > 30); // simplistic filter to avoid root or simple pages
    } catch {
        return [];
    }
}

async function test() {
    console.log("pmc:", (await scrapeSearchPmc("mehrad hidden maar")).slice(0, 5));
    console.log("mokhtalef:", (await scrapeSearchMokhtalef("mehrad hidden maar")).slice(0, 5));
}
test();
