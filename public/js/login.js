import { setToken, setLoginEmail, setRefreshToken, createAlert } from "./otherFunc.js";

document.getElementById("submit").addEventListener("click", async (event) => {

    event.preventDefault();
    debugger;
    const bodyElement = document.querySelector('body');

    // Get the page identifier class or data attribute
    let pageIdentifier = bodyElement.classList.contains('page-identifier')
        ? bodyElement.getAttribute('data-page')
        : null;

    console.log('pageIdentifier: ',pageIdentifier);

    const alertContainer = document.getElementById("alertContainer");
    // Get form inputs by id
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    let token;
    let refreshToken;

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
            if(pageIdentifier === 'customerDelete'){
                token = json.accessToken;
                refreshToken = json.refreshToken;
                setToken(token);
                setRefreshToken(refreshToken);
                setLoginEmail(username);
                window.location.href = "/HTML/deleteCustomer.html";
            }
            else if (json.role === "Installer") {
                token = json.accessToken;
                refreshToken = json.refreshToken;
                setToken(token);
                setRefreshToken(refreshToken);
                setLoginEmail(username);
                window.location.href = "/HTML/tenantHome.html";
            }
            else {
                token = json.accessToken;
                refreshToken = json.refreshToken;
                setToken(token);
                setRefreshToken(refreshToken);
                setLoginEmail(username);
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