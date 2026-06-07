import dns from "dns";
dns.lookup("www.radiojavan.com", (err, ip) => {
    console.log("www ip", ip, err?.message);
});
dns.lookup("api.radiojavan.com", (err, ip) => {
    console.log("api ip", ip, err?.message);
});
