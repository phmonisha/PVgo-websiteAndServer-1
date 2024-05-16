import { getToken } from "./otherFunc.js";

document.addEventListener("DOMContentLoaded", async (event) => {
    const token = getToken();

    const data = {};

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    };

    //console.log(options);

    const response = await fetch("/onLoad", options);


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

});