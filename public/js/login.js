import { setToken, createAlert } from "./otherFunc.js";

document.getElementById("submit").addEventListener("click", async (event) => {

    event.preventDefault();
    const alertContainer = document.getElementById("alertContainer");
    // Get form inputs by id
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    let token;

    const data = { username, password };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    //console.log(options);

    const response = await fetch("/Login", options);


    if (response.ok) {
        const json = await response.json();
        console.log(json);
        if (json.success) {
            if (json.role === "Installer") {
                token = json.accessToken;
                setToken(token);
                window.location.href = "/HTML/tenantHome.html";
            }
            else {
                token = json.accessToken;
                setToken(token);
                window.location.href = "/HTML/customerDevice.html";
            }
        }
        else {
            const alertDiv = createAlert("Authentication failed, try again!");
            alertContainer.appendChild(alertDiv);
        };
        // Handle the server response as needed
    } else {
        console.error("Server request failed:", response.status);
        // Handle the error
    }
});