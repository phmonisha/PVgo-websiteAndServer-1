"use strict";
const nodemailer = require("nodemailer");
const path = require("path");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  //service: 'gmail',
  host: "mail.smtp2go.com",
  port: 587,
  //secure: false,
  auth: {
    user: process.env.USER_NAME, // Sender Gmail address
    pass: process.env.APP_PASSWORD, // App password generated from Gmail account
  },
});

async function sendEmail(to, subject, text, html) {

  // console.log('transporter: ', transporter);

  try {
    // console.log({ to, subject, text, html });
    const info = await transporter.sendMail({
      from: {
          name: 'PVgo',
          address: process.env.USER_GMAIL,
        },
      to,
      subject,
      text,
      html
      // from: {
      //   name: 'PVgo',
      //   address: process.env.USER_GMAIL,
      // },
      // to,
      // subject,
      // text,
      // html,
      // bcc: ["monishaputhanveet@gmail.com"],
    });

    // console.log("Message sent: %s", info.response);
    return info.response;
  } catch (error) {
    console.error("Error sending email:", error);
    //return error;
  }
}

module.exports = sendEmail;
