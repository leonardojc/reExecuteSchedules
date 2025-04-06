"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSchedule = executeSchedule;
exports.shouldExecutePin = shouldExecutePin;
const logger_1 = require("./logger");
async function executeSchedule(controller, pinsToUpdate) {
    const executionState = {
        identifier: controller.identifier,
        ports: pinsToUpdate,
    };
    // Simulate the API call
    (0, logger_1.logInfo)(`[ACTION] API execute reExecutePin: ${JSON.stringify(executionState)}`);
}
function shouldExecutePin(pinSchedule, currentStatus, timezone) {
    try {
        // Validate timezone
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: timezone });
        }
        catch {
            throw new Error(`Invalid timezone: ${timezone}`);
        }
        // Validate time format (should be HH:mm)
        const isValidTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
        if (!isValidTime(pinSchedule.on) || !isValidTime(pinSchedule.off)) {
            throw new Error(`Invalid time format: on=${pinSchedule.on}, off=${pinSchedule.off}`);
        }
        const now = new Date();
        const timeOptions = {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const timeStr = now.toLocaleTimeString('en-US', timeOptions);
        const [currentHours, currentMinutes] = timeStr.split(':').map(Number);
        let currentTotalMins = currentHours * 60 + currentMinutes;
        const parseTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };
        const onMins = parseTime(pinSchedule.on);
        let offMins = parseTime(pinSchedule.off);
        if (offMins <= onMins) {
            offMins += 1440; // off in the  next day
            if (currentTotalMins < onMins) {
                currentTotalMins += 1440; // it's after midnight
            }
        }
        const isActive = currentTotalMins >= onMins && currentTotalMins < offMins;
        const shouldExecute = isActive ? currentStatus === 'off' : currentStatus === 'on';
        return { shouldExecute, localTime: timeStr };
    }
    catch (error) {
        (0, logger_1.logError)(`[EXEC_PIN] Error in shouldExecutePin: ${error instanceof Error ? error.message : String(error)}`);
        return { shouldExecute: false, localTime: '00:00' };
    }
}
