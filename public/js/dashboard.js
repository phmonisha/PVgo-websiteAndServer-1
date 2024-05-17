import { getToken, createAlert } from "./otherFunc.js";

const bodyElement = document.querySelector('body');

// Get the page identifier class or data attribute
let pageIdentifier = bodyElement.classList.contains('page-identifier')
    ? bodyElement.getAttribute('data-page')
    : null;

const token = getToken();

let scanButtonClicked = false;
let deviceListArray = [];
let tabStatus = 'current';
let webSocket;
let simulationStatus;


document.getElementById('defaultOpen').addEventListener('click', () => {
    tabStatus = 'current';
});

document.getElementById('HistoricTab').addEventListener('click', () => {
    tabStatus = 'historic';
});



document.addEventListener("DOMContentLoaded", async (event) => {
    loading();

    //////////////////////////////////CURRENT TAB//////////////////////////

    // Get the list of devices
    const datapageDeviceList = { pageIdentifier };
    const optionsDDeviceList = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datapageDeviceList),
    };

    const responseDeviceList = await fetch("/customerEntityList", optionsDDeviceList);
    const deviceListJson = await responseDeviceList.json();
    deviceListArray = deviceListJson.data;
    deviceListArray.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.label;
        option.text = entry.label;
        labelSelector.add(option);
    });
    //get current device id
    const dataPageIdentifier = { pageIdentifier };
    const optionsDeviceList = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataPageIdentifier),
    };

    const responseID = await fetch("/getSessionDeviceId", optionsDeviceList);

    const responseDeviceID = await responseID.json();

    // console.log(responseDeviceID);
    if (responseDeviceID) {
        sessionStorage.setItem('deviceID', responseDeviceID);
        getsparklineCurve();
    }
    getsimulationstatus();

    // Set the labelSelector to the label obtained from deviceData.
    const deviceDataSelector = deviceListArray.find(entry => entry.deviceId === sessionStorage.getItem('deviceID'));
    if (deviceDataSelector) {
        const label = deviceDataSelector.label;
        labelSelector.value = label;
    } else {
        console.log('Device not found');
    }

    performActionsWithDeviceID();



    // Change in the device ID, close the websocket connection  and start a new one with the new device id.
    document.getElementById('labelSelector').addEventListener("change", async (event) => {

        const selectedlabel = document.getElementById('labelSelector').value;
        if (selectedlabel === "") {
            const alertDiv = createAlert("Select a device.");
            alertContainer.appendChild(alertDiv);
        } else {
            webSocket.close();
            const selectedDevice = deviceListArray.find(entry => entry.label === selectedlabel);
            const selectedDeviceId = selectedDevice.deviceId;
            sessionStorage.setItem('deviceID', selectedDeviceId);


            if (tabStatus === 'historic') {
                performHistoricActionsWithDeviceID();
            } else {
                loading();
                getsimulationstatus();
                performActionsWithDeviceID();
            };
            getsparklineCurve();
        };
    });
    // Get the checkbox element and if it is already checked, pass a status code 1 to plot both IV and PV curve. If not checked pass status code 0..
    let checkbox = document.getElementById('toggleSecondaryAxis');
    checkbox.addEventListener('change', function () {
        // declare the variable
        let formattedCurrent = [];
        let formattedVoltages = [];
        let formattedPower = [];
        // get the current points from session storage
        let current = JSON.parse(sessionStorage.getItem('currentPoints'));

        let totalDataPoint = current.length;

        //get the voltage points from session storage
        formattedVoltages = JSON.parse(sessionStorage.getItem('voltagepoints'));

        //  Extract the current points and format it correctly
        for (let i = 0; i < totalDataPoint; i++) {
            // let roundedValue = (current[i] / 1000).toFixed(2);
            let roundedValue = Math.round((current[i] / 1000) * 100) / 100;
            formattedCurrent.push(roundedValue);
        };

        // Extract the power points and format it correctly
        for (let i = 0; i < totalDataPoint; i++) {
            formattedPower.push(Math.round(formattedCurrent[i] * formattedVoltages[i]));
        };

        // if check box is checked, create a checkbox status and save it  to session storage. call the createIVchart function and pass the correct values.
        if (this.checked) {
            sessionStorage.setItem('checkboxstatus', 1);
            createIVchart(
                formattedCurrent,
                formattedVoltages,
                sessionStorage.getItem('vmp'),
                sessionStorage.getItem('imp'),
                sessionStorage.getItem('pmp'),
                sessionStorage.getItem('vop'),
                sessionStorage.getItem('iop'),
                sessionStorage.getItem('pop'),
                formattedPower,
                'chart-curvy',
                sessionStorage.getItem('simCurrent').split(",").map(parseFloat),
                sessionStorage.getItem('simVoltage').split(",").map(parseFloat),
                '1'
            );
        } else {
            sessionStorage.setItem('checkboxstatus', 0);
            createIVchart(
                formattedCurrent,
                formattedVoltages,
                sessionStorage.getItem('vmp'),
                sessionStorage.getItem('imp'),
                sessionStorage.getItem('pmp'),
                sessionStorage.getItem('vop'),
                sessionStorage.getItem('iop'),
                sessionStorage.getItem('pop'),
                formattedPower,
                'chart-curvy',
                sessionStorage.getItem('simCurrent').split(",").map(parseFloat),
                sessionStorage.getItem('simVoltage').split(",").map(parseFloat),
                '0'
            );
        };
    });
});

window.addEventListener("unload", function () {
    sessionStorage.clear();
});

// remote scan
const scanButton = document.getElementById('scanButton');
scanButton.addEventListener('click', () => {
    scanButtonClicked = true;
    remoteCurvyScan(pageIdentifier);
});


// if the customer goes back to current page, refreesh the page.
// document.getElementById('defaultOpen').addEventListener('click', () => {
//     location.reload();
// });

//////////////////////////////////HISTORIC TAB//////////////////////////
// Declare all variables
let indexValue = 0;
let jsonData = null;
let historicTs = null;
let historicVmpData = null;
let pmpHistoric = null;
let pmpHistoricData = null;
let popHistoric = null;
let popHistoricData = null;
let vocHistoricalData = null;
let iscHistoricalData = null;
let historiccurrent = null;
let historicvoltages = null;
let historicPower = null;
let timestampAEST = null;
let total_scan = null;
let isPlaying = false;
let maxIsc = null;
let maxY1Axis = null;
let maxY2Axis = null;
let fixYaxisStatus = 0;
let historicepochTime = null;
let playInterval;
let dataValue = null;
let maxVal = null;
let sliderValue = null;
let arrayLength = null;
let maxcount = 0;
let mincount = 0;


document.getElementById('defaultOpen').addEventListener('click', () => {
    tabStatus = 'current';
    performActionsWithDeviceID();
});


document.getElementById('HistoricTab').addEventListener('click', () => {
    tabStatus = 'historic';
    let today = new Date();
    // Format the date as yyyy-mm-dd
    let year = today.getFullYear();
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because January is 0
    let day = today.getDate().toString().padStart(2, '0');
    let currentDate = year + '-' + month + '-' + day;
    // Set the value of the input field
    document.getElementById('datepicker').value = currentDate;
    performHistoricActionsWithDeviceID();
});


document.getElementById('datepicker').addEventListener('input', async function () {
    maxcount = 0;
    mincount = 0;
    performHistoricActionsWithDeviceID();
});

document.getElementById("date-forward").addEventListener("click", function () {
    maxcount = 0;
    mincount = 0;
    let currentDate = new Date(datepicker.value);
    // Subtract one day from the current date
    currentDate.setDate(currentDate.getDate() + 1);
    // Set the new date value in the datepicker
    datepicker.valueAsDate = currentDate;
    performHistoricActionsWithDeviceID();
});

document.getElementById("date-backward").addEventListener("click", function () {
    maxcount = 0;
    mincount = 0;
    let currentDate = new Date(datepicker.value);
    // Subtract one day from the current date
    currentDate.setDate(currentDate.getDate() - 1);
    // Set the new date value in the datepicker
    datepicker.valueAsDate = currentDate;
    performHistoricActionsWithDeviceID();
});

document.getElementById('prev-btn').addEventListener('click', () => {
    updateTimestamp('prev');
});
// Event listener for the "Next" button
document.getElementById('next-btn').addEventListener('click', () => {
    updateTimestamp('next');
});
// Event listener for the "Play" button
document.getElementById('play-btn').addEventListener('click', () => {
    togglePlay();
});

document.addEventListener('keydown', function (event) {
    // Check if the pressed key is the left arrow key
    if (event.key === 'ArrowLeft') {
        updateTimestamp('prev');
    }
    else if (event.key === 'ArrowRight') {
        updateTimestamp('next');
    }
    else if (event.key === 'Space') {
        togglePlay();
    }
});
// UPDATE THE DATA BASED ON THE SLIDER VALUE
document.getElementById('timestampSlider').addEventListener('input', function () {
    sliderValue = document.getElementById('timestampSlider');
    indexValue = parseInt(sliderValue.value);
    updateTimestampAndSlider(indexValue);
})

