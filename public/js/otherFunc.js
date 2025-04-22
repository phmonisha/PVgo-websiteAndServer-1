export async function unassignCustomerDevice(deviceId) {
    try {
        const token = getToken();
        const dataId = { deviceId };
        const option = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataId),
        };

        const resp = await fetchWithToken("/unassignDevice", option);

        if (resp.ok) {
            const deviceData = await resp.json();
            // You can access specific properties of deviceData if needed
            const alertDiv = createAlert("Device deleted successfully");
            alertContainer.appendChild(alertDiv);
            window.location.href = '/HTML/customerDevice.html';
        } else {
            // Handle non-OK responses here
            const alertDiv = createAlert("Error deleting the device");
            alertContainer.appendChild(alertDiv);
            window.location.href = '/HTML/customerDevice.html';
        }
    } catch (error) {
        // Handle client-side errors here
        console.error(error);
        const alertDiv = createAlert("An error occurred while deleting the device");
        alertContainer.appendChild(alertDiv);
        window.location.href = '/HTML/customerDevice.html';
    }
};

export async function populateCustomer(customerId) {
    try {
        const title = document.getElementById("title");
        const country = document.getElementById("country");
        const state = document.getElementById("state");
        const city = document.getElementById("city");
        const address = document.getElementById("address");
        const address2 = document.getElementById("address2");
        const zip = document.getElementById("zip");
        const phone = document.getElementById("phone");
        const email = document.getElementById("email");

        const token = getToken();

        const dataId = { customerId };
        const option = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataId),
        };

        const resp = await fetchWithToken("/populateCustomer", option);

        if (resp.ok) {
            const customerData = await resp.json();
            title.value = customerData.title;
            country.value = customerData.country;
            state.value = customerData.state;
            city.value = customerData.city;
            address.value = customerData.address;
            address2.value = customerData.address2;
            zip.value = customerData.zip;
            phone.value = customerData.phone;
            email.value = customerData.email;
        } else {
            // Handle non-OK responses here
            const alertDiv = createAlert("An error occurred while populating customer details for modification");
            alertContainer.appendChild(alertDiv);
            // window.location.href = '/tenantCustomer';
        }
    } catch (error) {
        // Handle client-side errors here
        console.error(error);
        const alertDiv = createAlert("An error occurred while populating customer details for modification");
        alertContainer.appendChild(alertDiv);
        //window.location.href = '/tenantCustomer';
    }
};

export async function updateAlarm(id, btn){
    try {
        const token = getToken();
        const dataId = { id, btn };
        const option = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataId),
        };

        const resp = await fetchWithToken("/updateAlarm", option);

        if (resp.ok) {
            const status = await resp.json();
            return status.alarmStatus;
        } else {
            return false;
        }
    } catch (error) {
        // Handle client-side errors here
        console.error(error);
        return false;
    }
}

export async function populateDeviceLable(deviceId, lable) {
    try {
        const custDevlable = document.getElementById("lable");
        custDevlable.value = lable;

        const token = getToken();

        const dataId = { deviceId };
        const option = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataId),
        };

        await fetchWithToken("/setDeviceID", option);


    } catch (error) {
        // Handle client-side errors here
        console.error(error);
        const alertDiv = createAlert("An error occurred while populating device lable for modification");
        alertContainer.appendChild(alertDiv);
        //window.location.href = '/tenantCustomer';
    }
}


export async function deleteCustomer(customerId) {

    try {
        const token = getToken();
        const dataId = { customerId };
        const option = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataId),
        };

        const resp = await fetchWithToken("/deleteCustomer", option);

        if (resp.ok) {
            const customerData = await resp.json();
            // You can access specific properties of customerData if needed
            const alertDiv = createAlert("Customer successfully deleted");
            alertContainer.appendChild(alertDiv);
            window.location.href = '/HTML/tenantCustomer.html';
        } else {
            // Handle non-OK responses here
            const alertDiv = createAlert("Error deleting the customer");
            alertContainer.appendChild(alertDiv);
            window.location.href = '/HTML/tenantCustomer.html';
        }
    } catch (error) {
        // Handle client-side errors here
        console.error(error);
        const alertDiv = createAlert("An error occurred while deleting the customer");
        alertContainer.appendChild(alertDiv);
        window.location.href = '/HTML/tenantCustomer.html';
    }
};

