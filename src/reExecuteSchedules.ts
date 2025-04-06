import { logInfo, logWarn, logError } from './logger';
import {
  Dependencies,
  LoadController,
  ControllerExecutionResult,
  SimplifiedControllerExecutionResult,
  PinExecutionResult
} from './types';
import { getCachedData, isCacheValid } from './cache';
import { shouldExecutePin, executeSchedule } from './executePin';

export async function reExecuteSchedules(
  controllers: LoadController[],
  dependencies: Dependencies = {}
): Promise<SimplifiedControllerExecutionResult[]> {
  const {
    getCachedData: getCachedDataFn = getCachedData,
    isCacheValid: isCacheValidFn = isCacheValid,
    executeSchedule: executeScheduleFn = executeSchedule
  } = dependencies;

  const results: ControllerExecutionResult[] = [];

  for (const controller of controllers) {
    const controllerResult: ControllerExecutionResult = {
      controllerId: controller.identifier,
      controllerUuid: controller.uuid,
      locationUuid: controller.locationUuid,
      cacheStatus: 'valid',
      pinsExecuted: [],
      success: true
    };

    try {
      const cachedData = await getCachedDataFn(controller.locationUuid, controller.uuid);

      if (!cachedData) {
        controllerResult.cacheStatus = 'missing';
        controllerResult.success = false;
        controllerResult.error = 'Cache miss';
        logWarn(`[CACHE] No cached data found for location=${controller.locationUuid}, device=${controller.uuid}`);
        results.push(controllerResult);
        continue;
      }

      const cacheAge = (Date.now() - new Date(cachedData.timestamp).getTime()) / (1000 * 60);
      if (!isCacheValidFn(cachedData)) {
        controllerResult.cacheStatus = 'expired';
        controllerResult.cacheAgeMinutes = cacheAge;
        controllerResult.success = false;
        controllerResult.error = `Cache expired (${cacheAge.toFixed(1)} minutes old)`;
        logWarn(`Cache expired for controller ${controller.identifier} (${cacheAge.toFixed(1)} minutes old)`);
        results.push(controllerResult);
        continue;
      }

      const pinsToUpdate: { [pin: string]: 'on' | 'off' } = {};
      const currentWeekday = new Date().getDay();

      for (const [pin, pinData] of Object.entries(controller.pins)) {
        const schedule = pinData.schedule[currentWeekday];
        const currentStatus = cachedData.latestData[pinData.name] ?? 'off';

        const pinResult: PinExecutionResult = {
          pin,
          pinName: pinData.name,
          currentStatus,
          desiredState: undefined,
          reExecuted: false,
          weekday: currentWeekday,
          onTime: schedule?.on ?? '',
          offTime: schedule?.off ?? '',
          error: undefined,
          currentLocalTime: undefined
        };

        if (!schedule) {
          pinResult.error = `No schedule defined for weekday ${currentWeekday}`;
          logWarn(`[SCHEDULE] Missing schedule for pin ${pin} on controller ${controller.identifier}`);
          controllerResult.pinsExecuted.push(pinResult);
          continue;
        }

        const { shouldExecute, localTime } = shouldExecutePin(schedule, currentStatus, controller.timezone);

        pinResult.desiredState = shouldExecute ? (currentStatus === 'on' ? 'off' : 'on') : undefined;
        pinResult.reExecuted = shouldExecute;
        pinResult.onTime = schedule.on;
        pinResult.offTime = schedule.off;
        pinResult.currentLocalTime = localTime;

        controllerResult.pinsExecuted.push(pinResult);

        if (shouldExecute) {
          pinsToUpdate[pin] = pinResult.desiredState!;
        }
      }

      // if (Object.keys(pinsToUpdate).length > 0) {
      //   try {
      //     await executeScheduleFn(controller, pinsToUpdate);
      //   } catch (error) {
      //     controllerResult.success = false;
      //     controllerResult.error = `Failed to execute schedule updates: ${error instanceof Error ? error.message : String(error)}`;
      //     logError(`Error executing schedule for ${controller.identifier}: ${error}`);
      //   }
      // }else
      // {
      //   logInfo(`it is not necessary to reExecute pins [${Object.keys(controller.pins).join(', ')}] on ${controller.identifier}`);
      // }

   
      // if (Object.keys(pinsToUpdate).length > 0) {
      //   try {
      //     await executeScheduleFn(controller, pinsToUpdate);
      //   } catch (error) {
      //     controllerResult.success = false;
      //     controllerResult.error = `Failed to execute schedule updates: ${error instanceof Error ? error.message : String(error)}`;
      //     logError(`Error executing schedule for ${controller.identifier}: ${error}`);
      //   }
      // } else {
      //   const notReexecutedPins = Object.keys(controller.pins).filter(pin => !(pin in pinsToUpdate));
      //   const pinList = notReexecutedPins.join(', ');
      //   logInfo(`No need to reExecute pins [${pinList}] on ${controller.identifier}`);
      // }


      const allPins = Object.keys(controller.pins);
      const updatedPins = Object.keys(pinsToUpdate);
      const notUpdatedPins = allPins.filter(pin => !updatedPins.includes(pin));

      if (updatedPins.length > 0) {
        try {
          await executeScheduleFn(controller, pinsToUpdate);
          logInfo(`Executed schedule for pins [${updatedPins.join(', ')}] on ${controller.identifier}`);
        } catch (error) {
          controllerResult.success = false;
          controllerResult.error = `Failed to execute schedule updates: ${error instanceof Error ? error.message : String(error)}`;
          logError(`Error executing schedule for ${controller.identifier}: ${error}`);
        }
      }

      if (notUpdatedPins.length > 0) {
        logInfo(`No need to reExecute pins [${notUpdatedPins.join(', ')}] on ${controller.identifier}`);
      }

      results.push(controllerResult);
    } catch (error) {
      controllerResult.success = false;
      controllerResult.error = error instanceof Error ? error.message : String(error);
      results.push(controllerResult);
      logError(`Error processing ${controller.identifier}: ${error}`);
    }
  }

  return results.map(r => ({
    controllerId: r.controllerId,
    success: r.success,
    pinsExecuted: r.pinsExecuted,
    ...(r.success ? {} : { error: r.error })
  }));
}
