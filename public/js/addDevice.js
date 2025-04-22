import { getToken, fetchWithToken, createAlert } from "./otherFunc.js";

document.getElementById('add').addEventListener('click', async (event) => {

    event.preventDefault();
    const token = getToken();

    const deviceName = document.getElementById('deviceName').value;

    const data = { deviceName };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };


    const response = await fetchWithToken("/Assign_Device_To_Customer", options);

    if (response.status === 500) {
        alert('Device successfully added');
        window.location.href = '/HTML/customerDevice.html';
    } else if (response.status === 200) {
        const errorMessage = await response.json();
        console.log(errorMessage.error);
        alert(errorMessage.error);
    } else {
        alert('Unknown error occurred');
    }
});

const formE = document.getElementById("editDeviceForm");

formE.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(formE);
    const jsonData = {};
    const token = getToken();

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    const url = "/editDeviceLable"; // Replace with your backend API URL
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
    };

    try {
        const response = await fetchWithToken(url, options);

        if (response.ok) {
            const json = await response.json();
            console.log(json);
            window.location.href = "../HTML/customerDevice.html";
            // Handle the server response as needed
        } else {
            // If response is not okay, handle the error
            throw new Error(`Server request failed: ${response.status}`);
        }
    } catch (error) {
        console.error("Error:", error);
        const alertDiv = createAlert("An error occurred. Please try again later.");
        alertContainer.appendChild(alertDiv);
    }
});


const formP = document.getElementById("pannelForm");

formP.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = {};
    const token = getToken();

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetchWithToken("/getDeviceId", options);

        if (response.ok) {
            const json = await response.json();
            console.log(json.deviceId);
            localStorage.setItem('panelDeviceId', json.deviceId);
            window.location.href = "../HTML/customerPanel.html";
            // Handle the server response as needed
        } else {
            // If response is not okay, handle the error
            throw new Error(`Server request failed: ${response.status}`);
        }
    } catch (error) {
        console.error("Error:", error);
        const alertDiv = createAlert("An error occurred. Please try again later.");
        alertContainer.appendChild(alertDiv);
    }
})

