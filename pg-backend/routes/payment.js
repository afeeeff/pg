// routes/payment.js

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create a Stripe Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, customerEmail } = req.body;

    if (!amount || !customerEmail) {
      return res.status(400).json({ error: 'Amount and email are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'PG Stay Payment',
            },
            unit_amount: amount * 100, // Amount in paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/payment-cancel',
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    res.status(500).json({ error: 'Something went wrong with Stripe' });
  }
});

module.exports = router;
