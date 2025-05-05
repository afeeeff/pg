//model/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Now storing email directly

  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);