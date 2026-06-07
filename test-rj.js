const axios = require("axios");

async function test() {
  try {
    const res = await axios.get("https://api.radiojavan.com/api2/search?q=mehrad+hidden+maar");
    console.log("RJ Search keys:", Object.keys(res.data));
    if (res.data.mp3s && res.data.mp3s.length > 0) {
      console.log("RJ mp3s:", res.data.mp3s[0]);
    }
  } catch(e){ console.log("RJ error", e.message) }
}
test();
