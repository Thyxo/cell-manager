require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const cellRoutes = require("./routes/cells");
const configRoutes = require("./routes/config");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.DASHBOARD_URL || "http://localhost:3000" }));
app.use(express.json());

// Attach io to requests so routes can emit events
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/cells", cellRoutes);
app.use("/api/config", configRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// MongoDB + daily countdown cron
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/minecraft-cells")
  .then(() => {
    console.log("✅ MongoDB connected");
    startDailyCountdown(io);
  })
  .catch((err) => console.error("MongoDB error:", err));

// Daily countdown: subtract 1 day from all cells at midnight
function startDailyCountdown(io) {
  const Cell = require("./models/Cell");

  async function runCountdown() {
    const cells = await Cell.find({ daysLeft: { $gt: 0 } });
    for (const cell of cells) {
      cell.daysLeft = Math.max(0, cell.daysLeft - 1);
      await cell.save();
    }
    const updated = await Cell.find({});
    io.emit("cells:updated", updated);
    console.log(`⏰ Daily countdown ran — updated ${cells.length} cells`);
  }

  // Calculate ms until next midnight
  function msUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }

  setTimeout(() => {
    runCountdown();
    setInterval(runCountdown, 24 * 60 * 60 * 1000);
  }, msUntilMidnight());
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

module.exports = { io };
