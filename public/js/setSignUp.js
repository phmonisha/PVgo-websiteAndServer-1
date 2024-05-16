import { setFormData, setToken, createAlert } from "./otherFunc.js";

const form = document.getElementById('signinInstaller');


form.addEventListener('submit', async function (event) {
const alertContainer = document.getElementById("alertContainer");

    event.preventDefault();

    // Get form data
    const formData = new FormData(form);

    const formDataObject = {};
    formData.forEach((value, key) => {
        formDataObject[key] = value;
    });

    console.log(formDataObject.title);
    const password = formDataObject.password;

    if (!formDataObject.title || !formDataObject.email || !formDataObject.password || !formDataObject.confirmPassword || !formDataObject.customerOrInstaller) {
        //alert('Fields marked with * are mandatory!');
        const alertDiv = createAlert('Fields marked with * are mandatory!');
        alertContainer.appendChild(alertDiv);
    }

    // Check if password is at least 8 characters long8
    else if (password.length < 8) {
        const alertDiv = createAlert('Password must be at least 8 characters long.');
        alertContainer.appendChild(alertDiv);
    }

    // Check if password contains at least one uppercase character
    else if (!/[A-Z]/.test(password)) {
        const alertDiv = createAlert('Password must contain at least one uppercase character.');
        alertContainer.appendChild(alertDiv);
    }

    // Check if password contains at least one digit
    else if (!/\d/.test(password)) {
        const alertDiv = createAlert('Password must contain at least one digit.');
        alertContainer.appendChild(alertDiv);
    }

    // Check if password contains at least one special character
    else if (!/[^a-zA-Z0-9]/.test(password)) {
        const alertDiv = createAlert('Password must contain at least one special character.');
        alertContainer.appendChild(alertDiv);
    }

    else if (formDataObject.password !== formDataObject.confirmPassword) {
        const alertDiv = createAlert('Confirm password should be same as the Password');
        alertContainer.appendChild(alertDiv);
    }

    else {

        const title = formDataObject.title;

        const data1 = { title };

        const options1 = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data1),
        };

        const response1 = await fetch("/checkIfExistingCustomer", options1);

        if (response1.ok) {
            const json2 = await response1.json();
            console.log('json1: ', json2);
            if (json2.existingCustomer === false) {
                let titleVerification = document.getElementById("titleVerify").value;

                const alertDiv = createAlert(`This name '${titleVerification}' is already taken. Please use any other name`);
                alertContainer.appendChild(alertDiv);
            }
            else {
                // Store form data in local storage
                setFormData(JSON.stringify(formDataObject));
                window.location.href = '../LOGIN_SIGNIN_HTML/verifyEmail.html';
            }
        }
        else {
            console.error("Server request failed:", response1.status);
            const alertDiv = createAlert('Server error. Failed to do email verification process. Try again after sometime');
            alertContainer.appendChild(alertDiv);
        }

    }
});