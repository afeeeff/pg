const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/payment-receipts/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['googlepay', 'phonepe', 'paytm']
  },
  amount: { type: Number, required: true },
  roomType: { type: String, required: true },
  days: { type: Number, required: true },
  receiptPath: { type: String, required: true },
  receiptOriginalName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  paymentId: { type: String, unique: true, required: true },
  timestamp: { type: Date, default: Date.now },
  verificationNotes: { type: String, default: '' },
  verifiedBy: { type: String, default: '' }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  phone: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Generate unique payment ID
const generatePaymentId = () => {
  return 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Submit manual payment
router.post('/manual-payment', upload.single('receipt'), async (req, res) => {
  try {
    const { paymentMethod, userId, amount, roomType, days } = req.body;
    
    if (!paymentMethod || !userId || !amount || !roomType || !days) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment receipt is required'
      });
    }

    // Get user details
    let user;
if (userId.includes('@')) {
  // If userId looks like an email, find by email
  user = await User.findOne({ email: userId });
} else {
  // Otherwise, assume it's a MongoDB ObjectId
  user = await User.findById(userId);
}
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create payment record
    const paymentId = generatePaymentId();
    const paymentData = new Payment({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone,
      paymentMethod: req.body.paymentMethod,
      amount: parseFloat(req.body.amount),
      roomType: req.body.roomType,
      days: parseInt(req.body.days),
      receiptPath: req.file.path,
      receiptOriginalName: req.file.originalname,
      paymentId: paymentId
    });
    await paymentData.save();
console.log('Payment saved to database:', paymentData);

    // Configure nodemailer transporter (example with Gmail)
require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS                // Use an app password, not your real password
  }
});

// Compose the email
const mailOptions = {
  from: 'sayedafeeef@gmail.com',
  to: 'sayedafeeef@gmail.com', // Owner's email
  subject: 'New Manual Payment Submission',
  text: `A new manual payment has been submitted by ${user.name} (${user.email}).

Amount: ₹${amount}
Room Type: ${roomType}
Days: ${days}
Payment Method: ${paymentMethod}
Phone: ${user.phone}

See attached receipt screenshot.`,
  attachments: [
    {
      filename: req.file.originalname,
      path: req.file.path
    }
  ]
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
    // Optionally, you can notify the user but don't fail the payment
  } else {
    console.log('Email sent:', info.response);
  }
});

    res.json({
      success: true,
      message: 'Payment details submitted successfully',
      paymentId: paymentId
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Get all manual payments (for owner)
router.get('/manual-payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ timestamp: -1 });
    const paymentsWithReceipts = payments.map(payment => {
      return {
        ...payment.toObject(),
        receiptFileName: payment.receiptPath ? path.basename(payment.receiptPath) : null
      };
    });
    res.json({
      success: true,
      payments: paymentsWithReceipts
    });
  } catch (error) {
    console.error('Error fetching manual payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// Get receipt file
router.get('/receipt/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads/payment-receipts', req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving receipt file:', error);
    res.status(500).send('Internal server error');
  }
});

// Update payment status
router.put('/manual-payments/:id/status', async (req, res) => {
  const { status, notes, verifiedBy } = req.body || {};
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status, verifiedBy, accepted: status === 'verified'  },
      { new: true }
    );
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
});

// Get user payments
router.get('/user-payments', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.query.userId })
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      payments: payments.map(p => ({
        paymentId: p.paymentId,
        amount: p.amount,
        roomType: p.roomType,
        days: p.days,
        status: p.status,
        timestamp: p.timestamp,
        verificationNotes: p.verificationNotes
      }))
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user payments'
    });
  }
});
router.get('/user-payments/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, payments: [] });
  }
});
module.exports = router;