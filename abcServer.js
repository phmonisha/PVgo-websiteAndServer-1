const axios = require('axios');
require('dotenv').config();
const { Pool } = require('pg');
const WebSocket = require('ws');

const pool = new Pool({
  host: "10.0.1.6",
  user: "thingsboard",
  port: 5432,
  password: "thingsboard",
  database: "thingsboard",
  max: 2,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0
});

const thingsboardHost = process.env.thingsboardHost;
const usernameAdmin = process.env.username;
const passwordAdmin = process.env.password;

const usernameTenant = process.env.usernameTenant;
const passwordTenant = process.env.passwordTenant;

const getJwtSysAdmin = async () => {
  try {

    const url = `${thingsboardHost}/api/auth/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const sysAdminCred = {
      "username": usernameAdmin,
      "password": passwordAdmin
    };

    const response = await axios.post(url, sysAdminCred, { headers });
    const tokenSysAdmin = response.data.token;
    //console.log({ tokenSysAdmin });
    return { "tokenSysAdmin": tokenSysAdmin, "boolean": true };
  } catch (error) {
    console.error('2) Error getting System Admin JWT Token:', error.message);
    return { "tokenSysAdmin": null, "boolean": false };
  }
}

const getJwtTenant = async () => {
  try {

    const url = `${thingsboardHost}/api/auth/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const tenantCred = {
      "username": usernameTenant,
      "password": passwordTenant
    };

    const response = await axios.post(url, tenantCred, { headers });
    const tokenTenant = response.data.token;
    //console.log({ tokenTenant });
    return { "tokenTenant": tokenTenant, "boolean": true };
  } catch (error) {
    console.error('2) Error getting Tenant JWT Token:', error.message);
    return { "tokenTenant": null, "boolean": false };
  }
}

// const getJwtTenant = async (tenantCredentials, tenantId) => {
//   console.log({ tenantCredentials, tenantId });
//   let response;
//   try {
//     //console.log('tenantCredentials_123 : ', tenantCredentials);
//     //if (tenantId === undefined || tenantId === null) {
//       if (tenantId === undefined) {

//       let url = `${thingsboardHost}/api/auth/login`;
//       let headers = {
//         'Content-Type': 'application/json',
//       };
//       response = await axios.post(url, tenantCredentials, { headers });
//     }
//     else {

//       const tokenData = await getJwtSysAdmin();
//       console.log({ tokenData });
//       // if (tokenData && tokenData.tokenSysAdmin) {
//       //   let jwtSysAdminToken = tokenData.tokenSysAdmin;
//       //   console.log({ jwtSysAdminToken });
//       // }
//       let jwtSysAdminToken = tokenData.tokenSysAdmin;

//       let url = `${thingsboardHost}/api/user/${tenantId}/token`;
//       let headers = {
//         'Content-Type': 'application/json',
//         'X-Authorization': `Bearer ${jwtSysAdminToken}`,
//       };
//       response = await axios.get(url, { headers });
//     }

//     const tokenTenant = response.data.token;
//     // console.log({ tokenTenant });
//     return { "tokenTenant": tokenTenant, "boolean": true };
//   } catch (error) {
//     console.error('2) Error getting Tenant JWT Token:', error.message);
//     return { "tokenTenant": null, "boolean": false };
//   }
// }


const getUserToken = async (credentials) => {
  //console.log({ credentials });
  try {

    const url = `${thingsboardHost}/api/auth/login`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, credentials, { headers });
    const tokenUser = response.data.token;
    //console.log({ tokenUser });
    return { "tokenUser": tokenUser, "boolean": true };
  } catch (error) {
    console.error('2) Error getting User JWT Token:', error.message);
    return { "tokenUser": null, "boolean": false };
  }
}

const getTheUserjwtToken = async (jwtTenantToken, customerId) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const sqlQuery17 = `SELECT array_agg(id) AS id FROM public.tb_user WHERE customer_id = '${customerId}'`;
    const res = await pool.query(sqlQuery17);

    //const userDataResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/users?pageSize=1&page=1`, { headers });
    //const userData = userDataResponse.data;
    //const userId = userData.data[0].id.id;
    const userId = res.rows[0].id[0];
    const userToken = await axios.get(`${thingsboardHost}/api/user/${userId}/token`, { headers });
    // console.log(userToken.data);
    return userToken.data;
  } catch (error) {
    throw error;
  };

};

