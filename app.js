const express = require("express");
const app = express();
const session = require('express-session');
const NodeCache = require('node-cache');//const cache = new NodeCache();
const cacheTenJwt = new NodeCache();
const cacheSysAdminJwt = new NodeCache();
const bcrypt = require('bcrypt');
const fs = require("fs");
const path = require("path");
const axios = require('axios'); // Add this line to import axios
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { getJwtSysAdmin, getJwtTenant, getUserToken, getUserDeatils, getTenantEntityList, getCustomerEntityList, createCustomer, createCustomerUser, createTenant, getCustomerName, homeDetails, unassignDevice, getCustomer, editCustomer, deleteCustomer, editDeviceLable, getDeviceTelemetry, getDeviceSparklineTelemetry, getDeviceAtrributes, assignDevice, gethistoricData, scanIV, getTheUserjwtToken, saveCode, verifyEmail, checkIfCustomerExists, setVerifyFlagStatus, checkExists, saveCodePwdReset, resetPwd, updateAlarmStatus, getUniquePanelManufacturer, getCustomerList, getmodel, getpaneldata, getAlarmSettings, setAlarmSettings, getsimulationStatus, updatePanelAttribute, getEmailId, saveFCMToken, getfaultlog, removeToken } = require("./funcBE");
const { saveNewPwd, autenticateUserPWD, saveNewPwdTenant, autenticateTenantUserPWD } = require("./pwdFunc");
//const { emailUserConcern } = require("./email");
const sendEmail = require("./sendEmail");
require('dotenv').config();

const port = 3011;

app.listen(port, () => {
    console.log(`Application started successfully in port ${port}`);
});

app.set('view engine', 'ejs'); //to get parameter between web pages

//EXPRESS SPECIFIC STUFFS
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static('images'));
app.use(
    session({
        secret: 'thisismysecretdonttellanyone!',
        resave: false,
        saveUninitialized: true,
        cookie: {
            sameSite: 'strict',
            // Add any other cookie attributes as needed
        },
    })
);


//Used to bring in input form data to backend
//app.use(express.urlencoded()); //use it if you are getting data directly from html form
app.use(bodyParser.urlencoded({ extended: false })); // used as an alternative to app.use(express.urlencoded());
app.use(express.json()); //use it if you are getting html form data using client side java script
app.use(cors());

const userData = {};

//let tenCred = '';
//let userData[req.user.name].customerId = null;
//let newCustomerId = null;
//let newCustId = null;
//let deviceId = null;
//let newUserPassword = null;
//let newUserId = null;
//let newUserEmail = null;
const salt = bcrypt.genSaltSync(10);
//let userId = null;
let tenId = null;
let tenantCredsJSON = null;
let newTenant = null;
let newTenantId = null;


function generateRandomCode() {
    // Generate 3 random bytes (24 bits)
    const buffer = crypto.randomBytes(3);

    // Convert the random bytes to a 6-digit number
    const code = buffer.readUIntBE(0, 3) % 1000000;

    // Ensure the code is exactly 6 digits by padding with zeros if necessary
    return code.toString().padStart(6, '0');
}


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    //console.log('Token in auth function: ', token);
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        //console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
};

// Function to get JWT token and store it in the jwToken variable
async function setJwtSysAdminToken() {
    const cacheKey = "Admin";
    jwtSysAdminToken = cacheSysAdminJwt.get(cacheKey);

    // If not cached, fetch and cache the token
    if (!jwtSysAdminToken) {
        const tokenData = await getJwtSysAdmin();
        if (tokenData && tokenData.tokenSysAdmin) {
            jwtSysAdminToken = tokenData.tokenSysAdmin;

            // Cache the token for a specific duration (e.g., 10 minutes)
            cacheSysAdminJwt.set(cacheKey, jwtSysAdminToken, 60 * 15); // Cache for 10 minutes
        }
    }
}

async function setJwtTenantToken() {
    const cacheKey = "Tenant";
    jwtTenantToken = cacheSysAdminJwt.get(cacheKey);

    // If not cached, fetch and cache the token
    if (!jwtTenantToken) {
        const tokenData = await getJwtTenant();
        if (tokenData && tokenData.tokenTenant) {
            jwtTenantToken = tokenData.tokenTenant;

            // Cache the token for a specific duration (e.g., 10 minutes)
            cacheSysAdminJwt.set(cacheKey, jwtTenantToken, 60 * 15); // Cache for 10 minutes
        }
    }
}

// async function setJwtTenantToken(req) {
//     try {

//         const cacheKey = `${JSON.stringify(userData[req.user.name].tenCred)}:${userData[req.user.name].tenantUserId}`;

//         // Try to get the cached token
//         userData[req.user.name].jwtTenantToken1 = cacheTenJwt.get(cacheKey);
//         jwtTenantToken = userData[req.user.name].jwtTenantToken1;

//         // If not cached, fetch and cache the token 
//         if (!jwtTenantToken) {
//             const tenCred = userData[req.user.name].tenCred;
//             let tenId = userData[req.user.name].tenantUserId;
//             const tokenData = await getJwtTenant(tenCred, tenId);
//             if (tokenData && tokenData.tokenTenant) {
//                 userData[req.user.name].jwtTenantToken1 = tokenData.tokenTenant;
//                 jwtTenantToken = userData[req.user.name].jwtTenantToken1;

//                 console.log({ jwtTenantToken });

//                 // Cache the token for a specific duration (e.g., 10 minutes)
//                 cacheTenJwt.set(cacheKey, jwtTenantToken, 60 * 15); // Cache for 10 minutes
//             }
//         }
//     } catch (error) {
//         // Handle errors here, you can log or perform any necessary actions
//         console.error("Error in setJwtTenantToken:", error);
//     }
// }



//END POINTS
app.get('', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/Index', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/Customer', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/New Customer.html'));
});

app.post('/New_Customer_Registration_A', async function (req, res) {
    req.body.additionalInfo = {};
    try {
        console.log('New_Customer_Registration_A');
        await setJwtTenantToken();
        tenantId = null;
        const newCustomer = await createCustomer(req.body, jwtTenantToken, tenantId); // Call createCustomer function with the request body and token
        const newCustomerId = newCustomer.id.id;
        res.json(newCustomer);
    } catch (error) {
        console.error('1) Error creating customer', error.response.data.message);
        res.status(500).json({ error: error.response.data.message });
    }
});

