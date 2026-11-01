
import { isIP } from "node:net";

export interface NormalizedSuricataAlert {
  sourceIp?: string;
  destinationIp?: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol?: string;
  signature: string;
  severity?: number;
  category?: string;
  timestamp: Date;
  source: "Suricata";
  eventType: "alert";
  rawEvent: Record<string, unknown>;
}

const validPort = (value: unknown): value is number =>
  Number.isInteger(value) &&
  Number(value) >= 0 &&
  Number(value) <= 65535;

export const normalizeSuricataAlert = (
  event: Record<string, any>
): NormalizedSuricataAlert => {

  if (event.event_type !== "alert") {
    throw new Error("Event is not a Suricata alert");
  }

  const alert = event.alert;

  if (!alert || typeof alert !== "object") {
    throw new Error("Invalid alert object");
  }

  const signature =
    typeof alert.signature === "string"
      ? alert.signature.trim()
      : "";

  if (!signature) {
    throw new Error("Alert signature is required");
  }

  const severity = alert.severity;

  if (
    severity !== undefined &&
    (!Number.isInteger(severity) ||
      severity < 1 ||
      severity > 4)
  ) {
    throw new Error("Severity must be between 1 and 4");
  }

  const sourceIp = event.src_ip;
  const destinationIp = event.dest_ip;

  if (sourceIp && (typeof sourceIp !== "string" || !isIP(sourceIp))) {
    throw new Error("Invalid source IP");
  }

  if (
    destinationIp &&
    (typeof destinationIp !== "string" || !isIP(destinationIp))
  ) {
    throw new Error("Invalid destination IP");
  }

  if (
    event.src_port !== undefined &&
    !validPort(event.src_port)
  ) {
    throw new Error("Invalid source port");
  }

  if (
    event.dest_port !== undefined &&
    !validPort(event.dest_port)
  ) {
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
    protocol:
      typeof event.proto === "string"
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
