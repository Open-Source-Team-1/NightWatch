"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AlertSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes for faster alert searching
AlertSchema.index({ sourceIp: 1 });
AlertSchema.index({ destinationIp: 1 });
AlertSchema.index({ severity: 1 });
AlertSchema.index({ timestamp: -1 });
const Alert = mongoose_1.default.models.Alert ||
    mongoose_1.default.model("Alert", AlertSchema);
exports.default = Alert;
//# sourceMappingURL=Alert.js.map