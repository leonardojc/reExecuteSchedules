# reExecuteSchedules Project

Based on the instructions and expected behavior, the reExecuteSchedules function follows these main steps:

   - It is called with a loadController object:
    reExecuteSchedules(loadController)

   - It reads the Redis cache to retrieve the last saved values.

   - It compares the current loadController values with the cached data.

   - If any pin values differ, it triggers an API call to /api/reExecutePin.

   - It handles different error scenarios gracefully.

   - It generates a log.txt file containing detailed logs of the process.




## Overview
This project provides a `reExecuteSchedules` function to manage scheduled timings for IoT controllers. It checks cache status and executes actions according to configured schedules for each pin.

## Installation
1. uncrompress the file in a folder

2. Install dependencies:
npm install

3. Compile TypeScript:
tsc


## reExecuteSchedules Function

### Description
The main `reExecuteSchedules` function:
- Checks cache status for each controller
- Compares current state with scheduled timings
- Executes state changes when needed

```typescript
async function reExecuteSchedules(
  controllers: LoadController[],
  dependencies: Dependencies = {}
): Promise<SimplifiedControllerExecutionResult[]>
```

### Parameters
- `controllers`: Array of LoadController objects with:
  - `identifier`: Name identifier
  - `uuid`: Unique ID
  - `locationUuid`: Location ID
  - `timezone`: Timezone
  - `pins`: Pin configuration with daily schedules

- `dependencies`: Optional object to inject:
  - `getCachedData`: Function to get cache data
  - `isCacheValid`: Function to validate cache
  - `executeSchedule`: Function to execute changes

### Usage Example
```typescript
const controller = {
  identifier: 'controller-1',
  uuid: 'uuid-1',
  locationUuid: 'loc-1',
  timezone: 'America/New_York',
  pins: {
    '1': {
      name: 'light-1',
      schedule: {
        0: { on: '08:00', off: '18:00' }, // Sunday
        // ... other days
      }
    }
  }
};

const results = await reExecuteSchedules([controller]);
```


## Jest Tests

The project includes 8 tests that verify:

1. `should handle missing cache data`: Missing cache
2. `should handle expired cache`: Expired cache
3. `should execute pins according to schedule`: Execution based on schedule
4. `should handle missing schedule`: Missing schedule
5. `should handle execution errors`: Execution errors
6. `should skip execution if not needed`: Skip when not required
7. `should handle multiple controllers`: Multiple controllers
8. `should execute multiple pins`: Multiple pins

Run tests:
```bash
npm test
```

## Practical Examples

### Example 1: Successful result
```javascript
{
  controllerId: 'controller-1',
  success: true,
  pinsExecuted: [{
    pin: '1',
    pinName: 'light-1',
    reExecuted: true,
    desiredState: 'on',
    currentStatus: 'off',
    weekday: 1,
    onTime: '08:00',
    offTime: '18:00'
  }]
}
```

### Example 2: Cache error
```javascript
{
  controllerId: 'controller-2',
  success: false,
  error: 'Cache expired (150.5 minutes old)',
  cacheStatus: 'expired'
}
```

### Example 3: Multiple pins
```javascript
{
  controllerId: 'controller-3',
  success: true,
  pinsExecuted: [
    {
      pin: '1',
      reExecuted: true,
      desiredState: 'on'
    },
    {
      pin: '2',
      reExecuted: false
    }
  ]
}



## WebTest
To make it easier to understand and test how the function works, I created a basic WebTest page. It allows you to input and configure the loadController JSON, send it to the function, and observe the results in real time.

### Installation
1. Navigate to TestWeb directory:
```bash
cd TestWeb
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

### Usage
1. Access the interface at: `http://localhost:3000`
2. API Endpoint:
   - POST `/api/execute`: Executes schedules with controller JSON data

Request example:
```json
{
  "identifier": "test-controller",
  "uuid": "controller-uuid",
  "locationUuid": "location-uuid",
  "timezone": "US/Arizona",
  "pins": {
    "1": {
      "name": "pin1",
      "schedule": {
        "0": {"on": "18:15", "off": "06:45"}
      }
    }
  }
}
```
