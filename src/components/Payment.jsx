import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const Payment = ({ formData, cost, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent when the component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/create-payment-intent', {
          amount: cost,
        });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Unable to initialize payment. Please try again later.');
      }
    };

    createPaymentIntent();
  }, [cost]);

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (confirmError) {
      setError(confirmError.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }

    setIsProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="payment-container">
      <h2>Payment for Room</h2>
      <div className="payment-details">
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Room Type:</strong> {formData.roomType}</p>
        <p><strong>Days:</strong> {formData.days}</p>
        <p><strong>Total Cost:</strong> ₹{cost}</p>
      </div>

      <div className="payment-form">
        <h3>Enter Card Details</h3>
        <div className="card-element-container">
          <CardElement 
            options={cardElementOptions}
            className="card-element" 
          />
        </div>

        <div className="test-card-details">
          <h4>Test Card Details:</h4>
          <p><strong>Card Number 1:</strong> 4000 0025 0000 3155</p>
          <p><strong>Card Number 2:</strong> 4242 4242 4242 4242</p>
          <p><strong>Card Number 3:(for decline)</strong> 4000 0000 0000 9995 </p>
          <p><strong>Expiry Date:</strong> Any future date (e.g., 04/25)</p>
          <p><strong>CVC:</strong> Any 3 digits (e.g., 123)</p>
          <p><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</p>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="payment-actions">
          <button onClick={onBack} disabled={isProcessing}>Back</button>
          <button onClick={handlePayment} disabled={isProcessing || !stripe || !clientSecret}>
            {isProcessing ? 'Processing...' : `Pay ₹${cost}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;