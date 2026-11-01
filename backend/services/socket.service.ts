
import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";

let io: Server | null = null;

export const initializeSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(
      "Night Watch client connected:",
      socket.id
    );

    socket.on("disconnect", (reason) => {
      console.log(
        "Night Watch client disconnected:",
        socket.id,
        reason
      );
    });
  });

  console.log("Socket.IO initialized successfully");
};

export const emitNewAlert = (alert: any): void => {
  if (!io) {
    console.warn("Socket.IO is not initialized");
    return;
  }

  const alertData = typeof alert.toObject === "function"
    ? alert.toObject()
    : { ...alert };

  // Never send the original raw Suricata event to clients.
  delete alertData.rawEvent;

  io.emit("new_alert", alertData);

  console.log(
    "New alert broadcast:",
    alertData.signature
  );
};
