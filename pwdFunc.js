const bcrypt = require('bcrypt');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');

const filePath = 'users.csv';
const filePathTenant = 'usersTenant.csv';

let tenantUserId = null;

const csvWriter = createCsvWriter({
  path: filePath,
  header: [
    { id: 'tenantUserId', title: 'TenantUserId' },
    { id: 'newCustId', title: 'CustomerId' },
    { id: 'newUserId', title: 'UserId' },
    { id: 'newUserEmail', title: 'UserEmail' },
    { id: 'newUserPassword', title: 'NewUserPassword' }
  ],
  // Set the "append" mode to append new records to the existing file
  append: fs.existsSync(filePath),
});

const csvWriterTen = createCsvWriter({
    path: filePathTenant,
    header: [
      { id: 'newTenantId', title: 'TenantId' },
      { id: 'newTenantUserId', title: 'TenantUserId' },
      { id: 'newTenantUserEmail', title: 'TenantUserEmail' },
      { id: 'newUserPassword', title: 'NewTenantUserPassword' }
    ],
    // Set the "append" mode to append new records to the existing file
    append: fs.existsSync(filePathTenant),
  });

const saveNewPwd = async (tenantUserId,newCustId, newUserId, newUserEmail, newUserPassword, res) => {
  console.log({ tenantUserId, newCustId, newUserId, newUserEmail, newUserPassword });

  try {
    const record = { tenantUserId, newCustId, newUserId, newUserEmail, newUserPassword };
    await csvWriter.writeRecords([record]);
    return true;
  } catch (error) {
    console.error('Error storing newUserPassword:', error.message);
    return `Error storing newUserPassword: ${error.message}`;
  }
};

const saveNewPwdTenant = async (newTenantId, newTenantUserId, newTenantUserEmail, newUserPassword) => {
    console.log({ newTenantId, newTenantUserId, newTenantUserEmail, newUserPassword });
  
    try {
      const record = { newTenantId, newTenantUserId, newTenantUserEmail, newUserPassword };
      await csvWriterTen.writeRecords([record]);
      return true;
    } catch (error) {
      console.error('Error storing newUserPassword:', error.message);
      return `Error storing newUserPassword: ${error.message}`;
    }
  };

const autenticateUserPWD = async (userCredsJSON) => {
  const userEmail = userCredsJSON.username;
  const password = userCredsJSON.password;

  console.log({userEmail,password});

  return new Promise((resolve, reject) => {
    const users = [];
    fs.createReadStream('users.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        users.push(row);
      })
      .on('end', () => {
        const user = users.find((u) => u.UserEmail === userEmail);

        if (!user) {
          reject(new Error('User not found'));
          return;
        }

        // Compare passwords
        bcrypt.compare(password, user.NewUserPassword, (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          const userId = user.UserId;
          const customerId = user.CustomerId;
          tenantUserId = user.TenantUserId;
          console.log({userId, customerId});
          resolve({ result, userId, customerId, tenantUserId });
        });
      });
  });
};


const autenticateTenantUserPWD = async (userCredsJSON) => {
    const userEmail = userCredsJSON.username;
    const password = userCredsJSON.password;
  
    return new Promise((resolve, reject) => {
      const users = [];
      fs.createReadStream('usersTenant.csv')
        .pipe(csvParser())
        .on('data', (row) => {
          users.push(row);
        })
        .on('end', () => {
            console.log('userEmail: ',userEmail);
          const user = users.find((u) => u.TenantUserEmail === userEmail);
  
          if (!user) {
            reject(new Error('User not found'));
            return;
          }
  
          // Compare passwords
          bcrypt.compare(password, user.NewTenantUserPassword, (err, result) => {
            if (err) {
              reject(err);
              return;
            }
  
            tenantUserId = user.TenantUserId;
            const tenantId = user.TenantId;
            console.log({result, tenantUserId, tenantId, password, userEmail});
            resolve({ result, tenantUserId, tenantId });
          });
        });
    });
  };

module.exports = { saveNewPwd, autenticateUserPWD, saveNewPwdTenant, autenticateTenantUserPWD };