document.getElementById('replay-btn').addEventListener('click', () => {
    indexValue = 0;
    // console.log(indexValue);
    togglePlay();
});


async function performHistoricActionsWithDeviceID() {
    // let indexValue = 0;
    let deviceID = sessionStorage.getItem('deviceID');
    let historicepochTime = null;
    try {
        const selectedDate = document.getElementById('datepicker').value;
        if (selectedDate) {
            const selectedDateTime = new Date(selectedDate + 'T00:00:00');
            if (selectedDateTime > new Date()) {
                nohistoricdata();
                return;  // Stop execution if the date is invalid
            } else {
                historicepochTime = selectedDateTime.getTime();
                // console.log({ historicepochTime })
            }
        } else {
            nohistoricdata();
            // const alertDiv = createAlert('Please select a date.');
            // alertContainer.appendChild(alertDiv);
            return;  // Stop execution if the date is not selected
        }

        const historicDate = { pageIdentifier, historicepochTime, deviceID };
        const historicDataOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(historicDate),
        };
        // await clearOldDataAndGraphs();
        const responseData = await fetch("/historicDData", historicDataOptions);
        jsonData = await responseData.json();

        const togglePosition = document.querySelector('.toggle-checkbox');
        if (togglePosition === null) {
            // document.getElementById('parameter-graph').innerHTML = ' ';
            if (jsonData["pmp"].length === 0) {
                document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
            } else {
                createParameterChart(jsonData, "parameter-graph");
            };

        } else if (togglePosition.checked === true) {
            if (jsonData["pmp"].length === 0) {
                document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
            } else {
                createFaultChart(jsonData, "parameter-graph");
            };
        } else {
            // document.getElementById('parameter-graph').innerHTML = ' ';
            if (jsonData["pmp"].length === 0) {
                document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
            } else {
                createParameterChart(jsonData, "parameter-graph");
            };
        };


        if (jsonData["voc"].length === 0) {
            nohistoricdata();
            return;
        } else {
            enableallbtn();
            document.getElementById('historicChartCurvy').innerHTML = ' ';
            for (var key in jsonData) {
                jsonData[key].sort((a, b) => a.ts - b.ts);
            }
            // console.log(jsonData);
            updateUI(indexValue); // Move it here, inside the else block
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
};

function updateUI(indexValue) {
    historicTs = jsonData['voc'][indexValue].ts

    // VOLTAGE AT MAXIMUM POWER POINT DATA
    historicVmpData = jsonData['vmp'][indexValue].value;
    createHistoricSparklineImage(jsonData['vmp'], 'sparkline-image-historical-vmp', `${jsonData['vmp'][indexValue].value} V`, jsonData['vmp'][indexValue].value, historicTs);

    // CURRENT AT MAXIMUM POWER POINT DATA
    createHistoricSparklineImage(jsonData['imp'], 'sparkline-image-historical-imp', `${jsonData['imp'][indexValue].value} A`, jsonData['imp'][indexValue].value, historicTs);

    // POWER AT MAXIMUM POWER POINT DATA
    createHistoricSparklineImage(jsonData['pmp'], 'sparkline-image-historical-pmp', `${jsonData['pmp'][indexValue].value} W`, jsonData['pmp'][indexValue].value, historicTs);

    // OPERATING VOLTAGE DATA
    createHistoricSparklineImage(jsonData['v'], 'sparkline-image-historical-vop', `${jsonData['v'][indexValue].value} V`, jsonData['v'][indexValue].value, historicTs);

    // OPERATING CURRENT DATA
    createHistoricSparklineImage(jsonData['i'], 'sparkline-image-historical-iop', `${jsonData['i'][indexValue].value} A`, jsonData['i'][indexValue].value, historicTs);

    // OPERATING POWER DATA
    createHistoricSparklineImage(jsonData['pop'], 'sparkline-image-historical-pop', `${jsonData['pop'][indexValue].value} W`, jsonData['pop'][indexValue].value, historicTs);

    // OPEN CIRCUIT VOLTAGE DATA
    createHistoricSparklineImage(jsonData['voc'], 'sparkline-image-historical-voc', `${jsonData['voc'][indexValue].value} V`, jsonData['voc'][indexValue].value, historicTs);

    // CLOSED CIRCUIT CURRENT DATA
    createHistoricSparklineImage(jsonData['isc'], 'sparkline-image-historical-isc', `${jsonData['isc'][indexValue].value} A`, jsonData['isc'][indexValue].value, historicTs);

    // FILL FACTOR DATA
    createHistoricSparklineImage(jsonData['ff'], 'sparkline-image-historical-ff', `${jsonData['ff'][indexValue].value}`, jsonData['ff'][indexValue].value, historicTs);

    // Tcell DATA
    if (simulationStatus === true) {
        createHistoricSparklineImage(jsonData['simTemperature'], 'sparkline-image-historical-tcell', `${jsonData['simTemperature'][indexValue].value}°C`, jsonData['simTemperature'][indexValue].value, historicTs);
    } else {
        createzerosparkline('sparkline-image-historical-tcell')
    }

    // GEFF DATA
    if (simulationStatus === true) {
        createHistoricSparklineImage(jsonData['simIrradiance'], 'sparkline-image-historical-Geff', `${jsonData['simIrradiance'][indexValue].value}W/m²`, jsonData['simIrradiance'][indexValue].value, historicTs);
    } else {
        createzerosparkline('sparkline-image-historical-Geff')
    }

    // PF DATA
    if (simulationStatus === true) {
        createHistoricSparklineImage(jsonData['performanceFactor'], 'sparkline-image-historical-pf', `${jsonData['performanceFactor'][indexValue].value}%`, jsonData['performanceFactor'][indexValue].value, historicTs);
    } else {
        createzerosparkline('sparkline-image-historical-pf')
    }
    // CREATE THE HISTORIC CURVY CHART
    timestampSlider.value = indexValue;
    historiccurrent = jsonData['currents'][indexValue].value;
    historicvoltages = jsonData['voltages'][indexValue].value;
    historicPower = jsonData['power'][indexValue].value;
    timestampAEST = new Date(parseInt(jsonData['ff'][indexValue].ts)).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    document.getElementById("historicTimeStampData").textContent = timestampAEST;
    total_scan = jsonData.ff.length;


    let checkboxStatus = document.getElementById('fixYAxis');
    if (checkboxStatus.checked) {
        // MAXIMUM ON Y1 AXIS
        maxY1Axis = calculatemaxvalue(jsonData['isc']);
        // MAXIMUM ON Y2 AXIS
        maxY2Axis = calculatemaxvalue(jsonData['pmp']);
        // STATUS FLAG SET TOP TRUE
        fixYaxisStatus = 1;
        createhistoricIVchart(historiccurrent,
            historicvoltages,
            [jsonData['vmp'][indexValue].value],
            [jsonData['imp'][indexValue].value],
            [jsonData['pmp'][indexValue].value],
            [jsonData['v'][indexValue].value],
            [jsonData['i'][indexValue].value],
            [jsonData['pop'][indexValue].value],
            historicPower,
            'historicChartCurvy',
            maxY1Axis, maxY2Axis, fixYaxisStatus
        );

    } else {
        createhistoricIVchart(historiccurrent,
            historicvoltages,
            [jsonData['vmp'][indexValue].value],
            [jsonData['imp'][indexValue].value],
            [jsonData['pmp'][indexValue].value],
            [jsonData['v'][indexValue].value],
            [jsonData['i'][indexValue].value],
            [jsonData['pop'][indexValue].value],
            historicPower,
            'historicChartCurvy',
        );
    }
};

function updateTimestamp(direction) {
    if (direction === 'prev') {
        indexValue = Math.max(indexValue - 1, 0);
    } else if (direction === 'next') {
        indexValue = Math.min(indexValue + 1, total_scan - 1);
    }
    updateTimestampAndSlider(indexValue);
};

function updateTimestampAndSlider(indexValue) {
    updateUI(indexValue);
    timestampSlider.value = indexValue;
    timestampSlider.max = total_scan - 1; // Update the max attribute
};

function togglePlay() {
    isPlaying = !isPlaying;

    if (isPlaying) {
        play();
        document.getElementById('play-btn').textContent = '⏸';
    } else {
        clearInterval(playInterval);
        document.getElementById('play-btn').textContent = '▶️';
    }
}

function play() {
    indexValue = 0;
    playInterval = setInterval(() => {
        indexValue = Math.min(indexValue + 1, total_scan - 1);
        updateTimestampAndSlider(indexValue);

        if (indexValue === total_scan - 1 || !isPlaying) {
            clearInterval(playInterval);
            isPlaying = false;
            document.getElementById('play-btn').textContent = '▶️';
        }
    }, 600);
}



////////////////////////////////////FUNCTIONS////////////////////////////////////

async function performActionsWithDeviceID() {
    // console.log(deviceID);
    //get the recent curvy data

    document.getElementById('chart-curvy').innerHTML = '';
    let labelCurveDiv = document.querySelector('.label-curve');
    if (labelCurveDiv) {
        labelCurveDiv.style.display = 'block'; // Set display to 'block' to show the element
    }
    const deviceID = sessionStorage.getItem('deviceID');
    // sessionStorage.clear();

    const dataPage = { pageIdentifier, deviceID };
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataPage),
    };
    // console.log(deviceID);
    // sessionStorage.clear();
    // console.log("device id from function",deviceId);
    const optionsuserJWTToken = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
    };
    const responseuserJWTToken = await fetch("/getUserJWTToken", optionsuserJWTToken);
    const getUserJWTtokenResponse = await responseuserJWTToken.json();
    const getUserJWTToken = getUserJWTtokenResponse.token;


    webSocket = new WebSocket("wss://diverter.allsolus.com.au/api/ws");
    webSocket.onopen = function () {
        // console.log("device id from websocket",deviceId);
        let object = {
            authCmd: {
                cmdId: 0,
                token: getUserJWTToken
            },
            cmds: [
                {
                    entityType: "DEVICE",
                    entityId: deviceID,
                    scope: "LATEST_TELEMETRY",
                    cmdId: 10,
                    type: "TIMESERIES"
                }
            ]
        };
        let data = JSON.stringify(object);
        webSocket.send(data);
    };

    webSocket.onmessage = async function (event) {

        let voc = 0;
        let current = 0;
        let formattedCurrent = [];
        let formattedPower = [];
        let totalDataPoint = 0;
        let formattedVoc = 0;
        let received_msg = event.data;
        let formattedIoperating = 0;
        let formattedVoperating = 0;
        let formattedIsc = 0;
        let formattedOperatingPower = 0;
        let voltagepoints = [];
        let powerAtMaxPoint = 0;
        let powerAtMaxPointIndex = 0;
        let voltageAtMaxPoint = 0;
        let currentAtMaxPoint = 0;
        let checkboxstatuscode = 0;
        let parsed_data = JSON.parse(received_msg);
        let lastUpdatedTime;
        let fillfactor = 0;
        let cellTemperature = 0;
        let simIrradiance = 0;
        let performanceFactor = 0;
        let simCurrent = [];
        let simVoltage = [];
        let faultCode = 0;
        let rssi = 0;
        let rssi_lastupdate = 0;
        let lasttime = 0;
        const resultElement = document.getElementById('resultScanCurvy');
        let difflast;
        // Check if the currents is part of the new called websocket, if yes save it in the session cache.
        const data = parsed_data.data;
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            document.getElementById('wifistrength').setAttribute('src', '../images/wi-fi-disconnected.png');
            document.getElementById('wifistrength').title = `Offline`;
            document.getElementById('lastUpdated').innerHTML = ' ';
            let labelCurveDiv = document.querySelector('.label-curve');
            if (labelCurveDiv) {
                labelCurveDiv.style.display = 'none'; // Set display to 'none' to hide the element
            };
            document.getElementById('chart-curvy').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
            returnzero();
        } else {
            if (parsed_data.data && parsed_data.data.appStatus && parsed_data.data.appStatus[0] && parsed_data.data.appStatus[0][0]) {
                lasttime = parsed_data.data.appStatus[0][0];
                sessionStorage.setItem('lastscan', lasttime)
            };
            difflast = ((new Date().getTime()) - (sessionStorage.getItem('lastscan'))) / 60000;
            if (difflast > 30) {
                sessionStorage.setItem('trendLineData', JSON.stringify({}));
            };
            if (parsed_data.data && parsed_data.data.currents && parsed_data.data.currents.length > 0) {
                sessionStorage.setItem('currentPoints', parsed_data.data.currents[0][1]);
                sessionStorage.setItem('voc', parsed_data.data.voc[0][1]);
                lastUpdatedTime = parsed_data.data.currents[0][0];
                convertEpochToAEST(lastUpdatedTime);
                resultElement.textContent = 'New scan uploaded';
                setTimeout(() => {
                    resultElement.textContent = '';
                }, 2000);
            };
            if (parsed_data.data && parsed_data.data.faultCode && parsed_data.data.faultCode.length > 0) {
                faultCode = parsed_data.data.faultCode[0][1];
                // console.log(faultCode);
                // faultCode = 5; // Temporary fix for issue
                if (faultCode === "0") {
                    // If no fault is detected hide the error message and keep the scan button acitve
                    resultElement.textContent = '';
                    document.querySelector('#scanButton').disabled = false;
                }

                if (faultCode != "0") {
                    if (faultCode === "9") {
                        resultElement.textContent = "Low sunlight";
                        document.querySelector('#scanButton').disabled = true;

                    } else if (faultCode === "2048") {
                        resultElement.textContent = "Low Irradiance, Scan cannot be completed";
                        document.querySelector('#scanButton').disabled = true;
                    } else {
                        // if a fault is detected  show the error message and disable the scan button
                        document.querySelector('#scanButton').disabled = true;
                        //put a shift count to 16 the fault can be max of 16 bit binary number
                        const shift_count = 16;
                        let nonZeroFaults = [];
                        // do a bitwise and operation  with 1 and check if its not zero. If not zero save that  value to array to display it later on
                        for (let i = 0; i < shift_count; i++) {
                            const fault = faultCode & (1 << i);
                            if (fault !== 0) {
                                nonZeroFaults.push(fault); // Adding 1 to i to convert it to 1-indexed value

                            };
                        };
                        // Show the fault
                        let errorList = {
                            1: "Internal low 15V supply",
                            2: "Internal high 15V supply",
                            4: "High internal temperature",
                            8: "Low PV voltage",
                            16: "High PV voltage",
                            32: "High PV current",
                            64: "Relay fail short",
                            128: "Relay bypass fail open",
                            256: "Relay fail open",
                            512: "Cant start inverter",
                            1024: "Discharge Cap Timed Out 1",
                            2048: "Charge Cap Timed Out",
                            4096: "Discharge Cap Timed Out 2",
                            8192: "Discharge Cap Timed Out 3",
                            16384: "Cap Connect Fault",
                        };

                        const faultErrors = nonZeroFaults.map(faultCode => errorList[faultCode]);
                        const errorMessage = "Below are the errors:<br>" +
                            faultErrors.join("<br>") +
                            "<br>Please contact the installer or supplier.";
                        resultElement.innerHTML = errorMessage;
                    };
                };
            };
            if (parsed_data.data && parsed_data.data.rssi && parsed_data.data.rssi.length > 0) {
                rssi_lastupdate = parsed_data.data.rssi[0][0];
                rssi = parsed_data.data.rssi[0][1];
                updateWifiSignal(rssi, rssi_lastupdate);
            }
            if (simulationStatus === true) {
                if (parsed_data.data && parsed_data.data.simTemperature && parsed_data.data.simTemperature.length > 0) {
                    sessionStorage.setItem('simT', parsed_data.data.simTemperature[0][1]);
                    sessionStorage.setItem('simG', parsed_data.data.simIrradiance[0][1]);
                    sessionStorage.setItem('pf', parsed_data.data.performanceFactor[0][1]);
                }
            } else {
                sessionStorage.setItem('simT', 0);
                sessionStorage.setItem('simG', 0);
                sessionStorage.setItem('pf', 0);
            }


            if (parsed_data.data && parsed_data.data.iSlow && parsed_data.data.iSlow.length > 0) {
                sessionStorage.setItem('iop', parsed_data.data.iSlow[0][1]);
            }

            if (parsed_data.data && parsed_data.data.vSlow && parsed_data.data.vSlow.length > 0) {
                sessionStorage.setItem('vop', parsed_data.data.vSlow[0][1]);
            }
            // get cuurent values from the session cache.
            current = JSON.parse(sessionStorage.getItem('currentPoints'));

            totalDataPoint = current.length;

            //  extract the current data point
            for (let i = 0; i < totalDataPoint; i++) {
                // let roundedValue = (current[i] / 1000).toFixed(2);
                let roundedValue = Math.round((current[i] / 1000) * 100) / 100;
                formattedCurrent.push(roundedValue);
            };

            // extract the Isc
            sessionStorage.setItem("isc", formattedCurrent[0])
            formattedIsc = sessionStorage.getItem("isc")


            // extract the Voc
            formattedVoc = JSON.parse(sessionStorage.getItem('voc'));

            // extract the voltage data point
            voltagepoints = divideIntoPoints(formattedVoc, totalDataPoint)
            sessionStorage.setItem("voltagepoints", JSON.stringify(voltagepoints));

            // extract the power data points
            for (let i = 0; i < totalDataPoint; i++) {
                formattedPower.push(Math.round(formattedCurrent[i] * voltagepoints[i]));
            };
            sessionStorage.setItem('powerpoints', JSON.stringify(voltagepoints))
            // Using array methods
            powerAtMaxPoint = Math.max(...formattedPower);
            powerAtMaxPointIndex = formattedPower.indexOf(powerAtMaxPoint);
            sessionStorage.setItem("pmp", powerAtMaxPoint);

            voltageAtMaxPoint = voltagepoints[powerAtMaxPointIndex];
            sessionStorage.setItem("vmp", voltageAtMaxPoint);

            currentAtMaxPoint = formattedCurrent[powerAtMaxPointIndex];
            sessionStorage.setItem("imp", currentAtMaxPoint);

            // extract the operating current
            formattedIoperating = JSON.parse(sessionStorage.getItem('iop'));

            // extract the operating voltage
            formattedVoperating = JSON.parse(sessionStorage.getItem('vop'));

            // extract the operating power
            sessionStorage.setItem("pop", Math.round(formattedVoperating * formattedIoperating));
            formattedOperatingPower = sessionStorage.getItem("pop");

            // Calculate fill factor
            fillfactor = Math.round((voltageAtMaxPoint * currentAtMaxPoint) / (formattedVoc * formattedIsc) * 100) / 100;

            if (simulationStatus === true) {
                if (parsed_data.data && parsed_data.data.currents && parsed_data.data.currents.length > 0) {
                    if (formattedVoc != 0 || formattedIsc != 0) {
                        const simulatedCurvy = { pageIdentifier: pageIdentifier, voc: formattedVoc, isc: formattedIsc, deviceID: sessionStorage.getItem('deviceID') };
                        const simCurvyOptions = {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify(simulatedCurvy),
                        };

                        const responseSimCurvy = await fetch("/deviceAttribute", simCurvyOptions);
                        const simulatedCurvyData = await responseSimCurvy.json();
                        sessionStorage.setItem('simCurrent', handleNull(simulatedCurvyData["Current"]));
                        sessionStorage.setItem('simVoltage', handleNull(simulatedCurvyData["Voltage"]));
                    } else {
                        sessionStorage.setItem('simCurrent', []);
                        sessionStorage.setItem('simVoltage', []);
                    };

                };
            } else {
                sessionStorage.setItem('simCurrent', []);
                sessionStorage.setItem('simVoltage', []);
            };

            simCurrent = sessionStorage.getItem('simCurrent').split(",").map(parseFloat);

            simVoltage = sessionStorage.getItem('simVoltage').split(",").map(parseFloat);


            // look for the checkbox statusand pass 1 or 0 to createIVchart to show the power curve
            checkboxstatuscode = sessionStorage.getItem('checkboxstatus');
            createIVchart(formattedCurrent, voltagepoints, voltageAtMaxPoint, currentAtMaxPoint, powerAtMaxPoint, formattedVoperating, formattedIoperating, formattedOperatingPower, formattedPower, 'chart-curvy', simCurrent, simVoltage, checkboxstatuscode);

            if (simulationStatus === true) {
                cellTemperature = sessionStorage.getItem('simT');
                simIrradiance = sessionStorage.getItem('simG');
                performanceFactor = sessionStorage.getItem('pf');

                // create sparkline chart
                createSparklineImage('sparkline-image-voc', `${formattedVoc} V`);
                createSparklineImage('sparkline-image-isc', `${formattedIsc} A`);
                createSparklineImage('sparkline-image-ff', `${fillfactor}`);

                createSparklineImage('sparkline-image-vmp', `${voltageAtMaxPoint} V`);
                createSparklineImage('sparkline-image-imp', `${currentAtMaxPoint} A`);
                createSparklineImage('sparkline-image-pmp', `${powerAtMaxPoint}W`);

                createSparklineImage('sparkline-image-vop', `${formattedVoperating} V`);
                createSparklineImage('sparkline-image-iop', `${formattedIoperating} A`);
                createSparklineImage('sparkline-image-pop', `${formattedOperatingPower}W`);

                createSparklineImage('sparkline-image-temperature', `${cellTemperature}°C`);
                createSparklineImage('sparkline-image-irradiance', `${simIrradiance}W/m²`);
                createSparklineImage('sparkline-image-perfromance-factor', `${performanceFactor}%`);
            } else {
                // create sparkline chart
                createSparklineImage('sparkline-image-voc', `${formattedVoc} V`);
                createSparklineImage('sparkline-image-isc', `${formattedIsc} A`);
                createSparklineImage('sparkline-image-ff', `${fillfactor}`);

                createSparklineImage('sparkline-image-vmp', `${voltageAtMaxPoint} V`);
                createSparklineImage('sparkline-image-imp', `${currentAtMaxPoint} A`);
                createSparklineImage('sparkline-image-pmp', `${powerAtMaxPoint}W`);

                createSparklineImage('sparkline-image-vop', `${formattedVoperating} V`);
                createSparklineImage('sparkline-image-iop', `${formattedIoperating} A`);
                createSparklineImage('sparkline-image-pop', `${formattedOperatingPower}W`);

                createzerosparkline('sparkline-image-temperature')
                createzerosparkline('sparkline-image-irradiance')
                createzerosparkline('sparkline-image-perfromance-factor')
            }

        };
    };

    webSocket.onclose = function (event) {
        console.log("Connection is closed!");
    };
    webSocket.onerror = function (event) {
        console.error("WebSocket error:", event);
    };

};

