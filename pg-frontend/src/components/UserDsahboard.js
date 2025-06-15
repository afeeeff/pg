import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Change if needed

export default function UserDashboard({ user }) {
  const [userPayments, setUserPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user payments on mount
  useEffect(() => {
    if (user && user._id) {
      axios
        .get(`${API_BASE_URL}/api/payment/user-payments/${user._id}`)
        .then(res => {
          setUserPayments(res.data.payments || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  // Handler for paying next month (redirect to payment page or open payment form)
  const handlePayNextMonth = () => {
    // You can navigate to your payment page or open the payment form here
    window.location.href = '/payment'; // Or use your router logic
  };

  if (loading) return <div>Loading your subscription details...</div>;

  return (
    <div className="user-dashboard">
      <h2>Welcome, {user.name}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Mobile:</strong> {user.phone}</p>
      <p><strong>Aadhar:</strong> {user.aadhar}</p>
      <p><strong>Address:</strong> {user.address}</p>

      <hr />

      {userPayments.length > 0 ? (
        <div>
          <h3>Your Payment History</h3>
          <ul>
            {userPayments.map((payment, idx) => (
              <li key={payment._id}>
                <strong>{idx === 0 ? 'Latest: ' : ''}</strong>
                Paid ₹{payment.amount} for {payment.days} days ({payment.roomType}) on {new Date(payment.createdAt).toLocaleDateString()}
                &nbsp;| Status: {payment.status || (payment.accepted ? 'verified' : 'pending')}
              </li>
            ))}
          </ul>
          <button onClick={handlePayNextMonth}>Pay for Next Month</button>
        </div>
      ) : (
        <div>
          <p>You have not paid for any month yet.</p>
          <button onClick={handlePayNextMonth}>Pay Now</button>
        </div>
      )}
    </div>
  );
}