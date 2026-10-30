import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initializeSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Night Watch client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  console.log("Socket.IO initialized successfully");
};

export const emitNewAlert = (alert: any): void => {
  if (!io) {
    console.warn("Socket.IO is not initialized");
    return;
  }

  const alertData = alert.toObject
    ? alert.toObject()
    : { ...alert };

  // Do not broadcast the original raw event to dashboard clients.
  delete alertData.rawEvent;

  io.emit("new_alert", alertData);

  console.log("New alert broadcast:", alertData.signature);
};