// function to divide voc into individual data point
function divideIntoPoints(total, numOfPoints) {
    // Calculate the interval between each point
    const interval = total / (numOfPoints - 1);

    // Generate the points
    const points = [];
    for (let i = 0; i < numOfPoints; i++) {
        const point = Math.round((i * interval) * 100) / 100;
        points.push(point);
    }

    return points;
}

// Function to handle null values and return 0
function handleNull(value) {
    return value !== null ? value : 0;
}


function createIVchart(currentData, voltageData, vmp, imp, pmp, voltOperating, currentOperating, powerop, powerData, elementIdCurvyChart, simCurrent, simVoltage, status_code) {
    var primaryData = [{
        x: voltageData,
        y: currentData,
        name: 'I-V Curve',
        type: 'scatter',
        line: {
            color: 'rgb(55, 128, 191)',
            width: 2,
        },
    },
    {
        x: simVoltage,
        y: simCurrent,
        name: 'simulated IV curve',
        mode: 'lines',
        line: {
            dash: 'dot',
            width: 1,
            color: 'rgb(0,153,0)',
        },

    },
    {
        x: [voltOperating],
        y: [currentOperating],
        name: 'Operating point',
        type: 'scatter',
        marker: {
            size: 6,
            color: 'rgb(55, 128, 191)'
        }
    },
    {
        x: [vmp],
        y: [imp],
        name: 'Maximum point',
        mode: 'markers',
        marker: {
            size: 6,
            color: 'rgb(255, 0, 0)'
        }
    }];

    var secondaryData = [{
        x: voltageData,
        y: powerData,
        name: 'P-V Curve',
        yaxis: 'y2',
        type: 'scatter',
        marker: {
            color: 'rgb(255, 165, 0)',
            width: 2,
        }
    },
    {
        x: [voltOperating],
        y: [powerop],
        name: 'Operating power',
        type: 'scatter',
        yaxis: 'y2',
        marker: {
            size: 6,
            color: 'rgb(255, 165, 0)'
        }
    },
    {
        x: [vmp],
        y: [pmp],
        name: 'Maximum power',
        type: 'scatter',
        yaxis: 'y2',
        marker: {
            size: 6,
            color: 'rgb(255, 0, 0)'
        }
    }];

    var layout = {
        showlegend: false,
        hovermode: 'x',
        dragmode: false,
        title: {
            text: 'Curvy Trace',
            font: {
                family: 'Ubuntu, sans-serif',
                size: 16,
            },
        },
        xaxis: {
            title: {
                text: 'Voltage (V)',
                font: {
                    family: 'Ubuntu, sans-serif',
                    size: 15
                },
            },
            showgrid: false,
            // showspike: true,
            // spikemode: 'toaxis',
        },
        yaxis: {
            title: {
                text: 'Current (A)',
                font: {
                    family: 'Ubuntu, sans-serif',
                    size: 15
                },
            },
            titlefont: { color: 'rgb(148, 103, 189)' },
            showgrid: false,
            // showspike: true,
            // spikemode: 'toaxis',
        },
        yaxis2: {
            title: 'Power (W)',
            overlaying: 'y',
            side: 'right',
            title: {
                text: 'Power (W)',
                font: {
                    family: 'Ubuntu, sans-serif',
                    size: 15
                },
            },
            showgrid: false,
            showline: true,
            // showspike: true,
            // spikemode: 'toaxis',
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        shapes: [{
            type: 'line',
            x0: voltOperating,
            y0: 0,
            x1: voltOperating,
            y1: currentOperating,
            line: {
                color: 'rgb(55, 128, 191)',
                width: 2,
                dash: 'dot'
            },
        },
        {
            type: 'line',
            x0: vmp,
            y0: 0,
            x1: vmp,
            y1: imp,
            line: {
                color: 'rgb(255, 0, 0)',
                width: 1,
                dash: 'dot'
            }
        },
        {
            type: 'line',
            x0: 0,
            y0: currentOperating,
            x1: voltOperating,
            y1: currentOperating,
            line: {
                color: 'rgb(55, 128, 191)',
                width: 1,
                dash: 'dot'
            }
        },
        {
            type: 'line',
            x0: 0,
            y0: imp,
            x1: vmp,
            y1: imp,
            line: {
                color: 'rgb(255, 0, 0)',
                width: 1,
                dash: 'dot'
            }
        },
        ],
        annotations: [{
            text: 'Voperating',
            x: voltOperating,
            y: 0.75 * currentOperating,
            xanchor: 'right',
            yanchor: 'top',
            showarrow: false,
            font: {
                size: 10,
                color: 'rgb(55, 128, 191)',
            },
            textangle: 90,
        },
        {
            text: 'Vmp',
            x: vmp,
            y: 0.95 * imp,
            xanchor: 'left',
            yanchor: 'top',
            showarrow: false,
            font: {
                size: 10,
                color: 'rgb(255, 0, 0)',
            },
            textangle: 90,
        },
        {
            text: 'Ioperating',
            x: 0,
            y: currentOperating,
            xanchor: 'left',
            yanchor: 'bottom',
            showarrow: false,
            font: {
                size: 10,
                color: 'rgb(55, 128, 191)',
            },
            textangle: 0,
        },
        {
            text: 'Imp',
            x: 12,
            y: imp,
            xanchor: 'left',
            yanchor: 'top',
            showarrow: false,
            font: {
                size: 10,
                color: 'rgb(255, 0, 0)',
            },
            textangle: 0,
        },
        ],
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 25,
            pad: 0
        }
    };

    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    }
    // Initially hide the secondary Y-axis traces
    // let status_code = sessionStorage.getItem('checkBoxStatus');
    // console.log({status_code});

    if (status_code === '1') {
        Plotly.newPlot(elementIdCurvyChart, primaryData, layout, config);
        Plotly.addTraces(elementIdCurvyChart, secondaryData);
    } else {
        Plotly.newPlot(elementIdCurvyChart, primaryData, layout, config);
    }
};

