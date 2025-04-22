import { getToken, fetchWithToken, setToken, getCustomerId, createAlert } from "./otherFunc.js";

const form = document.getElementById("registrationForm");

form.addEventListener("submit", async (event) => {
    debugger;
    event.preventDefault();

    const bodyElement = document.querySelector('body');
    let pageIdentifier = bodyElement.classList.contains('page-identifier')
        ? bodyElement.getAttribute('data-page')
        : null;

    const token = getToken();

    if (!pageIdentifier) {
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;

        if (password !== confirmPassword) {
            const alertDiv = createAlert("Passwords do not match. Please make sure both passwords are the same.");
            alertContainer.appendChild(alertDiv);
            return;
        }
    }

    const email = document.getElementById("email").value;

    const formData = new FormData(form);
    const jsonData = {};
    let url = null;

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    console.log(jsonData);

    if (pageIdentifier) {
        console.log({ pageIdentifier });
        jsonData.pageIdentifier = pageIdentifier;

    }

    if (getCustomerId()) {
        url = "/addNewCustomerUser_A";
        jsonData.customerId = getCustomerId();
    }
    else {
        url = "/addNewCustomerUser";
    }

    try {
        const response = await fetchWithToken(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonData),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log({ responseData });
            // setTimeout(() => {
            //     window.location.href = '/HTML/customerDevice.html';
            // }, 5000);

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
                    const alertDiv = createAlert(`User creation successful. <br><br> <strong>Set Password link has been emailed to ${responseData.email}`);
                    alertContainer.appendChild(alertDiv);
                    form.reset();
                }
                else if (json1.saveCodeResponse === 2) {
                    const alertDiv = createAlert(`User creation successful. <br><br> <strong>Set Password link has been emailed to ${responseData.email}`);
                    alertContainer.appendChild(alertDiv);
                    form.reset();
                }
            }
            else {
                console.error("Server request failed:", response1.status);
                const alertDiv = createAlert('Server error. Try again after sometime');
                alertContainer.appendChild(alertDiv);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else {
            //alert("Request failed with status:", response.status);
            const errorText = await response.json(); // Get error message as text
            if (errorText) {
                const alertDiv = createAlert(errorText.error);
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


});