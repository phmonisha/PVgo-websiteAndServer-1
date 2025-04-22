import { unassignCustomerDevice, populateCustomer, deleteCustomer, getToken, fetchWithToken, convertEpochToAEST, populateDeviceLable, createConfirm, updateAlarm } from "./otherFunc.js";

// '.tbl-content' consumed little space for vertical scrollbar, scrollbar width depend on browser/os/platfrom. Here calculate the scollbar width .
$(window).on("load resize ", function () {
    var scrollWidth = $('.tbl-content').width() - $('.tbl-content table').width();
    $('.tbl-header').css({ 'padding-right': scrollWidth });
}).resize();

document.addEventListener("DOMContentLoaded", async (event) => {

    const bodyElement = document.querySelector('body');
    const queryParams = new URLSearchParams(window.location.search);
    const customerId = queryParams.get("customerId");

    // Get the page identifier class or data attribute
    let pageIdentifier = bodyElement.classList.contains('page-identifier')
        ? bodyElement.getAttribute('data-page')
        : null;

    //console.log(`customerId from the ${pageIdentifier} page: `,customerId);


    const tableBody = document.getElementById('table-body');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const itemsPerPageInput = document.getElementById('items-per-page');
    const searchInput = document.getElementById('search');
    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageInput.value);
    let filteredData = [];
    let totalPages = 0;
    let response;

    if (pageIdentifier === 'customerAlarm') {
        const filterClear = document.getElementById("clear");
        const filterActive = document.getElementById("active");
        const filterAcknowledge = document.getElementById("acknowledge");
        const filterUnacknowledge = document.getElementById("unacknowledge");
        const filterSubmit = document.getElementById("filterSubmit");

        filterSubmit.addEventListener("click", function (event) {
            event.preventDefault();

            const clearChecked = filterClear.checked;
            const activeChecked = filterActive.checked;
            const acknowledgeChecked = filterAcknowledge.checked;
            const unacknowledgeChecked = filterUnacknowledge.checked;

            const alarmFilterJson = {
                clr: clearChecked,
                act: activeChecked,
                ack: acknowledgeChecked,
                unack: unacknowledgeChecked
            }

            localStorage.setItem('alarmFilterJson', JSON.stringify(alarmFilterJson));
            const Json = localStorage.getItem('alarmFilterJson');
            if (Json) {
                window.location.href = '/HTML/customerAlarm.html';
            }
        });
    }
    else {
        localStorage.removeItem('alarmFilterJson');
    }

    //let dataPage;

    // if (pageIdentifier.startsWith('tenant')) {
    //     dataPage = { pageIdentifier };
    // }
    // else if (pageIdentifier.startsWith('customer')) {
    //     dataPage = { pageIdentifier, customerId};

    const dataPage = { pageIdentifier };
    // };

    const token = getToken();

    //console.log({token});

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataPage),
    };

    if (pageIdentifier.startsWith('tenant')) {
        response = await fetchWithToken("https://www.pvgo.au/tenantEntityList", options);
    }
    else if (pageIdentifier.startsWith('customer')) {
        response = await fetchWithToken("https://www.pvgo.au/customerEntityList", options);
    };

    const cuList = await response.json();
    const arr = cuList.data;
    let data = [];
    //console.log('arr : ',arr);


    if (pageIdentifier === 'tenantCustomer') {
        for (const i of arr) {
            data.push({
                'createdTime': convertEpochToAEST(i.createdtime),
                'title': i.title,
                'email': i.email,
                'country': i.country,
                'city': i.city,
                'customerID': i.customerid
            });
        }
    }
    else if (pageIdentifier === 'tenantAlarm') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdtime),
                'originator': i.originator,
                'type': i.type,
                'severity': i.severity,
                'assignee': i.assignee,
                'status': i.status
            });
        }
    }
    else if (pageIdentifier === 'tenantDevice') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdtime),
                'name': i.name,
                'deviceProfile': i.deviceprofile,
                'label': i.label,
                'customer': i.customer,
                'deviceId': i.deviceid,
                'customerId': i.customerid
            });
        }
    }
    else if (pageIdentifier === 'tenantAsset') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdtime),
                'name': i.name,
                'assetProfile': i.assetprofile,
                'label': i.label,
                'customer': i.customer
            });
        }
    }
    else if (pageIdentifier === 'customerAlarm') {
        for (const i of arr) {

            data.push({
                'label': i.label,
                'type': i.type,
                'createdtime': convertEpochToAEST(i.createdtime),
                'severity': i.severity,
                'definition': i.definition,
                'status': i.status,
                'acknowledged': i.acknowledged,
                'cleared': i.cleared,
                'id': i.id,
                'deviceId': i.deviceId
            });
        }
    }
    else if (pageIdentifier === 'customerDevice') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdTime),
                'name': i.name,
                'deviceProfile': i.deviceProfile,
                'label': i.label,
                'deviceId': i.deviceId,
                'status': i.status
            });
        }
    }
    else if (pageIdentifier === 'customerAsset') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdTime),
                'name': i.name,
                'assetProfile': i.assetProfile,
                'label': i.label
            });
        }
    }
    else if (pageIdentifier === 'customerNotification') {
        for (const i of arr) {

            data.push({
                'createdTime': convertEpochToAEST(i.createdTime),
                'label': i.label,
                'type': i.type,
                'severity': i.severity,
                'definition': i.definition,
                'status': i.status,
                'acknowledged': i.acknowledged,
                'cleared': i.cleared,
                'id': i.id,
                'deviceId': i.deviceId
            });
        }
    }


    data.sort((a, b) => {
        const dateA = new Date(a.createdTime).getTime();
        const dateB = new Date(b.createdTime).getTime();
        return dateB - dateA; // Compare in descending order(Sort data in decending order of createdTime)
    });


    function updatePaginationNumbers() {
        const paginationNumbers = document.getElementById('pagination-numbers');
        paginationNumbers.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumberButton = document.createElement('button');
            pageNumberButton.textContent = i;
            pageNumberButton.classList.add('page-number');

            if (i === currentPage) {
                pageNumberButton.classList.add('active');
            }

            pageNumberButton.addEventListener('click', () => {
                currentPage = i;
                updateTable();
            });

            paginationNumbers.appendChild(pageNumberButton);
        }
    }

    function updateTable() {

        if (pageIdentifier === 'tenantCustomer') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.title.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'tenantAlarm') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.originator.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'tenantDevice') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.name.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'tenantAsset') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.name.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'customerAlarm') {
            const searchText = searchInput.value.toLowerCase();
            const alarmFilterJson = JSON.parse(localStorage.getItem('alarmFilterJson'));

            filteredData = data.filter(item => {
                // Check if the item matches the text search criteria
                const matchesTextSearch = item.label.toLowerCase().includes(searchText);

                // Apply the appropriate filter based on the existence of alarmFilterJson
                const matchesAlarmFilter = alarmFilterJson
                    ? ((alarmFilterJson.clr && item.cleared) ||
                       (alarmFilterJson.act && !item.cleared) ||
                       (alarmFilterJson.ack && item.acknowledged) ||
                       (alarmFilterJson.unack && !item.acknowledged))
                    : !item.cleared; // If alarmFilterJson doesn't exist, match items where item.cleared === false

                // Return true if both conditions are satisfied
                return matchesTextSearch && matchesAlarmFilter;
            });
        }

        else if (pageIdentifier === 'customerDevice') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.name.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'customerAsset') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.name.toLowerCase().includes(searchText));
        }
        else if (pageIdentifier === 'customerNotification') {
            const searchText = searchInput.value.toLowerCase();
            filteredData = searchText === ''
                ? data
                : data.filter(item => item.name.toLowerCase().includes(searchText));
        }

        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        currentPage = Math.min(currentPage, totalPages);

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentPageData = filteredData.slice(start, end);

        tableBody.innerHTML = '';

        if (currentPageData.length === 0) {
            const noDataRow = document.createElement('li');
            noDataRow.innerHTML = '<div class="grid-container"  style="padding-top: 10px; font-size: 13px; font-family: Helvetica"><br><p>ITEM COUNT ZERO</p><br></div>';
            tableBody.appendChild(noDataRow);
        } else {

            if (pageIdentifier === 'tenantCustomer') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');

                    const titleLink = document.createElement('a');
                    //alert(item.customerID);
                    titleLink.href = `/HTML/customerDev.html?customerId=${encodeURIComponent(item.customerID)}`;
                    console.log('item.customerID1: ', item.customerID);

                    row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.title}</div> <div class="grid-item left-allign name-length">${item.email !== null ? item.email : ''}</div> <div class="grid-item right-allign mergGrid sub-grid-container"> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item editCustomer"> <button class="icon-button"><img src="../images/edit-Icon.png" alt="logo"></button> </div> <div class="sub-grid-item deleteCustomer"> <button class="icon-button"><img src="../images/delete_Icon.png" alt="logo"></button> </div> </div> <div class="grid-item right-allign"></div> <div class="grid-item left-allign">${item.country !== null ? item.country : ''}</div> <div class="grid-item right-allign"></div> <div class="grid-item left-allign">${item.city !== null ? item.city : ''}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;

                    const editCell = row.querySelector('.editCustomer');

                    editCell.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'
                        document.getElementById("e-popup").style.display = "block";
                        // Handle the delete action here
                        // You can use 'item' data to identify the item to delete
                        try {
                            populateCustomer(item.customerID);
                        } catch (error) {
                            console.log(error);
                        }
                    });

                    const deleteCell = row.querySelector('.deleteCustomer');

                    deleteCell.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'

                        function testConfirm() {
                            const confirmContainer = document.getElementById("confirmContainer");
                            const confirmDialog = createConfirm("Are you sure you want to delete this Customer? Please note that the action will cause the deletion of all the data related to this specific Customer, including the loss of customer device data.", function () {
                                try {
                                    deleteCustomer(item.customerID);
                                } catch (error) {
                                    console.log(error);
                                }
                            });

                            confirmContainer.appendChild(confirmDialog);
                        }

                        testConfirm();
                    });

                    row.addEventListener('click', () => {
                        event.stopPropagation();
                        //alert('item.customerID: ', item.customerID);
                        const fetchData = async () => {
                            try {
                                console.log('item.customerID 2: ', item.customerID);
                                const response = await fetchWithToken('https://www.pvgo.au/setCustomer', {
                                    method: 'POST', // You can use the appropriate HTTP method
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        customerId: item.customerID,
                                    }),
                                });

                                if (!response.ok) {
                                    throw new Error(`Request to set customer ID failed with status: ${response.status}`);
                                }

                                // After the server call is successful, open the customerDashboard page
                                window.location.href = '/HTML/customerDevice.html';
                            } catch (error) {
                                console.error('Server call error: ', error);
                            }
                        };

                        fetchData();
                    });

                    tableBody.appendChild(row);
                });
            }
            else if (pageIdentifier === 'tenantAlarm') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');

                    row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.originator}</div> <div class="grid-item right-allign name-length">${item.severity}</div> <div class="grid-item left-allign ">${item.type}</div> <div class="grid-item right-allign">${item.status}</div> <div class="grid-item left-allign">Assignee: ${item.assignee !== null ? item.assignee : 'Unassigned'}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;
                    tableBody.appendChild(row);
                });
            }
            else if (pageIdentifier === 'tenantDevice') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');

                    const titleLink = document.createElement('a');
                    titleLink.href = `/HTML/tenantDashboard.html`;

                    row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.name}</div> <div class="grid-item left-allign name-length">${item.label !== null ? item.label : ''}</div> <div class="grid-item right-allign mergGrid"></div> <div class="grid-item left-allign">${item.customer !== null ? item.customer : ''}</div> <div class="grid-item left-allign">${item.deviceProfile}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;

                    row.addEventListener('click', (event) => {
                        event.preventDefault();

                        const customerId = item.customerId;
                        const deviceId = item.deviceId;

                        //setTenantDashboard([customerId, deviceId]);
                        localStorage.setItem('customerIDtenantDashboard', customerId);
                        localStorage.setItem('deviceIDtenantDashboard', deviceId);

                        window.location.href = titleLink.href;
                    });

                    tableBody.appendChild(row);
                });
            }
            else if (pageIdentifier === 'tenantAsset') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');
                    row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.name}</div> <div class="grid-item left-allign name-length">${item.assetProfile}</div> <div class="grid-item right-allign mergGrid"></div> <div class="grid-item left-allign">${item.customer !== null ? item.customer : ''}</div> <div class="grid-item left-allign">${item.label !== null ? item.label : ''}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;
                    tableBody.appendChild(row);
                });
            }
            else if (pageIdentifier === 'customerAlarm') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');
                        row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.label}</div> <div class="grid-item right-allign name-length">${item.createdtime}</div> <div class="grid-item left-allign">${item.type}</div> <div class="grid-item right-allign">${item.severity}</div> <div class="grid-item msg"> <div class="sub_msg">${item.definition}</div> </div> </div> <br> <div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.status}</div> <div class="grid-item right-allign"> ${!item.acknowledged ? `<button class="btn-alarm acknowledge-btn">Acknowledge</button>` : ''} ${!item.cleared ? `<button class="btn-alarm clear-btn">Clear</button>` : ''} </div> </div>`;

                        const acknowledgeBtn = row.querySelector('.acknowledge-btn');
                        if (acknowledgeBtn) {
                            acknowledgeBtn.addEventListener('click', async (event) => {
                                event.stopPropagation();
                                const status1 = await updateAlarm(item.id, 'ack');
                                console.log('status1: ', status1);
                                if (status1 === true) {
                                    acknowledgeBtn.parentNode.removeChild(acknowledgeBtn);
                                }
                                else {
                                    alert('errror while acknowledging alarm');
                                }
                            });
                        }

                        // Add event listener for Clear button
                        const clearBtn = row.querySelector('.clear-btn');
                        if (clearBtn) {
                            clearBtn.addEventListener('click', async () => {
                                const status2 = await updateAlarm(item.id, 'clr');
                                if (status2 === true) {
                                    row.parentNode.removeChild(row);
                                }
                            });
                        }
                        tableBody.appendChild(row);
                });
            }
            else if (pageIdentifier === 'customerDevice') {
                currentPageData.forEach((item) => {

                    const row = document.createElement('li');

                    const titleLink = document.createElement('a');
                    titleLink.href = `/HTML/customerDash.html?deviceId=${encodeURIComponent(item.deviceId)}`;

                    row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.name}</div> <div class="grid-item left-allign name-length">${item.label !== null ? item.label : ''}</div> <div class="grid-item right-allign mergGrid2 sub-grid-container"> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item">${item.status ? `<img src="../images/dot-green.png" alt="logo" style="width: 20px; filter: grayscale(0);">` : `<img src="../images/dot-red.png" alt="logo" style="width: 20px; filter: grayscale(1);">`}</div> <div class="sub-grid-item"><button class="icon-button deviceAlarms"><img src="../images/alarm-icon.png" alt="logo" style="width: 18px; filter: grayscale(10);"></button></div> <div class="sub-grid-item editCustomerDevice"> <button class="icon-button" id="e-open-popup"><img src="../images/edit-Icon.png" alt="logo"></button> </div> <div class="sub-grid-item addDevice"> <button class="icon-button"><img src="../images/delete_Icon.png" alt="logo"></button> </div> </div> <div class="grid-item left-allign">${item.deviceProfile}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;

                    const deviceAlarm = row.querySelector('.deviceAlarms');

                    deviceAlarm.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'
                        window.location.href = '/HTML/customerAlarm.html';
                    });

                    const editDevCell = row.querySelector('.editCustomerDevice');

                    editDevCell.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'
                        document.getElementById("e-popup").style.display = "block";
                        // Handle the delete action here
                        // You can use 'item' data to identify the item to delete
                        try {
                            populateDeviceLable(item.deviceId, item.label);
                        } catch (error) {
                            console.log(error);
                        }
                    });

                    const allignCell = row.querySelector('.addDevice');

                    allignCell.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent the click event from bubbling to the 'tr'

                        function testConfirm() {
                            const confirmContainer = document.getElementById("confirmContainer");
                            const confirmDialog = createConfirm("Are you sure you want to delete this Device? Please note that the action will causes deletion of all the data releted to that specific device.", function () {
                                try {
                                    unassignCustomerDevice(item.deviceId);
                                } catch (error) {
                                    console.log(error);
                                }
                            });

                            confirmContainer.appendChild(confirmDialog);
                        }

                        testConfirm();
                    });

                    row.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const fetchData = async () => {
                            try {
                                const response = await fetchWithToken('https://www.pvgo.au/setDevice', {
                                    method: 'POST', // You can use the appropriate HTTP method
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        deviceId: item.deviceId,
                                    }),
                                });

                                if (!response.ok) {
                                    throw new Error(`Request to set device ID failed with status: ${response.status}`);
                                }

                                // After the server call is successful, open the customerDashboard page
                                window.location.href = '/HTML/customerDashboard.html';
                            } catch (error) {
                                console.error('Server call error: ', error);
                            }
                        };

                        fetchData();
                    });
                    tableBody.appendChild(row);
                });
            }
            // else if (pageIdentifier === 'customerAsset') {
            //     currentPageData.forEach((item) => {
            //         const row = document.createElement('li');
            //         row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.name}</div> <div class="grid-item left-allign name-length">${item.assetProfile}</div> <div class="grid-item right-allign mergGrid2"></div> <div class="grid-item left-allign">${item.label !== null ? item.label : ''}</div> <div class="grid-item right-allign">${item.createdTime}</div> </div>`;
            //         tableBody.appendChild(row);
            //     });
            // }
            else if (pageIdentifier === 'customerNotification') {
                currentPageData.forEach((item) => {
                    const row = document.createElement('li');
                    console.log('item.deviceId: ', item.deviceId);
                    if (item.deviceId === '00000000-0000-0000-0000-000000000000') {
                        row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.type}</div> <div class="grid-item right-allign">${item.createdTime}</div> <div class="grid-item left-allign name-length">${item.definition}</div> <div class="grid-item right-allign sub-grid-container"> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item addDevice">  </div> </div> </div>`;
                    } else {
                        row.innerHTML = `<div class="grid-container"> <div class="grid-item left-allign text-bigger">${item.label}</div> <div class="grid-item right-allign">${item.createdTime}</div> <div class="grid-item left-allign name-length">PVgo Alarm - ${item.type} generated</div> <div class="grid-item right-allign sub-grid-container"> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item"></div> <div class="sub-grid-item addDevice"> <button class="btn-alarm" id="btn-notif">Go to device</button> </div> </div> </div>`;
                    }
                    
                    tableBody.appendChild(row);
            
                    const goToDeviceButton = row.querySelector('.btn-alarm');
                    if (goToDeviceButton) {
                        goToDeviceButton.addEventListener('click', (event) => {
                            event.stopPropagation();
                            const fetchData = async () => {
                                try {
                                    const response = await fetchWithToken('https://www.pvgo.au/setDevice', {
                                        method: 'POST', // You can use the appropriate HTTP method
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            deviceId: item.deviceId,
                                        }),
                                    });
            
                                    if (!response.ok) {
                                        throw new Error(`Request to set device ID failed with status: ${response.status}`);
                                    }
            
                                    // After the server call is successful, open the customerDashboard page
                                    window.location.href = '/HTML/customerDashboard.html';
                                } catch (error) {
                                    console.error('Server call error: ', error);
                                }
                            };
            
                            fetchData();
                        });
                    }
                });
            }
        }

        //console.log('currentPage: ', currentPage);
        prevButton.disabled = (currentPage === 1 || currentPage === 0);
        nextButton.disabled = currentPage === totalPages;

        updatePaginationNumbers();
    }

    searchInput.addEventListener('input', () => {
        currentPage = 1;
        updateTable();
    });

    itemsPerPageInput.addEventListener('change', () => {
        itemsPerPage = parseInt(itemsPerPageInput.value);
        currentPage = 1;
        updateTable();
    });

    prevButton.addEventListener('click', () => {
        currentPage -= 1;
        currentPage = Math.max(currentPage, 1);
        updateTable();
    });

    nextButton.addEventListener('click', () => {
        currentPage += 1;
        currentPage = Math.min(currentPage, totalPages);
        updateTable();
    });

    updateTable();

});