export function setToken(token) {
    localStorage.setItem('token', token);
};

export function getToken() {
    return localStorage.getItem('token');
};

export function removeToken() {
    localStorage.removeItem('token');
};

export function setRefreshToken(refreshToken) {
    console.log('token inside setToken: ',refreshToken);
    localStorage.setItem('refreshToken', refreshToken);
};

export function getRefreshToken() {
    console.log(localStorage.getItem('refreshToken'));
    return localStorage.getItem('refreshToken');
};

export function removeRefreshToken() {
    localStorage.removeItem('refreshToken');
};

export function setLoginEmail(email) {
    localStorage.setItem('email', email);
};

export function getLoginEmail() {
    console.log(localStorage.getItem('email'));
    return localStorage.getItem('email');
};

export function removeLoginEmail() {
    localStorage.removeItem('email');
};

export function convertEpochToAEST(epochTimeInput) {
    console.log('epochTimeInput:',epochTimeInput);
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
    return Datetime;
}

export function setCustomerId(customerId) {
    localStorage.setItem('customerId', customerId);
};

export function getCustomerId() {
    return localStorage.getItem('customerId');
};

export function removeCustomerId() {
    localStorage.removeItem('customerId');
};

export function setTenantId(tenantId) {
    localStorage.setItem('tenantId', tenantId);
};

export function getTenantId() {
    return localStorage.getItem('tenantId');
};

export function removeTenantId() {
    localStorage.removeItem('tenantId');
};

export function setqrOutput(qrOutput) {
    localStorage.setItem('qrOutput', qrOutput);
};

export function getqrOutput() {
    return localStorage.getItem('qrOutput');
};

export function removeqrOutput() {
    localStorage.removeItem('qrOutput');
};

export function setMAC(MAC) {
    localStorage.setItem('MAC', MAC);
};

export function getMAC() {
    return localStorage.getItem('MAC');
};

export function removeMAC() {
    localStorage.removeItem('MAC');
};

export function setFormData(formData) {
    localStorage.setItem('formData', formData);
};

export function getFormData() {
    return localStorage.getItem('formData');
};

export function removeFormData() {
    localStorage.removeItem('formData');
};

export function setForgotPasswordEmail(email) {
    localStorage.setItem('email', email);
};

export function getForgotPasswordEmail() {
    return localStorage.getItem('email');
};

export function removeForgotPasswordEmail() {
    localStorage.removeItem('email');
};

// export function setTenantDashboard([customerId, deviceId]) {
//     localStorage.setItem('customerIDtenantDashboard', customerId);
//     localStorage.setItem('deviceIDtenantDashboard', deviceId);
// };

// export function getTenantDashboard() {
//     const customerIDtenantDashboard = localStorage.getItem('customerIDtenantDashboard');
//     const deviceIDtenantDashboard = localStorage.getItem('deviceIDtenantDashboard');
//     return [customerIDtenantDashboard, deviceIDtenantDashboard];
// };

export function removeTenantDashboard() {
    localStorage.removeItem('customerIDtenantDashboard');
    localStorage.removeItem('deviceIDtenantDashboard');
};


