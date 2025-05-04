const redis = require("redis");

const client = redis.createClient({
  url: "rediss://default:9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ@redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com:18782",
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});

client.on("error", (err) => console.error("❌ Redis Client Error:", err));

const connectRedis = async () => {
  try {
    await client.connect();
    console.log("✅ Connected to Redis");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
};

module.exports = { client, connectRedis };
