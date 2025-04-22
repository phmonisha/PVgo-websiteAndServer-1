import { getToken, fetchWithToken } from "./otherFunc.js";

document.addEventListener("DOMContentLoaded", async (event) => {
    const token = getToken();

    const nameHome = document.getElementById("nameHome");
    const countryHome = document.getElementById("countryHome");
    const stateHome = document.getElementById("stateHome");
    const cityHome = document.getElementById("cityHome");
    const addressHome = document.getElementById("addressHome");
    const address2Home = document.getElementById("address2Home");
    const zipHome = document.getElementById("zipHome");
    const phoneHome = document.getElementById("phoneHome");
    const emailHome = document.getElementById("emailHome");
    const customerCount = document.getElementById("customerCount");
    const deviceCount = document.getElementById("deviceCount");
    const alarmCount = document.getElementById("alarmCount");
    const assetCount = document.getElementById("assetCount");
    const tableBody = document.getElementById('table-body');

    const bodyElement = document.querySelector('body');

    let pageIdentifier = bodyElement.classList.contains('page-identifier')
        ? bodyElement.getAttribute('data-page')
        : null;

    const data = { pageIdentifier };

    const url = "/homeDetails"; // Replace with your backend API URL

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
            console.log('result.users: ', result.users);

            result.users.forEach((item) => {
                const htmlContent = `<div class="grid-item left-align word-wrap gap">${item.name ?? ''}</div><div class="grid-item left-align word-wrap gap" id="deviceCount">${item.email}</div>`;
                tableBody.insertAdjacentHTML('beforeend', htmlContent);
            });


            //custName.textContent = profileDetails;
            nameHome.textContent = result.data.name;
            countryHome.textContent = result.data.country;
            stateHome.textContent = result.data.state;
            cityHome.textContent = result.data.city;
            addressHome.textContent = result.data.address;
            address2Home.textContent = result.data.address2;
            zipHome.textContent = result.data.zip;
            phoneHome.textContent = result.data.phone;
            emailHome.textContent = result.data.email;
            deviceCount.textContent = result.entityCount[0].device;
            alarmCount.textContent = result.entityCount[0].alarm;
            assetCount.textContent = result.entityCount[0].asset;

            if(pageIdentifier === 'tenantHome'){
                customerCount.textContent = result.entityCount[0].customer;
            };

        } else {
            null;
        }
    } catch (error) {
        null;
    }
});