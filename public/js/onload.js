import { getToken, fetchWithToken } from "./otherFunc.js";

document.addEventListener("DOMContentLoaded", async (event) => {
    debugger;
    const token = getToken();

    const data = {};

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    if (token) {


        const response = await fetchWithToken("/onLoad", options);


        if (response.ok) {
            const json = await response.json();
            console.log(json);
            if (json.success) {
                if (json.role === "Installer") {
                    window.location.href = "/HTML/tenantHome.html";
                }
                else {
                    window.location.href = "/HTML/customerDevice.html";
                }
            }
            else {
                null;
            };
            // Handle the server response as needed
        } else {
            console.error("Server request failed:", response.status);
            // Handle the error
        }

    }
});