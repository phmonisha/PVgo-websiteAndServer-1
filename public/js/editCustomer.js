import { getToken, fetchWithToken, createAlert } from "./otherFunc.js";

const formE = document.getElementById("editCustomerForm");
const token = getToken();
console.log(token);

formE.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(formE);
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    const url = "/editCustomer"; // Replace with your backend API URL
    const option = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
    };

    try {
        const response = await fetchWithToken(url, option);

        if (response.ok) {
            const json = await response.json();
            //console.log(json);
            if (json.id.entityType === 'CUSTOMER') {
                const alertDiv = createAlert("Customer data successfully modified");
                alertContainer.appendChild(alertDiv);
                window.location.href = "/HTML/tenantCustomer.html";
            }
            else {
                const alertDiv = createAlert("Couldn't add customer, try again!");
                alertContainer.appendChild(alertDiv);
            };
            // Handle the server response as needed
        } else {
            const alertDiv = createAlert("Server request failed:", response.status);
            alertContainer.appendChild(alertDiv);
            // Handle the error
        }
    } catch (error) {
        console.error("Error:", error);
    }
});