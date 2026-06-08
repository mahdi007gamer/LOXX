import axios from "axios";

const extractMp3FromWebPage = async (pageUrl: string) => {
    try {
      const res = await axios.get(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 4000
      });
      const html = res.data || "";
      const mp3Matches = [];
      const matches = html.matchAll(/href="([^"']+\.mp3)"/gi);
      for (const m of matches) {
        if (m[1]) {
          const l = m[1].trim();
          if (!mp3Matches.includes(l)) mp3Matches.push(l);
        }
      }
      return mp3Matches;
    } catch(e) { return [] }
}

async function testPmc() {
    const urls = [
      'https://pmcmusic.tv/playlist-category/music-player/',
      'https://pmcmusic.tv/playlist-online/',
      'https://pmcmusic.tv/mehrad-hidden-maar/'
    ];
    for (const url of urls) {
        const mp3s = await extractMp3FromWebPage(url);
        console.log("URL", url, "MP3s", mp3s);
    }
}
testPmc();