export function createAlert(message) {
    const alertContainer = document.getElementById("alertContainer");

    const alertDiv = document.createElement('div');
    alertDiv.className = 'popup';
    alertDiv.style.display = 'block';

    const customAlertDiv = document.createElement('div');
    customAlertDiv.className = 'custom-alert';

    const alertTopDiv = document.createElement('div');
    alertTopDiv.className = 'alertTop';

    const innerAlertTopDiv = document.createElement('div');
    innerAlertTopDiv.className = 'innerAlertTop';
    innerAlertTopDiv.innerText = 'Alert';

    const closeIconSpan = document.createElement('span');
    closeIconSpan.className = 'close-icon';
    closeIconSpan.innerText = '✖';
    closeIconSpan.addEventListener('click', function () {
        alertContainer.removeChild(alertDiv);
    });

    alertTopDiv.appendChild(innerAlertTopDiv);
    alertTopDiv.appendChild(closeIconSpan);

    const alertContDiv = document.createElement('div');
    alertContDiv.className = 'alertCont';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `<span class="icon">🔔</span> ${message}`;

    const okButton = document.createElement('button');
    okButton.className = 'ok-button';
    okButton.innerText = 'OK';
    okButton.addEventListener('click', function () {
        alertContainer.removeChild(alertDiv);
    });

    alertContDiv.appendChild(messageDiv);

    customAlertDiv.appendChild(alertTopDiv);
    customAlertDiv.appendChild(alertContDiv);
    customAlertDiv.appendChild(okButton);

    alertDiv.appendChild(customAlertDiv);

    return alertDiv;
};

export function createConfirm(message, callback) {
    const confirmContainer = document.getElementById("confirmContainer");

    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'popup';
    confirmDiv.style.display = 'block';

    const customConfirmDiv = document.createElement('div');
    customConfirmDiv.className = 'custom-confirm';

    const confirmTopDiv = document.createElement('div');
    confirmTopDiv.className = 'confirmTop';

    const innerConfirmTopDiv = document.createElement('div');
    innerConfirmTopDiv.className = 'innerConfirmTop';
    innerConfirmTopDiv.innerText = 'Confirmation';

    const closeIconSpan = document.createElement('span');
    closeIconSpan.className = 'close-icon';
    closeIconSpan.innerText = '✖';
    closeIconSpan.addEventListener('click', function () {
        confirmContainer.removeChild(confirmDiv);
    });

    confirmTopDiv.appendChild(innerConfirmTopDiv);
    confirmTopDiv.appendChild(closeIconSpan);

    const confirmContDiv = document.createElement('div');
    confirmContDiv.className = 'confirmCont';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `<span class="icon">⚠️</span> ${message}`;

    confirmContDiv.appendChild(messageDiv);

    customConfirmDiv.appendChild(confirmTopDiv);
    customConfirmDiv.appendChild(confirmContDiv);

    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'buttonContainer';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.innerText = 'Cancel';
    cancelButton.addEventListener('click', function () {
        confirmContainer.removeChild(confirmDiv);
    });

    const okButton = document.createElement('button');
    okButton.className = 'okC-button';
    okButton.innerText = 'OK';
    okButton.addEventListener('click', function () {
        callback();
        confirmContainer.removeChild(confirmDiv);
    });

    buttonDiv.appendChild(cancelButton);
    buttonDiv.appendChild(okButton);

    customConfirmDiv.appendChild(buttonDiv);

    confirmDiv.appendChild(customConfirmDiv);

    return confirmDiv;
};


export async function fetchWithToken(url, options) {
    debugger;
    let token = localStorage.getItem('token');
    console.log('token: ',token);

    if (!token) {
        window.location.href = '../index.html';
        throw new Error('No access token available');
    }

    options.headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, options);
    console.log('response:', response);

    if (response.status === 403) {
        // Token might be expired, try to refresh it
        try {
            token = await refreshAccessToken();
            options.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, options);
        } catch (error) {
            console.error('Failed to refresh token:', error);
            window.location.href = '../index.html';
            //console.log('Failed to refresh token:', error);
            // Handle the error (e.g., redirect to login)
        }
    }
    else if (response.status === 500 || response.status === 403) {
        // Need re-login due to server restart
        alert('Your account needs re-login. You are being redirected to the login page.');
        window.location.href = '../index.html';
    }

    return response;
};

async function refreshAccessToken() {
    debugger;
    const refreshToken = localStorage.getItem('refreshToken'); // Assuming you're storing the refresh token in local storage
    console.log('refreshToken: ',refreshToken);
    const response = await fetch("/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: refreshToken, loginEmail: getLoginEmail() }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken); // Store the new access token
        return data.accessToken;
    } else {
        removeRefreshToken();
        removeToken();
        removeLoginEmail();
        throw new Error('Failed to refresh access token');
    }
}