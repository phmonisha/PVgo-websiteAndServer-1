import { getToken } from "./otherFunc.js";


document.addEventListener("DOMContentLoaded", async (event) => {
    const token = getToken();

    let custName = document.getElementById("customerName");

    let instName = document.getElementById("installerName");

    let data = {};
    let url = null;
    let options = {};
    let response = null;
    let name = null;

    if (instName === null) {
        data = { "identifier": "C" };

        url = "/getName"; // Replace with your backend API URL

        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        };

        try {
            response = await fetch(url, options);

            if (response.ok) {
                name = await response.json();
                custName.textContent = name;
                initializeProfileImage(name);
            } else {
                custName.textContent = null;
            }
        } catch (error) {
            custName.textContent = null;
        }
    }
    else if (custName === null) {
        data = { "identifier": "I" };

        url = "/getName"; // Replace with your backend API URL

        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        };

        try {
            response = await fetch(url, options);

            if (response.ok) {
                name = await response.json();
                instName.textContent = name;
                initializeProfileImage(name);
            } else {
                instName.textContent = null;
            }
        } catch (error) {
            instName.textContent = null;
        }
    }
});

function initializeProfileImage(name) {
console.log('name: ',name);
    let initials = null;
    const words = name.split(' ');

    // If there's only one word, return the first two letters of that word
    if (words.length === 1) {
        initials = words[0].slice(0, 2);
    } else if (words.length > 1) { // Corrected the condition to check if there are more than one word
        initials = words[0].charAt(0) + words[1].charAt(0).toLowerCase();
    }

    // Set the initials as the text content of the profile image
    $('#profileImage').text(initials);
}

