import { fetchWithToken, removeToken, removeRefreshToken, removeLoginEmail, removeCustomerId, removeTenantId, createConfirm, removeTenantDashboard, getLoginEmail, createAlert } from "./otherFunc.js";

document.addEventListener("DOMContentLoaded", async (event) => {

    let type;

    const name = document.getElementById("Name");
    const email = document.getElementById("Email");
    const role = document.getElementById("Role");
    const deleteButton = document.getElementById('deleteCustomer');
    let data = {};

    const url = "/populateCustomerDetails"; // Replace with your backend API URL

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetchWithToken(url, options);

        if (response.ok) {
            const result = await response.json();
            console.log('result.accountDetails: ', result.accountDetails);

            name.textContent = result.accountDetails.title;
            email.textContent = result.accountDetails.email_list;
            role.textContent = result.accountDetails.type;

            type = result.accountDetails.type;

            deleteButton.textContent = `Delete ${result.accountDetails.type} Account`;

        } else {
            null;
        }
    } catch (error) {
        null;
    }

    deleteButton.addEventListener("click", async (event) => {
        event.preventDefault();

        debugger;

        function testConfirm() {
            const confirmContainer = document.getElementById("confirmContainer");
            const confirmDialog = createConfirm(`Are you sure you want to delete this ${type}? Please note that the action will cause the deletion of all the data related to this specific ${type} and all its users.`, function () {
                try {
                    deleteCust();
                } catch (error) {
                    console.log(error);
                }
            });

            confirmContainer.appendChild(confirmDialog);
        }

        testConfirm();

        async function deleteCust() {
            const bodyElement = document.querySelector('body');
            let pageIdentifier = bodyElement.classList.contains('page-identifier')
                ? bodyElement.getAttribute('data-page')
                : null;

            const data2 = { pageIdentifier };

            const url = "/deleteCustomer"; // Replace with your backend API URL

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data2),
            };

            try {
                const response = await fetchWithToken(url, options);

                if (response.ok) {
                    const customerData = await response.json();

                    // Hide the alert container
                    confirmContainer.style.display = 'none';

                    // You can access specific properties of customerData if needed
                    const alertDiv = createAlert(`${type} account successfully deleted`);
                    alertContainer.appendChild(alertDiv);
                    
                    // Delay for 2 seconds
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    /////////////////////////////////////////////////////////////
                    const data1 = { email: getLoginEmail() };

                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data1),
                    };

                    try {
                        const response = await fetchWithToken("/logout", options);

                        if (response.ok) {
                            testConfirm(); // Call the function
                        } else {
                            throw new Error(`Server responded with status ${response.status}`);
                        }
                    } catch (error) {
                        console.error("Error during fetch operation:", error.message);
                    }

                    function testConfirm() {
                        const confirmContainer = document.getElementById("confirmContainer");
                        const confirmDialog = createConfirm("Are you sure you want to log out?", function () {
                            removeToken();
                            removeCustomerId();
                            removeTenantId();
                            removeTenantDashboard();
                            removeRefreshToken();
                            removeLoginEmail();
                            localStorage.removeItem('alarmFilterJson');
                            localStorage.removeItem('panelDeviceId');
                            window.location.href = "../index.html";
                        });

                        confirmContainer.appendChild(confirmDialog);
                    }

                    /////////////////////////////////////////////////////////////
                    window.location.href = '../HTML/dcLogin.html';

                } else {
                    null;
                }
            } catch (error) {
                null;
            }
        }


    });
});