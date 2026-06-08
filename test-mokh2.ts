import axios from "axios";

async function testMok() {
    try {
        const res = await axios.get("https://mokhtalefmusic.com/%D9%85%D9%87%D8%B1%D8%A7%D8%AF-%D9%87%DB%8C%D8%AF%D9%86-%D9%85%D8%A7%D8%B1/", {
             headers: {
                 "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
             },
             timeout: 4000
        });
        console.log("Mokh", res.status);
    } catch(e) {
        console.log("Mokh ERR", e.message);
    }
}
testMok();