app.post('/New_Customer_Registration', authenticateToken, async function (req, res) {
    req.body.additionalInfo = {};
    try {
        await setJwtTenantToken();
        console.log('New_Customer_Registration');

        if (userData[req.user.name].tenantId === undefined) {
            userData[req.user.name].newTenId = userData[req.user.name].newTenantId;
        }
        else {
            userData[req.user.name].newTenId = userData[req.user.name].tenantId;
        }

        const newCustomer = await createCustomer(req.body, jwtTenantToken, userData[req.user.name].newTenId); // Call createCustomer function with the request body and token
        userData[req.user.name].newCustomer = newCustomer;
        userData[req.user.name].newCustomerId = newCustomer.id.id;
        //console.log('userData[req.user.name].newCustomerId : ', userData[req.user.name].newCustomerId);
        res.json(userData[req.user.name].newCustomer);
    } catch (error) {
        console.error('1) Error creating customer', error.response.data.message);
        res.status(500).json({ error: error.response.data.message });
    }
});

app.get('/addNewCustomerUser', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/Add Customer User.html'));
});

app.get('/addNewTenantUser', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/Add Tenant User.html'));
});

app.post('/addNewCustomerUser_A', async function (req, res) {

    console.log(`req.body1: `, req.body);

    if (req.body.pageIdentifier) {
        req.body.password = 'PVgo@1000#';
        delete req.body.pageIdentifier;
    }

    req.body.additionalInfo = { "description": "Customer" };
    req.body.authority = "CUSTOMER_USER";
    const custDtl = {
        "id": req.body.customerId,
        "entityType": "CUSTOMER"
    }

    req.body.customerId = custDtl;
    //userData[req.user.name].newUserPassword = await bcrypt.hash(req.body.password, salt);
    custUserPassword = req.body.password;
    const customerId = req.body.customerId.id;

    //console.log({ customerId });
    delete req.body.password;
    delete req.body.confirm_password;

    console.log(`req.body2: `, req.body);

    try {
        await setJwtTenantToken();
        //console.log({jwtTenantToken});
        const newCustomerUser = await createCustomerUser(JSON.stringify(req.body), jwtTenantToken, custUserPassword); // Call createCustomer function with the request body and token
        //console.log({ newCustomerUser })

        customerUserJWTToken = await newCustomerUser.jwtUserToken;

        //console.log({ customerUserJWTToken });

        if (customerUserJWTToken) {
            const username = req.body.email;
            const user = { name: username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 86400 });
            //console.log({ username, accessToken });

            if (!userData[username]) {
                // Initialize the userData[username] object if it doesn't exist
                //console.log('Inside if (!userData[username])');
                userData[username] = {};
            }

            userData[username].newCustomerId = customerId;
            //console.log('userData[username].newCustomerId: ', userData[username].newCustomerId);
            userData[username].customerUserJWTToken = customerUserJWTToken;
            newCustomerUser.newCustomerUserDataInfo.success = true;
            //console.log('newCustomerUser.newCustomerUserDataInfo: ', newCustomerUser.newCustomerUserDataInfo)
            newCustomerUser.newCustomerUserDataInfo.accessToken = accessToken;
            res.json(newCustomerUser.newCustomerUserDataInfo);
        }
    } catch (error) {
        //console.error('1) Error creating customer', error.response.data.message);
        console.error('1) Error creating customer', error.response.data.message);
        res.status(500).json({ error: error.response.data.message }); // Send error response to the client
    }
});

app.post('/addNewCustomerUser', authenticateToken, async function (req, res) {
    if (userData[req.user.name].customerId === undefined) {
        userData[req.user.name].newCustId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].newCustId = userData[req.user.name].customerId;
    }

    //console.log(`userData[req.user.name].newCustId: `,userData[req.user.name].newCustId);
    console.log('req.body: ', req.body);

    if (req.body.pageIdentifier) {
        req.body.password = 'PVgo@1000#';
        delete req.body.pageIdentifier;
    }

    req.body.additionalInfo = { "description": "Customer" };
    req.body.authority = "CUSTOMER_USER";
    const custDtl = {
        "id": userData[req.user.name].newCustId,
        "entityType": "CUSTOMER"
    }

    req.body.customerId = custDtl;
    //userData[req.user.name].newUserPassword = await bcrypt.hash(req.body.password, salt);
    //console.log({ newUserPassword });
    userData[req.user.name].custUserPassword = req.body.password;
    delete req.body.password;
    delete req.body.confirm_password;

    //console.log(`req.body: `, req.body);
    //console.log(`userData[req.user.name].custUserPassword: `, userData[req.user.name].custUserPassword);

    try {
        await setJwtTenantToken();
        //console.log({jwtTenantToken});
        const newCustomerUser = await createCustomerUser(JSON.stringify(req.body), jwtTenantToken, userData[req.user.name].custUserPassword); // Call createCustomer function with the request body and token
        userData[req.user.name].customerUserJWTToken = await newCustomerUser.jwtUserToken.token;
        newCustomerUser.newCustomerUserDataInfo.success = true;
        res.json(newCustomerUser.newCustomerUserDataInfo);
    } catch (error) {
        //console.error('1) Error creating customer', error.response.data.message);
        console.error('1) Error creating customer', error.response.data.message);
        res.status(500).json({ error: error.response.data.message }); // Send error response to the client
    }
});

