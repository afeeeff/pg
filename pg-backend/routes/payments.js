const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');

// POST /api/payments
router.post('/', async (req, res) => {
  console.log("Incoming payment payload:", req.body);

  const { uid, amount, paid } = req.body;

  try {
    // FIX: Check user by ID if UID is email
    const user = await User.findOne({ email: uid }); // assuming uid = email

    if (!user) {
      console.log("User not found for UID:", uid);
      return res.status(404).json({ error: 'User not found' });
    }

    const payment = new Payment({
      uid,
      amount,
      paid,
    });

    await payment.save();

    res.status(201).json({ message: 'Payment saved', payment });
  } catch (err) {
    console.error("Payment error stack:", err);  // log full error
    res.status(500).json({ error: 'Payment error' });
  }
  
});

module.exports = router;
