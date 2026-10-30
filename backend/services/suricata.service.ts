
import fs from "fs";
import readline from "readline";
import path from "path";
import Alert from "../models/Alert";
import { emitNewAlert } from "./socket.service";

const EVE_LOG_PATH =
  process.env.SURICATA_EVE_PATH || "./logs/eve.json";

let processing = false;
let lastPosition = 0;

const processEvent = async (line: string): Promise<void> => {
  if (!line.trim()) return;

  try {
    const event = JSON.parse(line);

    // Process only Suricata alert events
    if (event.event_type !== "alert") return;

    const alert = event.alert || {};

const savedAlert = await Alert.create({
  sourceIp: event.src_ip,
  destinationIp: event.dest_ip,
  sourcePort: event.src_port,
  destinationPort: event.dest_port,
  protocol: event.proto,
  signature: alert.signature || "Unknown alert",
  severity: alert.severity,
  category: alert.category,
  timestamp: event.timestamp
    ? new Date(event.timestamp)
    : new Date(),
  source: "Suricata",
  eventType: event.event_type,
  rawEvent: event,
});

// Broadcast the successfully saved alert
emitNewAlert(savedAlert);

console.log("Suricata alert saved:", alert.signature);

    console.log("Suricata alert saved:", alert.signature);
  } catch (error) {
    console.error("Failed to process Suricata event:", error);
  }
};

const readNewEvents = async (): Promise<void> => {
  if (processing) return;

  processing = true;

  try {
    if (!fs.existsSync(EVE_LOG_PATH)) {
      console.log("Waiting for Suricata EVE log:", EVE_LOG_PATH);
      return;
    }

    const stats = fs.statSync(EVE_LOG_PATH);

    // Handle log rotation or truncation
    if (stats.size < lastPosition) {
      lastPosition = 0;
    }

    if (stats.size === lastPosition) return;

    const start = lastPosition;
    const end = stats.size - 1;
    let completePosition = start;

    const stream = fs.createReadStream(EVE_LOG_PATH, {
      start,
      end,
      encoding: "utf8",
    });

    const reader = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of reader) {
      completePosition += Buffer.byteLength(line, "utf8") + 1;
      await processEvent(line);
    }

    lastPosition = completePosition;
  } catch (error) {
    console.error("Suricata log reading error:", error);
  } finally {
    processing = false;
  }
};

const startSuricataMonitoring = async (): Promise<void> => {
  const { watch } = await import("chokidar");
  const directory = path.dirname(EVE_LOG_PATH);

  watch(directory, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  }).on("change", (changedPath) => {
    if (path.resolve(changedPath) === path.resolve(EVE_LOG_PATH)) {
      void readNewEvents();
    }
  });

  console.log("Suricata monitoring started:", EVE_LOG_PATH);
};

export { startSuricataMonitoring, readNewEvents };