const getUserDeatils = async (tokenUser) => {
  try {

    const url = `${thingsboardHost}/api/auth/user`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${tokenUser}`,
    };

    const response = await axios.get(url, { headers });
    const userDetails = response.data;
    //console.log({ userDetails });
    return userDetails;
  } catch (error) {
    console.error('2) Error getting user details on login:', error.message);
    return 0;
  }
}

const createCustomer = async (customerData, jwtTenantToken, tenantId) => {
  try {
    let url = `${thingsboardHost}/api/customer`;

    let headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    console.log('customerData: ', customerData);

    const response = await axios.post(url, customerData, { headers });
    const newCustomerDataInfo = await response.data;
    console.log('New customer created:', newCustomerDataInfo);

    url = `${thingsboardHost}/api/plugins/telemetry/CUSTOMER/${newCustomerDataInfo.id.id}/attributes/SERVER_SCOPE`;

    const attribute = {
      "AccessLevel": "EndUser"
    };

    const attributeCreation = await axios.post(url, attribute, { headers });
    console.log('attributeCreation.data: ', attributeCreation.data);

    //////////


    url = `${thingsboardHost}/api/relation`;

    if (tenantId === null || tenantId === undefined) {
      tenantId = "0f7189f0-631b-11ee-9c67-638bd1419106";
      title = "MWP Default Installer";
    }
    else {
      const sqlQuery6 = `select title from customer where id = '${tenantId}'`;
      const res = await pool.query(sqlQuery6);
      //console.log('res.rows: ', res.rows);
      title = res.rows[0].title;
    }

    const relations = {
      "from": {
        "id": newCustomerDataInfo.id.id,
        "entityType": "CUSTOMER"
      },
      "to": {
        "id": tenantId,
        "entityType": "CUSTOMER"
      },
      "type": "Contains",
      "typeGroup": "COMMON",
      "additionalInfo": {
        "installerGroup": title
      }
    };

    const relationsCreation = await axios.post(url, relations, { headers });

    //console.log('relationsCreation.data: ', relationsCreation.data);

    /////////

    if (attributeCreation.data === '' && relationsCreation.data === '') {

      return newCustomerDataInfo;
    }
    else {

      url = `${thingsboardHost}/api/customer/${newCustomerDataInfo.id.id}`;

      headers = {
        'accept': '*/*',
        'X-Authorization': `Bearer ${jwtTenantToken}`,
      };

      const deleteCustomer = await axios.delete(url, { headers });

      throw new Error("Due to technical issues Installer account couldn't be created. Please try again.");

    }

  } catch (error) {
    throw error;
  }
};

const createCustomerUser = async (userData, jwtTenantToken, userPwd) => {
  //console.log({ userData });
  let headers = null;
  try {
    const url = `${thingsboardHost}/api/user?sendActivationMail=false`;

    headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    //console.log({ url, headers, userData });
    const response = await axios.post(url, userData, { headers });
    const newCustomerUserDataInfo = await response.data;
    //console.log('New customer user created:', newCustomerUserDataInfo);
    const userId = await response.data.id.id;

    //console.log('userId:', userId);

    headers = {
      'accept': 'text/plain',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const activationURL = await axios.get(`${thingsboardHost}/api/user/${userId}/activationLink`, { headers });
    //console.log('activationURL:', activationURL.data);
    const urlObj = new URL(activationURL.data);
    const activateToken = urlObj.searchParams.get('activateToken');
    //console.log(activateToken);

    const body = {
      "activateToken": activateToken,
      "password": userPwd
    }

    headers = {
      'Content-Type': 'application/json',
    };


    const jwtUserToken = await axios.post(`${thingsboardHost}/api/noauth/activate?sendActivationMail=false`, body, { headers });
    //console.log(`jwtUserToken.data.token: `, jwtUserToken.data.token);
    return { "newCustomerUserDataInfo": newCustomerUserDataInfo, "jwtUserToken": jwtUserToken.data.token };
    //return {newCustomerUserDataInfo};

  } catch (error) {
    console.error('2)Error creating customer User:', error.response.data.message);
    throw error;
  }
};


const resetPwd = async (email, jwtTenantToken) => {
  try {

    const sqlQuery21 = `SELECT id FROM public.tb_user where email = '${email}'`;

    const res = await pool.query(sqlQuery21);

    if (res.rows.length === 0) {
      throw new Error('User not found in the database.');
    }

    const userId = res.rows[0].id;

    const headers = {
      'accept': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const userDetails = await axios.get(`${thingsboardHost}/api/user/${userId}`, { headers });

    //console.log('userDetails.data: ', userDetails.data);

    delete userDetails.data.additionalInfo;
    delete userDetails.data.createdTime;
    delete userDetails.data.id;

    userDetails.data.additionalInfo = {
      description: 'Customer'
    }

    //console.log('userDetails.data: ', userDetails.data);

    if (!userDetails.data.customerId.id) {
      throw new error('Could not get user data.');
    }
    else {

      //console.log('userId: ',userId);
      //console.log('jwtTenantToken: ',jwtTenantToken);

      const headers1 = {
        'accept': '*/*',
        'X-Authorization': `Bearer ${jwtTenantToken}`,
      };

      const deleteStatus = await axios.delete(`${thingsboardHost}/api/user/${userId}`, { headers: headers1 });
      //console.log('deleteStatus: ', deleteStatus.data);

      return userDetails.data;

    }

  }
  catch (error) {
    console.error('Error:', error.message);
    throw error.message;
  }
};

const createTenant = async (tenantData, jwtTenantToken) => {
  try {
    let url = `${thingsboardHost}/api/customer`;

    console.log({ jwtTenantToken });
    console.log({ tenantData });

    let headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const response = await axios.post(url, tenantData, { headers });
    console.log('New tenant ID response:', response);
    const newTenantDataInfo = await response.data;
    //console.log('New tenant ID:', newTenantDataInfo.id.id);

    url = `${thingsboardHost}/api/plugins/telemetry/CUSTOMER/${newTenantDataInfo.id.id}/attributes/SERVER_SCOPE`;

    const attribute = {
      "AccessLevel": "Installer"
    };

    const attributeCreation = await axios.post(url, attribute, { headers });

    console.log('attributeCreation.data: ', attributeCreation.data);

    if (attributeCreation.data === '') {
      return newTenantDataInfo;
    }

    else {

      url = `${thingsboardHost}/api/customer/${newTenantDataInfo.id.id}`;

      headers = {
        'accept': '*/*',
        'X-Authorization': `Bearer ${jwtTenantToken}`,
      };

      const deleteTenant = await axios.delete(url, { headers });

      throw new Error("Due to technical issues Installer account couldn't be created. Please try again.");
    }

  } catch (error) {
    //console.log('error: ',error.response.data);
    //console.error('2)Error creating tenant:', error.response.data);
    throw error;
  }
};

const getTenantEntityList = async (pageIdentifier, jwtTenantToken, installerCustomerId) => {
  try {

    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    let modifiedResponse;
    let thingsboardResponse = null;
    const sqlQuery1 = `SELECT c2.created_time createdtime, c2.title, c2.email, c2.country, c2.city, c2.id customerid FROM relation r, customer c1, customer c2 WHERE r.from_type = 'CUSTOMER' AND r.from_id = c2.id AND ( r.additional_info :: json ) ->> 'installerGroup' = c1.title AND c1.id = '${installerCustomerId}' order by 1 desc`;
    const sqlQuery2 = `select a.created_time createdtime, a.originator_id originatorid, a.type, a.severity, a.assignee_id assigneeid, a.cleared||'_'||a.acknowledged status from alarm a where a.customer_id in (SELECT r.from_id FROM relation r, customer c1 WHERE r.from_type = 'CUSTOMER' AND ( r.additional_info :: json ) ->> 'installerGroup' = c1.title AND c1.id = '${installerCustomerId}') order by 1 desc`;
    const sqlQuery3 = `select d.created_time createdtime, d.name, (select name from device_profile where id = d.device_profile_id) deviceprofile, d.label, (select title from customer where id = d.customer_id) customer, d.id deviceid, d.customer_id customerId from device d where d.type = 'curvy' AND d.customer_id in (SELECT r.from_id FROM relation r, customer c1 WHERE r.from_type = 'CUSTOMER' AND ( r.additional_info :: json ) ->> 'installerGroup' = c1.title AND c1.id = '${installerCustomerId}') order by 1 desc`;
    const sqlQuery4 = `select a.created_time createdtime, a.name, (select name from asset_profile where id = a.asset_profile_id) assetprofile, a.label, (select title from customer where id = a.customer_id) customer from asset a where a.customer_id in (SELECT r.from_id FROM relation r, customer c1 WHERE r.from_type = 'CUSTOMER' AND ( r.additional_info :: json ) ->> 'installerGroup' = c1.title AND c1.id = '${installerCustomerId}') order by 1 desc`;

    //Make a GET API call to ThingsBoard API
    if (pageIdentifier === 'tenantCustomer') {

      try {
        const res = await pool.query(sqlQuery1);
        thingsboardResponse = res.rows;

        modifiedResponse = {
          data: thingsboardResponse,
          hasNext: false,
        };
        //console.log('modifiedResponse1:  ',modifiedResponse);
      } catch (err) {
        console.error(err);
      }
    }
    else if (pageIdentifier === 'tenantAlarm') {
      try {
        const res = await pool.query(sqlQuery2);
        thingsboardResponse = res.rows;

        modifiedResponse = {
          data: thingsboardResponse,
          hasNext: false,
        };
        //console.log('modifiedResponse1:  ',modifiedResponse);
      } catch (err) {
        console.error(err);
      }
    }
    else if (pageIdentifier === 'tenantDevice') {
      try {
        const res = await pool.query(sqlQuery3);
        thingsboardResponse = res.rows;

        // console.log('thingsboardResponse: ', thingsboardResponse);

        modifiedResponse = {
          data: thingsboardResponse,
          hasNext: false,
        };
        //console.log('modifiedResponse1:  ',modifiedResponse);
      } catch (err) {
        console.error(err);
      }
    }
    else if (pageIdentifier === 'tenantAsset') {
      try {
        const res = await pool.query(sqlQuery4);
        thingsboardResponse = res.rows;

        modifiedResponse = {
          data: thingsboardResponse,
          hasNext: false,
        };
        //console.log('modifiedResponse1:  ',modifiedResponse);
      } catch (err) {
        console.error(err);
      }
    }
    //console.log('modifiedResponse2:  ',modifiedResponse);
    //client.end();
    return modifiedResponse;
  } catch (error) {
    console.error('2) Error creating tenant list:', error.message);
    return 0;
  }
}

/////////////////////

const getCustomerEntityList = async (pageIdentifier, jwtTenantToken, customerId) => {
  try {

    //console.log({ pageIdentifier, jwtTenantToken, customerId });

    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    let modifiedResponse;

    //Make a GET API call to ThingsBoard API
    if (pageIdentifier === 'customerAlarm') {
      //console.log(pageIdentifier);
      intermediateResponse = await axios.get(`${thingsboardHost}/api/alarm/CUSTOMER/${customerId}?pageSize=1&page=0`, { headers });
      if (intermediateResponse.data.totalElements !== 0) {
        itemsPerPage = intermediateResponse.data.totalElements;
      } else {
        itemsPerPage = 1;
      };

      thingsboardResponse = await axios.get(`${thingsboardHost}/api/alarm/CUSTOMER/${customerId}?pageSize=1&page=0`, { headers });

      modifiedResponse = {
        data: await Promise.all(thingsboardResponse.data.data.map(async item => {

          let originator = null;
          originator = await getDeviceName(item.originator.id, jwtTenantToken);


          let assigneeName = null;

          if (item.assignee === null) {
            assigneeName = null;
          } else {
            assigneeName = item.assignee ? (item.assignee.firstName + ' ' + item.assignee.lastName) : '';
          }

          return {
            createdTime: item.createdTime,
            originator: originator,
            type: item.type,
            severity: item.severity,
            assignee: assigneeName,
            status: item.status,
          };
        })),
        hasNext: thingsboardResponse.data.hasNext,
      };
    }
    else if (pageIdentifier === 'customerDevice') {

      //console.log('customerId inside customerEntityList customerDevice: ', customerId);

      intermediateResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/devices?pageSize=1&page=0`, { headers });
      if (intermediateResponse.data.totalElements !== 0) {
        itemsPerPage = intermediateResponse.data.totalElements;
      } else {
        itemsPerPage = 1;
      };
      thingsboardResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/deviceInfos?pageSize=${itemsPerPage}&page=0`, { headers });

      //console.log('thingsboardResponse.data.data: ', thingsboardResponse.data.data);

      modifiedResponse = {
        data: (await Promise.all(thingsboardResponse.data.data.map(async item => {
          let customer = null;
          const deviceProfile = 'curvy';

          if (item.customerId && item.customerId.id !== '13814000-1dd2-11b2-8080-808080808080') {
            customer = await getCustomerName(item.customerId.id, jwtTenantToken);
          }

          //console.log('item.deviceProfileId.id: ',item.deviceProfileId.id);

          return {
            createdTime: item.createdTime,
            name: item.name,
            deviceProfile: deviceProfile,
            deviceProfileId: item.deviceProfileId.id,
            label: item.label,
            deviceId: item.id.id,
            status: item.active,
          };
        }))).filter(item => item.deviceProfileId === 'ac773360-10a7-11ee-8cb3-398c6452fe3e'), // Filter data by deviceProfile
        hasNext: thingsboardResponse.data.hasNext,
      };
    }
    else if (pageIdentifier === 'customerAsset') {
      intermediateResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/assets?pageSize=1&page=0`, { headers });
      if (intermediateResponse.data.totalElements !== 0) {
        itemsPerPage = intermediateResponse.data.totalElements;
      } else {
        itemsPerPage = 1;
      };
      thingsboardResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/assets?pageSize=${itemsPerPage}&page=0`, { headers });

      modifiedResponse = {
        data: await Promise.all(thingsboardResponse.data.data.map(async item => {

          let assetProfile = null;
          assetProfile = await getAssetProfileName(item.assetProfileId.id, jwtTenantToken);

          return {
            createdTime: item.createdTime,
            name: item.name,
            assetProfile: assetProfile,
            label: item.label,
          };
        })),
        hasNext: thingsboardResponse.data.hasNext,
      };
    }
    else if (pageIdentifier === 'customerDashboard' || pageIdentifier === 'tenantDashboard') {
      intermediateResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/devices?pageSize=1&page=0`, { headers });
      if (intermediateResponse.data.totalElements !== 0) {
        itemsPerPage = intermediateResponse.data.totalElements;
      } else {
        itemsPerPage = 1;
      };
      thingsboardResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/devices?pageSize=${itemsPerPage}&page=0`, { headers });

      modifiedResponse = {
        data: (await Promise.all(thingsboardResponse.data.data.map(async item => {
          let customer = null;
          const deviceProfile = 'curvy';

          if (item.customerId && item.customerId.id !== '13814000-1dd2-11b2-8080-808080808080') {
            customer = await getCustomerName(item.customerId.id, jwtTenantToken);
          }

          //console.log('item.deviceProfileId.id: ',item.deviceProfileId.id);

          return {
            createdTime: item.createdTime,
            name: item.name,
            deviceProfile: deviceProfile,
            deviceProfileId: item.deviceProfileId.id,
            label: item.label,
            deviceId: item.id.id,
          };
        }))).filter(item => item.deviceProfileId === 'ac773360-10a7-11ee-8cb3-398c6452fe3e'), // Filter data by deviceProfile
        hasNext: thingsboardResponse.data.hasNext,
      };
    }
    //console.log({ modifiedResponse });
    return modifiedResponse;
  } catch (error) {
    console.error('2) Error creating customer list:', error.message);
    return 0;
  }
}


//////////////////////

const getCustomerName = async (customerID, jwtTenantToken) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const customerName = await axios.get(`${thingsboardHost}/api/customer/${customerID}`, { headers });
    return customerName.data.name;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const getDeviceName = async (deviceId, jwtTenantToken) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const deviceName = await axios.get(`${thingsboardHost}/api/device/${deviceId}`, { headers });
    return deviceName.data.name;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const getAssetProfileName = async (assetProfileId, jwtTenantToken) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const assetProfileName = await axios.get(`${thingsboardHost}/api/assetProfileInfo/${assetProfileId}`, { headers });
    return assetProfileName.data.name;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const getDeviceProfileName = async (deviceProfileId, jwtTenantToken) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const deviceProfileName = await axios.get(`${thingsboardHost}/api/deviceProfileInfo/${deviceProfileId}`, { headers });
    return deviceProfileName.data.name;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const homeDetails = async (id, jwtTenantToken, pageIdentifier) => {
  try {
    const headers = {
      'accept': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const details = await axios.get(`${thingsboardHost}/api/customer/${id}`, { headers });
    //console.log(profileDetails.data);
    const data = details.data;

    let res = null;
    if (pageIdentifier === 'tenantHome') {
      const sqlQuery8 = `WITH mm AS (SELECT r.from_id FROM relation r, customer c1 WHERE r.from_type = 'CUSTOMER' AND (r.additional_info::json) ->> 'installerGroup' = c1.title AND c1.id = '${id}'), customer AS (SELECT count(*) customer FROM customer,mm WHERE id = mm.from_id), device AS (SELECT count(*) device FROM ( SELECT device_profile_id FROM device,mm WHERE device_profile_id = 'ac773360-10a7-11ee-8cb3-398c6452fe3e' AND customer_id = mm.from_id) d), alarm AS (select count(*) alarm from alarm, mm where customer_id = mm.from_id), asset AS (select count(*) asset from asset, mm where customer_id = mm.from_id) select * from customer,device, alarm, asset`;
      res = await pool.query(sqlQuery8);
    }
    else if (pageIdentifier === 'customerHome') {
      const sqlQuery9 = `WITH mm AS (SELECT id from customer where id = '${id}'), device AS (SELECT count(*) device FROM ( SELECT device_profile_id FROM device,mm WHERE device_profile_id = 'ac773360-10a7-11ee-8cb3-398c6452fe3e' AND customer_id = mm.id) d), alarm AS (select count(*) alarm from alarm, mm where customer_id = mm.id), asset AS (select count(*) asset from asset, mm where customer_id = mm.id) select * from device, alarm, asset`;
      res = await pool.query(sqlQuery9);
    }

    const entityCount = res.rows;

    const sqlQuery9 = `select (first_name||' '||last_name) as name, email from tb_user where authority = 'CUSTOMER_USER' and customer_id = '${id}'`;

    res = await pool.query(sqlQuery9);

    const users = res.rows;

    //console.log({ users });



    return { data, entityCount, users };
  } catch (error) {
    console.error('2)Error getting home page details:', error.message);
  }
};

const unassignDevice = async (deviceId, jwtTenantToken) => {
  try {

    const sqlQuery23 = `UPDATE public.device SET label = null WHERE id = '${deviceId}'`;

    const headers = {
      'accept': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const deviceDetails = await axios.delete(`${thingsboardHost}/api/customer/device/${deviceId}`, { headers });
    console.log('deviceDetails.data.label: ', deviceDetails.data.label);

    if (deviceDetails.data.label !== '') {
      const res = await pool.query(sqlQuery23);
      console.log('Row count:', res.rowCount);
    }
    return deviceDetails.data;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const getCustomer = async (customerId, jwtTenantTokecustomerIdn) => {
  try {
    const headers = {
      'accept': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const customerDetails = await axios.get(`${thingsboardHost}/api/customer/${customerId}`, { headers });
    //console.log('customerDetails.data: ', customerDetails.data);
    return customerDetails.data;
  } catch (error) {
    console.error('2)Error populating customer details before modification:', error.message);
  }
};

const editCustomer = async (customerData, jwtTenantToken) => {
  try {
    let url = `${thingsboardHost}/api/customer`;

    let headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const response = await axios.post(url, customerData, { headers });
    const customerDataInfo = await response.data;
    //console.log('Customer modified data:', customerDataInfo);

    return customerDataInfo;

  } catch (error) {
    console.error('2)Error modifying customer:', error.message);
  }
};

const deleteCustomer = async (customerId, jwtTenantToken) => {
  try {
    const headers = {
      'accept': '*/*',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const customerDetails = await axios.delete(`${thingsboardHost}/api/customer/${customerId}`, { headers });
    //console.log('customerDetails.data: ', customerDetails.data);
    return customerDetails.data;
  } catch (error) {
    console.error('2)Error creating customer:', error.message);
  }
};

const editDeviceLable = async (deviceId, label) => {
  try {
    const sqlQuery = `UPDATE device SET label = $1 WHERE id = $2`;

    const result = await pool.query(sqlQuery, [label, deviceId]);

    const rowsUpdated = result.rowCount;
    //console.log(`Number of rows updated: ${rowsUpdated}`);

    const success = rowsUpdated > 0;
    //console.log({ success });
    return { success };
  } catch (error) {
    console.error('Error updating device label:', error.message);
    throw error; // Rethrow the error to be caught by the caller
  }
};


const getDeviceTelemetry = (pageIdentifier, jwtTenantToken, deviceId) => {

  //console.log({ deviceId });
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket("wss://diverter.allsolus.com.au/api/ws/plugins/telemetry?token=" + jwtTenantToken);

    webSocket.onopen = function () {
      const object = {
        tsSubCmds: [
          {
            entityType: "DEVICE",
            entityId: deviceId,
            scope: "LATEST_TELEMETRY",
            cmdId: 10
          }
        ],
        historyCmds: [],
        attrSubCmds: []
      };
      const data = JSON.stringify(object);
      webSocket.send(data);
    };

    webSocket.onmessage = function (event) {
      const originalData = JSON.parse(event.data); // Parse the received JSON data
      const formattedData = {};

      for (const key in originalData.data) {
        formattedData[key] = [
          {
            "ts": originalData.data[key][0][0], // Extract the timestamp
            "value": originalData.data[key][0][1] // Extract the value
          }
        ];
      }

      //console.log({ formattedData });

      // Resolve the Promise with the telemetry data
      resolve(formattedData);

    };

    webSocket.onclose = function (event) {
      reject("Connection is closed!"); // Reject the Promise in case of an error
    };
  });
};

const getDeviceSparklineTelemetry = async (pageIdentifier, jwtTenantToken, deviceId) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };
    const seconds = Math.floor(Date.now() / 1000);
    const endTs = seconds * 1000;
    const startTs = endTs - 28800000;
    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=i,v,voc,currents,simIrradiance,simTemperature,performanceFactor&startTs=${startTs}&endTs=${endTs}`, { headers });
    let voc = deviceTelemetry.data['voc'];

    let totaldatapoints = 250;
    let extractedVotlagePoints = voc.map(voc => {
      const dividedValue = voc.value / (totaldatapoints - 1); // Divide the value by totaldatapoints - 1

      const voltages = Array(totaldatapoints).fill(0).map((_, index) => {
        if (index === totaldatapoints - 1) {
          return Math.round(voc.value * 100) / 100; // Last data point retains the original value
        }
        return Math.round((index * dividedValue) * 100) / 100; // Increment each data point by divided value
      });

      const valueString = '[' + voltages.join(', ') + ']'; // Convert the array to string format

      return {
        ts: voc.ts,
        value: valueString
      };
    });

    const currentPoints = deviceTelemetry.data['currents'].map(item => {
      const parsedValue = JSON.parse(item.value); // Parse the value string into an array
      const dividedValues = parsedValue.map(val => val / 1000); // Divide each value by 1000
      const stringValue = JSON.stringify(dividedValues); // Convert the array back to string
      return {
        ts: item.ts,
        value: stringValue
      };
    });

    // Function to multiply corresponding values
    const multiplyPoints = (point1, point2) => {
      const parsedValue1 = JSON.parse(point1.value); // Parse the value string into an array
      const parsedValue2 = JSON.parse(point2.value); // Parse the value string into an array

      const multipliedValues = parsedValue1.map((val, index) => Math.round(val * parsedValue2[index])); // Multiply corresponding values andround the result

      const stringValue = JSON.stringify(multipliedValues); // Convert the array back to a string
      return {
        ts: point1.ts, // Assuming timestamps are same for both points
        value: stringValue
      };
    };

    // Multiply the points
    const powerPoints = extractedVotlagePoints.map((voltagePoint, index) => multiplyPoints(voltagePoint, currentPoints[index]));

    let pmp = [];
    let index = [];
    powerPoints.forEach(item => {
      // Remove square brackets and parse the value string into an array of integers
      let values = item.value.substring(1, item.value.length - 1).split(',').map(Number);

      // Find the maximum value and its index
      let maxVal = Math.max(...values);
      let maxIdx = values.indexOf(maxVal);

      // Create objects with timestamp and maximum value/index
      let pmpObj = {
        ts: item.ts,
        value: maxVal
      };

      let indexObj = {
        ts: item.ts,
        value: maxIdx
      };

      // Save the objects
      pmp.push(pmpObj);
      index.push(indexObj);
    });

    let vmp = [];
    let imp = [];

    index.forEach(idx => {
      let extractedIndex = idx.value;
      let currentIdx = currentPoints.findIndex(item => item.ts === idx.ts);
      let extractedIdx = extractedVotlagePoints.findIndex(item => item.ts === idx.ts);

      if (currentIdx !== -1 && extractedIdx !== -1) {
        vmp.push({ ts: idx.ts, value: JSON.parse(extractedVotlagePoints[extractedIdx].value)[extractedIndex] });
        imp.push({ ts: idx.ts, value: JSON.parse(currentPoints[currentIdx].value)[extractedIndex] });
      }
    });

    let isc = [];
    isc = deviceTelemetry.data.currents.map(data => {
      const parsedValue = JSON.parse(data.value);
      const lastValue = parsedValue[0] / 1000;

      return {
        'ts': data.ts,
        'value': lastValue.toFixed(2)
      };
    });

    const ff = pmp.map((pmpItem, index) => {
      const iscValue = parseFloat(isc[index].value);
      const vocValue = parseFloat(voc[index].value);
      const pmpValue = pmpItem.value;

      // Check if ISC and VOC are non-zero before calculating FF
      if (iscValue !== 0 && vocValue !== 0) {
        const fillFactor = (pmpValue / (iscValue * vocValue)).toFixed(2); // Round FF to 2 decimal places
        return { ts: pmpItem.ts, value: parseFloat(fillFactor) };
      } else {
        return { ts: pmpItem.ts, value: 0 }; // Set FF to 0 if ISC or VOC is zero to avoid division by zero error
      }
    });

    let pop = [];
    let iop = [];
    let vop = [];
    iop = deviceTelemetry.data.i;
    vop = deviceTelemetry.data.v;
    pop = iop.map((iopItem, index) => {
      const iopValue = parseFloat(iopItem.value);
      const vopValue = parseFloat(vop[index].value);

      // Multiply values and round to 0 decimal places
      const popValue = Math.round(iopValue * vopValue);

      return { ts: iopItem.ts, value: popValue };
    });

    deviceTelemetry.data.isc = isc;
    deviceTelemetry.data.pmp = pmp;
    deviceTelemetry.data.vmp = vmp;
    deviceTelemetry.data.imp = imp;
    deviceTelemetry.data.ff = ff;
    deviceTelemetry.data.pop = pop;

    return deviceTelemetry.data;
  } catch (error) {
    console.error('3)Errorgetting data:', error.message);
  }
};

