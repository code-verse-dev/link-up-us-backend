const socketIO = require("socket.io");

let io;
const users = new Map();

function initializeWebSocket(server) {
  io = socketIO(server, {
    pingTimeout: 60000,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("register", (userId) => {
      users.set(String(userId), socket.id);
      socket.join(`room_${userId}`);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          break;
        }
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initializeWebSocket, getIO, users };
