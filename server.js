require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const {
  registerUser,
  authenticateUser,
} = require("./controllers/authController");
require("dotenv").config("./.env");
const { startAllClients, setOtpCode } = require("./services/telegramService");

const app = express();
app.use(bodyParser.json());

let PORT = 4000;

mongoose
  .connect(process.env.mongodbURI)
  .then(() => {
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    startAllClients();
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running on port " + PORT);
});