// Function to convert epoach time to human readable time
function convertEpochToAEST(epochTimeInput) {
    const timestamp = parseInt(epochTimeInput, 10);

    const timestampSeconds = timestamp / 1000;

    // Create a UTC datetime object
    const utcDatetime = new Date(timestampSeconds * 1000);

    // Set the timezone to AEST
    const Timezone = 'Australia/Sydney';
    const Datetime = new Intl.DateTimeFormat('en-AU', {
        timeZone: Timezone,
        year: 'numeric', // Use 'numeric' to get the full year
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(utcDatetime);

    // Display the AEST time
    document.getElementById("lastUpdated").textContent = Datetime;
}

async function getsparklineCurve() {
    const dataPageSparkline = { pageIdentifier, deviceID: sessionStorage.getItem('deviceID') };
    const optionsSparkline = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataPageSparkline),
    };

    const responseSparkline = await fetch("/customerSparklineDeviceTelemetry", optionsSparkline);
    let trendlineData;
    try {
        trendlineData = await responseSparkline.json();
    } catch (error) {
        trendlineData = {}; // Set trendlineData to empty object
    }
    sessionStorage.setItem('trendLineData', JSON.stringify(trendlineData));

};

async function createSparklineImage(elementID, value_sparline) {
    let trendLineData;
    let extracteddata = [];

    // Parse trendLineData from sessionStorage
    trendLineData = JSON.parse(sessionStorage.getItem('trendLineData'));

    // If trendLineData is empty, set extracteddata to an empty array
    if (Object.keys(trendLineData).length === 0 && trendLineData.constructor === Object) {
        extracteddata = [];
    } else {
        // Assign the appropriate data based on the elementID
        switch (elementID) {
            case 'sparkline-image-voc':
                extracteddata = trendLineData['voc'];
                break;
            case 'sparkline-image-isc':
                extracteddata = trendLineData['isc'];
                break;
            case 'sparkline-image-ff':
                extracteddata = trendLineData['ff'];
                break;
            case 'sparkline-image-vmp':
                extracteddata = trendLineData['vmp'];
                break;
            case 'sparkline-image-imp':
                extracteddata = trendLineData['imp'];
                break;
            case 'sparkline-image-pmp':
                extracteddata = trendLineData['pmp'];
                break;
            case 'sparkline-image-vop':
                extracteddata = trendLineData['v'];
                break;
            case 'sparkline-image-iop':
                extracteddata = trendLineData['i'];
                break;
            case 'sparkline-image-pop':
                extracteddata = trendLineData['pop'];
                break;
            case 'sparkline-image-temperature':
                extracteddata = trendLineData['simTemperature'];
                break;
            case 'sparkline-image-irradiance':
                extracteddata = trendLineData['simIrradiance'];
                break;
            case 'sparkline-image-perfromance-factor':
                extracteddata = trendLineData['performanceFactor'];
                break;
            default:
                extracteddata = [];
        }
    }

    // Sort the extracteddata array in ascending order of timestamp
    extracteddata.sort((a, b) => new Date(a.ts) - new Date(b.ts));


    const targetTimeZone = 'Australia/Sydney'; // Specify the target time zone
    const timeStamp = extracteddata.map(item => {
        const date = new Date(item.ts);
        const options = { timeZone: targetTimeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        return date.toLocaleString('en-AU', options);
    });

    const values = extracteddata.map(item => parseFloat(item.value));

    const trace = {
        x: timeStamp,
        y: values,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'rgba(37, 11, 11, 0.849)', width: 0.75 },
        // fill: 'tozeroy',
        fill: 'tonexty',
        fillcolor: 'rgba(232,228,228,1.5)',
        showgrid: false,
        showticklabels: false,
        showline: false
    };
    const layout = {
        margin: { t: 0, r: 0, l: 0, b: 0 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        showlegend: false,
        xaxis: {
            showgrid: false,
            showticklabels: false,
            showline: false,
            visible: false,
        },
        yaxis: {
            showgrid: false,
            showticklabels: false,
            showline: false,
            visible: false,
        },
        annotations: [
            {
                x: 0.5,
                y: 0.5,
                xref: 'paper',
                yref: 'paper',
                text: `${value_sparline}`,
                showarrow: false,
                font: {
                    size: 20,
                    color: 'brown',
                },
            }
        ]
    };
    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    };
    Plotly.newPlot(elementID, [trace], layout, config);

    Plotly.toImage(elementID, { format: 'svg', width: 250, height: 50 }).then(function (url) {
        document.getElementById(elementID).src = url;
        document.getElementById(elementID).classList.remove('image-modify2');
        document.getElementById(elementID).classList.add('sparklineimages');
    });
};

