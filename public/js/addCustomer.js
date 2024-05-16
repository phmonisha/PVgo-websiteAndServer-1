import { getToken, setCustomerId, createAlert } from "./otherFunc.js";

const formC = document.getElementById("signinCustomer");
    
    formC.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = getToken();
    
        const formData = new FormData(formC);
        const jsonData = {};
    
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
    
        const url = "/New_Customer_Registration"; // Replace with your backend API URL
        const option = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(jsonData),
            };
    
        try {
            const response = await fetch(url, option);
    
            if (response.ok) {
            const json = await response.json();
            console.log(json);
            if(json.id.entityType === 'CUSTOMER'){
            window.location.href = "/LOGIN_SIGNIN_HTML/Add Customer User.html";
        }
        else {
            const alertDiv = createAlert("Couldn't add customer, try again!");
            alertContainer.appendChild(alertDiv);
        };        
            // Handle the server response as needed
        } else {
            const errorText = await response.json();
            if (errorText) {
                 console.log('errorText: ',errorText.error);
                 const alertDiv = createAlert("errorText.error");
                 alertContainer.appendChild(alertDiv);
            } else {
                const alertDiv = createAlert("Request failed with status: " + response.status);
                 alertContainer.appendChild(alertDiv);
            };
            // Handle the error
        }
        } catch (error) {
            console.error("Error:", error);
        }
    });

    const formC1 = document.getElementById("signinCustomer1");

    formC1.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const formData = new FormData(formC1);
        const jsonData = {};
    
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
    
        const url = "/New_Customer_Registration_A"; // Replace with your backend API URL
        const option = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonData),
            };
    
        try {
            const response = await fetch(url, option);
    
            if (response.ok) {
            const json = await response.json();
            debugger;
            console.log(json.id.id);
            const customerId = json.id.id;
            setCustomerId(customerId);
            if(json.id.entityType === 'CUSTOMER'){
            window.location.href = "/LOGIN_SIGNIN_HTML/Add Customer User.html";
        }
        else{
            const alertDiv = createAlert("Couldn't add customer, try again!");
            alertContainer.appendChild(alertDiv);
        };
            // Handle the server response as needed
        } else {
            const errorText = await response.json();
                        if (errorText) {
                             console.log('errorText: ',errorText.error);
                             const alertDiv = createAlert("errorText.error");
                             alertContainer.appendChild(alertDiv);
                        } else {
                            const alertDiv = createAlert("Request failed with status: " + response.status);
                             alertContainer.appendChild(alertDiv);
                        };
            // Handle the error
        }
        } catch (error) {
            console.error("Error:", error);
        }

    });

    const form = document.getElementById("registrationForm");
    
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = getToken();
    
        const formData = new FormData(form);
        const jsonData = {};
    
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
    
        const url = "/New_Customer_Registration"; // Replace with your backend API URL
        const option = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(jsonData),
            };
    
        try {
            const response = await fetch(url, option);
    
            if (response.ok) {
            const json = await response.json();
            //console.log(json);
            if(json.id.entityType === 'CUSTOMER'){
            window.location.href = "/HTML/tenantCustomer.html";
        }
        else{
            const alertDiv = createAlert("Couldn't add customer, try again!");
            alertContainer.appendChild(alertDiv);
        };
            // Handle the server response as needed
        } else {
            const errorText = await response.json();
                        if (errorText) {
                             console.log('errorText: ',errorText.error);
                             const alertDiv = createAlert(errorText.error);
                             alertContainer.appendChild(alertDiv);
                        } else {
                             const alertDiv = createAlert("Request failed with status: " + response.status);
                             alertContainer.appendChild(alertDiv);
                        };
            // Handle the error
        }
        } catch (error) {
            console.error("Error:", error);
        }
    });