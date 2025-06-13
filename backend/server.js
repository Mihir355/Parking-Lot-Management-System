const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const cashfreeRoutes = require("./routes/cashfreeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const lotRoutes = require("./routes/lotRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.set("trust proxy", 1);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Setup your API routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/lots", lotRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/cashfree", cashfreeRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"));
  });
}

// Create an HTTP server and attach Socket.IO to it
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend's origin
    methods: ["GET", "POST"],
  },
});

// Make io instance available to all routes
app.set("socketio", io);

// Optional: Log connection events
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  // Optional: handle events from the client
  socket.on("disconnect", () => {
    console.log("A client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