app.post('/addNewTenantUser_A', async function (req, res) {

    req.body.additionalInfo = { "description": "Installer" };
    req.body.authority = "CUSTOMER_USER";
    const tenDtl = {
        "id": req.body.tenantId,
        "entityType": "CUSTOMER"
    }

    req.body.customerId = tenDtl;
    //userData[req.user.name].newUserPassword = await bcrypt.hash(req.body.password, salt);
    const installerUserPassword = req.body.password;
    const tenantId = req.body.tenantId;

    //console.log({ tenantId });
    delete req.body.password;
    delete req.body.confirm_password;
    delete req.body.tenantId;

    //console.log(`req.body: `, req.body);
    //console.log(`userData[req.user.name].installerUserPassword: `, userData[req.user.name].installerUserPassword);

    try {
        await setJwtTenantToken();
        //console.log({jwtTenantToken});
        const newInstallerUser = await createCustomerUser(JSON.stringify(req.body), jwtTenantToken, installerUserPassword); // Call createCustomer function with the request body and token
        //console.log({ newInstallerUser })

        customerUserJWTToken = await newInstallerUser.jwtUserToken;

        //console.log({ customerUserJWTToken });

        if (customerUserJWTToken) {
            const username = req.body.email;
            const user = { name: username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 86400 });
            //console.log({ username, accessToken });

            if (!userData[username]) {
                // Initialize the userData[username] object if it doesn't exist
                //console.log('Inside if (!userData[username])');
                userData[username] = {};
            }

            userData[username].newTenantId = tenantId;
            //console.log('userData[username].newTenantId: ', userData[username].newTenantId);
            userData[username].customerUserJWTToken = customerUserJWTToken;
            newInstallerUser.newCustomerUserDataInfo.success = true;
            //console.log('newInstallerUser.newCustomerUserDataInfo: ', newInstallerUser.newCustomerUserDataInfo)
            newInstallerUser.newCustomerUserDataInfo.accessToken = accessToken;
            res.json(newInstallerUser.newCustomerUserDataInfo);
        }
    } catch (error) {
        console.error('1) Error creating installer user: ', error.response.data.message);
        res.status(500).json({ error: error.response.data.message }); // Send error response to the client
    }
});

app.post('/addNewTenantUser', authenticateToken, async function (req, res) {
    if (userData[req.user.name].tenantId === undefined) {
        userData[req.user.name].newTenId = userData[req.user.name].newTenantId;
    }
    else {
        userData[req.user.name].newTenId = userData[req.user.name].tenantId;
    }

    console.log('req.body: ', req.body);

    if (req.body.pageIdentifier) {
        req.body.password = 'PVgo@1000#';
        delete req.body.pageIdentifier;
    }

    req.body.additionalInfo = { "description": "Installer" };
    req.body.authority = "CUSTOMER_USER";
    const tenDtl = {
        "id": userData[req.user.name].newTenId,
        "entityType": "CUSTOMER"
    }

    req.body.customerId = tenDtl;
    //userData[req.user.name].newUserPassword = await bcrypt.hash(req.body.password, salt);
    //console.log({ newUserPassword });
    userData[req.user.name].installerUserPassword = req.body.password;
    delete req.body.password;
    delete req.body.confirm_password;

    //console.log(`req.body: `, req.body);
    //console.log(`userData[req.user.name].installerUserPassword: `, userData[req.user.name].installerUserPassword);

    try {
        await setJwtTenantToken();
        //console.log({jwtTenantToken});
        const newInstallerUser = await createCustomerUser(JSON.stringify(req.body), jwtTenantToken, userData[req.user.name].installerUserPassword); // Call createCustomer function with the request body and token
        userData[req.user.name].customerUserJWTToken = await newInstallerUser.jwtUserToken.token;
        newInstallerUser.newCustomerUserDataInfo.success = true;
        res.json(newInstallerUser.newCustomerUserDataInfo);
    } catch (error) {
        //console.error('1) Error creating customer', error.response.data.message);
        console.error('1) Error creating installer user: ', error.response.data.message);
        res.status(500).json({ error: error.response.data.message }); // Send error response to the client
    }
});

app.get('/Tenant', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/New Tenant.html'));
});

app.post('/New_Tenant_Registration', async function (req, res) {
    //req.body.additionalInfo = {};
    try {
        await setJwtTenantToken();
        const newTenant = await createTenant(req.body, jwtTenantToken); // Call createCustomer function with the request body and token
        console.log('newTenant: ', newTenant);
        if (newTenant !== undefined) {
            newTenantId = newTenant.id.id;
            res.json(newTenant);
        }
        //console.log('userData[req.user.name].newTenantId : ', userData[req.user.name].newTenantId);
    } catch (error) {
        //console.log('1) Error creating tenant:', error.message);
        //console.error('1) Error creating tenant:', error.message);
        console.error('1) Error creating tenant:', error.response.data.message);
        res.status(500).json({ error: error.response.data.message });
    };
});

// app.get('/Existing_Customer', function (req, res) {
//     res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/Existing Customer.html'));
// });

// app.post('/Existing_User_Login', async function (req, res) {
//     const userCredsJSON = req.body;
//     console.log('Customer User Credentials', userCredsJSON);
//     try {
//         const authResult = await autenticateUserPWD(userCredsJSON);
//         userData[req.user.name].userId = await authResult.userId;
//         userData[req.user.name].customerId = await authResult.customerId;
//         userData[req.user.name].tenantUserId = await authResult.tenantUserId;
//         console.log('userData[req.user.name].customerId :', userData[req.user.name].customerId);
//         const isMatch = await authResult.result;

//         //console.log({ customerId, userId, isMatch });
//         res.json({ "success": isMatch });

//     } catch (error) {
//         console.error('Error authenticating user:', error.message);
//         res.status(401).json({ "success": false });
//     }
// });


// app.get('/Existing_Tenant', function (req, res) {
//     res.sendFile(path.join(__dirname, 'public', '/LOGIN_SIGNIN_HTML/Existing Tenant.html'));
// });

app.post('/onLoad', authenticateToken, async function (req, res) {
    if (userData[req.user.name] && userData[req.user.name].role) {
        role = userData[req.user.name].role;
        boolean = true;
    } else {
        role = 'NA';
        boolean = false;
    }
    res.json({ "role": role, "success": boolean });
});

