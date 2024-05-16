import { getToken, createAlert } from "./otherFunc.js";

let panelManufacturers = [];
let panelModels = [];


const inputFieldManu = document.getElementById('myInput-manu');
const dropdownManu = document.getElementById('myDropdown-manu');
const inputFieldModel = document.getElementById('myInput-model');
const dropdownModel = document.getElementById('myDropdown-model');
const inputPanelSeries = document.getElementById('myInput-panel-series');
const inputStringParallel = document.getElementById('myInput-panel-parallel');
const inputPower = document.getElementById('myInput-power')
const inputCells = document.getElementById('myInput-cell');
const inputVoc = document.getElementById('myInput-voc');
const inputIsc = document.getElementById('myInput-isc');
const inputVmp = document.getElementById('myInput-vmp');
const inputImp = document.getElementById('myInput-imp');
const inputKv = document.getElementById('myInput-kv');
const inputKi = document.getElementById('myInput-ki');
const kipercent = document.getElementById('percentki');
const kireal = document.getElementById("realki");
const kvpercent = document.getElementById('percentkv');
const kvreal = document.getElementById('realkv');
const inputTechnology = document.getElementById('myInput-technology');

document.addEventListener("DOMContentLoaded", async () => {

    console.log(localStorage.getItem('panelDeviceId'));

    const bodyElement = document.querySelector('body');
    const pageIdentifier = bodyElement.classList.contains('page-identifier')
        ? bodyElement.getAttribute('data-page')
        : null;
    const token = getToken(); // Assuming getToken() function is defined elsewhere
    dropdownModel.style.display = 'none';

    const requestData = { pageIdentifier };
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
    };

    try {
        const response = await fetch("/getuniquepanelmanufacturer", requestOptions);
        const data = await response.json();

        // Extract panel manufacturers from the response
        panelManufacturers = data.map(item => item.panel_manu);
        // panelManufacturers.push('Custom Panel');

    } catch (error) {
        console.error('Error fetching panel manufacturers:', error);
        // Handle error appropriately, e.g., display a message to the user
    };

    // Function to display dropdown options based on user input for manufacturers
    function displayManufacturerOptions(inputValue) {
        dropdownManu.innerHTML = ''; // Clear previous options

        const filteredOptions = panelManufacturers.filter(option => (
            option.toLowerCase().includes(inputValue.toLowerCase())

        ));

        if (filteredOptions.length === 0) {
            filteredOptions.push('Custom Panel');
            inputFieldModel.value = 'Custom Panel';
        } else {
            filteredOptions.push('Custom Panel');
            inputFieldModel.value = '';
        }

        filteredOptions.forEach(option => {
            const optionElement = document.createElement('a');
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => {
                inputFieldManu.value = option; // Set input value on option selection
                dropdownManu.style.display = 'none'; // Hide dropdown after selection
                if (option === "Custom Panel") {
                    inputFieldModel.value = 'Custom Panel';
                    resetInputValues();
                } else {
                    getPanelModels(option);

                }
            });
            dropdownManu.appendChild(optionElement);
        });

        dropdownManu.style.display = filteredOptions.length > 0 ? 'block' : 'none';
    }

    // Function to display dropdown options based on user input for models
    function displayModelOptions(inputValue) {
        dropdownModel.innerHTML = ''; // Clear previous options

        const filteredOptions = panelModels.filter(option => (
            option.toLowerCase().includes(inputValue.toLowerCase())
        ));

        if (filteredOptions.length === 0) {
            filteredOptions.push('Custom Panel');
        } else {
            filteredOptions.push('Custom Panel');
            // inputFieldModel.value = '';
        };

        filteredOptions.forEach(option => {
            const optionElement = document.createElement('a');
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => {
                inputFieldModel.value = option; // Set input value on option selection
                dropdownModel.style.display = 'none'; // Hide dropdown after selection
                if (option != "Custom Panel") {
                    getpaneldata(option);
                    readOnly();
                } else {
                    editable();
                    resetInputValues();
                };
            });
            dropdownModel.appendChild(optionElement);
        });
        dropdownModel.style.display = filteredOptions.length > 0 ? 'block' : 'none';
    };

    // Event listeners for manufacturer input
    inputFieldManu.addEventListener('input', function () {
        const inputValue = this.value;
        resetInputValues();
        displayManufacturerOptions(inputValue);
    });

    inputFieldManu.addEventListener('focus', function () {
        const inputValue = this.value;
        // resetInputValues();
        displayManufacturerOptions(inputValue);
    });

    // Event listeners for model input
    inputFieldModel.addEventListener('input', function () {
        const inputValue = this.value;
        resetInputValues();
        displayModelOptions(inputValue);
    });

    inputFieldModel.addEventListener('focus', function () {
        const inputValue = this.value;
        // resetInputValues();
        displayModelOptions(inputValue);
    });

    // Close dropdowns if clicked outside inputs or dropdowns
    document.addEventListener('click', event => {
        if (!event.target.matches('#myInput-manu') && !event.target.closest('#myDropdown-manu')) {
            dropdownManu.style.display = 'none';
        };
        if (!event.target.matches('#myInput-model') && !event.target.closest('#myDropdown-model')) {
            dropdownModel.style.display = 'none';
        };
    });

    async function getPanelModels(selectedManufacturer) {
        const requestPanelModels = { pageIdentifier, selectedManufacturer };
        const requestPanelModelsOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestPanelModels),
        };
        try {
            const response = await fetch("/getmodel", requestPanelModelsOptions);
            const data = await response.json();

            // Extract panel models from the response
            panelModels = data.map(item => item.panel_model);
            // panelModels.push('Custom Panel');
            // displayModelOptions(inputFieldModel.value); // Display options for the current input value
        } catch (error) {
            console.error('Error fetching panel models:', error);
            // Handle error appropriately, e.g., display a message to the user
        };
    };

    async function getpaneldata(selectedModel) {
        const requestPanelModels = { pageIdentifier, selectedModel };
        const requestPanelModelsOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestPanelModels),
        };
        try {
            const response = await fetch("/getpaneldata", requestPanelModelsOptions);
            const data = await response.json();
            inputPower.value = Number(data.map(item => item.power_w));
            inputCells.value = Number(data.map(item => item.series_cell));
            inputVoc.value = Number(data.map(item => item.voc_v));
            inputIsc.value = Number(data.map(item => item.isc_a));
            inputVmp.value = Number(data.map(item => item.vmp_v));
            inputImp.value = Number(data.map(item => item.imp_a));
            inputKv.value = Number(data.map(item => item.kv));
            inputKi.value = Number(data.map(item => item.ki));
            inputTechnology.value = (data.map(item => item.technology));


        } catch (error) {
            console.error('Error fetching panel models:', error);
            // Handle error appropriately, e.g., display a message to the user
        };
    };

    document.getElementById('submit-panelinfo-btn').addEventListener('click', function () {
        const requiredInputs = [
            { input: inputFieldManu, labelFor: 'myInput-manu' },
            { input: inputFieldModel, labelFor: 'myInput-model' },
            { input: inputPanelSeries, labelFor: 'myInput-panel-series' },
            { input: inputStringParallel, labelFor: 'myInput-panel-parallel' },
            { input: inputPower, labelFor: 'myInput-power' },
            { input: inputCells, labelFor: 'myInput-cell' },
            { input: inputVoc, labelFor: 'myInput-voc' },
            { input: inputIsc, labelFor: 'myInput-isc' },
            { input: inputVmp, labelFor: 'myInput-vmp' },
            { input: inputImp, labelFor: 'myInput-imp' },
            { input: inputKv, labelFor: 'myInput-kv' },
            { input: inputKi, labelFor: 'myInput-ki' },
            { input: inputTechnology, labelFor: 'myInput-technology' }
        ];

        let hasEmptyField = false;

        // Remove any existing alerts
        const existingAlert = alertContainer.querySelector('.alert');
        if (existingAlert) {
            alertContainer.removeChild(existingAlert);
        }

        requiredInputs.forEach(({ input, labelFor }) => {
            if (input.value.trim() === "") {
                document.querySelector(`label[for="${labelFor}"]`).classList.add("emptyField");
                hasEmptyField = true;
            } else {
                document.querySelector(`label[for="${labelFor}"]`).classList.remove("emptyField");
            }
        });

        if (hasEmptyField) {
            // Show alert only if there are empty fields and no previous alert is displayed
            const alertDiv = createAlert("Please ensure that you have entered information in all the required fields before proceeding.");
            alertDiv.classList.add('alert');
            alertContainer.appendChild(alertDiv);
        } else {
            let panelData = {};
            // get all the data in the input field
            panelData.manuValue = inputFieldManu.value;
            panelData.modelValue = inputFieldModel.value;
            panelData.seriesValue = Number(inputPanelSeries.value);
            panelData.parallelValue = Number(inputStringParallel.value);
            panelData.powerValue = Number(inputPower.value);
            panelData.cellsValue = Number(inputCells.value);
            panelData.vocValue = Number(inputVoc.value);
            panelData.iscValue = Number(inputIsc.value);
            panelData.vmpValue = Number(inputVmp.value);
            panelData.impValue = Number(inputImp.value);
            // see if V/C is clicked, if yes convert it
            if (kipercent.checked) {
                panelData.kiValue = Number(inputKi.value);
            } else {
                panelData.kiValue = ((Number(inputKi.value) / panelData.iscValue) * 100).toFixed(3);
            };
            // see if A/C is clicked, if yes convert it
            if (kvpercent.checked) {
                panelData.kvValue = Number(inputKv.value);
            } else {
                panelData.kvValue = ((Number(inputKv.value) / panelData.vocValue) * 100).toFixed(3);
            };

            panelData.techValue = inputTechnology.value;

            console.log(panelData)
            console.log("Continue the action here after the above code is executed");
        };
    });
});

