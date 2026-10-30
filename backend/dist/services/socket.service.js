"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNewAlert = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
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
exports.initializeSocket = initializeSocket;
const emitNewAlert = (alert) => {
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
exports.emitNewAlert = emitNewAlert;
//# sourceMappingURL=socket.service.js.map