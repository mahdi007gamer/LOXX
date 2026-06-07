import axios from "axios";
import fs from "fs";

async function dumpMok() {
    const res = await axios.get(`https://mokhtalefmusic.com/?s=${encodeURIComponent("Mehrad Hidden Maar")}`);
    fs.writeFileSync("mok.html", res.data);
    console.log("dumped mok.html");
}
dumpMok();
