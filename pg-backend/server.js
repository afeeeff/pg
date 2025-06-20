require('dotenv').config();
const express = require('express');
const app = express();

const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Middleware
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5001',                      // Local frontend
  'https://quickstay-kpfh.onrender.com'         // Hosted frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());


// Import routes
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const ownerRoutes = require('./routes/owner');
//const paymentRoutess = require('./routes/payment');
const manualPaymentRoutes = require('./routes/payment')



app.use('/api/payment', manualPaymentRoutes);
//app.use('/payment', paymentRoutess);




app.use('/uploads', express.static('uploads'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Stripe Payment Intent Endpoint (for client-side confirmation)
// Stripe Payment Intent Endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Use your existing routes
app.use('/api/users', userRoutes);
//app.use('/api/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/owner', ownerRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('PG Automation Backend is Running 🚀');
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});