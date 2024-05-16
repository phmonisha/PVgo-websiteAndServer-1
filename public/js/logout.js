import { removeToken, removeCustomerId, removeTenantId, createConfirm, removeTenantDashboard } from "./otherFunc.js";

document.getElementById('logoutButton1').addEventListener('click', async () => {
    function testConfirm() {
        const confirmContainer = document.getElementById("confirmContainer");
        const confirmDialog = createConfirm("Are you sure you want to log out?", function () {
            removeToken();
            removeCustomerId();
            removeTenantId();
            removeTenantDashboard();
            localStorage.removeItem('alarmFilterJson');
            localStorage.removeItem('panelDeviceId');
            window.location.href = "../index.html";
        });

        confirmContainer.appendChild(confirmDialog);
    }

    testConfirm();
});
