import { getForgotPasswordEmail, createAlert } from "./otherFunc.js";
let resent = false;

document.addEventListener("DOMContentLoaded", async (event) => {
    document.getElementById("resetPwd").addEventListener("click", verifyCodeAndSetPwd);

    document.getElementById('resendVerification').addEventListener('click', resend);

    sendVerifyCode();
})

function resend(){
    resent = true;
    sendVerifyCode();
}

async function sendVerifyCode(){

    const alertContainer = document.getElementById("alertContainer");

    const notification = document.getElementById("verifyEmailNotif");
    const email = getForgotPasswordEmail();

    const data = { email };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetch("/emailForgotPwdCode", options);

        if (response.ok) {
            const json1 = await response.json();
            console.log('json1: ', json1);
            if (json1.saveCodeResponse === 0) {
                const alertDiv = createAlert('No or Duplicate entry. Please contact us on (02) 6652 9700');
                alertContainer.appendChild(alertDiv);
                window.location.href = '../index.html';
            }
            else if (json1.saveCodeResponse === 1) {
                if(resent === false){
                    notification.textContent = `Please enter the 6-digit code sent to your email address ${email}`;
                }
                else {
                    notification.textContent = `Your 6-digit code has been resent to your email address ${email}`;
                }
            }
        }
        else {
            console.error("Server request failed:", response.status);
            const alertDiv = createAlert('Server error. Try again after sometime');
            alertContainer.appendChild(alertDiv);
        }
    } catch (error) {
        console.error("Error during fetch operation:", error.message);
    }
}

async function verifyCodeAndSetPwd(event) {

    const alertContainer = document.getElementById("alertContainer");
    event.preventDefault();
    const notification = document.getElementById("verifyEmailNotif");
    let code = document.getElementById("4code").value;

    const email = getForgotPasswordEmail();

    const data1 = { code, email };

    const options1 = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data1),
    };

    const response1 = await fetch("/verifyResetPwdCode", options1);

    if (response1.ok) {
        const json2 = await response1.json();
        console.log('json1: ', json2);
        if (json2.verifyStatus === false) {
            notification.textContent = `Incorrect code. Please try again.`;
            document.getElementById("4code").value = "";
        }
        else if (json2.verifyStatus === true) {
            //alert('Verification successfull');
            notification.textContent = `Verification successful.`;

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
                            window.location.href = `../index.html`;
                        } else if (json3.resetPwdStatus === false) {
                            const alertDiv = createAlert('Issue while resetting the password');
                            alertContainer.appendChild(alertDiv);
                            window.location.href = `../index.html`;
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
    }

}
