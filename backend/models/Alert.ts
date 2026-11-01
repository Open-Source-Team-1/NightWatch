import mongoose, { Schema, Document } from "mongoose";

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

const AlertSchema: Schema = new Schema(
  {
    sourceIp: {
      type: String,
      trim: true,
    },

    destinationIp: {
      type: String,
      trim: true,
    },

    sourcePort: {
      type: Number,
      min: 0,
      max: 65535,
    },

    destinationPort: {
      type: Number,
      min: 0,
      max: 65535,
    },

    protocol: {
      type: String,
      trim: true,
      uppercase: true,
    },

    signature: {
      type: String,
      required: true,
      trim: true,
    },

    severity: {
      type: Number,
      min: 1,
      max: 4,
    },

    category: {
      type: String,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    source: {
      type: String,
      default: "Suricata",
    },

    eventType: {
      type: String,
      default: "alert",
    },

    rawEvent: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster alert searching
AlertSchema.index({ sourceIp: 1 });
AlertSchema.index({ destinationIp: 1 });
AlertSchema.index({ severity: 1 });
AlertSchema.index({ timestamp: -1 });

const Alert = mongoose.models.Alert ||
  mongoose.model<IAlert>("Alert", AlertSchema);

export default Alert;