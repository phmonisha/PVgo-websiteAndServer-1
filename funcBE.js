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

const currentTime = new Date();
const formattedTime = currentTime.toISOString();//aedt time format
const epochTime = currentTime.getTime();//epoch time format

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
    //console.log('attributeCreation.data: ', attributeCreation.data);

    //////////


    url = `${thingsboardHost}/api/relation`;
    let installerType = 'NA';

    if (tenantId === null || tenantId === undefined) {
      console.log('abc');
      tenantId = "0f7189f0-631b-11ee-9c67-638bd1419106";
      title = "MWP Default Installer";
    }
    else {
      console.log('xyz');
      const sqlQuery6 = `select title from customer where id = '${tenantId}'`;
      const res = await pool.query(sqlQuery6);
      //console.log('res.rows: ', res.rows);
      title = res.rows[0].title;
      installerType = 'nonDefault';
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
    console.log('relationsCreation.data: ', relationsCreation.data);
    console.log('installerType: ', installerType);

    if (relationsCreation.data === '' && installerType === 'nonDefault') {
      const relations1 = {
        "from": {
          "id": newCustomerDataInfo.id.id,
          "entityType": "CUSTOMER"
        },
        "to": {
          "id": "0f7189f0-631b-11ee-9c67-638bd1419106",
          "entityType": "CUSTOMER"
        },
        "type": "Contains",
        "typeGroup": "COMMON",
        "additionalInfo": {
          "installerGroup": "MWP Default Installer"
        }
      };

      const relationsCreationDefault = await axios.post(url, relations1, { headers });
      console.log({ relationsCreationDefault });
    }

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
    console.log('error from creat customer function: ', error);
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

        console.log('thingsboardResponse: ', thingsboardResponse);

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

      const sqlQuery24 = `SELECT a.id, d.id as device_id, d.label, t.type, a.created_time, a.severity, t.definition, a.acknowledged, a.cleared, CASE WHEN (a.acknowledged = false AND a.cleared = false) THEN 'Active Unacknowledged' WHEN (a.acknowledged = true AND a.cleared = false) THEN 'Active Acknowledged' WHEN (a.acknowledged = false AND a.cleared = true) THEN 'Cleared Unacknowledged' WHEN (a.acknowledged = true AND a.cleared = true) THEN 'Cleared Acknowledged' END AS status FROM public.custom_alarm a, custom_alarm_type t, device d where a.customer_id = '${customerId}' and a.device_id = d.id and a.code = t.code`;
      res = await pool.query(sqlQuery24);
      //console.log(res.rows);

      modifiedResponse = {
        data: res.rows.map(item => ({
          label: item.label,
          type: item.type,
          createdtime: item.created_time,
          severity: item.severity,
          definition: item.definition,
          status: item.status,
          acknowledged: item.acknowledged,
          cleared: item.cleared,
          id: item.id,
          deviceId: item.device_id,
        })),
        hasNext: false,
      };
    }
    else if (pageIdentifier === 'customerDevice') {

      //console.log('customerId inside customerEntityList customerDevice: ', customerId);

      //console.log({customerId});

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
        }))).filter(item => item.deviceProfileId === 'fa909e50-2204-11ef-8d93-e52196e6d77f'), // Filter data by deviceProfile
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
      //console.log({customerId});
      intermediateResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/devices?pageSize=1&page=0`, { headers });
      if (intermediateResponse.data.totalElements !== 0) {
        itemsPerPage = intermediateResponse.data.totalElements;
      } else {
        itemsPerPage = 1;
      };
      thingsboardResponse = await axios.get(`${thingsboardHost}/api/customer/${customerId}/devices?pageSize=${itemsPerPage}&page=0`, { headers });
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
          };
        }))).filter(item => item.deviceProfileId === 'fa909e50-2204-11ef-8d93-e52196e6d77f'), // Filter data by deviceProfile
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
      const sqlQuery8 = `WITH mm AS (SELECT r.from_id FROM relation r, customer c1 WHERE r.from_type = 'CUSTOMER' AND (r.additional_info::json) ->> 'installerGroup' = c1.title AND c1.id = '${id}'), customer AS (SELECT count(*) customer FROM customer,mm WHERE id = mm.from_id), device AS (SELECT count(*) device FROM ( SELECT device_profile_id FROM device,mm WHERE device_profile_id = 'fa909e50-2204-11ef-8d93-e52196e6d77f' AND customer_id = mm.from_id) d), alarm AS (select count(*) alarm from alarm, mm where customer_id = mm.from_id), asset AS (select count(*) asset from asset, mm where customer_id = mm.from_id) select * from customer,device, alarm, asset`;
      res = await pool.query(sqlQuery8);
    }
    else if (pageIdentifier === 'customerHome') {
      const sqlQuery9 = `WITH mm AS (SELECT id from customer where id = '${id}'), device AS (SELECT count(*) device FROM ( SELECT device_profile_id FROM device,mm WHERE device_profile_id = 'fa909e50-2204-11ef-8d93-e52196e6d77f' AND customer_id = mm.id) d), alarm AS (select count(*) alarm from alarm, mm where customer_id = mm.id), asset AS (select count(*) asset from asset, mm where customer_id = mm.id) select * from device, alarm, asset`;
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
      //console.log('Row count:', res.rowCount);
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
    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=voc,isc,vmp,currents,imp,simIrradiance,simTemperature,performanceFactor&startTs=${startTs}&endTs=${endTs}`, { headers });
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
    iop = deviceTelemetry.data.imp;
    vop = deviceTelemetry.data.vmp;
    pop = iop.map((iopItem, index) => {
      const iopValue = parseFloat(iopItem.value);
      const vopValue = parseFloat(vop[index].value);

      // Multiply values and round to 0 decimal places
      const popValue = Math.round(iopValue * vopValue);

      return { ts: iopItem.ts, value: popValue };
    });


    deviceTelemetry.data.pmpcal = pmp;
    deviceTelemetry.data.vmpcal = vmp;
    deviceTelemetry.data.impcal = imp;
    deviceTelemetry.data.ff = ff;
    deviceTelemetry.data.pmp = pop;
    /* 
    In the device telemetry data we have ,
    voc open circuit voltage
    isc short circuit current
    ff fill factor 
    impcal calculated imp 
    vmpcal calculated vmp
    pmpcal calculated pmp
    imp operating current
    vmp operating voltage
    pmp operating power 
    */
    return deviceTelemetry.data;

  } catch (error) {
    console.error('3)Error getting telemetry data for current page:', error.message);
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


    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE?`, { headers });

    // console.log('deviceTelemetry: ', deviceTelemetry);

    const deviceAttributesdata = deviceTelemetry.data

    const userData = deviceAttributesdata.find(attr => attr.key === 'userPanelData').value;
    const paneljsondata = JSON.stringify(userData);
    const curvySimulated = await axios.get(`${thingsboardHost}/curvyval?isc=${isc}&voc=${voc}&panel_data=${paneljsondata}`, { headers });
    return curvySimulated.data;

  } catch (error) {
    console.error('4)Error getting simulated data', error.message);
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
    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=voc,isc,vmp,currents,imp,simIrradiance,simTemperature,performanceFactor&startTs=${sTime}&endTs=${eTime}&limit=100000`, { headers });

    if (deviceTelemetry.data['isc'] !== undefined) {
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
      iop = deviceTelemetry.data.imp;
      vop = deviceTelemetry.data.vmp;
      pop = iop.map((iopItem, index) => {
        const iopValue = parseFloat(iopItem.value);
        const vopValue = parseFloat(vop[index].value);

        // Multiply values and round to 0 decimal places
        const popValue = Math.round(iopValue * vopValue);

        return { ts: iopItem.ts, value: popValue };
      });

      deviceTelemetry.data.pmpcal = pmp;
      deviceTelemetry.data.vmpcal = vmp;
      deviceTelemetry.data.impcal = imp;
      deviceTelemetry.data.ff = ff;
      deviceTelemetry.data.pmp = pop;
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

    if (res.rows.length === 0) {
      throw new Error("Please re-check the device serial number you entered. Looks like there is no device with this serial number in the database.");
    }
    else {

      if (res.rows[0].device_profile_id !== 'fa909e50-2204-11ef-8d93-e52196e6d77f') {
        throw new Error("Only IVcurvy device can be added");
      };
      deviceId = res.rows[0].id;

      const url = `${thingsboardHost}/api/customer/${customerId}/device/${deviceId}`;

      const headers = {
        'accept': 'application/json',
        'X-Authorization': `Bearer ${jwtTenantToken}`,
      };

      const response = await axios.post(url, '', { headers });
      const deviceTaggingInfo = await response.data;

      const macAddress = deviceTaggingInfo.name;
      const code = macAddress.substr(macAddress.length - 8).replace(/:/g, "");

      //console.log('deviceTaggingInfo.label: ',deviceTaggingInfo);

      if (deviceTaggingInfo.customerId.entityType === 'CUSTOMER') {
        if (deviceTaggingInfo.label === null) {
          const sqlQuery18 = `update public.device set label = 'PVgo_${code}' where id = '${deviceId}'`;
          const res1 = await pool.query(sqlQuery18);
        }
        const sqlQuery30 = `select count(1) as cnt from public.attribute_kv where entity_id = '${deviceId}' and attribute_type = 'SERVER_SCOPE' and attribute_key = 'alarmSettings'`;
        const res2 = await pool.query(sqlQuery30);
        //console.log('res2.rows: ', res2.rows[0].cnt);

        if (res2.rows[0].cnt === '1') {
          const sqlQuery31 = `update public.attribute_kv set long_v = 4294967295 where entity_id = '${deviceId}' and attribute_type = 'SERVER_SCOPE' and attribute_key = 'alarmSettings'`;
          const res3 = await pool.query(sqlQuery31);
          //console.log('res3.rowCount: ', res3.rowCount);
          if (res3.rowCount === 1) {
            return deviceTaggingInfo;
          }
          else {
            throw new Error("Unable to set default alarm settings for this device Update. Please try after sometime.");
          }
        }
        else if (res2.rows[0].cnt === '0') {
          const sqlQuery32 = `INSERT INTO public.attribute_kv(entity_type, entity_id, attribute_type, attribute_key, long_v, last_update_ts) VALUES ('DEVICE', '${deviceId}', 'SERVER_SCOPE', 'alarmSettings', 4294967295, ${epochTime})`;
          const res4 = await pool.query(sqlQuery32);
          //console.log('res4.rowCount: ', res4.rowCount);
          if (res4.rowCount === 1) {
            return deviceTaggingInfo;
          }
          else {
            throw new Error("Unable to set default alarm settings for this device Insert. Please try after sometime.");
          }
        }
        else {
          throw new Error("Unable to set default alarm settings for this device. Please try after sometime.");
        }
      }
      else {
        throw new Error("Unable to set device label. Please try after sometime.");
      }
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
  let state = null;

  const sqlQuery34 = `SELECT count(*) cnt FROM public.verify_email where email = '${email}'`;
  const sqlQuery20 = `SELECT count(*) cnt FROM public.verify_email where verify = true and email = '${email}'`;

  try {
    const res = await pool.query(sqlQuery34);
    console.log('res.rows: ', res.rows);

    if (res.rows[0].cnt === '1') {
      const res1 = await pool.query(sqlQuery20);
      console.log('res1.rows: ', res1.rows);

      if (res1.rows[0].cnt === '1') {
        state = 0;
      }
      else {
        state = 1;
      }
    }
    else {
      state = 2;
    }

    return state;

  } catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const updateAlarmStatus = async (dataObj) => {

  const sqlQuery25 = `update public.custom_alarm set ack_ts = ${epochTime}, acknowledged = true where id = '${dataObj.id}'`;
  const sqlQuery26 = `update public.custom_alarm set clear_ts = ${epochTime}, cleared = true where id = '${dataObj.id}'`;
  let res = null;
  try {

    if (dataObj.btn === 'ack') {
      res = await pool.query(sqlQuery25);
    }
    else if (dataObj.btn === 'clr') {
      res = await pool.query(sqlQuery26);
    }
    //console.log('res.rowCount:  ', res.rowCount);

    if (res.rowCount === 1) {
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

const getmodel = async (pageIdentifier, manufacturer) => {
  //console.log({ deviceId, voc, isc });
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };
    const sqlQuery23 = `SELECT panel_model FROM public.pannel_info WHERE panel_manu='${manufacturer}';`;
    const res = await pool.query(sqlQuery23);

    return res.rows;
  } catch (error) {
    console.error('4)Error getting panel model from funcBE.js:', error.message);
  }
};

const getpaneldata = async (pageIdentifier, model) => {
  //console.log({ deviceId, voc, isc });
  try {
    const sqlQuery23 = `SELECT * FROM public.pannel_info WHERE panel_model='${model}';`;
    const res = await pool.query(sqlQuery23);

    return res.rows;
  } catch (error) {
    console.error('4)Error getting panel model from funcBE.js:', error.message);
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

const getAlarmSettings = async (deviceId) => {

  //console.log({deviceId});

  const sqlQuery27 = `SELECT long_v FROM public.attribute_kv where entity_id = '${deviceId}' and attribute_type = 'SERVER_SCOPE' and attribute_key = 'alarmSettings'`;
  const sqlQuery28 = `select type as name, code from custom_alarm_type`;

  let res = null;
  let res1 = null;

  try {
    res = await pool.query(sqlQuery28);
    console.log('res.rows: ', res.rows);
    const alarmTypes = res.rows;

    res1 = await pool.query(sqlQuery27);
    console.log('res1.rows: ', res1.rows[0].long_v);

    const statusNumber = res1.rows[0].long_v;

    if (alarmTypes && statusNumber) {
      const numBits = alarmTypes.length;

      const alarms = [];
      for (let i = 0; i < numBits; i++) {
        const alarmBit = (statusNumber >> (alarmTypes[i].code - 1)) & 1;
        const alarmType = alarmTypes[i].name;
        alarms.push({
          name: alarmType,
          switchid: `switch${alarmTypes[i].code}`,
          status: alarmBit === 1,
        });
      }

      console.log(alarms);
      return alarms;
    }
  }
  catch (error) {
    console.log('error: ', error);
    throw error;
  }
};

const resetAlarmBits = (statusNumber, alarmSettings) => {
  let binaryString = statusNumber.toString(2).padStart(32, '0');
  alarmSettings.forEach(alarm => {
    if (!alarm.status) {
      const index = 32 - alarm.code;
      binaryString = binaryString.substring(0, index) + '0' + binaryString.substring(index + 1);
    }
  });
  return parseInt(binaryString, 2);
};

const setAlarmSettings = async (deviceId, alarmSettings) => {

  let success = null;
  try {
    const statusNumber = 4294967295;
    const updatedStatusNumber = resetAlarmBits(statusNumber, alarmSettings);
    //console.log(updatedStatusNumber);

    const sqlQuery29 = `update public.attribute_kv set long_v = ${updatedStatusNumber} where entity_id = '${deviceId}' and attribute_type = 'SERVER_SCOPE' and attribute_key = 'alarmSettings'`;
    const res = await pool.query(sqlQuery29);
    //console.log('Row count:', res.rowCount);

    if (res.rowCount === 1) {
      success = true;
    }
    else {
      success = false;
    }

    return success;

  } catch (error) {
    //console.log('error: ', error);
    throw error;
  }
};

const getsimulationStatus = async (deviceId) => {
  //console.log({ deviceId, voc, isc });
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    const deviceAttributes = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`, { headers });

    return deviceAttributes.data;
  } catch (error) {
    console.error('4)Error getting simulated data:', error.message);
  }
};

const updatePanelAttribute = async (deviceId, panelData) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    }
    const json_data = {
      userPanelData: panelData
    };
    const response = await axios.post(
      `${thingsboardHost}/api/plugins/telemetry/${deviceId}/SERVER_SCOPE`,
      json_data, // Pass JSON data as the request body
      {
        headers: headers,
      }
    );
    return response.status;

  } catch (error) {
    console.error('Error updating panel in funcBE:', error.message);
    throw error;
  };
};

const getEmailId = async (code) => {
  console.log('inside getEmailId');
  try {
    const sqlQuery33 = `SELECT email FROM public.verify_email where code = $1`;
    const codeInteger = parseInt(code, 10);
    const res = await pool.query(sqlQuery33, [codeInteger]);
    console.log('sqlQuery33 res.rows: ', res.rows);
    if (res.rows.length === 0) {
      throw new Error('The link is invalid');
    }
    return res.rows[0].email;

  } catch (error) {
    //console.log('error: ', error);
    throw error;
  }
};

const getfaultlog = async (jwtTenantToken, deviceId, epochtime) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${jwtTenantToken}`,
    };

    sTime = epochtime;
    // add 24 hrours to get the 1 day period 
    eTime = epochtime + 82800000;
    const deviceTelemetry = await axios.get(`${thingsboardHost}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=faultLog&startTs=${sTime}&endTs=${eTime}&limit=100000`, { headers });
    return deviceTelemetry.data
  } catch (error) {
    console.error('5) Error getting histroicData', error.message);
  }
};

const saveFCMToken = async (token, userId) => {
  try {

    const settings = {
      sessions: {
        [token]: {
          fcmTokenTimestamp: epochTime,
        },
      },
    };

    const sqlQuery35 = `SELECT count(*) AS cnt FROM public.user_settings WHERE user_id = $1 AND type = 'MOBILE'`;
    const sqlQuery36 = `INSERT INTO public.user_settings (user_id, type, settings) VALUES ($1, 'MOBILE', $2::jsonb)`;
    const sqlQuery37 = `UPDATE public.user_settings SET settings = jsonb_set(settings, '{sessions}', settings->'sessions' || $1::jsonb) WHERE user_id = $2 AND type = 'MOBILE'`;

    const res = await pool.query(sqlQuery35, [userId]);
    //const count = parseInt(res.rows[0].cnt, 10);

    console.log('res.rows[0].cnt: ', res.rows[0].cnt);

    if (res.rows[0].cnt === '0') {
      const res1 = await pool.query(sqlQuery36, [userId, JSON.stringify(settings)]);
      console.log('sqlQuery36 res1.rows: ', res1.rows);
      console.log('Data inserted successfully');
    } else {
      const res2 = await pool.query(sqlQuery37, [JSON.stringify(settings.sessions), userId]);
      console.log('sqlQuery37 res2.rows: ', res2.rows);
      console.log('Data updated successfully');
    }

    let success = true;
    return success;

  } catch (error) {
    console.log('error funcBE: ', error);
    throw error;
  }
};

const removeToken = async (token, userId) => {
  try {
    let success;

    const sqlQuery38 = `SELECT settings FROM public.user_settings WHERE type = 'MOBILE' AND user_id = $1`;
    const sqlQuery39 = `UPDATE public.user_settings SET settings = $1 WHERE user_id = $2 AND type = 'MOBILE'`;

    const res = await pool.query(sqlQuery38, [userId]);
    const settingsObj = res.rows[0].settings;
    const tokenParts = token.split(":");
    const prefix = tokenParts.length > 1 ? tokenParts[0] : token;

    // Extract sessions object
    let sessions = settingsObj.sessions;

    // Initialize an array to store keys to delete
    let keysToDelete = [];

    // Iterate over the keys of the sessions object
    for (let key in sessions) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    // Remove matching keys from sessions object
    keysToDelete.forEach(key => {
      delete sessions[key];
    });

    // Convert the modified object back to JSON string
    let updatedSettingsJson = JSON.stringify(settingsObj);
    const res2 = await pool.query(sqlQuery39, [updatedSettingsJson, userId]);
    success = res2.rowCount === 1;
    return success;
  } catch (error) {
    console.log('error funcBE: ', error);
    throw error;
  }
};



module.exports = { getJwtSysAdmin, getJwtTenant, getUserToken, getUserDeatils, getTenantEntityList, getCustomerEntityList, createCustomer, createCustomerUser, createTenant, getCustomerName, homeDetails, unassignDevice, getCustomer, editCustomer, deleteCustomer, editDeviceLable, getDeviceTelemetry, getDeviceSparklineTelemetry, getDeviceAtrributes, assignDevice, gethistoricData, scanIV, getTheUserjwtToken, saveCode, verifyEmail, checkIfCustomerExists, setVerifyFlagStatus, checkExists, saveCodePwdReset, resetPwd, updateAlarmStatus, getUniquePanelManufacturer, getCustomerList, getmodel, getpaneldata, getAlarmSettings, setAlarmSettings, getsimulationStatus, updatePanelAttribute, getEmailId, saveFCMToken, getfaultlog, removeToken };