const getDeviceAtrributes = async (pageIdentifier, jwtTenantToken, deviceId, voc, isc) => {
  //console.log({ deviceId, voc, isc });
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    // console.log({ deviceId });

    // const sqlQuery19 = `SELECT CASE WHEN att.str_v = 'custom' THEN (SELECT json_v FROM attribute_kv WHERE entity_id = att.entity_id AND attribute_key = 'custom') ELSE (SELECT ROW_TO_JSON(pannel_info) FROM public.pannel_info WHERE panel_model = att.str_v) END AS model_value FROM attribute_kv att WHERE att.entity_id = '${deviceId}' AND att.attribute_key = 'model'`;

    //   const res = await pool.query(sqlQuery19);

    //   console.log('res.rows: ',res.rows);


    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE?keys=model,noPanels`, { headers });

    // console.log('deviceTelemetry: ', deviceTelemetry);

    const deviceAttributesdata = deviceTelemetry.data
    const model = deviceAttributesdata.find(attr => attr.key === 'model').value;
    const noPanels = deviceAttributesdata.find(attr => attr.key === 'noPanels').value;
    const curvySimulated = await axios.get(`${thingsboardHost}/curvyval?isc=${isc}&voc=${voc}&module_series=${noPanels}&module_parallel=1&model=${model}`, { headers });

    // console.log('curvySimulated.data: ', curvySimulated.data);

    return curvySimulated.data;
  } catch (error) {
    console.error('4)Error creating customer:', error.message);
  }
};

const gethistoricData = async (pageIdentifier, jwtTenantToken, deviceId, epochtime) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    sTime = epochtime;
    // add 24 hrours to get the 1 day period 
    eTime = epochtime + 82800000;
    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=i,faultCode,v,voc,currents,simIrradiance,simTemperature,performanceFactor&startTs=${sTime}&endTs=${eTime}&limit=100000`, { headers });
    if (deviceTelemetry.data['i'] !== undefined) {
      let voc = deviceTelemetry.data['voc'];
      let totaldatapoints = 250;
      let extractedVotlagePoints = voc.map(voc => {
        const dividedValue = voc.value / (totaldatapoints - 1); // Divide the value by totaldatapoints - 1

        const voltages = Array(totaldatapoints).fill(0).map((_, index) => {
          if (index === totaldatapoints - 1) {
            return Math.round(voc.value * 100) / 100; // Last data point retains the original value
          }
          return Math.round((index * dividedValue) * 100) / 100; // Increment each data point by divided value
        });

        const valueString = '[' + voltages.join(', ') + ']'; // Convert the array to string format

        return {
          ts: voc.ts,
          value: valueString
        };
      });

      const currentPoints = deviceTelemetry.data['currents'].map(item => {
        const parsedValue = JSON.parse(item.value); // Parse the value string into an array
        const dividedValues = parsedValue.map(val => val / 1000); // Divide each value by 1000
        const stringValue = JSON.stringify(dividedValues); // Convert the array back to string
        return {
          ts: item.ts,
          value: stringValue
        };
      });
      // Function to multiply corresponding values
      const multiplyPoints = (point1, point2) => {
        const parsedValue1 = JSON.parse(point1.value); // Parse the value string into an array
        const parsedValue2 = JSON.parse(point2.value); // Parse the value string into an array

        const multipliedValues = parsedValue1.map((val, index) => Math.round(val * parsedValue2[index])); // Multiply   corresponding values andround the result

        const stringValue = JSON.stringify(multipliedValues); // Convert the array back to a string
        return {
          ts: point1.ts, // Assuming timestamps are same for both points
          value: stringValue
        };
      };
      // Multiply the points
      const powerPoints = extractedVotlagePoints.map((voltagePoint, index) => multiplyPoints(voltagePoint, currentPoints[index]));

      let pmp = [];
      let index = [];
      powerPoints.forEach(item => {
        // Remove square brackets and parse the value string into an array of integers
        let values = item.value.substring(1, item.value.length - 1).split(',').map(Number);

        // Find the maximum value and its index
        let maxVal = Math.max(...values);
        let maxIdx = values.indexOf(maxVal);

        // Create objects with timestamp and maximum value/index
        let pmpObj = {
          ts: item.ts,
          value: maxVal
        };

        let indexObj = {
          ts: item.ts,
          value: maxIdx
        };

        // Save the objects
        pmp.push(pmpObj);
        index.push(indexObj);
      });

      let vmp = [];
      let imp = [];

      index.forEach(idx => {
        let extractedIndex = idx.value;
        let currentIdx = currentPoints.findIndex(item => item.ts === idx.ts);
        let extractedIdx = extractedVotlagePoints.findIndex(item => item.ts === idx.ts);

        if (currentIdx !== -1 && extractedIdx !== -1) {
          vmp.push({ ts: idx.ts, value: JSON.parse(extractedVotlagePoints[extractedIdx].value)[extractedIndex] });
          imp.push({ ts: idx.ts, value: JSON.parse(currentPoints[currentIdx].value)[extractedIndex] });
        }
      });

      let isc = [];
      isc = deviceTelemetry.data.currents.map(data => {
        const parsedValue = JSON.parse(data.value);
        const lastValue = parsedValue[0] / 1000;

        return {
          'ts': data.ts,
          'value': lastValue.toFixed(2)
        };
      });

      const ff = pmp.map((pmpItem, index) => {
        const iscValue = parseFloat(isc[index].value);
        const vocValue = parseFloat(voc[index].value);
        const pmpValue = pmpItem.value;

        // Check if ISC and VOC are non-zero before calculating FF
        if (iscValue !== 0 && vocValue !== 0) {
          const fillFactor = (pmpValue / (iscValue * vocValue)).toFixed(2); // Round FF to 2 decimal places
          return { ts: pmpItem.ts, value: parseFloat(fillFactor) };
        } else {
          return { ts: pmpItem.ts, value: 0 }; // Set FF to 0 if ISC or VOC is zero to avoid division by zero error
        }
      });

      let pop = [];
      let iop = [];
      let vop = [];
      iop = deviceTelemetry.data.i;
      vop = deviceTelemetry.data.v;
      pop = iop.map((iopItem, index) => {
        const iopValue = parseFloat(iopItem.value);
        const vopValue = parseFloat(vop[index].value);

        // Multiply values and round to 0 decimal places
        const popValue = Math.round(iopValue * vopValue);

        return { ts: iopItem.ts, value: popValue };
      });

      deviceTelemetry.data.isc = isc;
      deviceTelemetry.data.pmp = pmp;
      deviceTelemetry.data.vmp = vmp;
      deviceTelemetry.data.imp = imp;
      deviceTelemetry.data.ff = ff;
      deviceTelemetry.data.pop = pop;
      deviceTelemetry.data.voltages = extractedVotlagePoints;
      deviceTelemetry.data.currents = currentPoints;
      deviceTelemetry.data.power = powerPoints;

    } else {

      deviceTelemetry.data.isc = [];
      deviceTelemetry.data.voc = [];
      deviceTelemetry.data.ff = [];

      deviceTelemetry.data.imp = [];
      deviceTelemetry.data.vmp = [];
      deviceTelemetry.data.pmp = [];

      deviceTelemetry.data.pop = [];
      deviceTelemetry.data.i = [];
      deviceTelemetry.data.v = [];

      deviceTelemetry.data.performanceFactor = [];
      deviceTelemetry.data.simIrradiance = [];
      deviceTelemetry.data.simTemperature = [];

      deviceTelemetry.data.voltages = [];
      deviceTelemetry.data.currents = [];
      deviceTelemetry.data.power = [];
      deviceTelemetry.data.faultCode = [];

    };
    return deviceTelemetry.data;
  } catch (error) {
    console.error('5) Error getting histroicData', error.message);
  }

};


