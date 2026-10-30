"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNewEvents = exports.startSuricataMonitoring = void 0;
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const path_1 = __importDefault(require("path"));
const Alert_1 = __importDefault(require("../models/Alert"));
const socket_service_1 = require("./socket.service");
const EVE_LOG_PATH = process.env.SURICATA_EVE_PATH || "./logs/eve.json";
let processing = false;
let lastPosition = 0;
const processEvent = async (line) => {
    if (!line.trim())
        return;
    try {
        const event = JSON.parse(line);
        // Process only Suricata alert events
        if (event.event_type !== "alert")
            return;
        const alert = event.alert || {};
        const savedAlert = await Alert_1.default.create({
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
        (0, socket_service_1.emitNewAlert)(savedAlert);
        console.log("Suricata alert saved:", alert.signature);
        console.log("Suricata alert saved:", alert.signature);
    }
    catch (error) {
        console.error("Failed to process Suricata event:", error);
    }
};
const readNewEvents = async () => {
    if (processing)
        return;
    processing = true;
    try {
        if (!fs_1.default.existsSync(EVE_LOG_PATH)) {
            console.log("Waiting for Suricata EVE log:", EVE_LOG_PATH);
            return;
        }
        const stats = fs_1.default.statSync(EVE_LOG_PATH);
        // Handle log rotation or truncation
        if (stats.size < lastPosition) {
            lastPosition = 0;
        }
        if (stats.size === lastPosition)
            return;
        const start = lastPosition;
        const end = stats.size - 1;
        let completePosition = start;
        const stream = fs_1.default.createReadStream(EVE_LOG_PATH, {
            start,
            end,
            encoding: "utf8",
        });
        const reader = readline_1.default.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });
        for await (const line of reader) {
            completePosition += Buffer.byteLength(line, "utf8") + 1;
            await processEvent(line);
        }
        lastPosition = completePosition;
    }
    catch (error) {
        console.error("Suricata log reading error:", error);
    }
    finally {
        processing = false;
    }
};
exports.readNewEvents = readNewEvents;
const startSuricataMonitoring = async () => {
    const { watch } = await import("chokidar");
    const directory = path_1.default.dirname(EVE_LOG_PATH);
    watch(directory, {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
        },
    }).on("change", (changedPath) => {
        if (path_1.default.resolve(changedPath) === path_1.default.resolve(EVE_LOG_PATH)) {
            void readNewEvents();
        }
    });
    console.log("Suricata monitoring started:", EVE_LOG_PATH);
};
exports.startSuricataMonitoring = startSuricataMonitoring;
//# sourceMappingURL=suricata.service.js.map