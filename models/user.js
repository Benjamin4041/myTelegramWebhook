const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  apiId: { type: Number, required: true },
  apiHash: { type: String, required: true },
  session: { type: String, default: null },
  signalGivers: { type: Array, requied: true, default: null },
  signalGroups: { type: Array, requied: true, default: null },
});

module.exports = mongoose.model("User", userSchema);
