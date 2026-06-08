import axios from "axios";
async function testMok() {
    const searchUrl = `https://mokhtalefmusic.com/?s=${encodeURIComponent("Mehrad Hidden Maar")}`;
    const res = await axios.get(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = res.data;
    const matches = html.matchAll(/href="(https:\/\/mokhtalefmusic\.com\/[^"']+)"/gi);
    const postUrls = [];
    for(const m of matches){
         const u = m[1];
         if(u.endsWith("/") && !u.includes("/category/") && !u.includes("/page/")) {
             if(!postUrls.includes(u)) postUrls.push(u);
         }
    }
    console.log("Mokhtalef", postUrls.slice(0,5));
}
testMok();
