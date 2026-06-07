import axios from "axios";
import path from "path";

const extractMp3FromWebPage = async (pageUrl: string) => {
    try {
      const res = await axios.get(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 4000
      });
      const html = res.data || "";
      
      const mp3Matches: string[] = [];
      const matches = html.matchAll(/href="([^"']+\.mp3)"/gi);
      for (const m of matches) {
        if (m[1]) {
          const l = m[1].trim();
          if (!mp3Matches.includes(l)) mp3Matches.push(l);
        }
      }

      const validMp3s = mp3Matches.filter(link => {
        const l = link.toLowerCase();
        return !l.includes("ads") && !l.includes("tabligh") && !l.includes("intro") && !l.includes("advertis");
      });

      if (validMp3s.length === 0) return null;

      let bestMp3 = validMp3s.find(link => link.includes("320")) || 
                     validMp3s.find(link => link.toLowerCase().includes("320")) ||
                     validMp3s.find(link => link.includes("128")) ||
                     validMp3s.find(link => link.toLowerCase().includes("128")) ||
                     validMp3s[0];

      let pTitle = "";
      const htmlTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (htmlTitleMatch) {
         pTitle = htmlTitleMatch[1]
          .replace(/ - پاپ موزیک| - نکس وان موزیک| - موزیک فا| - آپ موزیک/gi, "")
          .replace(/دانلود آهنگ جدید|دانلود آهنگ|پخش آنلاین/gi, "")
          .trim();
      } else {
        pTitle = path.basename(decodeURIComponent(bestMp3)).replace(/\.[^/.]+$/, "");
      }

      let coverUrl = "/badges/musicbot-gold.jpeg";
      const imgm = html.matchAll(/src="([^"']+\.(jpe?g|png))"/gi);
      const imgMatches: string[] = [];
      for (const m of imgm) {
        if (m[1] && !m[1].includes("ads") && !m[1].includes("banner")) {
          imgMatches.push(m[1].trim());
        }
      }
      const validCover = imgMatches.find(img => img.includes("wp-content/uploads/"));
      if (validCover) coverUrl = validCover;

      return {
        title: pTitle || "موزیک پیدا شده",
        url: bestMp3,
        coverUrl,
        duration: 240
      };
    } catch {
      return null;
    }
};

const searchOnlineTrack = async (query: string) => {
    console.log(`[MusicBot Search] Direct site search for query: "${query}"`);

    const sites = [
      { name: "PMC", url: `https://pmcmusic.tv/?s=${encodeURIComponent(query)}`, regex: /href="(https:\/\/pmcmusic\.tv\/[^"']+)"/gi },
      { name: "Mokhtalef", url: `https://mokhtalefmusic.com/?s=${encodeURIComponent(query)}`, regex: /href="(https:\/\/mokhtalefmusic\.com\/[^"']+)"/gi }
    ];

    const validPosts: string[] = [];

    for (const site of sites) {
      try {
        const res = await axios.get(site.url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 4000
        });
        const html = res.data || "";
        const matches = html.matchAll(site.regex);
        for (const m of matches) {
          const u = m[1];
          if (
            u.endsWith("/") &&
            !u.match(/\/(category|page|tag|author|album|podcast|playlist-category|playlist-online)\//) &&
            !u.match(/^(https:\/\/[^/]+\/)(contact-us|about-us|release|music-publish|albums|music-video|download-song|pmcroyale|madahi|remix|foreign|korea|kordi)\/?$/) &&
            u !== "https://pmcmusic.tv/" &&
            u !== "https://mokhtalefmusic.com/"
          ) {
            if (!validPosts.includes(u)) {
                validPosts.push(u);
            }
          }
        }
      } catch (e) {
        console.log(`[MusicBot Search] Error scraping ${site.name}`);
      }
    }

    console.log(`[MusicBot Search] Found ${validPosts.length} potential posts.`);
    console.log(validPosts.slice(0, 5));

    // Take only the first 5 potential posts to avoid long delays
    for (const url of validPosts.slice(0, 5)) {
      const result = await extractMp3FromWebPage(url);
      if (result) {
        console.log(`[MusicBot Search] Successfully extracted track: "${result.title}"`);
        return result;
      }
    }

    return null;
}

searchOnlineTrack("mehrad hidden maar").then(console.log);
