import { getFormData, setCustomerId, setToken, setTenantId, createAlert } from "./otherFunc.js";

let json;
const myElement = document.getElementById('emailDrag');

document.addEventListener('DOMContentLoaded', async function (event) {

    const jsonParsed = await getFormData();
    json = await JSON.parse(jsonParsed);
    myElement.textContent = `Please enter the 4-digit code sent to your email Id ${json.email}`;

    if (json.email !== undefined) {
        sendVerificationEmail(event);
    }

    document.getElementById('resendVerification').addEventListener('click', sendVerificationEmail);
    document.getElementById("verify").addEventListener("click", verifyCode);

});

async function sendVerificationEmail(event) {
    event.preventDefault();
    const alertContainer = document.getElementById("alertContainer");

    const data = json;

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const response = await fetch("/sendSignUpEmail", options);

    if (response.ok) {
        const json1 = await response.json();
        console.log('json1: ', json1);
        if (json1.saveCodeResponse === 0) {
            const alertDiv = createAlert('This email ID already exist in the database. Please use another email ID to create a new account or login using your existing account.');
            alertContainer.appendChild(alertDiv);
            window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
        }
        else if (json1.saveCodeResponse === 1) {
            myElement.textContent = `Please enter the 4-digit code sent to your email Id ${json.email}`;
        }
        else if (json1.saveCodeResponse === 2) {
            myElement.textContent = `The verification code has been resent to your email Id ${json.email}`;
        }
    }
    else {
        console.error("Server request failed:", response.status);
        const alertDiv = createAlert('Server error. Try again after sometime');
        alertContainer.appendChild(alertDiv);
    }
}