app.post('/LoginApp', async function (req, res) {
    credsJSON = req.body;
    //console.log({credsJSON});
    //userData[req.user.name].cred = credsJSON;
    try {
        const authResult = await getUserToken(credsJSON);
        const tokenUser = (await authResult).tokenUser;
        const boolean = (await authResult).boolean;

        //
        if (boolean) {

            const username = req.body.username;
            const user = { name: username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            //console.log({ username, accessToken });
            //

            const userDetails = await getUserDeatils(tokenUser);
            //console.log({userDetails});
            //     if(userDetails === 0){
            //         res.json({ "success": false });
            //     };

            //     if(userDetails.additionalInfo.description === ''){
            //         res.json({ "success": false });
            //     }
            //     else{
            //     const role = userDetails.additionalInfo.description;
            //     if(role === "Installer"){
            //        userData[req.user.name].tenantUserId = userDetails.id.id;
            //        userData[req.user.name].tenantId = userDetails.customerId.id;
            //     }
            //     else{
            //         userData[req.user.name].customerUserId = userDetails.id.id;
            //         userData[req.user.name].customerId = userDetails.customerId.id;
            //     }
            //     res.json({ "role": role, "success": boolean });
            // }
            if (userDetails === 0) {
                res.json({ "success": false });
            }
            else {
                if (userDetails.additionalInfo.description === '') {
                    res.json({ "success": false });
                }
                else {
                    const role = userDetails.additionalInfo.description;

                    if (!userData[username]) {
                        // Initialize the userData[username] object if it doesn't exist
                        userData[username] = {};
                    }

                    userData[username].role = role;

                    if (role === "Installer") {
                        userData[username].tenantUserId = userDetails.id.id;
                        userData[username].tenantId = userDetails.customerId.id;
                    }
                    else {
                        userData[username].customerUserId = userDetails.id.id;
                        userData[username].customerId = userDetails.customerId.id;
                    }
                    //console.log('userData : ', userData);
                    res.json({ "role": role, "success": boolean, "accessToken": accessToken });
                }
            };
        };
    } catch (error) {
        console.error('1) Error getting Tenant JWT token:', error.message);
    }
});

app.post('/Login', async function (req, res) {
    credsJSON = req.body;
    //console.log({credsJSON});
    //userData[req.user.name].cred = credsJSON;
    try {
        const authResult = await getUserToken(credsJSON);
        const tokenUser = (await authResult).tokenUser;
        const boolean = (await authResult).boolean;
        //console.log('boolean: ',boolean);
        //
        if (boolean) {

            const username = req.body.username;
            const user = { name: username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 86400 });
            //console.log({ username, accessToken });
            //

            const userDetails = await getUserDeatils(tokenUser);
            //console.log({userDetails});
            //     if(userDetails === 0){
            //         res.json({ "success": false });
            //     };

            //     if(userDetails.additionalInfo.description === ''){
            //         res.json({ "success": false });
            //     }
            //     else{
            //     const role = userDetails.additionalInfo.description;
            //     if(role === "Installer"){
            //        userData[req.user.name].tenantUserId = userDetails.id.id;
            //        userData[req.user.name].tenantId = userDetails.customerId.id;
            //     }
            //     else{
            //         userData[req.user.name].customerUserId = userDetails.id.id;
            //         userData[req.user.name].customerId = userDetails.customerId.id;
            //     }
            //     res.json({ "role": role, "success": boolean });
            // }
            if (userDetails === 0) {
                res.json({ "success": false });
            }
            else {
                if (userDetails.additionalInfo.description === '') {
                    res.json({ "success": false });
                }
                else {
                    const role = userDetails.additionalInfo.description;

                    if (!userData[username]) {
                        // Initialize the userData[username] object if it doesn't exist
                        userData[username] = {};
                    }

                    userData[username].role = role;

                    if (role === "Installer") {
                        userData[username].tenantUserId = userDetails.id.id;
                        userData[username].tenantId = userDetails.customerId.id;
                    }
                    else {
                        userData[username].customerUserId = userDetails.id.id;
                        userData[username].customerId = userDetails.customerId.id;
                    }
                    //console.log('userData : ', userData);
                    res.json({ "role": role, "success": boolean, "accessToken": accessToken });
                }
            };
        }
        else {
            res.json({ "role": null, "success": boolean, "accessToken": null });
        };
    } catch (error) {
        console.error('1) Error getting Tenant JWT token:', error.message);
        console.log('1) Error getting Tenant JWT token:', error.message);
    }
});

app.get('/tenantHome', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantHome.html'));
});

app.get('/tenantAlarm', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantAlarm.html'));
});

app.get('/tenantDashboard', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantDashboard.html'));
});

app.get('/tenantDevice', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantDevice.html'));
});

app.get('/tenantAsset', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantAsset.html'));
});

app.get('/tenantCustomer', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantCustomer.html'));
});

app.get('/tenantNotification', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/tenantNotification.html'));
});

app.get('/customerHome', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerHome.html'));
});

// app.get('/customerHome', function (req, res) {
//     const customerId = req.query.customerId;
//     res.render('customerHome', { customerId });
// });

// app.get('/customerDash', authenticateToken, function (req, res) {
//     res.sendFile(path.join(__dirname, 'public', '/HTML/customerDashboard.html'));
// });

app.post('/setDevice', authenticateToken, function (req, res) {
    userData[req.user.name].deviceId = req.body.deviceId;
    //console.log('req.query.deviceId in app.js from /setDevice: ', userData[req.user.name].deviceId);
    let setDevice = true;
    res.json(setDevice);
});

app.get('/customerDashboard', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerDashboard.html'));
});

app.get('/customerDash', authenticateToken, function (req, res) {
    userData[req.user.name].deviceId = req.query.deviceId;
    //console.log('req.query.deviceId in app.js from /customerDashboard: ', userData[req.user.name].deviceId);
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerDashboard.html'));
});

app.get('/customerAlarm', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerAlarm.html'));
});

app.post('/setCustomer', authenticateToken, function (req, res) {
    //console.log('From /setCustomer req.body.customerId = ', req.body.customerId);
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].customerId = userData[req.user.name].newCustomerId;
    }
    else if (userData[req.user.name].customerId === undefined && req.body.customerId === undefined) {
        userData[req.user.name].customerId = userData[req.user.name].customerId;
    }
    else if (req.body.customerId !== undefined) {
        userData[req.user.name].customerId = req.body.customerId;
    }
    let setCustomer = true;
    res.json(setCustomer);
});

app.get('/customerDevice', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerDevice.html'));
});

