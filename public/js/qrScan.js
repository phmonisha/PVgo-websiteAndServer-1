import { setqrOutput, createAlert } from "./otherFunc.js";

document.addEventListener('deviceready', function () {

    var qrScanButton = document.getElementById('withoutQR');

    qrScanButton.addEventListener('click', function () {

        try {
            QRScanner.hide(function (status) {
                console.log('status after actual scan: ', JSON.stringify(status));
                //alert('status after hide() : ', JSON.stringify(status));
                QRScanner.cancelScan(function () {
                    QRScanner.getStatus(function (statusGetStatus) {
                        console.log('statusGetStatus: ', JSON.stringify(statusGetStatus));
                    });
                });
            });
            window.location.href = '../HTML/provisionStart.html';
        } catch (hideError) {
            console.error("An error occurred while hiding scanner:", hideError);
            const alertDiv = createAlert("An error occurred while hiding the scanner.");
            alertContainer.appendChild(alertDiv);
        }
    });

    document.addEventListener('backbutton', function (event) {
        try {
            //                              QRScanner.destroy(function(statusDestroy){
            //                                  console.log('statusDestroy: ',JSON.stringify(statusDestroy));
            //                              });
            QRScanner.hide(function (status) {
                console.log('status after actual scan: ', JSON.stringify(status));
                //alert('status after hide() : ', JSON.stringify(status));
                QRScanner.cancelScan(function () {
                    QRScanner.getStatus(function (statusGetStatus) {
                        console.log('statusGetStatus: ', JSON.stringify(statusGetStatus));
                    });
                });
            });
            // QRScanner.cancelScan();
            //                 QRScanner.destroy(function(statusDestroy){
            //                     console.log('statusDestroy: ',JSON.stringify(statusDestroy));
            //                 });
            // QRScanner.getStatus(function (statusGetStatus) {
            //     console.log('statusGetStatus: ', JSON.stringify(statusGetStatus));
            // });
            window.location.href = '../HTML/provisionStart.html';
        } catch (hideError) {
            console.error("An error occurred while hiding scanner:", hideError);
            const alertDiv = createAlert("An error occurred while hiding the scanner.");
            alertContainer.appendChild(alertDiv);
        }
    });
    // Your QRScanner-related code here
    QRScanner.prepare(onDone);

    function onDone(err, status) {
        if (err) {
            const alertDiv = createAlert(err);
            alertContainer.appendChild(alertDiv);
            console.error(err);
        }
        if (status.authorized) {
            //alert('you have camera access and the scanner is initialized.');
        } else if (status.denied) {
            const alertDiv = createAlert('The video preview will remain black, and scanning is disabled.');
            alertContainer.appendChild(alertDiv);
        } else {
            const alertDiv = createAlert("we didn't get permission, but we didn't get permanently denied.");
            alertContainer.appendChild(alertDiv);
        }
    }

    scan();
});

//document.addEventListener("DOMContentLoaded", function(event) {
//    // Your function call here
//    scan();
//});


function scan() {

    try {
        QRScanner.show(function () {
            try {
                QRScanner.scan(displayContents);
            } catch (error) {
                console.error("An error occurred during scanning:", error);
                const alertDiv = createAlert("An error occurred during scanning. Please try again.");
                alertContainer.appendChild(alertDiv);
            }
        });
        console.log("show() DONE");
    } catch (showError) {
        console.error("Error showing scanner:", showError);
        const alertDiv = createAlert("An error occurred while showing the scanner.");
        alertContainer.appendChild(alertDiv);
    }

    // try {
    //     QRScanner.scan(displayContents);
    // } catch (error) {
    //     console.error("An error occurred during scanning:", error);
    //     alert("An error occurred during scanning. Please try again.");
    // }

    let qrOutput = null;

    async function displayContents(err, text) {
        if (err) {
            console.error("An error occurred during scanning:", err);
            //alert("An error occurred, or the scan was canceled (error code `6`)");
            cancel();
        } else {
            console.log('status: ', text);
            //alert(text);
            qrOutput = text;
            console.log('qrOutput: ', qrOutput);
            setqrOutput(qrOutput);
            try {
                //                              QRScanner.destroy(function(statusDestroy){
                //                                  console.log('statusDestroy: ',JSON.stringify(statusDestroy));
                //                              });
                QRScanner.hide(function (status) {
                    console.log('status after actual scan: ', JSON.stringify(status));
                    //alert('status after hide() : ', JSON.stringify(status));
                    QRScanner.cancelScan(function () {
                        QRScanner.getStatus(function (statusGetStatus) {
                            console.log('statusGetStatus: ', JSON.stringify(statusGetStatus));
                        });
                    });
                });
                // QRScanner.cancelScan();
                //                 QRScanner.destroy(function(statusDestroy){
                //                     console.log('statusDestroy: ',JSON.stringify(statusDestroy));
                //                 });
                // QRScanner.getStatus(function (statusGetStatus) {
                //     console.log('statusGetStatus: ', JSON.stringify(statusGetStatus));
                // });
                window.location.href = '../HTML/wifiList.html';
            } catch (hideError) {
                console.error("An error occurred while hiding scanner:", hideError);
                const alertDiv = createAlert("An error occurred while hiding the scanner.");
                alertContainer.appendChild(alertDiv);
            }
        }
    }
}


function cancel() {
    QRScanner.hide(function (status) {
        console.log('status while cancel(): ', JSON.stringify(status));
        const alertDiv = createAlert(status);
        alertContainer.appendChild(alertDiv);
    });
    QRScanner.cancelScan();
}
