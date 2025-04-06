// types.ts
import {getCachedData, isCacheValid }from './cache'
import {executeSchedule }from './executePin'

export interface Dependencies {
    getCachedData?: typeof getCachedData;
    isCacheValid?: typeof isCacheValid;
    executeSchedule?: typeof executeSchedule;
  }

  
export type SimplifiedControllerExecutionResult = {
    controllerId: string;
    success: boolean;
    pinsExecuted: PinExecutionResult[];
    error?: string;
  };
  
  // Interfaces
  export interface LoadController {
    identifier: string;
    locationUuid: string;
    pins: {
      [pin: string]: {
        name: string;
        schedule: {
          [day: number]: {
            on: string;
            off: string;
          };
        };
      };
    };
    typeUuid: string;
    uuid: string;
    timezone: string;
  }
  
  export interface CachedData {
    energyDeviceUUID: string;
    gatewayID: string;
    serialNumber: string;
    latestData: {
      [switchName: string]: 'on' | 'off';
    };
    locationUUID: string;
    timestamp: string;
    deviceType: string;
  }
  
  export interface ExecutionState {
    identifier: string;
    ports: {
      [pin: string]: 'on' | 'off';
    };
  }
  
  export interface PinExecutionResult {
    pin: string;
    pinName: string;
    currentStatus: 'on' | 'off';
    desiredState?: 'on' | 'off';
    reExecuted: boolean;
    weekday: number;
    onTime: string;
    offTime: string;
    currentLocalTime?: string;
    error?: string;
  }
  
  export interface ControllerExecutionResult {
    controllerId: string;
    controllerUuid: string;
    locationUuid: string;
    cacheStatus: 'valid' | 'expired' | 'missing';
    cacheAgeMinutes?: number;
    pinsExecuted: PinExecutionResult[];
    success: boolean;
    error?: string;
  }
  

  