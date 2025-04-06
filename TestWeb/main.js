
let pinCounter = 1;


function init() {

    document.getElementById('addPinBtn')?.addEventListener('click', addNewPin);
    document.getElementById('generateJsonBtn')?.addEventListener('click', generateJson);
    document.getElementById('executeBtn')?.addEventListener('click', executeSchedule);

        addNewPin();


    setupAutoGenerateJson();
 
}


function setupAutoGenerateJson() {
    const controllerConfig = document.getElementById('controllerConfig');
    if (!controllerConfig) return;


    const addInputListeners = () => {
        const inputs = controllerConfig.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.removeEventListener('input', generateJson);
            input.removeEventListener('change', generateJson);
            input.addEventListener('input', generateJson);
            input.addEventListener('change', generateJson);
        });
    };


    addInputListeners();


    const observer = new MutationObserver(() => {
        addInputListeners(); 
        generateJson();     
    });

    observer.observe(controllerConfig, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
}




// Add a new pin configuration
function addNewPin() {
    const pinsContainer = document.getElementById('pinsContainer');
    const pinTemplate = document.getElementById('pinTemplate');
    const pinClone = pinTemplate.content.cloneNode(true);

    const pinNumberSpan = pinClone.querySelector('.pin-number');
    pinNumberSpan.textContent = pinCounter;
    
    const removeBtn = pinClone.querySelector('.remove-pin');
    removeBtn.addEventListener('click', () => {
        pinsContainer.removeChild(removeBtn.closest('.pin'));
    });


    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleContainer = document.createElement('div');
    scheduleContainer.className = 'schedule-container';
    
    days.forEach((day, index) => {
        const daySchedule = document.createElement('div');
        daySchedule.className = 'day-schedule';
        
        const onTimeInput = document.createElement('input');
        onTimeInput.type = 'time';
        onTimeInput.className = 'on-time';
        onTimeInput.value = '18:15';
        onTimeInput.step = '300';
        onTimeInput.lang = 'en-GB'; // force 24 hours
        
        const offTimeInput = document.createElement('input');
        offTimeInput.type = 'time';
        offTimeInput.className = 'off-time';
        offTimeInput.value = '06:45';
        offTimeInput.step = '300';
        offTimeInput.lang = 'en-GB'; // force 24 hours
        
        const label = document.createElement('label');
        label.innerHTML = `${day}: `;
        
        //  DOM
        label.appendChild(onTimeInput);
        label.appendChild(document.createTextNode(' to '));
        label.appendChild(offTimeInput);
        daySchedule.appendChild(label);
        scheduleContainer.appendChild(daySchedule);
    });

    pinClone.querySelector('.pin').appendChild(scheduleContainer);
    pinsContainer.appendChild(pinClone);
    pinCounter++;
}



// Generate JSON from form inputs
function generateJson() {
    const pins = {};
    const pinElements = document.querySelectorAll('.pin');
    
    pinElements.forEach((pinEl, index) => {
        const pinNumber = index + 1;
        const pinName = pinEl.querySelector('.pin-name').value;
        
        const schedule = {};
        const daySchedules = pinEl.querySelectorAll('.day-schedule');
        
        daySchedules.forEach((dayEl, dayIndex) => {
            schedule[dayIndex] = {
                on: dayEl.querySelector('.on-time').value,
                off: dayEl.querySelector('.off-time').value
            };
        });
        
        pins[pinNumber] = {
            name: pinName,
            schedule: schedule
        };
    });
    
    const controllerData = {
        "identifier": document.getElementById('controllerIdentifier').value,
        "locationUuid": document.getElementById('controllerLocationUuid').value,
        "pins": pins,
        "typeUuid": document.getElementById('controllerTypeUuid').value,
        "uuid": document.getElementById('controllerUuid').value,
        "timezone": document.getElementById('controllerTimezone').value
    };
    
    document.getElementById('controllerData').value = JSON.stringify(controllerData, null, 2);
}

// Execute the schedule
async function executeSchedule() {

  
    const resultDiv = document.getElementById('result');
    const controllerUuid = document.getElementById('controllerUuid').value;
    
    if (!controllerUuid) {
        resultDiv.innerHTML = ('⚠️ Please select a valid UUID before executing the schedule.');
        return; 
    }

    
    try {
        generateJson();
        const controllerData = document.getElementById('controllerData').value;
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: controllerData
        });

        const result = await response.json();

       console.log("Raw result JSON:", JSON.stringify(result, null, 2));

       if (result.success) {
        const executions = result.executionResult || [];
    
        let html = '<strong>Execution Results:</strong><ul>';


    executions.forEach(exec => {
        html += `<li style="margin-bottom: 1em;">
            <strong>Controller ID:</strong> <code>${exec.controllerId || 'N/A'}</code><br>`;

        
        if (exec.error) {
            html += `<div style="color: #b30000; background-color: #ffe6e6; padding: 6px; border-radius: 4px; margin: 6px 0;">
                ⚠️ <strong>Error:</strong> ${exec.error}
            </div>`;
        }else
        {
            html += `<div style="color: #018020; background-color:rgb(230, 255, 236); padding: 6px; border-radius: 4px; margin: 6px 0;">
            ✅ <strong>Success:</strong>
        </div>`;
        }


    if (Array.isArray(exec.pinsExecuted) && exec.pinsExecuted.length > 0) {
        html += '<strong>Pins Executed:</strong><ul>';
        exec.pinsExecuted.forEach(pin => {
            html += `<li>
                <strong>Pin:</strong> ${pin.pin} - ${pin.pinName}<br>
                <strong>Current Status:</strong> ${pin.currentStatus}<br>`;
            


            if (pin.desiredState !== undefined) {
                html += `<strong>Desired State:</strong> ${pin.desiredState}<br>`;
            }

            html += `<strong>Re-Executed:</strong> <span style="color:${pin.reExecuted ? 'green' : 'red'}">${pin.reExecuted ? 'Yes' : 'No'}</span><br>
                <strong>Weekday:</strong> ${pin.weekday}<br>
                <strong>Controller time:</strong> ${pin.currentLocalTime}<br>
                <strong>On Time:</strong> ${pin.onTime}<br>
                <strong>Off Time:</strong> ${pin.offTime}
            </li>`;
        });
        html += '</ul>';
    } else {
        html += '<em>No pins executed.</em>';
    }

    html += '</li>';
});

        html += '</ul>';
    
        resultDiv.innerHTML = html;
        console.log('Execution result:', result);
    } else {
        resultDiv.innerHTML += `<br>Error: ${result.message}`;
        console.error('Execution error:', result);
    }
    
    } catch (error) {
        resultDiv.innerHTML += `<br>Error: ${error.message}`;
        console.error('Execution error:', error);
    }

}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {

    init();
}
