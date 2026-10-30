import mongoose, { Document } from "mongoose";
export interface IAlert extends Document {
    sourceIp?: string;
    destinationIp?: string;
    sourcePort?: number;
    destinationPort?: number;
    protocol?: string;
    signature: string;
    severity?: number;
    category?: string;
    timestamp: Date;
    source: string;
    eventType: string;
    rawEvent: Record<string, any>;
}
declare const Alert: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default Alert;