async function remoteCurvyScan(pageIdentifier) {
    const resultElement = document.getElementById('resultScanCurvy');
    resultElement.textContent = 'Scan Initiated..';
    try {
        // Display loading message
        let deviceID = sessionStorage.getItem('deviceID');

        const dataPageScan = { pageIdentifier, deviceID };
        const optionScan = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(dataPageScan),
        };
        const responseScan = await fetch("/scanIVCurvy", optionScan);

        if (responseScan.ok) {
            resultElement.innerHTML = '<iconify-icon icon="eos-icons:hourglass" flip="horizontal,vertical"></iconify-icon> Scan In Progress...';
        } else {
            // console.error('API request failed with status:', responseScan.status);
            // resultElement.textContent = 'Error: ' + responseScan.status;

            // Handle the error message from the server
            // const errorText = await responseScan.text();
            resultElement.textContent = 'Error: Device Offline';
        }
    } catch (error) {
        console.error('An error occurred:', error);
        // resultElement.textContent = 'Error: ' + error.message;
    }
};


// Function to generate the sparkline images
function createHistoricSparklineImage(data, elementId, value_sparline, dataValue, dataTs) {
    const timeStamp = data.map(item => new Date(item.ts).toLocaleTimeString()); // Format timestamp
    const values = data.map(item => parseFloat(item.value));
    const trace0 = {
        x: timeStamp,
        y: values,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'rgba(37, 11, 11, 0.849)', width: 0.75 },
        fill: 'tonexty',
        fillcolor: 'rgba(232,228,228,1.5)',
        showgrid: false,
        showticklabels: false,
        showline: false
    };
    const trace1 = {
        x: [new Date(dataTs).toLocaleTimeString()], // Format dataTs timestamp
        y: [dataValue],
        mode: 'markers',
        type: 'scatter',
        marker: { size: 6, color: 'red' },
        showgrid: false,
        showticklabels: false,
        showline: false
    };

    const layout = {
        margin: { t: 0, r: 0, l: 0, b: 0 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        showlegend: false,
        xaxis: {
            showgrid: false,
            showticklabels: false,
            showline: false,
            visible: false,
        },
        yaxis: {
            showgrid: false,
            showticklabels: false,
            showline: false,
            visible: false,
        },
        annotations: [
            {
                x: 0.5,
                y: 0.5,
                xref: 'paper',
                yref: 'paper',
                text: `${value_sparline}`,
                showarrow: false,
                font: {
                    size: 25,
                    color: 'brown',
                },
            }
        ]
    };
    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    };

    Plotly.newPlot(elementId, [trace0, trace1], layout, config);

    // Plotly.toImage(elementId, { format: 'png', width: 250, height: 80 }).then(function (url) {
    //     document.getElementById(elementId).src = url;
    // });
}

