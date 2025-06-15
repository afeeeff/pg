//model/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: String,
  userEmail: String,
  userName: String,
  userPhone: String,
  paymentMethod: String,
  amount: Number,
  roomType: String,
  days: Number,
  receiptPath: String,
  receiptOriginalName: String,
  paymentId: String,
  status: { type: String, default: 'pending' },
  accepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);