// function to reset the input values
function resetInputValues() {
    inputPower.value = '';
    inputCells.value = '';
    inputVoc.value = '';
    inputIsc.value = '';
    inputVmp.value = '';
    inputImp.value = '';
    inputKv.value = '';
    inputKi.value = '';
    inputTechnology.value = '';
    inputPanelSeries.value = '';
    inputStringParallel.value = '';
    kipercent.checked = true;
    kvpercent.checked = true;
};

// function to make the input in readonly
function readOnly() {
    inputPower.readOnly = true;
    inputCells.readOnly = true;
    inputVoc.readOnly = true;
    inputIsc.readOnly = true;
    inputVmp.readOnly = true;
    inputImp.readOnly = true;
    inputKv.readOnly = true;
    inputKi.readOnly = true;
    inputTechnology.readOnly = true;
    kipercent.disabled = true;
    kireal.disabled = true;
    kvpercent.disabled = true;
    kvreal.disabled = true;
};

// function to make the inputs editable 
function editable() {
    inputPower.readOnly = false;
    inputCells.readOnly = false;
    inputVoc.readOnly = false;
    inputIsc.readOnly = false;
    inputVmp.readOnly = false;
    inputImp.readOnly = false;
    inputKv.readOnly = false;
    inputKi.readOnly = false;
    inputTechnology.readOnly = false;
    kipercent.disabled = false;
    kireal.disabled = false;
    kvpercent.disabled = false;
    kvreal.disabled = false;
};