import { setForgotPasswordEmail, createAlert } from "./otherFunc.js";

document.getElementById('submit').addEventListener('click', async function (event) {
    event.preventDefault();
    const alertContainer = document.getElementById("alertContainer");

    const email = document.getElementById("email").value;
    const emailInput = document.getElementById("email");
    const notification = document.getElementById("notif");

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
                console.log('json: ', json);

                if (json.existStatus === 0) {
                    setForgotPasswordEmail(email);
                    //alert('Email exists in DB. taking you to reset pwd page');
                    window.location.href = `../LOGIN_SIGNIN_HTML/resetPassword.html`;
                } else if (json.existStatus === 2) {
                    const alertDiv = createAlert('The email Id you entered do not exist in our database. Please enter correct email Id.');
                    alertContainer.appendChild(alertDiv);
                } else if (json.existStatus === 1) {

                    const data = { email };

                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    };

                    const response1 = await fetch("/sendUserVerificationEmail", options);

                    console.log(response1);

                    if (response1.ok) {
                        const json1 = await response1.json();
                        console.log('json1: ', json1);
                        if (json1.saveCodeResponse === 0) {
                            const alertDiv = createAlert('This email ID already exist in the database. Please use another email ID to create a new account or login using your existing account.');
                            alertContainer.appendChild(alertDiv);
                            window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                        }
                        else if (json1.saveCodeResponse === 1) {
                            const alertDiv = createAlert(`User ${email} isn't verified yet. <br><br>A link has been sent to ${email} for email verification and password creation.`);
                            alertContainer.appendChild(alertDiv);
                            emailInput.value = '';
                            notification.innerHTML = `Please check your mailbox for the password reset link`;
                        }
                        else if (json1.saveCodeResponse === 2) {
                            const alertDiv = createAlert(`User ${email} isn't verified yet. <br><br>A link has been sent to ${email} for email verification and password creation.`);
                            alertContainer.appendChild(alertDiv);
                            emailInput.value = '';
                            notification.innerHTML = `Please check your mailbox for the password reset link`;
                        }
                    }
                    else {
                        console.error("Server request failed:", response1.status);
                        const alertDiv = createAlert('Server error. Try again after sometime');
                        alertContainer.appendChild(alertDiv);
                    }








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