app.get('/customerDev', authenticateToken, function (req, res) {
    //console.log('req.query.customerId = ',req.query.customerId);
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].customerId = userData[req.user.name].newCustomerId;
    }
    else if (userData[req.user.name].customerId === undefined && req.query.customerId === undefined) {
        userData[req.user.name].customerId = userData[req.user.name].customerId;
    }
    else if (req.query.customerId !== undefined) {
        userData[req.user.name].customerId = req.query.customerId;
    }

    //console.log('userData[req.user.name].customerId in app.js from /customerDevice: ', userData[req.user.name].customerId);
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerDevice.html'));
});

app.get('/customerAsset', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerAsset.html'));
});

app.get('/customerNotification', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', '/HTML/customerNotification.html'));
});

// const refreshInterval = 2 * 60 * 1000; // 2 minutes in milliseconds

// async function refreshCache(pageIdentifier, jwtTenantToken) {
//     try {
//         const authResult = await getTenantEntityList(pageIdentifier, jwtTenantToken);

//         const cacheKey = `${pageIdentifier}-${jwtTenantToken}`;
//         cache.set(cacheKey, authResult, refreshInterval / 1000); // Cache for 2 minutes

//         //console.log(`Cache refreshed for ${cacheKey}`);
//     } catch (error) {
//         console.error('Error refreshing cache:', error.message);
//     }
// }

// app.post('/tenantEntityList', async (req, res) => {
//     const pageIdentifier = req.body.pageIdentifier;
//     await setJwtTenantToken(req);
//     const cacheKey = `${pageIdentifier}-${jwtTenantToken}`;


//     // Check if cached data is available
//     const cachedData = cache.get(cacheKey);
//     if (cachedData) {
//         //console.log('Serving from cache:', cacheKey);
//         return res.json(cachedData);
//     }

//     await refreshCache(pageIdentifier, jwtTenantToken);
//     return res.json(cache.get(cacheKey));
// });

// // Refresh the cache every 2 minutes
// setInterval(async () => {
//     const pageIdentifiers = ['tenantCustomer', 'tenantAlarm', 'tenantDevice', 'tenantAsset'];
//     await setJwtTenantToken(req);
//     console.log(jwtTenantToken);

//     for (const pageIdentifier of pageIdentifiers) {
//         await refreshCache(pageIdentifier, jwtTenantToken);
//         await new Promise(resolve => setTimeout(resolve, 2*1000)); //keeping a delay of 2 seconds between cache refresh of every page
//         console.log(`${pageIdentifier} cache got refreshed`);
//     }
// }, refreshInterval);

app.post('/tenantEntityList', authenticateToken, async function (req, res) {
    if (userData[req.user.name].newTenantId !== undefined) {
        userData[req.user.name].tId = userData[req.user.name].newTenantId;
    }
    else {
        userData[req.user.name].tId = userData[req.user.name].tenantId;
    };
    const pageIdentifier = req.body.pageIdentifier;
    try {
        await setJwtTenantToken();
        //console.log('jwtTenantToken inside /tenantEntityList',jwtTenantToken);
        const authResult = await getTenantEntityList(pageIdentifier, jwtTenantToken, userData[req.user.name].tId);
        console.log(authResult);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting Tenant Customer List:', error.message);
    }
});

app.post('/customerEntityList', authenticateToken, async function (req, res) {
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].cId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].cId = userData[req.user.name].customerId;
    };
    const pageIdentifier = req.body.pageIdentifier;
    //console.log('customerId read in backend from let customerId: ', userData[req.user.name].cId);
    try {

        await setJwtTenantToken();
        //console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getCustomerEntityList(pageIdentifier, jwtTenantToken, userData[req.user.name].cId);
        //console.log({ authResult });
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting Tenant Customer List:', error.message);
    }
});

app.post('/getSessionDeviceId', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].cId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].cId = userData[req.user.name].customerId;
    };
    let currentdeviceID;
    if (userData[req.user.name].deviceId === undefined) {
        await setJwtTenantToken();
        const deviceList = await getCustomerEntityList(pageIdentifier, jwtTenantToken, userData[req.user.name].cId);
        // console.log('list:', deviceList)
        if (deviceList.data.length > 0) {
            currentdeviceID = deviceList.data[0].deviceId;
        }
    } else {
        currentdeviceID = userData[req.user.name].deviceId;
    }
    if (currentdeviceID != undefined) {
        res.json(currentdeviceID);
    } else {
        currentdeviceID = 0;
        res.json(currentdeviceID);
    }

});