function createhistoricIVchart(currentData, voltageData, vmp, imp, pmp, voltOperating, currentOperating, powerop, powerData, elementIdCurvyChart, maxY1Axis, maxY2Axis, fixYaxisStatus) {
    currentData = JSON.parse(currentData);
    voltageData = JSON.parse(voltageData);
    powerData = JSON.parse(powerData);

    var primaryData = [{
        x: voltageData,
        y: currentData,
        name: 'I-V Curve',
        type: 'scatter',
        line: {
            color: 'rgb(55, 128, 191)',
            width: 2,
        },
    },
    {
        x: voltOperating,
        y: currentOperating,
        name: 'Operating point',
        type: 'scatter',
        marker: {
            size: 6,
            color: 'rgb(55, 128, 191)'
        }
    },
    {
        x: vmp,
        y: imp,
        name: 'Maximum point',
        type: 'scatter',
        marker: {
            size: 6,
            color: 'rgb(255, 0, 0)'
        }
    },
    {
        x: voltageData,
        y: powerData,
        name: 'P-V Curve',
        yaxis: 'y2',  // Specify y2 for the secondary y-axis
        type: 'scatter',
        marker: {
            color: 'rgb(255, 165, 0)',
            width: 2,
        }
    },
    {
        x: voltOperating,
        y: powerop,
        name: 'Operating power',
        type: 'scatter',
        yaxis: 'y2',  // Specify y2 for the secondary y-axis
        marker: {
            size: 6,
            color: 'rgb(255, 165, 0)'
        }
    },
    {
        x: vmp,
        y: pmp,
        name: 'Maximum power',
        type: 'scatter',
        yaxis: 'y2',  // Specify y2 for the secondary y-axis
        marker: {
            size: 6,
            color: 'rgb(255, 0, 0)'
        }
    }
    ];
    // If lock y axis status is set to 1, fix the range else make the range dynamic.
    if (fixYaxisStatus === 1) {
        var layout = {
            showlegend: false,
            hovermode: 'x',
            dragmode: false,
            title: {
                text: 'Curvy Trace',
                font: {
                    family: 'Ubuntu, sans-serif',
                    size: 16,
                },
            },
            xaxis: {
                title: {
                    text: 'Voltage (V)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                    x: 0.5, // Centered title
                    wraptext: 'word', // Wrap title text

                },
                showgrid: false,
                // showspike: true,
                // spikemode: 'toaxis',
            },
            yaxis: {
                title: {
                    text: 'Current (A)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                },

                titlefont: { color: 'rgb(148, 103, 189)' },
                showgrid: false,
                range: [0, maxY1Axis],
                fixedrange: true,
                // showspike: true,
                // spikemode: 'toaxis',

            },
            yaxis2: {
                title: 'Power (W)',
                overlaying: 'y',
                side: 'right',
                title: {
                    text: 'Power (W)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                },

                showgrid: false,
                showline: true,
                range: [0, maxY2Axis],
                fixedrange: true,
                // showspike: true,
                // spikemode: 'toaxis',
            },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            margin: {
                l: 50,
                r: 50,
                b: 50,
                t: 40,
                pad: 0
            }
        };
    } else {
        var layout = {
            showlegend: false,
            hovermode: 'x',
            dragmode: false,
            title: {
                text: 'Curvy Trace',
                font: {
                    family: 'Ubuntu, sans-serif',
                    size: 16,
                },
            },
            xaxis: {
                title: {
                    text: 'Voltage (V)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                    x: 0.5, // Centered title
                    wraptext: 'word', // Wrap title text

                },
                showgrid: false,
                // showspike: true,
                // spikemode: 'toaxis',
            },
            yaxis: {
                title: {
                    text: 'Current (A)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                },

                titlefont: { color: 'rgb(148, 103, 189)' },
                showgrid: false,

                // showspike: true,
                // spikemode: 'toaxis',

            },
            yaxis2: {
                title: 'Power (W)',
                overlaying: 'y',
                side: 'right',
                title: {
                    text: 'Power (W)',
                    font: {
                        family: 'Ubuntu, sans-serif',
                        size: 15
                    },
                },
                showgrid: false,
                showline: true,
                // showspike: true,
                // spikemode: 'toaxis',
            },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            margin: {
                l: 50,
                r: 50,
                b: 50,
                t: 40,
                pad: 0
            }
        };

    }
    // Make the chart responisve and remoe plotly logo. Also Displaymodebar
    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    }

    // Create the plot with primaryData initially
    Plotly.newPlot(elementIdCurvyChart, primaryData, layout, config);

}

// FUNCTION TO CALCULATE THE MAX DATA POINT
function calculatemaxvalue(data) {
    // console.log({ data });
    // console.log(typeof (data));
    dataValue = data.map(entry => parseFloat(entry.value));
    maxVal = Math.max(...dataValue);
    maxVal = maxVal + 0.10 * maxVal;
    // console.log(maxVal)
    return maxVal;
};

let tempData;
let selectedParameter;

document.getElementById("dropdown-content").addEventListener("change", function () {
    tempData = null;
    selectedParameter = this.value;
    // Depending on the selection of the parameters, pass the data in to the temporary variable.
    switch (selectedParameter) {
        case "Vmp":
            tempData = jsonData['vmp'];
            break;
        case "Imp":
            tempData = jsonData['imp'];
            break;
        case "Pmp":
            tempData = jsonData['pmp'];
            break;
        case "V":
            tempData = jsonData['v'];
            break;
        case "I":
            tempData = jsonData['i'];
            break;
        case "P":
            tempData = jsonData['pop'];
            break;
        case "Voc":
            tempData = jsonData['voc'];
            break;
        case "Isc":
            tempData = jsonData['isc'];
            break;
        case "FF":
            tempData = jsonData['ff'];
            break;
        case "simI":
            tempData = jsonData['simIrradiance'];
            break;
        case "SimCT":
            tempData = jsonData['simTemperature'];
            break;
        case "PF":
            tempData = jsonData['performanceFactor'];
            break;
        default:
            const alertDiv = createAlert("Select a parameter.");
            alertContainer.appendChild(alertDiv);
    }
});

document.getElementById("maxbtn").addEventListener('click', () => {
    handlemaxbutton(tempData, maxcount);
    // console.log(tempData);
    maxcount = maxcount + 1;
});

document.getElementById("minbtn").addEventListener('click', () => {
    handleminbutton(tempData, mincount);
    mincount = mincount + 1;
});

async function handlemaxbutton(data, count) {
    const extractedValues = data.map(item => parseFloat(item.value));
    const indexedValues = extractedValues.map((val, index) => [val, index]);
    indexedValues.sort((a, b) => b[0] - a[0]);
    const sortedIndices = indexedValues.map(item => item[1]);
    let arrayLength = sortedIndices.length;
    if (count < arrayLength) {
        updateUI(sortedIndices[count]);
    } else {
        count = -1;
    }
};

async function handleminbutton(data, count) {
    const extractedValues = data.map(item => parseFloat(item.value));
    const indexedValues = extractedValues.map((val, index) => [val, index]);
    indexedValues.sort((a, b) => a[0] - b[0]);
    const sortedIndices = indexedValues.map(item => item[1]);
    let arrayLength = sortedIndices.length;
    if (count < arrayLength) {
        updateUI(sortedIndices[count]);
    } else {
        count = -1;
    }
};

async function updateWifiSignal(rssi, rssi_lastupdate) {
    // find the difference in current time and last update time and divide them by 60000 to convert into min
    const diff = ((new Date().getTime()) - rssi_lastupdate) / 60000;
    let wifiImage = document.getElementById('wifistrength');
    // check if the difference in time is greater than 30 mins. If difference is greater than 30 mins display it as offline
    if (diff > 30) {
        wifiImage.setAttribute('src', '../images/wi-fi-disconnected.png');
        wifiImage.title = "Offline";
    } else {
        // if rssi >-50, set wifi excellent
        if (wifiImage && rssi > -50) {
            wifiImage.setAttribute('src', '../images/wi-fi-excellent.png');
            wifiImage.title = `${100 + Number(rssi)}%`;
            // if rssi between -50 and -60, set wifi good
        } else if (wifiImage && rssi >= -60 && rssi <= -50) {
            wifiImage.setAttribute('src', '../images/wi-fi-good.png');
            wifiImage.title = `${100 + Number(rssi)}%`;
            // if rssi between -60 and -70, set wifi fair
        } else if (wifiImage && rssi >= -70 && rssi < -60) {
            wifiImage.setAttribute('src', '../images/wi-fi-fair.png');
            wifiImage.title = `${100 + Number(rssi)}%`;
        } else {
            // if rssi < -70, set wifi weak
            wifiImage.setAttribute('src', '../images/wi-fi-weak.png');
            wifiImage.title = `${100 + Number(rssi)}%`;
        };
    };
};

// GRAPH IN HISTORIC TAB 

function createParameterChart(json_data, elementIDParameterChart) {
    document.getElementById('parameter-graph').innerHTML = ' ';
    const pmp = (json_data['pmp']);
    pmp.sort((a, b) => a.ts - b.ts);
    const timeStamp = pmp.map(item => {
        const date = new Date(item.ts);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    });
    const values_pmp = pmp.map(item => parseFloat(item.value));

    const pop = (json_data['pop']);
    pop.sort((a, b) => a.ts - b.ts);
    const values_pop = pop.map(item => parseFloat(item.value));



    // Calculate inverter tracking efficiency rounded to 0 decimal places
    const inverterTrackingEfficiency = [];
    for (let i = 0; i < values_pmp.length; i++) {
        // Ensure both values are valid numbers and values_pmp[i] is not zero
        if (!isNaN(values_pmp[i]) && !isNaN(values_pop[i]) && values_pmp[i] !== 0) {
            const efficiency = (values_pop[i] / values_pmp[i]) * 100; // Calculate efficiency in percentage
            const roundedEfficiency = Math.round(efficiency); // Round efficiency to nearest whole number
            inverterTrackingEfficiency.push(roundedEfficiency);
        } else {
            inverterTrackingEfficiency.push(0); // Default value if calculation is not valid
        }
    };

    // Assuming inverterTrackingEfficiency array has been populated as described


    let averageEfficiency = findAverage(inverterTrackingEfficiency);


    var trace1 = {
        x: timeStamp,
        y: values_pmp,
        type: 'scatter',
        mode: 'lines',
        name: "Power at maximum point"
    };

    var trace2 = {
        x: timeStamp,
        y: values_pop,
        type: 'scatter',
        mode: 'lines',
        name: "Operating Power"
    };

    var trace3 = {
        x: timeStamp,
        y: inverterTrackingEfficiency,
        type: 'scatter',
        mode: 'lines',
        name: "MPP tracking efficency",
        line: {
            dash: 'dot',
            width: 1
        },
        yaxis: 'y2'
    };

    var data = [trace1, trace2, trace3];

    var layout = {
        showlegend: true,
        legend: {
            orientation: 'h', // Set legend orientation to horizontal
            x: 0.5, // Center the legend horizontally
            xanchor: 'center', // Anchor legend to the center
            y: -0.5, // Adjust the vertical position below the chart
            yanchor: 'bottom' // Anchor the legend below the chart
        },
        hovermode: 'x unified',
        yaxis: { title: 'Power(W)' },
        yaxis2: {
            title: 'Efficency(%)',
            titlefont: { color: 'green' },
            tickfont: { color: 'green' },
            overlaying: 'y',
            side: 'right',
        },
        annotations: [
            {
                x: 1,
                y: 1.1,
                xref: 'paper',
                yref: 'paper',
                text: `Average MPP tracking efficency: ${averageEfficiency}%`,
                showarrow: false,
                xanchor: 'right',
                yanchor: 'bottom',
                font: { size: 10, color: 'green' },
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                bordercolor: 'green',
                borderwidth: 1,
                borderpad: 4,
                opacity: 0.8
            }
        ]

    };

    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    };
    Plotly.newPlot(elementIDParameterChart, data, layout, config);
    // if zoomed, find the new inverter tracking efficency 
    document.getElementById(elementIDParameterChart).on('plotly_relayout', function (eventData) {
        if (eventData['xaxis.range[0]'] !== undefined && eventData['xaxis.range[1]'] !== undefined &&
            eventData['yaxis.range[0]'] !== undefined && eventData['yaxis.range[1]'] !== undefined) {
            // Start index
            const xMin = eventData['xaxis.range[0]'];
            const startIndex = Number(xMin).toFixed(0);
            // End index
            const xMax = eventData['xaxis.range[1]'];
            const endIndex = Number(xMax).toFixed(0);
            // Find the sub set of the inverter effficency based on start index and end index
            let subInverterTrackingEff = [];
            subInverterTrackingEff = inverterTrackingEfficiency.slice(startIndex, endIndex);

            let newAverageInverterTrackingEff = findAverage(subInverterTrackingEff);
            // Access the annotation and update its text
            layout.annotations[0].text = `Average MPP tracking efficiency: ${newAverageInverterTrackingEff.toFixed(2)}%`;

            // Update the plot with the modified layout
            Plotly.relayout(elementIDParameterChart, layout);
        }
    });
    // when double-clicked, get the efficency back to original 
    document.getElementById(elementIDParameterChart).on('plotly_doubleclick', function (eventData) {
        let newAverageInverterTrackingEff = findAverage(inverterTrackingEfficiency);
        console.log({ newAverageInverterTrackingEff });
        layout.annotations[0].text = `Average MPP tracking efficiency: ${newAverageInverterTrackingEff.toFixed(2)}%`;
        Plotly.relayout(elementIDParameterChart, layout);

    });

}

// finding an average
function findAverage(array) {
    let sumEfficiency = 0;
    let validCount = 0;
    for (let i = 0; i < array.length; i++) {
        if (array[i] !== 0) {
            sumEfficiency += array[i];
            validCount++;
        }
    };
    // Calculate the average efficiency
    let averageEfficiency = 0;
    if (validCount > 0) {
        averageEfficiency = sumEfficiency / validCount;
    };
    return Math.round(averageEfficiency);
}

// Fault monitoring --> if logo clicked 5 times then show the fault monitoring tab 
let clickCount = 0;
document.getElementById('logo').addEventListener('click', function () {

    clickCount++;
    if (clickCount === 5) {
        const toggleContainer = document.getElementById('toggle-container');
        toggleContainer.innerHTML = `
            <label class="toggle">
                <input class="toggle-checkbox" type="checkbox">
                <div class="toggle-switch"></div>
                <span class="toggle-label">Fault Monitoring</span>
            </label>
        `;
        const togglePosition = document.querySelector('.toggle-checkbox');
        togglePosition.addEventListener('change', function () {

            if (togglePosition.checked) {
                if (jsonData["pmp"].length === 0) {
                    document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
                } else {
                    createFaultChart(jsonData, "parameter-graph");
                };
            } else {
                if (jsonData["pmp"].length === 0) {
                    document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
                } else {
                    createParameterChart(jsonData, "parameter-graph");
                };
            };
        });

    };

});
// Function to format timestamp as hh:mm

function createFaultChart(json_data, elementIDFaultChart) {
    const faultCode = json_data['faultCode'];
    // Arrays to store extracted timestamps and values
    const timestamps = [];
    const values = [];

    faultCode.forEach(entry => {
        const date = new Date(entry.ts); // Create Date object from timestamp
        const hours = date.getHours().toString().padStart(2, '0'); // Get hours and pad with leading zero if necessary
        const minutes = date.getMinutes().toString().padStart(2, '0'); // Get minutes and pad with leading zero if necessary
        const formattedTime = `${hours}:${minutes}`; // Format time as hh:mm
        timestamps.push(formattedTime); // Store formatted timestamp
        values.push(entry.value);  // Store value
    });

    // Check if timestamps are in ascending order
    let isAscending = true;
    for (let i = 0; i < timestamps.length - 1; i++) {
        if (timestamps[i] > timestamps[i + 1]) {
            isAscending = false;
            break;
        }
    }

    // If timestamps are not ascending, sort both timestamps and values accordingly
    if (!isAscending) {
        const sortedIndices = timestamps.map((_, index) => index).sort((a, b) => {
            return timestamps[a] > timestamps[b] ? 1 : -1;
        });

        const sortedTimestamps = [];
        const sortedValues = [];

        sortedIndices.forEach(index => {
            sortedTimestamps.push(timestamps[index]);
            sortedValues.push(values[index]);
        });

        // Replace original arrays with sorted arrays
        timestamps.splice(0, timestamps.length, ...sortedTimestamps);
        values.splice(0, values.length, ...sortedValues);
    }


    // Define Plotly trace with correct data
    var trace1 = {
        x: timestamps,
        y: values,
        type: 'scatter',
        mode: 'lines+markers',
        name: "Faults"
    };

    var data = [trace1];

    var layout = {
        showlegend: true,
        legend: {
            orientation: 'h',
            x: 0.5,
            xanchor: 'center',
            y: -0.5,
            yanchor: 'bottom'
        },
        hovermode: 'x',
        yaxis: { title: 'Fault' },
    };

    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    };

    Plotly.newPlot(elementIDFaultChart, data, layout, config);
    // if clicked on the points, show  the fault data 
    document.getElementById(elementIDFaultChart).on('plotly_click', function (eventData) {
        let textValue;
        let pointIndex = eventData.points[0].pointIndex;
        var clickedFaultValue = values[pointIndex];
        var clickedtimestamp = timestamps[pointIndex];
        let faulterrors = faultcodedecode(clickedFaultValue);
        if (clickedFaultValue != 0) {
            textValue = 'Faults at ' + clickedtimestamp + '<br>' + faulterrors;

        } else {
            textValue = "No Faults";
        }



        var updatedLayout = {
            annotations: [{
                x: 1, // x-coordinate (adjust as needed)
                y: 1, // y-coordinate (adjust as needed)
                xref: 'paper',
                yref: 'paper',
                xanchor: 'right',
                yanchor: 'top',
                text: textValue,
                showarrow: false,
                font: {
                    size: 12,
                    color: '#ffffff' // Text color
                },
                bgcolor: '#000000', // Background color
                opacity: 0.8, // Opacity of the background
                borderpad: 4, // Padding around the text
                borderwidth: 1, // Border width
                bordercolor: '#ffffff' // Border color
            }]
        };
        Plotly.relayout(elementIDFaultChart, updatedLayout);
    });
};
// function to decode fauly code
function faultcodedecode(clickedFaultValue) {
    const shift_count = 16;
    let nonZeroFaults = [];
    for (let i = 0; i < shift_count; i++) {
        const fault = clickedFaultValue & (1 << i);
        if (fault !== 0) {
            nonZeroFaults.push(fault); // Adding 1 to i to convert it to 1-indexed value

        };
    };
    let errorList = {
        1: "Internal low 15V supply",
        2: "Internal high 15V supply",
        4: "High internal temperature",
        8: "Low PV voltage",
        16: "High PV voltage",
        32: "High PV current",
        64: "Relay fail short",
        128: "Relay bypass fail open",
        256: "Relay fail open",
        512: "Cant start inverter",
        1024: "Discharge Cap Timed Out 1",
        2048: "Charge Cap Timed Out",
        4096: "Discharge Cap Timed Out 2",
        8192: "Discharge Cap Timed Out 3",
        16384: "Cap Connect Fault",
    };
    const faultErrors = nonZeroFaults.map(faultCode => errorList[faultCode]);
    const errorMessage = faultErrors.join("<br>");
    return errorMessage;
};

