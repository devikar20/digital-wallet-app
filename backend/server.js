
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");

const initializeSocket = require("./socket");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Create HTTP server for Express and Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make Socket.IO available to Express routes
app.set("io", io);

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8080"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to WalletPay REST API",
    status: "Server is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected transaction routes
app.use("/api/transactions", transactionRoutes);

// Admin-only routes
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Email already exists.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// Connect MongoDB and start HTTP server
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      throw new Error(
        "MONGODB_URI and JWT_SECRET must be configured in .env"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Atlas connected successfully!");

    server.listen(PORT, () => {
      console.log(
        `WalletPay API running at http://localhost:${PORT}`
      );

      console.log("Socket.IO server is running!");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
