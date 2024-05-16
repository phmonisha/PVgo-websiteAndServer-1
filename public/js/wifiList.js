//import { getqrOutput, removeqrOutput, getToken, getMAC } from "./otherFunc.js";
//
//document.addEventListener("DOMContentLoaded", function(event) {
//    let devName = document.getElementById("deviceName");
//    const qrOutput = getqrOutput();
//    const qrJson = JSON.parse(qrOutput);
//    devName.textContent = `Device name: ${qrJson.name}`;
//});

import { getqrOutput, removeqrOutput, setMAC, getToken, getMAC, createAlert } from "./otherFunc.js";


let devicePrefix = 'CURVY_';
let transport = 'TRANSPORT_BLE';
let security = 'SECURITY_1';//"WPA2";

let espDeviceName = null;
let primaryServiceUuid = null;
let MAC;


document.addEventListener('deviceready', onDeviceReady);

document.addEventListener('backbutton', function (event) {
    window.location.href = '../HTML/provisionStart.html';
});

async function onDeviceReady() {
    let name = await loader();

    if (name === undefined) {
        console.log('Loader function failed');
    }
    else {

        console.log('name: ', name);

        document.getElementById('scanButton').addEventListener('click', function () {
            document.getElementById("errorContainer").style.display = "none";
            if (qrJsonName === undefined) {
                devicePrefix = 'CURVY_';
            } else {
                devicePrefix = qrJsonName;
                console.log('devicePrefix: ', devicePrefix);
            }
            searchESPDevices(devicePrefix, transport, security, successScan, failureScan);
        });

        //        document.getElementById('provision').addEventListener('click', function () {
        //            alert('Entered scanNetworkButton');
        //            scanNetworks(espDeviceName, onSuccessNetwork, onFailureNetwork);
        //        });
    }
};

let qrJsonName;
let qrJsonPop;

async function loader() {
    let devName = document.getElementById("devName");
    const qrOutput = getqrOutput();
    const qrJson = JSON.parse(qrOutput);
    qrJsonName = qrJson.name;
    qrJsonPop = qrJson.pop;
    console.log('qrJsonName: ', qrJsonName);
    console.log('qrJsonPop: ', qrJsonPop);
    devName.textContent = `Device name: ${qrJsonName}`;

    const upperMAC = await fetchUpperMAC(qrJsonName);
    const mergeMAC = await mergeUpperLower(qrJsonPop, upperMAC);
    MAC = await applySemicolon(mergeMAC);

    console.log('MAC: ', MAC);
    setMAC(MAC);

    //removeqrOutput();
    return qrJsonName;
};

function fetchUpperMAC(inputString) {

    let parts = inputString.split('_');
    let textAfterUnderscore;

    // Check if the split result contains more than one part
    if (parts.length > 1) {
        // Retrieve the part after the underscore
        textAfterUnderscore = parts[1];
        console.log('textAfterUnderscore: ', textAfterUnderscore); // Output: "text"
    } else {
        console.log("No text after underscore found.");
    }

    return textAfterUnderscore;

}

function mergeUpperLower(string1, string2) {
    let mergedString = `${string1}${string2}`;

    console.log('mergedString: ', mergedString);
    return mergedString;
}

function applySemicolon(string3) {
    let modifiedString = "";

    for (let i = 0; i < string3.length; i += 2) {
        let chunk = string3.slice(i, i + 2);
        modifiedString += chunk;
        if (i + 2 < string3.length) {
            modifiedString += ":";
        }
    }

    console.log('modifiedString: ', modifiedString);

    return modifiedString;
}


function searchESPDevices(devicePrefix, transport, security, successScan, failureScan) {
    document.getElementById("frame").style.display = "flex";
    console.log('devicePrefix:', devicePrefix);
    console.log('transport:', transport);
    console.log('security:', security);
    cordova.exec(successScan, failureScan, 'ESPIdfProvisioning', 'searchESPDevices', [devicePrefix, transport, security]);
}

let ref = false;
let ref1 = false;