function returnzero() {
    if (tabStatus === "current") {
        createzerosparkline("sparkline-image-voc");
        createzerosparkline("sparkline-image-isc");
        createzerosparkline("sparkline-image-ff");
        createzerosparkline("sparkline-image-vmp");
        createzerosparkline("sparkline-image-imp");
        createzerosparkline("sparkline-image-pmp");
        createzerosparkline("sparkline-image-vop");
        createzerosparkline("sparkline-image-iop");
        createzerosparkline("sparkline-image-pop");
        createzerosparkline("sparkline-image-temperature");
        createzerosparkline("sparkline-image-irradiance");
        createzerosparkline("sparkline-image-perfromance-factor");
    } else if (tabStatus === "historic") {
        createzerosparkline("sparkline-image-historical-voc");
        createzerosparkline("sparkline-image-historical-isc");
        createzerosparkline("sparkline-image-historical-ff");
        createzerosparkline("sparkline-image-historical-vmp");
        createzerosparkline("sparkline-image-historical-imp");
        createzerosparkline("sparkline-image-historical-pmp");
        createzerosparkline("sparkline-image-historical-vop");
        createzerosparkline("sparkline-image-historical-iop");
        createzerosparkline("sparkline-image-historical-pop");
        createzerosparkline("sparkline-image-historical-tcell");
        createzerosparkline("sparkline-image-historical-Geff");
        createzerosparkline("sparkline-image-historical-pf");
    }
};

