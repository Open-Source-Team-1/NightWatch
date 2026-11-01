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
export declare const normalizeSuricataAlert: (event: Record<string, any>) => NormalizedSuricataAlert;
