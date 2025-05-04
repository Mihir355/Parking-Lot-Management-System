const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: "redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com", // e.g. redis-xxxx.c10.us-east-1-4.ec2.cloud.redislabs.com
    port: 18782, // e.g. 12345
    tls: true, // ✅ enable SSL/TLS
  },
  username: "default",
  password: "9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ",
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
