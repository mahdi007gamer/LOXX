import axios from "axios";
async function testM() {
    const res = await axios.get(`https://music-fa.com/?s=${encodeURIComponent("Mehrad Hidden Maar")}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    console.log("length", res.data.length);
    const html = res.data;
    const matches = html.matchAll(/href="(https:\/\/music-fa\.com\/[^"']+)"/gi);
    const postUrls = [];
    for(const m of matches){
         const u = m[1];
         if(u.endsWith("/") && !u.includes("/category/") && !u.includes("/page/")) {
             if(!postUrls.includes(u)) postUrls.push(u);
         }
    }
    console.log("Music fa", postUrls.slice(0,5));
}
testM();
