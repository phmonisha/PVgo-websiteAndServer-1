import { getToken, setToken, getCustomerId, createAlert } from "./otherFunc.js";

const form = document.getElementById("registrationForm");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = getToken();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
        const alertDiv = createAlert("Passwords do not match. Please make sure both passwords are the same.");
        alertContainer.appendChild(alertDiv);
        return; // Stop form submission if passwords don't match
    }

    const formData = new FormData(form);
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    console.log(jsonData);

    if (getCustomerId()) {
        const url = "/addNewCustomerUser_A"; // Replace with your backend API URL
        jsonData.customerId = getCustomerId();

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonData),
            });

            if (response.ok) {
                const responseData = await response.json();
                // Handle successful response data if needed
                const token1 = responseData.accessToken;
                setToken(token1);
                const alertDiv = createAlert(`New Customer User ${responseData.email} successfuly created with User ID : ${responseData.customerId.id}.\n\n
                    Please login with your email ID and password`);
                alertContainer.appendChild(alertDiv);
                window.location.href = '/HTML/customerDevice.html';
            } else {
                //alert("Request failed with status:", response.status);
                const errorText = await response.json(); // Get error message as text
                if (errorText) {
                    const alertDiv = createAlert("Error creating customer: " + errorText.error);
                    alertContainer.appendChild(alertDiv);
                } else {
                    const alertDiv = createAlert("Request failed with status: " + response.status);
                    alertContainer.appendChild(alertDiv);
                }
            }
        } catch (error) {
            const alertDiv = createAlert("Error123: " + error);
            alertContainer.appendChild(alertDiv);
        }
    }
    else {
        const url = "/addNewCustomerUser"; // Replace with your backend API URL

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(jsonData),
            });

            if (response.ok) {
                const responseData = await response.json();
                // Handle successful response data if needed
                const alertDiv = createAlert(`New Customer User ${responseData.email} successfuly created with User ID : ${responseData.customerId.id}.\n\n
                    Please login with your email ID and password`);
                alertContainer.appendChild(alertDiv);
                window.location.href = '/HTML/customerDevice.html';
            } else {
                //alert("Request failed with status:", response.status);
                const errorText = await response.json(); // Get error message as text
                if (errorText) {
                    const alertDiv = createAlert("Error creating customer: " + errorText.error);
                    alertContainer.appendChild(alertDiv);
                } else {
                    const alertDiv = createAlert("Request failed with status: " + response.status);
                    alertContainer.appendChild(alertDiv);
                }
            }
        } catch (error) {
            const alertDiv = createAlert("Error: " + error);
            alertContainer.appendChild(alertDiv);
        }
    };


});