app.post('/customerDeviceTelemetry', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const userSelectedDeviceId = req.body.deviceID;

    try {
        const authResult = await getDeviceTelemetry(pageIdentifier, jwtTenantToken, userSelectedDeviceId);
        //console.log('Data from app.js 123', authResult);
        res.json(authResult);
    } catch (error) {
        console.error('Error fetching telemetry data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/customerSparklineDeviceTelemetry', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const userSelectedDeviceId = req.body.deviceID;
    // console.log('deviceid:', frontendDeviceId)
    //console.log('deviceId read in backend from let deviceId: ', userData[req.user.name].deviceId);
    try {
        await setJwtTenantToken();

        // console.log('userData[req.user.name].deviceId: ', userData[req.user.name].deviceId);
        // console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getDeviceSparklineTelemetry(pageIdentifier, jwtTenantToken, userSelectedDeviceId);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting sparkline Customer List:', error.message);
    }
});


// app.post('/User_Concern_Email', async function (req, res) {
//     try {
//     const result = await emailUserConcern(req.body);
//     res.json(result);
//     }catch (error) {
//         res.status(500).json({ error });
//     }
// });

app.post('/getName', authenticateToken, async function (req, res) {
    try {
        if (req.body.identifier === "C") {
            if (userData[req.user.name].newCustomerId !== undefined) {
                id = userData[req.user.name].newCustomerId;
            }
            else {
                id = userData[req.user.name].customerId;
            }
        }
        else if (req.body.identifier === "I") {

            // if (newTenantId !== null) {
            //     id = newTenantId;
            // }
            // else {
            //     id = userData[req.user.name].tenantId;
            // }

            if (userData[req.user.name].tenantId === undefined) {
                id = userData[req.user.name].newTenantId;
            }
            else {
                id = userData[req.user.name].tenantId;
            }
        }

        await setJwtTenantToken();
        const result = await getCustomerName(id, jwtTenantToken);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/homeDetails', authenticateToken, async function (req, res) {
    try {
        //console.log('userData[req.user.name].customerId: ', userData[req.user.name].customerId);
        //console.log('req.user: ', req.user);
        const pageIdentifier = req.body.pageIdentifier;
        //console.log({ pageIdentifier });
        if (pageIdentifier === 'tenantHome') {
            if (userData[req.user.name].newTenantId !== undefined) {
                id = userData[req.user.name].newTenantId;
            }
            else {
                id = userData[req.user.name].tenantId;
            };
            // console.log({ id });
        }
        else if (pageIdentifier === 'customerHome') {
            if (userData[req.user.name].newCustomerId !== undefined) {
                id = userData[req.user.name].newCustomerId;
            }
            else {
                id = userData[req.user.name].customerId;
            }
        };

        //console.log({ id });
        await setJwtTenantToken();
        const result = await homeDetails(id, jwtTenantToken, pageIdentifier);
        //console.log({ result });
        res.json(result);

    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/unassignDevice', authenticateToken, async function (req, res) {
    try {
        const deviceId = req.body.deviceId;

        //console.log({ deviceId });
        await setJwtTenantToken();
        const result = await unassignDevice(deviceId, jwtTenantToken);
        //console.log({ result });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/populateCustomer', authenticateToken, async function (req, res) {
    try {
        const customerId = req.body.customerId;

        //console.log({ customerId });
        await setJwtTenantToken();
        const result = await getCustomer(customerId, jwtTenantToken);
        userData[req.user.name].cuId = await result.id.id;
        //console.log({ result });
        res.json(result);

    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/editCustomer', authenticateToken, async function (req, res) {
    try {
        //console.log('req.body inside before /editCustomer: ', req.body);
        req.body.id = {
            "entityType": "CUSTOMER",
            "id": userData[req.user.name].cuId
        };

        //console.log('req.body inside /editCustomer: ', req.body);
        await setJwtTenantToken();
        const result = await editCustomer(req.body, jwtTenantToken);
        userData[req.user.name].cuId = await result.id.id;
        //console.log({ result });
        res.json(result);

    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/setDeviceID', authenticateToken, async function (req, res) {
    //console.log('req.body setDeviceID: ', req.body);
    try {
        userData[req.user.name].devId = req.body.deviceId;
        const result = true;
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/getDeviceId', authenticateToken, function (req, res) {
    //console.log('req.body setDeviceID: ', req.body);
    try {
        const deviceId = userData[req.user.name].devId;
        res.json({ deviceId });
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/editDeviceLable', authenticateToken, async function (req, res) {
    try {
        console.log('req.body inside /editDeviceLable: ', req.body);
        await setJwtTenantToken();
        const result = await editDeviceLable(userData[req.user.name].devId, req.body.lable);
        res.json(result.success);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/deleteCustomer', authenticateToken, async function (req, res) {
    try {
        const customerId = req.body.customerId;

        //console.log({ customerId });
        await setJwtTenantToken();
        const result = await deleteCustomer(customerId, jwtTenantToken);
        //console.log({ result });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/deleteCustomer_A', async function (req, res) {
    try {
        const customerId = req.body.customerId;

        console.log({ customerId });
        await setJwtTenantToken();
        const result = await deleteCustomer(customerId, jwtTenantToken);
        //console.log({ result });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/deleteTenant_A', async function (req, res) {
    try {
        const tenantId = req.body.tenantId;

        console.log({ tenantId });
        await setJwtTenantToken();
        const result = await deleteCustomer(tenantId, jwtTenantToken);
        //console.log({ result });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});



app.post('/deviceAttribute', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const voc = req.body.voc;
    const isc = req.body.isc;
    const deviceId = req.body.deviceID;
    //console.log('deviceId read in backend from let deviceId: ', userData[req.user.name].deviceId);
    try {
        await setJwtTenantToken();
        //console.log('userData[req.user.name].deviceId: ', userData[req.user.name].deviceId);
        //console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getDeviceAtrributes(pageIdentifier, jwtTenantToken, deviceId, voc, isc);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting attributes', error.message);
    }
});


app.post('/historicDData', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const historicEpoachTime = req.body.historicepochTime;
    const deviceID = req.body.deviceID;
    //console.log('deviceId read in backend from let deviceId: ', userData[req.user.name].deviceId);
    try {
        await setJwtTenantToken();
        // console.log('userData[req.user.name].deviceId: ', userData[req.user.name].deviceId);
        // console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await gethistoricData(pageIdentifier, jwtTenantToken, deviceID, historicEpoachTime);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting attributes', error.message);
    }
});


app.post('/scanIVCurvy', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const deviceId = req.body.deviceID;
    try {
        await setJwtTenantToken();
        // console.log('userData[req.user.name].deviceId: ', userData[req.user.name].deviceId);
        // console.log({ pageIdentifier, jwtTenantToken });
        //console.log('Doing a scan now')
        const authResult = await scanIV(pageIdentifier, jwtTenantToken, deviceId);
        res.json(authResult);
    } catch (error) {
        console.error('Error scanning:', error.message);
        res.status(500).json({ error: error.message }); // Send the error as JSON response with 500 status code
    }
});

// Logout route
app.post('/logout', authenticateToken, (req, res) => {

    res.status(200).json({ redirectUrl: 'index.html' });
});

app.post('/Assign_Device_To_Customer', authenticateToken, async function (req, res) {
    const deviceName = req.body.deviceName;

    //console.log('customerId read in backend from let customerId: ', userData[req.user.name].customerId);
    //console.log('deviceName: ', deviceName);

    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].cId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].cId = userData[req.user.name].customerId;
    };

    try {
        await setJwtTenantToken();
        const authResult = await assignDevice(deviceName, jwtTenantToken, userData[req.user.name].cId);
        //console.log('authResult: ',authResult);
        res.status(500).json(authResult);

    } catch (error) {
        console.error('1) Error while tagging device to customer: ', error.message);
        res.status(200).json({ error: error.message }); // Send error response to the client
    }

})


app.post('/getUserJWTToken', authenticateToken, async function (req, res) {
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].cId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].cId = userData[req.user.name].customerId;
    };
    await setJwtTenantToken();
    const userjwttoken = await getTheUserjwtToken(jwtTenantToken, userData[req.user.name].cId);
    res.json(userjwttoken);
});

app.post('/checkIfExistingCustomer', async function (req, res) {
    const existingCustomer = await checkIfCustomerExists(req.body.title);
    res.json({ existingCustomer });
});

app.post('/sendSignUpEmail', async function (req, res) {
    try {
        const randomCode = generateRandomCode();
        console.log('Random code:', randomCode);

        const verifyForm = req.body;
        console.log('verifyForm: ', verifyForm);
        //const result = await unassignDevice(deviceId, jwtTenantToken);
        const toEmail = [verifyForm.email];
        const emailSubject = "Verification Code for signup";
        const emailText = `Hi ${verifyForm.title},`;
        const emailHtml = `Here is your Verification Code: <strong>${randomCode}</strong>. Please enter it on the registration page to complete the process.<br><br><br><strong>Thank you!</strong><br>PVgo<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><hr>Copyright © 2024 PVgo. All rights reserved`;
        const mailResponse = await sendEmail(toEmail, emailSubject, emailText, emailHtml);
        console.log('mailResponse: ', mailResponse);
        if (mailResponse !== undefined) {
            console.log('inside saveCode');
            const saveCodeResponse = await saveCode(toEmail, randomCode);
            console.log('saveCodeResponse : ', saveCodeResponse);
            res.json({ saveCodeResponse });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/verifySignupCode', async function (req, res) {
    try {

        console.log('req.body: ', req.body);
        const verifyStatus = await verifyEmail(req.body.email1, req.body.code);
        console.log('verifyStatus: ', verifyStatus);
        res.json({ verifyStatus });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/setVerifyFlag', async function (req, res) {
    try {

        console.log('req.body: ', req.body);
        const verifyFlagStatus = await setVerifyFlagStatus(req.body.email);
        console.log('verifyFlagStatus: ', verifyFlagStatus);
        res.json({ verifyFlagStatus });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/checkIfExists', async function (req, res) {
    try {
        console.log('req.body.email: ', req.body.email);
        const existStatus = await checkExists(req.body.email);
        console.log('existStatus: ', existStatus);
        res.json({ existStatus });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/emailForgotPwdCode', async function (req, res) {
    try {
        const randomCode = generateRandomCode();
        console.log('Random code:', randomCode);
        console.log('userData: ', userData);
        resetPwdEmail = req.body.email;
        console.log('resetPwdEmail: ', resetPwdEmail);
        const toEmail = [resetPwdEmail];
        const emailSubject = "Verification Code for signup";
        const emailText = `Hi,`;
        const emailHtml = `Hi,<br><br>We received a request to reset the password for your account. To verify your identity and complete the password reset process, please use the following verification code: <br><br><strong style="font-size:20px;">${randomCode}</strong><br><br><br><strong>Thank you!</strong><br>E_Billing<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><hr>Copyright © 2024 Megawattpower pvt. ltd. All rights reserved`;
        const mailResponse = await sendEmail(toEmail, emailSubject, emailText, emailHtml);
        console.log('mailResponse: ', mailResponse);
        if (mailResponse !== undefined) {
            console.log('inside saveCode');
            const saveCodeResponse = await saveCodePwdReset(resetPwdEmail, randomCode);
            console.log('saveCodeResponse : ', saveCodeResponse);
            res.json({ saveCodeResponse });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});


app.post('/verifyResetPwdCode', async function (req, res) {
    try {
        console.log('req.body.code: ', req.body.code);
        const verifyStatus = await verifyEmail(req.body.email, req.body.code);
        console.log('verifyStatus: ', verifyStatus);
        res.json({ verifyStatus });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/resetPassword', async function (req, res) {
    try {
        let resetPwdStatus;
        await setJwtTenantToken();
        const userDetails = await resetPwd(req.body.email, jwtTenantToken);
        //console.log('userDetails.customerId.id: ',userDetails.customerId.id);
        if (userDetails.customerId.id === null || userDetails.customerId.id === undefined || userDetails.customerId.id === '') {
            resetPwdStatus = false;
        }
        else {
            //console.log('req.body.password: ', req.body.password);
            const newCustomerUser = await createCustomerUser(userDetails, jwtTenantToken, req.body.password);
            //console.log('newCustomerUser: ',newCustomerUser);
            resetPwdStatus = true;
        }
        res.json({ resetPwdStatus });
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.post('/updateAlarm', authenticateToken, async function (req, res) {
    try {
        const alarmStatus = await updateAlarmStatus(req.body);
        //console.log('alarmStatus: ', alarmStatus);
        res.json({ alarmStatus });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/getCustomerList', authenticateToken, async function (req, res) {
    if (userData[req.user.name].newTenantId !== undefined) {
        userData[req.user.name].tId = userData[req.user.name].newTenantId;
    }
    else {
        userData[req.user.name].tId = userData[req.user.name].tenantId;
    };
    const pageIdentifier = req.body.pageIdentifier;
    try {
        await setJwtTenantToken();
        //console.log('jwtTenantToken inside /tenantEntityList',jwtTenantToken);
        const authResult = await getCustomerList(pageIdentifier, userData[req.user.name].tId);
        // console.log(authResult);
        res.json(authResult);
    } catch (error) {
        console.error('Error getting Tenant Customer List for dashboard:', error.message);
    }
});

app.post('/getuniquepanelmanufacturer', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    try {
        await setJwtTenantToken();

        const authResult = await getUniquePanelManufacturer(pageIdentifier);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting panel manufacturer', error.message);
    }
});

app.post('/getmodel', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const manufacturer = req.body.selectedManufacturer;
    try {
        await setJwtTenantToken();

        const authResult = await getmodel(pageIdentifier, manufacturer);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting panel models', error.message);
    }
});

app.post('/getpaneldata', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const model = req.body.selectedModel;
    try {
        await setJwtTenantToken();

        const authResult = await getpaneldata(pageIdentifier, model);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting panel models', error.message);
    }
});



app.post('/customerDeviceList', authenticateToken, async function (req, res) {
    const pageIdentifier = req.body.pageIdentifier;
    const customerID = req.body.customerIDdashboard;

    //console.log('customerId read in backend from let customerId: ', userData[req.user.name].cId);
    try {

        await setJwtTenantToken();
        //console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getCustomerEntityList(pageIdentifier, jwtTenantToken, customerID);
        //console.log({ authResult });
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting Tenant Customer List:', error.message);
    }
});

app.post('/getUserJWTTokenfortenantdashboard', authenticateToken, async function (req, res) {
    const customerID = req.body.customerID;
    await setJwtTenantToken();
    const userjwttoken = await getTheUserjwtToken(jwtTenantToken, customerID);
    res.json(userjwttoken);
});

app.post('/populateAlarmSettings', authenticateToken, async function (req, res) {
    try {
        const alarmSettings = await getAlarmSettings(req.body.selectedDeviceId);
        res.json(alarmSettings);

    } catch (error) {
        console.error('1) Error getting panel models', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/setAlarmSetting', authenticateToken, async function (req, res) {
    try {
        console.log('req.body inside set Alarm: ', req.body);
        const alarmSettings = await setAlarmSettings(req.body.selectedDeviceId, req.body.alarmSettings);
        res.json({ alarmSettings });
    } catch (error) {
        console.error('1) Error getting panel models', error.message);
    }
});

app.post('/populateDeviceList', authenticateToken, async function (req, res) {
    if (userData[req.user.name].newCustomerId !== undefined) {
        userData[req.user.name].cId = userData[req.user.name].newCustomerId;
    }
    else {
        userData[req.user.name].cId = userData[req.user.name].customerId;
    };
    const pageIdentifier = req.body.pageIdentifier;

    //console.log('customerId read in backend from let customerId: ', userData[req.user.name].cId);
    try {

        await setJwtTenantToken();
        //console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getCustomerEntityList(pageIdentifier, jwtTenantToken, userData[req.user.name].cId);
        //console.log("authResult:", JSON.stringify(authResult, null, 2));
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting Tenant Customer List:', error.message);
    }
});

app.post('/getsimulationStatus', authenticateToken, async function (req, res) {
    const deviceID = req.body.deviceID;
    try {
        await setJwtTenantToken();

        const authResult = await getsimulationStatus(deviceID);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting simulation status', error.message);
    }
});

app.post('/updatePanelAttribute', authenticateToken, async function (req, res) {
    const deviceID = req.body.deviceID;
    const panelData = req.body.panelData;
    try {
        await setJwtTenantToken();

        const authResult = await updatePanelAttribute(deviceID, panelData);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error updating panel data', error.message);
    }
});

app.post('/sendUserVerificationEmail', async function (req, res) {
    try {
        const randomCode = generateRandomCode();
        console.log('Random code:', randomCode);

        const verifyForm = req.body;
        console.log('verifyForm: ', verifyForm);
        //const result = await unassignDevice(deviceId, jwtTenantToken);
        const toEmail = [verifyForm.email];
        const emailSubject = "Create Password - PVgo";
        const emailText = `Hi,`;
        const emailHtml = `Please click below link to verify email and create new password.<br><br><br><p style="font-size:20px;">${process.env.linkTest}/HTML/userVerification.html?code=${randomCode}</p><br><br><br><strong>Thank you!</strong><br>PVgo<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><hr>Copyright © 2024 PVgo. All rights reserved`;
        const mailResponse = await sendEmail(toEmail, emailSubject, emailText, emailHtml);
        console.log('mailResponse: ', mailResponse);
        if (mailResponse !== undefined) {
            console.log('inside saveCode');
            const saveCodeResponse = await saveCode(toEmail, randomCode);
            console.log('saveCodeResponse : ', saveCodeResponse);
            res.json({ saveCodeResponse });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

app.post('/getEmail', async function (req, res) {
    try {
        const email = await getEmailId(req.body.code);
        //console.log('email inside getEmail: ', email);
        res.json(email);
    } catch (error) {
        console.error('1) Error getting email: ', error.message);
        res.status(200).json({ error: error.message });
    }
});

app.post('/saveToken', authenticateToken, async function (req, res) {
    try {
        console.log('req.body: ', req.body);
        console.log('customerUserId', userData[req.user.name].customerUserId);
        const saveTokenStatus = await saveFCMToken(req.body.fcmToken, userData[req.user.name].customerUserId);
        console.log('saveTokenStatus: ', saveTokenStatus);
        res.json({ saveTokenStatus });
    } catch (error) {
        console.log('error app.js: ', error);
        res.status(500).json({ error });
    }
});

app.post('/getFaultLog', authenticateToken, async function (req, res) {
    const epoachFaultDate = req.body.epoachFaultDate;
    const deviceID = req.body.deviceID;
    //console.log('deviceId read in backend from let deviceId: ', userData[req.user.name].deviceId);
    try {
        await setJwtTenantToken();
        // console.log('userData[req.user.name].deviceId: ', userData[req.user.name].deviceId);
        // console.log({ pageIdentifier, jwtTenantToken });
        const authResult = await getfaultlog(jwtTenantToken, deviceID, epoachFaultDate);
        res.json(authResult);

    } catch (error) {
        console.error('1) Error getting attributes', error.message);
    }
});


app.post('/removeFCMToken', authenticateToken, async function (req, res) {
    try {
        //console.log('req.body removeFCMToken: ', req.body);
        //console.log('customerUserId removeFCMToken: ', userData[req.user.name].customerUserId);
        const saveTokenStatus = await removeToken(req.body.fcmToken, userData[req.user.name].customerUserId);
        console.log('saveTokenStatus: ', saveTokenStatus);
        res.json({ saveTokenStatus });
    } catch (error) {
        // console.log('error app.js: ', error);
        // res.status(500).json({ error });
    }
});

// send message to slack - Delete later
app.post('/send-to-slack', async (req, res) => {
    const webhookUrl = 'https://hooks.slack.com/services/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';
    const data = req.body;

    try {
        const response = await axios.post(webhookUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.status(response.status).send({ message: 'Message sent to Slack successfully.' });
    } catch (error) {
        res.status(error.response ? error.response.status : 500).send({ error: 'Error sending message to Slack.' });
    }
});