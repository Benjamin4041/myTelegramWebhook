const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// define a schema for subscription

const SubscriptionDetailsSchema = new Schema({
  isSubscribe: {
    type: Boolean,
    required: false,
    default: false,
  },
  duration: {
    type: String,
    required: false,
    default: "0",
  },
  expires: {
    type: Date,
    required: false,
    default: "",
  },
});

// Define a new schema for User
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  exchangeApiKey: {
    type: String,
    required: false,
  },
  exchangeApiSecret: {
    type: String,
    required: false,
  },
  telegramApiId: {
    type: String,
    required: false,
  },
  telegramApiHash: {
    type: String,
    required: false,
  },
  telegramSession: {
    type: String,
    required: false,
  },
  telegramPassword: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  signalGiversUsernames: {
    type: Array,
    required: false,
  },
  signalGroup: {
    type: Array,
    required: false,
  },
  stoplossTraling: {
    type: Boolean,
    required: false,
    default: false,
  },
  currentBalance: {
    type: String,
    required: false,
  },
  startBalance: {
    type: String,
    required: false,
  },
  Profit: {
    type: String,
    required: false,
  },
  referalPoint: {
    type: Number,
    required: false,
  },
  referal: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  subscriptionDetails: {
    type: SubscriptionDetailsSchema,
    required: false,
    default: () => ({
      isSubscribe: false,
      duration: "0",
      expires: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000),
    }),
  },
  exemptionSymbols: {
    type: Array,
    required: false,
  },
  roles: {
    type: String,
    required: true,
    default: "User",
  },
});

module.exports = mongoose.model("User", userSchema);
