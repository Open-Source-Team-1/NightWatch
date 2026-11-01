
import "dotenv/config";

import { createServer } from "node:http";

import app from "./app";
import connectDB from "./config/db";

import { initializeSocket } from "./services/socket.service";
import { startSuricataMonitoring } from "./services/suricata.service";

const PORT = Number(process.env.PORT) || 4000;

const startServer = async (): Promise<void> => {
  try {
    // Step 1: Connect MongoDB.
    await connectDB();

    // Step 2: Create HTTP server.
    const httpServer = createServer(app);

    // Step 3: Initialize Socket.IO.
    initializeSocket(httpServer);

    // Step 4: Start HTTP server.
    await new Promise<void>((resolve, reject) => {
      httpServer.once("error", reject);

      httpServer.listen(PORT, () => {
        resolve();
      });
    });

    console.log(
      `Night Watch API running on port ${PORT}`
    );

    console.log(
      `Socket.IO ready on port ${PORT}`
    );

    // Step 5: Start Suricata monitoring.
    await startSuricataMonitoring();

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

void startServer();
