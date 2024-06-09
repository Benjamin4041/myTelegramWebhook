require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bodyParser = require("body-parser");
const {
  registerUser,
  authenticateUser,
} = require("./controllers/authController");
const { startAllClients, setOtpCode } = require("./services/telegramService");
const { verifyCode } = require('./services/telegramService');




const app = express();
app.use(bodyParser.json());

let PORT = 4000;

const uri =
  "mongodb+srv://admin:user_password.@cluster0.z5wvnul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
mongoose
.connect(
uri
)
.then(() => {
  console.log(
    "Pinged your deployment. You successfully connected to MongoDB!"
  );
  startAllClients();
})
.catch((err) => {
  console.log(err);
});

let otpStore={}

app.post('/register', registerUser);


app.post('/otp', async (req, res) => {
  try {
    const otp = req.body.otp;
    console.log(`Received OTP: ${otp}`);
    setOtpCode(otp); // Use setter function to store OTP
    res.status(200).send('OTP received');
  } catch (error) {
    console.error('Error receiving OTP:', error);
    res.status(500).send('Error receiving OTP');
  }
});




app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});
