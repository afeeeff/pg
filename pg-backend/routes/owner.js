//routes/owner.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');

// GET /api/owner/dashboard
// Returns all users along with their payment info
// routes/owner.js
router.get('/dashboard', async (req, res) => {
    try {
      const users = await User.find();
      const payments = await Payment.find();
  
      const result = users.map(user => {
        const userPayments = payments
          .filter(p => p.uid === user.email) // match by UID (email)
          .map(p => ({
            amount: p.amount,
            status: p.paid ? 'Paid' : 'Pending',
            date: p.date
          }));
  
        return {
          name: user.name,
          email: user.email,
          phone: user.phone,
          payments: userPayments
        };
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error fetching owner dashboard:', err);
      res.status(500).send('Server error');
    }
  });
  

// Get all manual payments for owner dashboard
router.get('/manual-payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
