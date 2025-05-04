const { createClient } = require("redis");

const client = createClient({
  url: "redis://default:9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ@redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com:18782",
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

module.exports = client;
