import { createClient } from "redis";

const client = createClient({
  username: "default",
  password: "9Zlg69KsL4IVlVCiRl44nEoduwsKgYnZ",
  socket: {
    host: "redis-18782.c305.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 18782,
    tls: true, // important: required for Redis Cloud
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

connectRedis(); // fire the connection immediately

export default client;
