import { reExecuteSchedules } from '../reExecuteSchedules';
import { LoadController } from '../types';

// Mocks
jest.mock('../logger', () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('../executePin', () => ({
  shouldExecutePin: jest.fn(() => ({
    shouldExecute: true,
    localTime: '10:30',
  })),
  executeSchedule: jest.fn(),
}));

const { logInfo, logWarn, logError } = jest.requireMock('../logger');
const { shouldExecutePin, executeSchedule } = jest.requireMock('../executePin');

// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'warn').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });

describe('reExecuteSchedules', () => {
  const mockGetCachedData = jest.fn();
  const mockIsCacheValid = jest.fn();

  const defaultDependencies = {
    getCachedData: mockGetCachedData,
    isCacheValid: mockIsCacheValid,
    executeSchedule 
  };

  interface TestControllerOverrides extends Partial<LoadController> {}
  const createTestController = (overrides: TestControllerOverrides = {}): LoadController => ({
    identifier: 'test-controller',
    uuid: 'controller-uuid',
    locationUuid: 'location-uuid',
    typeUuid: 'controller-type',
    timezone: 'US/Arizona',
    pins: {
      '1': {
        name: 'pin1',
          "schedule": {
            "0": {
              "on": "18:15",
              "off": "06:45"
            },
            "1": {
              "on": "18:15",
              "off": "06:45"
            },
            "2": {
              "on": "18:15",
              "off": "06:45"
            },
            "3": {
              "on": "18:15",
              "off": "06:45"
            },
            "4": {
              "on": "18:15",
              "off": "06:45"
            },
            "5": {
              "on": "18:15",
              "off": "06:45"
            },
            "6": {
              "on": "18:15",
              "off": "06:45"
            }
        }
      }
    },
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2025-04-07T10:30:00Z').getTime());
  });

  it('should handle missing cache data', async () => {
    mockGetCachedData.mockResolvedValue(null);

    const controllers = [createTestController()];
    const results = await reExecuteSchedules(controllers, defaultDependencies);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toBe('Cache miss');
    expect(executeSchedule).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith(
      '[CACHE] No cached data found for location=location-uuid, device=controller-uuid'
    );
  });

  it('should handle expired cache', async () => {
    const expiredCache = {
      timestamp: '2025-04-07T08:00:00Z',
      latestData: { pin1: 'off' }
    };
    mockGetCachedData.mockResolvedValue(expiredCache);
    mockIsCacheValid.mockReturnValue(false);

    const controllers = [createTestController()];
    const results = await reExecuteSchedules(controllers, defaultDependencies);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toMatch(/Cache expired/);
    expect(executeSchedule).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cache expired for controller test-controller')
    );
  });
  it('should execute pins according to schedule', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'off' }
    };
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);
  
    shouldExecutePin.mockReturnValue({
      shouldExecute: true,
      localTime: '10:30',
      desiredState: 'on',
      weekday: 1,
      onTime: '08:00',
      offTime: '18:00',
    });
  
    executeSchedule.mockResolvedValue(undefined);
  
    const controllers = [createTestController()];
    const results = await reExecuteSchedules(controllers, defaultDependencies);
  
  
    expect(results[0].success).toBe(true);
    expect(results[0].pinsExecuted[0].reExecuted).toBe(true);
    expect(results[0].pinsExecuted[0].desiredState).toBe('on');
    expect(executeSchedule).toHaveBeenCalledWith(
      expect.any(Object),
      { '1': 'on' }
    );
  });

  it('should handle missing schedule for current weekday', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'off' }
    };
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);

    const controllers = [createTestController({
      pins: {
        '1': {
          name: 'pin1',
          schedule: {} // no schedule for Monday
        }
      }
    })];
    const results = await reExecuteSchedules(controllers, defaultDependencies);

    expect(results[0].success).toBe(true);
    expect(results[0].pinsExecuted[0].error).toMatch(/No schedule defined/);
    expect(logWarn).toHaveBeenCalledWith(
      '[SCHEDULE] Missing schedule for pin 1 on controller test-controller'
    );
  });

  it('should handle execution errors', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'off' }
    };
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);
    executeSchedule.mockRejectedValue(new Error('Network error'));

    const controllers = [createTestController()];
    const results = await reExecuteSchedules(controllers, defaultDependencies);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toMatch(/Failed to execute schedule updates/);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Error executing schedule for test-controller')
    );
  });


  it('should skip execution if shouldExecutePin returns false', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'on' }
    };
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);
    shouldExecutePin.mockReturnValue({
      shouldExecute: false,
      localTime: '10:30',
      desiredState: 'off',
      weekday: 1,
      onTime: '08:00',
      offTime: '18:00',
    });
  
    const controllers = [createTestController()];
    const results = await reExecuteSchedules(controllers, defaultDependencies);
  
    expect(results[0].success).toBe(true);
    expect(results[0].pinsExecuted[0].reExecuted).toBe(false);
    expect(executeSchedule).not.toHaveBeenCalled();
  });
  
  it('should handle multiple controllers independently', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'off' }
    };
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);
  

    shouldExecutePin.mockReturnValue({
      shouldExecute: true,
      localTime: '10:30',
      desiredState: 'on',
      weekday: 0,
      onTime: '08:00',
      offTime: '18:00',
    });
  
    executeSchedule.mockResolvedValue(undefined); 
  
    const controller1 = createTestController({ identifier: 'controller-1', uuid: 'uuid-1' });
    const controller2 = createTestController({ identifier: 'controller-2', uuid: 'uuid-2' });
  
    const results = await reExecuteSchedules([controller1, controller2], defaultDependencies);
  
    expect(results.length).toBe(2);
    expect(results.every(r => r.success)).toBe(true);
    expect(executeSchedule).toHaveBeenCalledTimes(2);
  
    results.forEach(result => {
      expect(result.pinsExecuted[0].reExecuted).toBe(true);
      expect(result.pinsExecuted[0].desiredState).toBe('on');
    });
  });
  

  it('should execute multiple pins if required', async () => {
    const validCache = {
      timestamp: '2025-04-07T09:30:00Z',
      latestData: { pin1: 'off', pin2: 'off' }
    };
  
    mockGetCachedData.mockResolvedValue(validCache);
    mockIsCacheValid.mockReturnValue(true);
  

    shouldExecutePin.mockImplementation(({ pinName }: { pinName: string }) => ({
      shouldExecute: true,
      localTime: '10:30',
      desiredState: 'on',
      weekday: 1,
      onTime: '08:00',
      offTime: '18:00',
    }));
    const controllers = [createTestController({
      pins: {
        '1': {
          name: 'pin1',
          schedule: { '6': { on: '08:00', off: '18:00' } } 
        },
        '2': {
          name: 'pin2',
          schedule: { '6': { on: '08:00', off: '18:00' } }
        }
      }
    })];
  
    const results = await reExecuteSchedules(controllers, defaultDependencies);
  
 
    expect(results[0].success).toBe(true);
    expect(results[0].pinsExecuted.length).toBe(2);
    expect(results[0].pinsExecuted.every(p => p.reExecuted)).toBe(true);
    expect(executeSchedule).toHaveBeenCalledWith(
      expect.any(Object),
      { '1': 'on', '2': 'on' }
    );
  });
  



  //end 
});
