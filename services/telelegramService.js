const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const User = require("../models/user");
require("dotenv").config();
const input = require("input");
const express = require('express');


const app = express()



let otpCode = null; // Store OTP code in a module-level variable

const setOtpCode = (code) => {
  otpCode = code;
};

const getOtpCode = () => {
  return otpCode;
};



const clients = {}; // Store clients by email

const startClient = async (user) => {
  const stringSession = new StringSession(user.session || "");
  const client = new TelegramClient(stringSession, user.apiId, user.apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => user.phoneNumber,
      password: async () => {
        throw new Error("Password required, but not implemented.");
      },
      phoneCode: async () => {
        throw new Error("Code required, but not implemented.");
      },
      onError: (err) => console.error(err),
    });

    user.session = client.session.save();
    await user.save();

    client.addEventHandler(async (event) => {
      if (event.message) {
        const message = event.message.message;
        const sender = await event.message.getSender();
        const senderId = sender.id;
        console.log(`New message from ${senderId}: ${message}`);
        forwardMessage(senderId, message);
      }
    }, {});

    clients[user.email] = client;
  } catch (error) {
    console.error(`Failed to start client for ${user.email}:`, error);
  }
};

const startClientRegister = async (user) => {
  const stringSession = new StringSession(user.session || "");
  const client = new TelegramClient(stringSession, user.apiId, user.apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => user.phoneNumber,
      password: "",
      phoneCode: async () => {
        return new Promise((resolve) => {
          const checkOTP = setInterval(() => {
            const code = getOtpCode(); // Use getter function to retrieve OTP
            if (code) {
              clearInterval(checkOTP);
              resolve(code);
            }
          }, 1000); // Check every second for the OTP
        });
      },
      onError: (err) => console.error(err),
    });

    user.session = client.session.save();
    await user.save();

    client.addEventHandler(async (event) => {
      if (event.message) {
        const message = event.message.message;
        const sender = await event.message.getSender();
        const senderId = sender.id;
        console.log(`New message from ${senderId}: ${message}`);
        forwardMessage(senderId, message);
      }
    }, {});

    clients[user.email] = client;
  } catch (error) {
    console.error(`Failed to start client for ${user.email}:`, error);
  }
};

const forwardMessage = (senderId, message) => {
  axios
    .post("https://another-server.com/forward", { senderId, message })
    .then((response) => {
      console.log("Message forwarded successfully");
    })
    .catch((error) => {
      console.error("Error forwarding message:", error);
    });
};

const startAllClients = async () => {
  const users = await User.find({ session: { $ne: null } });
  for (const user of users) {
    await startClient(user);
  }
};

// module.exports = {
//   startClient,
//   startAllClients,
//   startClientRegister
// };
module.exports = {
  startClientRegister,
  startClient,
  startAllClients,
  setOtpCode,
  getOtpCode,
};