"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSuricataAlert = void 0;
const node_net_1 = require("node:net");
const validPort = (value) => Number.isInteger(value) &&
    Number(value) >= 0 &&
    Number(value) <= 65535;
const normalizeSuricataAlert = (event) => {
    if (event.event_type !== "alert") {
        throw new Error("Event is not a Suricata alert");
    }
    const alert = event.alert;
    if (!alert || typeof alert !== "object") {
        throw new Error("Invalid alert object");
    }
    const signature = typeof alert.signature === "string"
        ? alert.signature.trim()
        : "";
    if (!signature) {
        throw new Error("Alert signature is required");
    }
    const severity = alert.severity;
    if (severity !== undefined &&
        (!Number.isInteger(severity) ||
            severity < 1 ||
            severity > 4)) {
        throw new Error("Severity must be between 1 and 4");
    }
    const sourceIp = event.src_ip;
    const destinationIp = event.dest_ip;
    if (sourceIp && (typeof sourceIp !== "string" || !(0, node_net_1.isIP)(sourceIp))) {
        throw new Error("Invalid source IP");
    }
    if (destinationIp &&
        (typeof destinationIp !== "string" || !(0, node_net_1.isIP)(destinationIp))) {
        throw new Error("Invalid destination IP");
    }
    if (event.src_port !== undefined &&
        !validPort(event.src_port)) {
        throw new Error("Invalid source port");
    }
    if (event.dest_port !== undefined &&
        !validPort(event.dest_port)) {
        throw new Error("Invalid destination port");
    }
    const timestamp = event.timestamp
        ? new Date(event.timestamp)
        : new Date();
    if (Number.isNaN(timestamp.getTime())) {
        throw new Error("Invalid timestamp");
    }
    return {
        sourceIp,
        destinationIp,
        sourcePort: event.src_port,
        destinationPort: event.dest_port,
        protocol: typeof event.proto === "string"
            ? event.proto.toUpperCase()
            : undefined,
        signature,
        severity,
        category: alert.category,
        timestamp,
        source: "Suricata",
        eventType: "alert",
        rawEvent: event,
    };
};
exports.normalizeSuricataAlert = normalizeSuricataAlert;
//# sourceMappingURL=suricata.validator.js.map