import { removeToken, removeRefreshToken, removeLoginEmail, removeCustomerId, removeTenantId, createConfirm, removeTenantDashboard, getLoginEmail, fetchWithToken } from "./otherFunc.js";

document.getElementById('logoutButton1').addEventListener('click', async () => {

    const data = { email: getLoginEmail() };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
});