async function verifyCode(event) {
    event.preventDefault();

    const alertContainer = document.getElementById("alertContainer");

    let code = document.getElementById("4code").value;

    console.log('json: ', json);
    const email1 = json.email;

    const data1 = { email1, code };

    const options1 = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data1),
    };

    const response1 = await fetch("/verifySignupCode", options1);

    if (response1.ok) {
        const json2 = await response1.json();
        console.log('json1: ', json2);
        if (json2.verifyStatus === false) {
            myElement.textContent = `Incorrect code. Please try again.`;
            document.getElementById("4code").value = "";
        }
        else {
            //debugger;
            myElement.innerHTML = `<strong>Verification is successful.</strong> Please wait till we create an account for you.`;
            document.getElementById("4code").value = "";

            //////////////////CUSTOMER START

            const title = json.title;
            const customerOrInstaller = json.customerOrInstaller;

            ///////////

            const jsonData = { title };

            if (customerOrInstaller === "Customer") {
                const url = "/New_Customer_Registration_A"; // Replace with your backend API URL
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
                        const json3 = await response.json();
                        console.log(json3.id.id);
                        const customerId = json3.id.id;
                        setCustomerId(customerId);
                        if (json3.id.entityType === 'CUSTOMER') {
                            ///////////////////////////CustomerUser Start

                            const password = json.password;
                            const confirm_password = json.confirmPassword;
                            const email = json.email;

                            const jsonData1 = { email, password, confirm_password, customerId };

                            if (customerId) {
                                const url = "/addNewCustomerUser_A"; // Replace with your backend API URL

                                try {
                                    const response2 = await fetch(url, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(jsonData1),
                                    });

                                    if (response2.ok) {
                                        const responseData = await response2.json();
                                        // Handle successful response data if needed
                                        const token1 = responseData.accessToken;
                                        setToken(token1);
                                        const alertDiv = createAlert(`New Customer User ${responseData.email} successfully created with User ID : ${responseData.customerId.id}.\n\n
                                                                                                             Please login with your email ID and password`);
                                        alertContainer.appendChild(alertDiv);
                                        //////////set verify flag start
                                        const dataFlag = { email };

                                        const url1 = "/setVerifyFlag";

                                        const responses = await fetch(url1, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify(dataFlag),
                                        });

                                        if (responses.ok) {
                                            const responsesData = await responses.json();
                                            // Handle successful response data if needed
                                            if (responsesData.verifyFlagStatus === true) {
                                                //alert('Verification status set to true.');
                                                window.location.href = '../HTML/customerDevice.html';
                                            }
                                        }
                                        else {
                                            //alert('Unable to set verification status to true.');
                                            try {
                                                const dataId = { customerId };
                                                const option = {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify(dataId),
                                                };

                                                const resp = await fetch("/deleteCustomer_A", option);

                                                if (resp.ok) {
                                                    const customerData = await resp.json();
                                                    console.log({ customerData });
                                                    // You can access specific properties of customerData if needed
                                                    const alertDiv = createAlert(`Customer ${title} successfully deleted. Please try again`);
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                } else {
                                                    // Handle non-OK responses here
                                                    const alertDiv = createAlert("Error deleting the customer");
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                }
                                            } catch (error) {
                                                // Handle client-side errors here
                                                console.error(error);
                                                const alertDiv = createAlert("An error occurred while deleting the customer");
                                                alertContainer.appendChild(alertDiv);
                                                window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                            }
                                        }

                                        //////////set verify flag end
                                    } else {
                                        //alert("Request failed with status:", response.status);
                                        const errorText = await response2.json(); // Get error message as text
                                        if (errorText) {
                                            const alertDiv = createAlert(errorText.error);
                                            alertContainer.appendChild(alertDiv);
                                            if (errorText.error === `User with email '${email}'  already present in database!`) {
                                                /////////////////DeleteCustomer Start
                                                try {
                                                    const dataId = { customerId };
                                                    const option = {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify(dataId),
                                                    };

                                                    const resp = await fetch("/deleteCustomer_A", option);

                                                    if (resp.ok) {
                                                        const customerData = await resp.json();
                                                        console.log({ customerData });
                                                        // You can access specific properties of customerData if needed
                                                        const alertDiv = createAlert(`Customer ${title} successfully deleted. Please use a different email Id`);
                                                        alertContainer.appendChild(alertDiv);
                                                        window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                    } else {
                                                        // Handle non-OK responses here
                                                        const alertDiv = createAlert("Error deleting the customer");
                                                        alertContainer.appendChild(alertDiv);
                                                        window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                    }
                                                } catch (error) {
                                                    // Handle client-side errors here
                                                    console.error(error);
                                                    const alertDiv = createAlert("An error occurred while deleting the customer");
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                }

                                                /////////////////DeleteCustomer End

                                            }
                                        } else {
                                            const alertDiv = createAlert("Request failed with status: " + response2.status);
                                            alertContainer.appendChild(alertDiv);
                                        }
                                    }
                                } catch (error) {
                                    const alertDiv = createAlert("Error123: " + error);
                                    alertContainer.appendChild(alertDiv);
                                }
                            }
                            ///////////////////////////CustomerUser End
                        }
                        else {
                            const alertDiv = createAlert("Couldn't add customer, try again!");
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
                //////////////////CUSTOMER END
            }
            else if (customerOrInstaller === "Installer") {
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
                        const json3 = await response.json();
                        console.log(json3.id.id);
                        const tenantId = json3.id.id;
                        if (json3.id.entityType === 'CUSTOMER') {
                            setTenantId(tenantId);
                            ///////////////////////////TenantUser Start
                            const password = json.password;
                            const confirm_password = json.confirmPassword;
                            const email = json.email;

                            const jsonData1 = { email, password, confirm_password, tenantId };

                            if (tenantId) {
                                const url = "/addNewTenantUser_A"; // Replace with your backend API URL

                                try {
                                    const response2 = await fetch(url, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(jsonData1),
                                    });

                                    if (response2.ok) {
                                        const responseData = await response2.json();
                                        // Handle successful response data if needed
                                        const token1 = responseData.accessToken;
                                        setToken(token1);
                                        const alertDiv = createAlert(`New Installer User ${responseData.email} successfuly created with User ID : ${responseData.customerId.id}.\n\n
                                                                                                             Please login with your email ID and password`);
                                        alertContainer.appendChild(alertDiv);

                                        //////////set verify flag start
                                        const dataFlag = { email };

                                        const url1 = "/setVerifyFlag";

                                        const responses = await fetch(url1, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify(dataFlag),
                                        });

                                        if (responses.ok) {
                                            const responsesData = await responses.json();
                                            // Handle successful response data if needed
                                            if (responsesData.verifyFlagStatus === true) {
                                                //alert('Verification status set to true.');
                                                window.location.href = '../HTML/tenantCustomer.html';
                                            }
                                        }
                                        else {
                                            //alert('Unable to set verification status to true.');
                                            try {
                                                const dataId = { tenantId };
                                                const option = {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify(dataId),
                                                };

                                                const resp = await fetch("/deleteTenant_A", option);

                                                if (resp.ok) {
                                                    const customerData = await resp.json();
                                                    console.log({ customerData });
                                                    // You can access specific properties of customerData if needed
                                                    const alertDiv = createAlert(`Installer ${title} successfully deleted. Please use a different email Id`);
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                } else {
                                                    // Handle non-OK responses here
                                                    const alertDiv = createAlert("Error deleting the Installer");
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                }
                                            } catch (error) {
                                                // Handle client-side errors here
                                                console.error(error);
                                                const alertDiv = createAlert("An error occurred while deleting the customer");
                                                alertContainer.appendChild(alertDiv);
                                                window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                            }
                                        }

                                        //////////set verify flag end
                                    } else {
                                        //alert("Request failed with status:", response.status);
                                        const errorText = await response2.json(); // Get error message as text
                                        if (errorText) {
                                            const alertDiv = createAlert(errorText.error);
                                            alertContainer.appendChild(alertDiv);
                                            if (errorText.error === `User with email '${email}'  already present in database!`) {
                                                /////////////////DeleteTenant Start
                                                console.log('Inside ABC');
                                                try {
                                                    const dataId = { tenantId };
                                                    const option = {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify(dataId),
                                                    };

                                                    const resp = await fetch("/deleteTenant_A", option);

                                                    if (resp.ok) {
                                                        const customerData = await resp.json();
                                                        console.log({ customerData });
                                                        // You can access specific properties of customerData if needed
                                                        const alertDiv = createAlert(`Installer ${title} successfully deleted. Please use a different email Id`);
                                                        alertContainer.appendChild(alertDiv);
                                                        window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                    } else {
                                                        // Handle non-OK responses here
                                                        const alertDiv = createAlert("Error deleting the Installer");
                                                        alertContainer.appendChild(alertDiv);
                                                        window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                    }
                                                } catch (error) {
                                                    // Handle client-side errors here
                                                    console.error(error);
                                                    const alertDiv = createAlert("An error occurred while deleting the customer");
                                                    alertContainer.appendChild(alertDiv);
                                                    window.location.href = '../LOGIN_SIGNIN_HTML/SignUp.html';
                                                }

                                                /////////////////DeleteTenant End

                                            }
                                        } else {
                                            const alertDiv = createAlert("Request failed with status: " + response2.status);
                                            alertContainer.appendChild(alertDiv);
                                        }
                                    }
                                } catch (error) {
                                    const alertDiv = createAlert("Error123: " + error);
                                    alertContainer.appendChild(alertDiv);
                                }
                            }
                            ///////////////////////////TenantUser End
                        }
                        else {
                            const alertDiv = createAlert("Couldn't add customer, try again!");
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
            }
        }
    }
    else {
        console.error("Server request failed:", response1.status);
        const alertDiv = createAlert('Server error. Failed to do email verification process. Try again after sometime');
        alertContainer.appendChild(alertDiv);
    }

};
