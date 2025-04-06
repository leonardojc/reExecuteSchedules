# reExecuteSchedules

This repository contains the implementation of the `reExecuteSchedules` function for the IoT Systems.

##  Assignment Summary

Develop a robust and efficient `reExecuteSchedules` function to manage the re-execution of schedules for load controllers. These controllers are part of a LoRaWAN-based IoT system that automates and controlling  devices based on predefined schedules.

### Deliverables

-  `reExecuteSchedules` function implemented in **TypeScript**.
-  Unit tests written using **Jest**.
-  This `README` with an explanation of the approach and assumptions made.

---

##  How It Works

Based on the assignment description and expected behavior, the `reExecuteSchedules` function operates as follows:

1. **Call the function**  
   Use `reExecuteSchedules(loadController)` to trigger the process.

2. **Read Redis cache**  
   The function reads the last saved values for the controller from Redis.

3. **Compare data**  
   It compares the current state of the `loadController` with the cached data.

4. **API call on changes**  
   If there are differences in pin states, the function makes a request to the `/api/reExecutePin` endpoint.

5. **Handle errors**  
   Various error handling scenarios are considered and logged accordingly.

6. **Logging**  
   A detailed `log.txt` file is generated with timestamped logs for debugging and traceability.

---

##  Web Testing Interface

To better understand and test the `reExecuteSchedules` function, I created a simple `WebTest` page that allows for:

- Manually configuring a JSON `loadController` object.
- Sending the object to the function.
- Visualizing the result of the execution process.

---

## 🧠 Notes & Reflections

- The biggest learning experience was working with **Jest** for unit testing. I had used it very little before, so I took this opportunity to strengthen that skill.
- I chose to keep the code clean, modular, and easy to follow.
- The Redis and API logic were mocked to simulate expected behavior in a real environment.

---


## Installation
1. Clone repo
```bash
git clone https://github.com/leonardojc/reExecuteSchedules
cd reExecuteSchedules
```

2. Install dependencies:
```bash
npm install
```

3. Compile TypeScript:
```bash
tsc
```

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