function createzerosparkline(elementID) {
    const data = [{
        z: [[0]],  // 2D array with a single value of 0
        type: 'line',
        showscale: false  // Hide the color scale legend
    }];
    let textval;
    switch (elementID) {
        case 'sparkline-image-voc':
        case 'sparkline-image-vop':
        case 'sparkline-image-vmp':
        case 'sparkline-image-historical-voc':
        case 'sparkline-image-historical-vmp':
        case 'sparkline-image-historical-vop':
            textval = '0V';
            break;

        case 'sparkline-image-isc':
        case 'sparkline-image-imp':
        case 'sparkline-image-iop':
        case 'sparkline - image - historical - isc':
        case 'sparkline-image-historical-imp':
        case 'sparkline-image-historical-iop':
            textval = '0A';
            break;

        case 'sparkline-image-pmp':
        case 'sparkline-image-pop':
        case 'sparkline-image-historical-pmp':
        case 'sparkline-image-historical-pop':
            textval = '0W';
            break;

        case 'sparkline-image-temperature':
        case 'sparkline-image-historical-tcell':
            textval = '0°C';
            break;

        case 'sparkline-image-irradiance':
        case 'sparkline-image-historical-Geff':
            textval = '0W/m²';
            break;
        case 'sparkline-image-perfromance-factor':
        case 'sparkline-image-historical-pf':
            textval = '0%';
            break;
        default:
            textval = '0';
    }
    // Define layout options
    const layout = {
        margin: { t: 0, r: 0, l: 0, b: 0 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { visible: false },  // Hide x-axis
        yaxis: { visible: false },  // Hide y-axis
        autosize: true,
        annotations: [
            {
                x: 0.5,
                y: 0.5,
                xref: 'paper',
                yref: 'paper',
                text: textval,
                showarrow: false,
                font: {
                    size: 20,
                    color: 'grey',
                },
            }
        ]
    };
    var config = {
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
    };
    // Plot the chart
    Plotly.newPlot(elementID, data, layout, config);
    Plotly.toImage(elementID, { format: 'svg', width: 250, height: 50 }).then(function (url) {
        document.getElementById(elementID).src = url;
        document.getElementById(elementID).classList.remove('image-modify2');
        document.getElementById(elementID).classList.add('sparklineimages');
    });
};

function disableallbtn() {
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;
    document.getElementById('replay-btn').disabled = true;
    document.getElementById('timestampSlider').disabled = true;
    document.getElementById('date-forward').disabled = true;
    document.getElementById('date-backward').disabled = true;
    document.getElementById('dropdown-content').disabled = true;
    document.getElementById('maxbtn').disabled = true;
    document.getElementById('minbtn').disabled = true;
};

function enableallbtn() {
    document.getElementById('prev-btn').disabled = false;
    document.getElementById('play-btn').disabled = false;
    document.getElementById('next-btn').disabled = false;
    document.getElementById('replay-btn').disabled = false;
    document.getElementById('timestampSlider').disabled = false;
    document.getElementById('date-forward').disabled = false;
    document.getElementById('date-backward').disabled = false;
    document.getElementById('dropdown-content').disabled = false;
    document.getElementById('maxbtn').disabled = false;
    document.getElementById('minbtn').disabled = false;
};

function nohistoricdata() {
    returnzero();
    document.getElementById('historicTimeStampData').innerHTML = ' ';
    document.getElementById('historicChartCurvy').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
    document.getElementById('parameter-graph').innerHTML = '<img src="../images/nodata.png" class="image-modify" alt="No data found">';
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;
    document.getElementById('replay-btn').disabled = true;
    document.getElementById('timestampSlider').disabled = true;
    document.getElementById('dropdown-content').disabled = true;
    document.getElementById('maxbtn').disabled = true;
    document.getElementById('minbtn').disabled = true;
};

function loading() {
    if (tabStatus === "current") {
        let labelCurveDiv = document.querySelector('.label-curve');
        if (labelCurveDiv) {
            labelCurveDiv.style.display = 'none'; // Set display to 'none' to hide the element
        }
        document.getElementById('lastUpdated').innerHTML = ' ';
        document.getElementById('chart-curvy').innerHTML = '<img src="../images/icons8-loading.gif" class="image-modify2" alt="No data found">';
        generateSparklineLoading('sparkline-image-voc');
        generateSparklineLoading('sparkline-image-isc');
        generateSparklineLoading('sparkline-image-ff');
        generateSparklineLoading('sparkline-image-vmp');
        generateSparklineLoading('sparkline-image-imp');
        generateSparklineLoading('sparkline-image-pmp');
        generateSparklineLoading('sparkline-image-vop');
        generateSparklineLoading('sparkline-image-iop');
        generateSparklineLoading('sparkline-image-pop');
        generateSparklineLoading('sparkline-image-temperature');
        generateSparklineLoading('sparkline-image-irradiance');
        generateSparklineLoading('sparkline-image-perfromance-factor');

    } else if (tabStatus === "historic") {
        let labelCurveDiv = document.querySelector('.label-curve-his');
        console.log(labelCurveDiv);
        if (labelCurveDiv) {
            labelCurveDiv.style.display = 'none'; // Set display to 'none' to hide the element
        }
        document.getElementById('historicTimeStampData').innerHTML = ' ';
        document.getElementById('historicTimeStampData').innerHTML = ' ';
        document.getElementById('historicChartCurvy').innerHTML = '<img src="../images/icons8-loading.gif" class="image-modify2" alt="No data found">'
    };
};

async function getsimulationstatus() {
    const dataSimulationStatus = { deviceID: sessionStorage.getItem('deviceID') };
    const optionSimulationStatus = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataSimulationStatus),
    };

    const responseSimulationStstus = await fetch("/getsimulationStatus", optionSimulationStatus);
    const simulationresponseData = await responseSimulationStstus.json();

    let foundModelKey = false;
    let modelValueExists = false;

    for (let item of simulationresponseData) {
        if (item.key === "model") {
            foundModelKey = true;
            // Check if value is present and not null or undefined
            if (item.value !== null && item.value !== undefined) {
                modelValueExists = true;
            }
            break; // No need to continue once "model" key is found
        }
    }

    // Determine simulationStatus based on conditions
    if (!foundModelKey) {
        simulationStatus = false; // Key "model" not found
    } else if (foundModelKey && !modelValueExists) {
        simulationStatus = false; // Key "model" found but no value
    } else {
        simulationStatus = true; // Key "model" found with a valid value
    }
}

async function generateSparklineLoading(elementID) {
    document.getElementById(elementID).classList.remove('sparklineimages');
    document.getElementById(elementID).src = "../images/icons8-loading.gif";
    document.getElementById(elementID).classList.add('image-modify2');
};
