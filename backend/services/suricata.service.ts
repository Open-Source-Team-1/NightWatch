
import fs from "node:fs";
import path from "node:path";

import type { FSWatcher } from "chokidar" with { "resolution-mode": "import" };

import Alert from "../models/Alert";
import { emitNewAlert } from "./socket.service";
import { normalizeSuricataAlert } from "./suricata.validator";

const EVE_LOG_PATH = path.resolve(
  process.env.SURICATA_EVE_PATH || "./logs/eve.json"
);

let processing = false;
let lastPosition = 0;
let pendingBuffer = Buffer.alloc(0);
let watcher: FSWatcher | undefined;

const processEvent = async (line: string): Promise<void> => {
  if (!line.trim()) return;

  try {
    const event = JSON.parse(line);

    // Only process security alerts.
    if (event.event_type !== "alert") return;

    // Normalize and validate the event.
    const normalizedAlert = normalizeSuricataAlert(event);

    // Save alert to MongoDB.
    const savedAlert = await Alert.create(normalizedAlert);

    // Emit only after successful database insertion.
    emitNewAlert(savedAlert);

    console.log(
      "Suricata alert saved:",
      normalizedAlert.signature
    );

  } catch (error) {
    console.error(
      "Suricata event rejected:",
      error instanceof Error ? error.message : error
    );
  }
};

export const readNewEvents = async (): Promise<void> => {
  if (processing) return;

  processing = true;

  try {
    if (!fs.existsSync(EVE_LOG_PATH)) {
      console.log("Waiting for EVE log:", EVE_LOG_PATH);
      return;
    }

    const stats = await fs.promises.stat(EVE_LOG_PATH);

    // Handle file truncation or rotation.
    if (stats.size < lastPosition) {
      lastPosition = 0;
      pendingBuffer = Buffer.alloc(0);
    }

    if (stats.size === lastPosition) return;

    const stream = fs.createReadStream(EVE_LOG_PATH, {
      start: lastPosition,
    });

    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      );
    }

    const newData = Buffer.concat(chunks);
    const combined = Buffer.concat([pendingBuffer, newData]);

    const lastNewline = combined.lastIndexOf(0x0a);

    // Wait for a complete JSON line.
    if (lastNewline === -1) {
      pendingBuffer = combined;
      lastPosition = stats.size;
      return;
    }

    const completeData = combined.subarray(0, lastNewline + 1);

    pendingBuffer = combined.subarray(lastNewline + 1);

    const lines = completeData.toString("utf8").split("\n");

    for (const line of lines) {
      await processEvent(line);
    }

    lastPosition = stats.size;

  } catch (error) {
    console.error("Suricata ingestion error:", error);

  } finally {
    processing = false;
  }
};

export const startSuricataMonitoring = async (): Promise<void> => {
  if (watcher) return;

  const directory = path.dirname(EVE_LOG_PATH);

  await fs.promises.mkdir(directory, { recursive: true });

  const { watch } = await import("chokidar");

  watcher = watch(directory, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("error", (error) => {
    console.error("Suricata watcher error:", error);
  });

  const handleChange = (changedPath: string) => {
    if (path.resolve(changedPath) === EVE_LOG_PATH) {
      void readNewEvents();
    }
  };

  watcher.on("change", handleChange);
  watcher.on("add", handleChange);

  await new Promise<void>((resolve) => {
    watcher!.once("ready", resolve);
  });

  console.log("Suricata monitoring started:", EVE_LOG_PATH);

  // Process existing log entries on startup.
  await readNewEvents();
};
