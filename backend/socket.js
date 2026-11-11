
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Authenticate every Socket.IO connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const room = `user:${socket.user._id}`;

    // Join the room belonging to this user
    socket.join(room);

    console.log(
      `User ${socket.user.email} connected: ${socket.id}`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `User ${socket.user.email} disconnected: ${reason}`
      );
    });
  });

  return io;
}

module.exports = initializeSocket;