// const scanIV = async (pageIdentifier, jwtTenantToken, deviceId) => {
//   try {
//     const headers = {
//       'accept': 'application/json',
//       'Content-Type': 'application/json',
//       'X-Authorization': `Bearer ${jwtTenantToken}`,
//     };
//     const json_data = {
//       'method': 'goButton',
//       'params': {},
//     };

//     const response = await axios.post(
//       `${thingsboardHost}/api/rpc/oneway/${deviceId}`,
//       json_data, // Pass JSON data as the request body
//       {
//         headers: headers,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Error Scanning:', error.message);
//   }
// };

const scanIV = async (pageIdentifier, jwtTenantToken, deviceId) => {
  try {
    const headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };
    const json_data = {
      'method': 'goButton',
      'params': {},
    };

    const response = await axios.post(
      `${thingsboardHost}/api/rpc/oneway/${deviceId}`,
      json_data, // Pass JSON data as the request body
      {
        headers: headers,
      }
    );

    if (response.status !== 200) {
      throw new Error(`Scan failed with status code ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error; // Throw the error to be caught by the caller
  }
};

const assignDevice = async (deviceName, jwtTenantToken, customerId) => {

  const sqlQuery5 = `select id, device_profile_id from device where upper(name) = upper('${deviceName}')`;
  const sqlQuery7 = `select count(*) cnt from device where customer_id not in ('13814000-1dd2-11b2-8080-808080808080') and upper(name) = upper('${deviceName}')`;
  let res = null;

  try {
    res = await pool.query(sqlQuery5);

    //console.log('res.rows5: ', res.rows);

    if (res.rows.length === 0) {
      throw new Error("Please re-check the device serial number you entered. Looks like there is no device with this serial number in the database.");
    }
    else {

      if (res.rows[0].device_profile_id !== 'ac773360-10a7-11ee-8cb3-398c6452fe3e') {
        throw new Error("Only IVcurvy device can be added");
      };
      deviceId = res.rows[0].id;

      // res = await pool.query(sqlQuery7);

      // //console.log('res.rows7: ', res.rows);

      // if (res.rows[0].cnt === '1') {
      //   throw new Error("The device is already claimed by other customer. For more guidance please contact us on (02) 6652 9700");
      // };

      const url = `${thingsboardHost}/api/customer/${customerId}/device/${deviceId}`;

      const headers = {
        'accept': 'application/json',
        'X-Authorization': `Bearer ${jwtTenantToken}`,
      };

      const response = await axios.post(url, '', { headers });
      const deviceTaggingInfo = await response.data;
      //console.log('deviceTaggingInfo: ', deviceTaggingInfo);
      //console.log('deviceTaggingInfo.customerId.entityType: ', deviceTaggingInfo.customerId.entityType);
      // if (deviceTaggingInfo.customerId.entityType !== 'CUSTOMER') {
      //   const sqlQuery18 = `update public.device set label = 'PVgo' where id = '${deviceId}'`;
      //   const res1 = await pool.query(sqlQuery18);
      //   //console.log('res1.rows');
      // }

      const macAddress = deviceTaggingInfo.name;
      const code = macAddress.substr(macAddress.length - 8).replace(/:/g, "");

      //console.log({code});

      if (deviceTaggingInfo.label === null) {
        const sqlQuery18 = `update public.device set label = 'PVgo_${code}' where id = '${deviceId}'`;
        const res1 = await pool.query(sqlQuery18);
        //console.log('res1.rows');
      }
      return deviceTaggingInfo;
    };

  } catch (error) {
    //console.log('Error inside assignDevice: ', error);
    throw error;
  }
};

const saveCode = async (toEmail, code) => {

  console.log('toEmail: ', toEmail[0]);

  const sqlQuery10 = `select count(*) cnt from public.verify_email where email = '${toEmail[0]}' and verify = false`;
  const sqlQuery11 = `INSERT INTO public.verify_email(email, code, verify) VALUES ('${toEmail[0]}', '${code}', false)`;
  const sqlQuery12 = `select count(*) cnt from public.verify_email where email = '${toEmail[0]}' and verify = true`;
  const sqlQuery13 = `update public.verify_email set code = '${code}' where email = '${toEmail[0]}' and verify = false`;

  try {
    const res2 = await pool.query(sqlQuery12);
    console.log('res2.rows: ', res2.rows);

    if (res2.rows[0].cnt >= '1') {
      return 0;
    }
    else if (res2.rows[0].cnt === '0') {

      const res = await pool.query(sqlQuery10);

      console.log('res.rows: ', res.rows);

      if (res.rows[0].cnt === '0') {
        const res1 = await pool.query(sqlQuery11);

        console.log('res1.rows: ', res1.rows);
        return 1;
      }
      else if (res.rows[0].cnt === '1') {
        const res3 = await pool.query(sqlQuery13);

        console.log('res3.rows: ', res3.rows);
        return 2;
      }

    }

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};


const saveCodePwdReset = async (email, code) => {

  console.log('email: ', email);

  const sqlQuery12 = `select count(*) cnt from public.verify_email where email = '${email}' and verify = true`;
  const sqlQuery13 = `update public.verify_email set code = '${code}' where email = '${email}' and verify = true`;

  try {
    const res2 = await pool.query(sqlQuery12);
    console.log('res2.rows: ', res2.rows);

    if (res2.rows[0].cnt >= '1') {
      const res1 = await pool.query(sqlQuery13);
      console.log('res1.rows: ', res1.rows);
      return 1;
    }
    else {
      return 0;
    }

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const verifyEmail = async (email, code) => {

  console.log('email: ', email);
  let success = null;

  const sqlQuery14 = `select count(*) cnt from public.verify_email where email = '${email}' and code = '${code}'`;

  try {
    const res = await pool.query(sqlQuery14);
    console.log('res.rows: ', res.rows);

    if (res.rows[0].cnt === '1') {
      success = true;
    }
    else {
      success = false;
    }

    return success;

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const checkIfCustomerExists = async (title) => {

  console.log('title: ', title);
  let success = null;

  const sqlQuery15 = `select count(*) cnt from customer where title = '${title}'`;

  try {
    const res = await pool.query(sqlQuery15);
    console.log('res.rows: ', res.rows);

    if (res.rows[0].cnt === '0') {
      success = true;
    }
    else {
      success = false;
    }

    return success;

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const setVerifyFlagStatus = async (email) => {

  console.log('email: ', email);
  let success = null;

  const sqlQuery16 = `update public.verify_email set verify = true where email = '${email}'`;

  try {
    const res = await pool.query(sqlQuery16);
    console.log('res.rows: ', res.rows);

    success = true;

    return success;

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const checkExists = async (email) => {

  console.log('email: ', email);
  let success = null;

  const sqlQuery20 = `SELECT count(*) cnt FROM public.verify_email where verify = true and email = '${email}'`;

  try {
    const res = await pool.query(sqlQuery20);
    console.log('res.rows: ', res.rows);

    if (res.rows[0].cnt === '1') {
      success = true;
    }
    else {
      success = false;
    }

    return success;

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const getUniquePanelManufacturer = async (pageIdentifier) => {
  //console.log({ deviceId, voc, isc });
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };


    const sqlQuery22 = `SELECT DISTINCT panel_manu FROM public.pannel_info;`;

    const res = await pool.query(sqlQuery22);


    return res.rows;
  } catch (error) {
    console.error('4)Error creating customer:', error.message);
  }
};

const getCustomerList = async (pageIdentifier, installerCustomerId) => {
  try {
    const sqlQuery23 = `SELECT c2.title, c2.id customerid FROM relation r, customer c1, customer c2 WHERE r.from_type = 'CUSTOMER' AND r.from_id = c2.id AND ( r.additional_info :: json ) ->> 'installerGroup' = c1.title AND c1.id = '${installerCustomerId}' order by 1 desc`;
    const res = await pool.query(sqlQuery23);
    return res.rows;
  } catch (error) {
    console.error('4)Error creating customer list from FuncBE:', error.message);
  }
};


module.exports = { getJwtSysAdmin, getJwtTenant, getUserToken, getUserDeatils, getTenantEntityList, getCustomerEntityList, createCustomer, createCustomerUser, createTenant, getCustomerName, homeDetails, unassignDevice, getCustomer, editCustomer, deleteCustomer, editDeviceLable, getDeviceTelemetry, getDeviceSparklineTelemetry, getDeviceAtrributes, assignDevice, gethistoricData, scanIV, getTheUserjwtToken, saveCode, verifyEmail, checkIfCustomerExists, setVerifyFlagStatus, checkExists, saveCodePwdReset, resetPwd, getUniquePanelManufacturer, getCustomerList };
