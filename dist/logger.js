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
exports.getRecentLogs = getRecentLogs;
exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logError = logError;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
const LOG_FILE = path.join(__dirname, 'log.txt');
const MAX_LOG_ENTRIES = 100;
const logEntries = [];
function getTimestamp() {
    return new Date().toISOString();
}
function formatMessage(level, message) {
    return `[${getTimestamp()}] [${level}] ${message}`;
}
function getRecentLogs() {
    return [...logEntries];
}
function logInfo(message) {
    try {
        const formatted = formatMessage(LogLevel.INFO, message);
        fs.appendFileSync(LOG_FILE, formatted + "\n");
        console.log(formatted);
    }
    catch (err) {
        console.error(`Failed to write log: ${err}`);
    }
}
function logWarn(message) {
    try {
        const formatted = formatMessage(LogLevel.WARN, message);
        fs.appendFileSync(LOG_FILE, formatted + "\n");
        console.log(formatted);
    }
    catch (err) {
        console.error(`Failed to write log: ${err}`);
    }
}
function logError(message) {
    try {
        const formatted = formatMessage(LogLevel.ERROR, message);
        fs.appendFileSync(LOG_FILE, formatted + "\n");
        console.log(message);
    }
    catch (err) {
        console.error(`Failed to write log: ${err}`);
    }
}
