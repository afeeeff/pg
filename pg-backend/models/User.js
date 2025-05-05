//model/User.js
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  aadhar: String,
  address: String,
});

module.exports = mongoose.model('User', userSchema);
