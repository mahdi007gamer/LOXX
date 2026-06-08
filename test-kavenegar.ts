import axios from "axios";

async function testKavenegar() {
  const KAVENEGAR_API_KEY = "6A42677659444F74536B77467678745132456C4F364D494A43617572757639424775454243317A313974453D";
  
  // Test GET
  try {
    console.log("Testing GET...");
    const res = await axios.get(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json?receptor=09375302400&token=824566&template=template`);
    console.log("GET SUCCESS", res.data);
  } catch (e: any) {
    console.log("GET ERROR", e.response?.status, e.message);
  }

  // Test POST
  try {
    console.log("Testing POST...");
    const params = new URLSearchParams();
    params.append('receptor', '09375302400');
    params.append('token', '824566');
    params.append('template', 'template');
    const res2 = await axios.post(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`, params);
    console.log("POST SUCCESS", res2.data);
  } catch (e: any) {
    console.log("POST ERROR", e.response?.status, e.message);
  }
}
testKavenegar();
