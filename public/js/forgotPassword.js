import { setForgotPasswordEmail, createAlert } from "./otherFunc.js";

document.getElementById('submit').addEventListener('click', async function (event) {
    event.preventDefault();
    const alertContainer = document.getElementById("alertContainer");

    const email = document.getElementById("email").value;

    if (!email) {
        const alertDiv = createAlert('Please enter your registered email id!');
        alertContainer.appendChild(alertDiv);
    }
    else {
        const data = { email };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        try {
            const response = await fetch("/checkIfExists", options);

            if (response.ok) {
                const json = await response.json();

                if (json.existStatus) {
                    setForgotPasswordEmail(email);
                    //alert('Email exists in DB. taking you to reset pwd page');
                    window.location.href = `../LOGIN_SIGNIN_HTML/resetPassword.html`;
                } else if (!json.existStatus) {
                    const alertDiv = createAlert('The email Id you entered do not exist in our database. Please enter correct email Id.');
                    alertContainer.appendChild(alertDiv);
                }
            }

            else if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }


        } catch (error) {
            console.error("Error during fetch operation:", error.message);
        }
    }
});