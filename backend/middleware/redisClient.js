const redis = require("redis");

const redisClient = redis.createClient({
  url: "rediss://default:9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ@redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com:18782",
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis Cloud");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

module.exports = redisClient;