async function successScan(scanSuccess) {

    console.log('BLE device scanned successfully: ', JSON.stringify(scanSuccess));
    const networkNames = document.querySelectorAll('.networkName');
    const networkNameCount = await networkNames.length;

    console.log('ref:', ref);

    console.log('Count of networkName values:', networkNameCount);
    if (scanSuccess.primaryServiceUuid != undefined) {
        ref = true;
        espDeviceName = scanSuccess.name;
        primaryServiceUuid = scanSuccess.primaryServiceUuid;
        console.log('BLE device scanned successfully espDeviceName: ', espDeviceName);
        console.log('BLE device scanned successfully primaryServiceUuid: ', primaryServiceUuid);
        stopSearchingESPDevices(successStopScan, failureStopScan);
    }
    else if (!ref && scanSuccess === "OK") {
        document.getElementById("frame").style.display = "none";
        document.getElementById("errorContainer").style.display = "block";
        //document.getElementById("errorMsg").textContent = '** Unable to establish connection. Please click on reset button on the device, switch off and switch on the phone Bluetooth and click on Scan Wi-Fi again. **';
        document.getElementById("errorMsg").textContent = '** Unable to establish connection. Please turn off and turn on the phone Bluetooth and click on Scan Wi-Fi again. **';
    }
    //    else if (networkNameCount === 0 && scanSuccess === "OK") {
    //        document.getElementById("frame").style.display = "none";
    //        document.getElementById("errorContainer").style.display = "block";
    //        document.getElementById("errorMsg").textContent = '** Looks like  there is an issue while connecting to the curvy device. Please turn off and turn on your bluetooth and then click on Scan Wi-Fi button **';
    //    }
}

// Define failure callback function
function failureScan(error) {
    console.error('Failed to scan BLE device:', error);
    // Additional error handling logic
}

function stopSearchingESPDevices(successStopScan, failureStopScan) {
    cordova.exec(successStopScan, failureStopScan, 'ESPIdfProvisioning', 'stopSearchingESPDevices');
}

let proofOfPossession;

// Define success callback function
function successStopScan(stopScanSuccess) {
    proofOfPossession = qrJsonPop;
    console.log('BLE device connected successfully: ', JSON.stringify(stopScanSuccess));
    connectBLEDevice(espDeviceName, primaryServiceUuid, proofOfPossession, onSuccess, onFailure);
}

// Define failure callback function
function failureStopScan(error) {
    console.error('Failed to connect to BLE device:', error);
    // Additional error handling logic
}

function connectBLEDevice(espDeviceName, primaryServiceUuid, proofOfPossession, onSuccess, onFailure) {
    console.log("entered in connectBLEDevice proofOfPossession: ", proofOfPossession);
    cordova.exec(onSuccess, onFailure, 'ESPIdfProvisioning', 'connectBLEDevice', [espDeviceName, primaryServiceUuid, proofOfPossession]);
}

// Define success callback function
function onSuccess(connectSuccess) {
    console.log('BLE device connected successfully: ', JSON.stringify(connectSuccess));
    //scanNetworks(espDeviceName, onSuccessNetwork, onFailureNetwork);
    scanNetworks(espDeviceName, onSuccessNetwork, onFailureNetwork);
}

// Define failure callback function
function onFailure(error) {
    console.error('Failed to connect to BLE device:', error);
    if (!ref1) {
        const alertDiv = createAlert("Please enter correct POP 1");
        alertContainer.appendChild(alertDiv);
        document.getElementById("frame").style.display = "none";
        document.getElementById("correctPop").style.display = "block";
    }
    else {
        document.getElementById("popup").style.display = "none";
        document.getElementById("popup1").style.display = "none";
    }
}

function scanNetworks(espDeviceName, onSuccessNetwork, onFailureNetwork) {
    console.log("entered in connectBLEDevice", espDeviceName);
    console.log([espDeviceName]);
    cordova.exec(onSuccessNetwork, onFailureNetwork, 'ESPIdfProvisioning', 'scanNetworks', [espDeviceName]);
}

// Define success callback function
function onSuccessNetwork(networkSuccess) {
    console.log('Available wifi Network successful: ', JSON.stringify(networkSuccess));
    // Additional logic after successful connection
    console.log('networkSuccess[0].ssid: ', networkSuccess[0].ssid);
    document.getElementById("frame").style.display = "none";
    document.getElementById("errorContainer").style.display = "none";
    createWifiListItems(networkSuccess);
}

// Define failure callback function
function onFailureNetwork(error) {
    console.error('Failed to get wifi Networks:', error);
    const alertDiv = createAlert("Please enter correct POP 2");
    alertContainer.appendChild(alertDiv);
    document.getElementById("frame").style.display = "none";
    document.getElementById("correctPop").style.display = "block";
}

let ssid;
let passphrase;

