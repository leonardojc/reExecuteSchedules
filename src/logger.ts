import * as fs from 'fs';
import * as path from 'path';

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

const LOG_FILE = path.join(__dirname, 'log.txt');
const MAX_LOG_ENTRIES = 100;
const logEntries: Array<{timestamp: string, level: string, message: string}> = [];

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string): string {
  return `[${getTimestamp()}] [${level}] ${message}`;
}


export function getRecentLogs(): Array<{timestamp: string, level: string, message: string}> {
  return [...logEntries];
}

export function logInfo(message: string): void {
  try {
    const formatted = formatMessage(LogLevel.INFO, message);
    fs.appendFileSync(LOG_FILE, formatted+"\n");

    console.log(formatted);
  } catch (err) {
    console.error(`Failed to write log: ${err}`);
  }
}

export function logWarn(message: string): void {
  try {
    const formatted = formatMessage(LogLevel.WARN, message);
    fs.appendFileSync(LOG_FILE, formatted+"\n");

    console.log(formatted);
  } catch (err) {
    console.error(`Failed to write log: ${err}`);
  }
}

export function logError(message: string): void {
  try {
    const formatted = formatMessage(LogLevel.ERROR, message);
    fs.appendFileSync(LOG_FILE, formatted+"\n");

    console.log(message);
  } catch (err) {
    console.error(`Failed to write log: ${err}`);
  }
}
