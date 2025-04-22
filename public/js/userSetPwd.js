import { createAlert } from "./otherFunc.js";

const verifyElement = document.getElementById('verifyStatus');
let verifyFlag;
let email = null;

document.addEventListener("DOMContentLoaded", async (event) => {
    event.preventDefault();
    document.getElementById("setPwd").addEventListener("click", verifyCodeAndSetPwd);
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log('Extracted code:', code);

        const data = { code };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response1 = await fetch("/getEmail", options);

        console.log(response1);

        if (response1.ok) {
            const json1 = await response1.json();
            console.log('json1: ', json1);
            if (json1.error) {
                verifyElement.innerHTML = `${json1.error}<br>Password cannot be created`;
            } else if (json1) {
                //alert(json1);

                const email1 = json1; // Adjust if json1 directly gives email
                const data1 = { email1, code };

                console.log('data1: ', data1);

                const options1 = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data1),
                };

                const response2 = await fetch("/verifySignupCode", options1);

                if (response2.ok) {
                    const json2 = await response2.json();
                    console.log('json2: ', json2); // Corrected to json2
                    if (json2.verifyStatus === false) {
                        verifyElement.textContent = `Incorrect code. Please try again.`;
                    } else {
                        // verifyElement.innerHTML = `<strong>Verification is successful.</strong> Please wait till we create an account for you.`;
                        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                        email = email1;
                        const dataFlag = { email };
                        console.log('dataFlag: ', dataFlag);

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
                                verifyElement.innerHTML = `Verification successful...`;
                            }
                        }
                        else {
                            verifyElement.innerHTML = `Verification unsuccessful...Can't set password now.`;
                        }
                        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    }
                } else {
                    console.error("Server request failed:", response2.status);
                    const alertDiv = createAlert('Server error. Failed to do email verification process. Try again after sometime');
                    alertContainer.appendChild(alertDiv);
                }
            } else {
                verifyElement.innerHTML = `Verification unsuccessful !!!<br>Password cannot be created`;
            }
        } else {
            const errorData = await response1.json();
            throw new Error(errorData.error);
        }

    } catch (error) {
        verifyElement.textContent = `${error}`;
    }
});

async function verifyCodeAndSetPwd(event) {
    debugger;
    event.preventDefault();
    let password = document.getElementById("pwd").value;
    let confirm_Password = document.getElementById("conf_pwd").value;

    if (!password || !confirm_Password) {
        const alertDiv = createAlert('Please complete the form. All forms are mandatorily to be filled.');
        alertContainer.appendChild(alertDiv);
    }
    else if (password !== confirm_Password) {
        const alertDiv = createAlert('Password and Confirm password do not match!');
        alertContainer.appendChild(alertDiv);
    }
    else {
        const data2 = { email, password };

        const options2 = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data2),
        };

        //
        //////////////////////////////////////////

        try {
            const response2 = await fetch("/resetPassword", options2);

            if (response2.ok) {
                const json3 = await response2.json();

                if (json3.resetPwdStatus === true) {
                    const alertDiv = createAlert('Password reset successfull. Please login using your registered email and password.');
                    alertContainer.appendChild(alertDiv);
                    setTimeout(function () {
                        window.location.href = '../index.html';
                    }, 3000);
                } else if (json3.resetPwdStatus === false) {
                    const alertDiv = createAlert('Issue while creating password');
                    alertContainer.appendChild(alertDiv);
                    setTimeout(function () {
                        window.location.href = '../index.html';
                    }, 3000);
                }
            }

            else if (!response2.ok) {
                throw new Error(`Server responded with status ${response2.status}`);
            }


        } catch (error) {
            console.error("Error during fetch operation:", error.message);
        }

        ////////////////////////////////////////////
    }
}

