// src/components/StripeLoaderTest.jsx
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Payment from './Payment';

// Load your Stripe publishable key from environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeLoaderTest = () => {
  return (
    <Elements stripe={stripePromise}>
      <div style={{ padding: 20 }}>
        <h2>Stripe Test Loader</h2>
        <Payment />
      </div>
    </Elements>
  );
};

export default StripeLoaderTest;
