"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_http_1 = require("node:http");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const socket_service_1 = require("./services/socket.service");
const suricata_service_1 = require("./services/suricata.service");
const PORT = Number(process.env.PORT) || 4000;
const startServer = async () => {
    try {
        // Step 1: Connect MongoDB.
        await (0, db_1.default)();
        // Step 2: Create HTTP server.
        const httpServer = (0, node_http_1.createServer)(app_1.default);
        // Step 3: Initialize Socket.IO.
        (0, socket_service_1.initializeSocket)(httpServer);
        // Step 4: Start HTTP server.
        await new Promise((resolve, reject) => {
            httpServer.once("error", reject);
            httpServer.listen(PORT, () => {
                resolve();
            });
        });
        console.log(`Night Watch API running on port ${PORT}`);
        console.log(`Socket.IO ready on port ${PORT}`);
        // Step 5: Start Suricata monitoring.
        await (0, suricata_service_1.startSuricataMonitoring)();
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};
void startServer();
//# sourceMappingURL=server.js.map