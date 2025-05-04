const { createClient } = require("redis");

const client = createClient({
  username: "default",
  password: "9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ",
  socket: {
    host: "redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 18782,
    tls: true,
  },
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

const connectRedis = async () => {
  try {
    await client.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
};

module.exports = {
  client,
  connectRedis,
};
