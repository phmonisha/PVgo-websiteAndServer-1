import { setTenantId, createAlert } from "./otherFunc.js";

const formI = document.getElementById("signinInstaller");

formI.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(formI);
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    const url = "/New_Tenant_Registration"; // Replace with your backend API URL
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
            const tenantId = json.id.id;
            setTenantId(tenantId);
            if (json.id.entityType === 'CUSTOMER') {
                window.location.href = "/LOGIN_SIGNIN_HTML/Add Tenant User.html";
            }
            else {
                const alertDiv = createAlert("Couldn't add Tenant, try again!");
                alertContainer.appendChild(alertDiv);
            };
            // Handle the server response as needed
        } else {
            const errorText = await response.json();
            if (errorText) {
                console.log('errorText: ', errorText.error);
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