const { TelegramClient, Api, client } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const User = require("../models/user");
const input = require("input"); // npm i input
const { NewMessage } = require("telegram/events");
require("dotenv").config();

let otpCode = null; // Store OTP code in a module-level variable

const setOtpCode = (code) => {
  otpCode = code;
};

const getOtpCode = () => {
  return otpCode;
};

const clients = {}; // Store clients by email

async function handler(event) {
  try {
    if (event.message) {
      const message = event.message.message;
      const sender = await event.message.getSender();
      const senderId = sender.id;
      console.log(`New message from ${senderId}: ${message}`);
      // forwardMessage(senderId, message);
    }
  } catch (err) {
    console.error("Error handling event:", err);
  }
}

const startClient = async (user) => {
  const stringSession = new StringSession(user.session || "");
  const client = new TelegramClient(stringSession, user.apiId, user.apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => user.phoneNumber,
      password: async () => user.password || "",
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.error("Client start error:", err),
    });

    user.session = client.session.save();
    await user.save();

    console.log(`Adding event handler for user ${user.email}`);

    let myChoice = user.signalGivers;
    console.log("Trimmed Signal Givers:", myChoice); 


    client.addEventHandler(
      (event) => {
        if (event.message) {
          console.log("Event received from:", event.message.peerId.userId, "Message:", event.message.message);
        }
      },
      new NewMessage({
        incoming: true,
        fromUsers: myChoice,
      })
    );

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
      password: async () => "",
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
      onError: (err) => console.error("Client start error:", err),
    });

    user.session = client.session.save();
    await user.save();

    console.log(`Adding event handler for user ${user.email}`);

    client.addEventHandler(handler, new NewMessage({}));

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

module.exports = {
  startClientRegister,
  startClient,
  startAllClients,
  setOtpCode,
  getOtpCode,
};
