import { setqrOutput, getqrOutput } from "./otherFunc.js";

const devicePrefix = 'CURVY_';
const transport = 'TRANSPORT_BLE';
const security = 'SECURITY_1';
let wifiList = document.getElementById("wifiList");
const existingListItems = wifiList.querySelectorAll('.devName');
let ssid;
let uuid;
let next = document.getElementById("provision");


document.addEventListener('deviceready', function () {
    document.getElementById("wifiList").innerHTML = "";
    searchESPDevices(devicePrefix, transport, security, successScan, failureScan);
});

function searchESPDevices(devicePrefix, transport, security, successScan, failureScan) {
    console.log('devicePrefix:', devicePrefix);
    console.log('transport:', transport);
    console.log('security:', security);
    cordova.exec(successScan, failureScan, 'ESPIdfProvisioning', 'searchESPDevices', [devicePrefix, transport, security]);
}

async function successScan(scanSuccess) {

    const fetcher = await getqrOutput();
    console.log('BLE device fetch getqrOutput() successfully: ', fetcher);
    if (fetcher === null) {
        console.log('No data in fetcher');
    }
    else {
        const qrJson = JSON.parse(fetcher);
        const qrJsonName = qrJson.name;


        let nameAlreadyExists = Array.from(wifiList.querySelectorAll('.devName')).some(item => item.textContent.trim() === qrJsonName);


                console.log('nameAlreadyExists: ',nameAlreadyExists);
                if (!nameAlreadyExists) {
                    wifiList.innerHTML += `<li><div class="grid-container1"><div class="grid-item center-allign text-bigger devName">${qrJsonName}</div></div></li>`;
                }

        //wifiList.innerHTML = `<li><div class="grid-container1"><div class="grid-item center-allign text-bigger devName">${qrJsonName}</div></div></li>`;
        }

    console.log('BLE device scanned successfully: ', JSON.stringify(scanSuccess));
    console.log('scanSuccess.primaryServiceUuid: ',scanSuccess.primaryServiceUuid);
    console.log('scanSuccess.name: ',scanSuccess.name);
    if (scanSuccess.primaryServiceUuid !== undefined) {
        let espDeviceName = scanSuccess.name;
        //let primaryServiceUuid = scanSuccess.primaryServiceUuid;
        console.log('BLE device scanned successfully espDeviceName: ', espDeviceName);
        //console.log('BLE device scanned successfully primaryServiceUuid: ', primaryServiceUuid);
        //stopSearchingESPDevices(successStopScan, failureStopScan);

//        let nameAlreadyExists = false;
//        existingListItems.forEach(item => {
//            if (item.textContent.trim() === qrJsonName || item.textContent.trim() === espDeviceName) {
//                nameAlreadyExists = true;
//                return;
//            }
//        });
        let nameAlreadyExists = Array.from(wifiList.querySelectorAll('.devName')).some(item => item.textContent.trim() === espDeviceName);


        console.log('nameAlreadyExists: ',nameAlreadyExists);
        if (!nameAlreadyExists) {
            wifiList.innerHTML += `<li><div class="grid-container1"><div class="grid-item center-allign text-bigger devName">${espDeviceName}</div></div></li>`;
        }
    }

    else if (scanSuccess === "OK") {
        document.getElementById("frame").style.display = "none";
    }
}

function failureScan(error) {
    console.log('Failed to scan BLE device:', error);
    // Additional error handling logic

    if (typeof error === 'string' && error.includes('Need android.permission.')) {
        setTimeout(() => {
            window.location.href = '../HTML/withoutQR.html';
        }, 5000); // Delay of 10 seconds (10000 milliseconds)
    } else {
        // Handle other types of errors
        console.error('Failed to scan BLE device:', error);
        // For example, log the error or display a generic error message
    }
}



wifiList.addEventListener("click", function (event) {
    // Check if the clicked element is an <li>
    if (event.target.tagName === "DIV" && event.target.classList.contains("devName")) {
        // Retrieve the SSID and UUID from the clicked <li>
        let listItem = event.target.closest("li");
        ssid = listItem.querySelector(".devName").textContent;

        // Perform further actions with the SSID and UUID
        console.log("Clicked on:", ssid);

        document.getElementById("popBlock").style.display = "block";
        document.getElementById("popDevName").textContent = `Enter POP for ${ssid}`;

    }
});

next.addEventListener("click", function (event) {
    event.stopPropagation();

    const popThis = document.getElementById("pop").value;
    console.log('popThis: ', popThis);

    let qrJsonString = {
        "ver": "v1",
        "name": ssid,
        "pop": popThis,
        "transport": "ble"
    };

    console.log('qrJsonString: ', qrJsonString);
    console.log('qrJsonString: ', JSON.stringify(qrJsonString));
    setqrOutput(JSON.stringify(qrJsonString));
    window.location.href = '../HTML/wifiList.html';
});


