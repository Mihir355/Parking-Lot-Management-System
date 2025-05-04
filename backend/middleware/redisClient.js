// redisClient.js
const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379", // Update if you're using a hosted Redis
});

redisClient.on("error", (err) => console.error("Redis error:", err));

redisClient.connect();

module.exports = redisClient;