function createWifiListItems(networks) {
    const wifiList = document.getElementById('wifiList');
    // Clear any existing items
    wifiList.innerHTML = '';

    // Create and append list items for each network
    networks.forEach(network => {
        const listItem = document.createElement('li');
        let rssi = 100 + network.rssi;
        listItem.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger networkName">${network.ssid}</div> <div class="grid-item right-allign name-length">${rssi}%</div> </div>`;
        wifiList.appendChild(listItem);

        listItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'
            document.getElementById("popup").style.display = "block";
            ssid = network.ssid;
            document.getElementById('wifiName').textContent = ssid;
            console.log('ssid: ', ssid);
        });
    });

    // Append an anchor tag after all list items
    const anchorTag = document.createElement('a');
    anchorTag.id = 'joinNetwork';
    anchorTag.href = '#'; // Set the href attribute to '#' for example
    anchorTag.textContent = 'Join Other Networks'; // Set the text content of the anchor tag
    wifiList.appendChild(anchorTag);

    // Add click event listener to the anchor tag
    anchorTag.addEventListener('click', (event) => {
        // Handle the click event here
        event.preventDefault(); // Prevent the default action of the anchor tag
        console.log('Anchor tag clicked');
        document.getElementById("popup1").style.display = "block";

        // Add your logic here
    });
}

const form = document.getElementById("provisionWifi");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pwd = document.getElementById("wifiPassword").value;
    passphrase = pwd;
    console.log("espDeviceName: ", espDeviceName);
    console.log('ssid: ', ssid);
    console.log('passphrase: ', passphrase);
    provision(espDeviceName, ssid, passphrase, successProvision, failureProvision);
});


const form1 = document.getElementById("provisionWifi1");

form1.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ssidHiddenNetwork = document.getElementById("wifiSSID").value;
    const pwd = document.getElementById("wifiPassword1").value;
    passphrase = pwd;
    console.log("espDeviceName: ", espDeviceName);
    console.log('passphrase: ', passphrase);
    let ssid = ssidHiddenNetwork;
    provision(espDeviceName, ssid, passphrase, successProvision, failureProvision);
});

function provision(espDeviceName, ssid, passphrase, successProvision, failureProvision) {
    cordova.exec(successProvision, failureProvision, 'ESPIdfProvisioning', 'provision', [espDeviceName, ssid, passphrase]);
}

// Define success callback function
async function successProvision(provisionSuccess) {
    console.log('Provisioning Successful: ', JSON.stringify(provisionSuccess));
    const alertDiv = createAlert(JSON.stringify(provisionSuccess));
    alertContainer.appendChild(alertDiv);
    if (provisionSuccess === "DEVICE_PROVISIONING_SUCCESS") {
        ref1 = true;
        const alertDiv = createAlert("Please wait till we assign you this device and redirect you to your Customer Devices page");
        alertContainer.appendChild(alertDiv);
        const token = getToken();
        const deviceName = getMAC();

        const data = { deviceName };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        };


        const response = await fetch("/Assign_Device_To_Customer", options);

        if (response.status === 500) {
            const alertDiv = createAlert('Device successfully added');
            alertContainer.appendChild(alertDiv);
            removeqrOutput();
            window.location.href = '../HTML/customerDevice.html';
        } else if (response.status === 200) {
            const errorMessage = await response.json();
            console.log(errorMessage.error);
            const alertDiv = createAlert(errorMessage.error);
            alertContainer.appendChild(alertDiv);
            window.location.href = '../HTML/customerDevice.html';
        } else {
            const alertDiv = createAlert('Unknown error occurred while assigning device to the customer');
            alertContainer.appendChild(alertDiv);
        }

        //window.location.href = '../HTML/customerDevice.html';
    }
}

// Define failure callback function
function failureProvision(error) {
    console.error('Provisioning failed:', error);
    // Additional error handling logic
}

const submitPop = document.getElementById("provision2");

submitPop.addEventListener('click', async (event) => {
    event.preventDefault();
    document.getElementById("frame").style.display = "flex";
    const popNew = document.getElementById("pop").value;

    const upperMAC1 = await fetchUpperMAC(qrJsonName);
    const mergeMAC1 = await mergeUpperLower(popNew, upperMAC1);
    MAC = await applySemicolon(mergeMAC1);
    console.log('MAC: ', MAC);
    setMAC(MAC);

    proofOfPossession = popNew;
    connectBLEDevice(espDeviceName, primaryServiceUuid, proofOfPossession, onSuccess, onFailure);

    //provision(espDeviceName, ssid, passphrase, successProvision, failureProvision);
});

