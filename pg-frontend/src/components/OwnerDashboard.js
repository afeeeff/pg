import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Assuming your main CSS is App.css or index.css
//import './App.css'; 

const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://pgbackend-p3p0.onrender.com';

export default function OwnerDashboard() {
  const [allManualPayments, setAllManualPayments] = useState([]); // Stores all fetched payments
  const [uniqueUsers, setUniqueUsers] = useState([]); // Stores unique users who have made payments
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // Stores the email of the currently selected user

  useEffect(() => {
    fetchPaymentsAndUsers();
  }, []);

  const fetchPaymentsAndUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payment/manual-payments`);
      const payments = res.data.payments || [];
      setAllManualPayments(payments);

      // Process unique users from payments
      const usersMap = new Map();
      payments.forEach(payment => {
        if (!usersMap.has(payment.userEmail)) {
          usersMap.set(payment.userEmail, {
            email: payment.userEmail,
            name: payment.userName, // Assuming userName is consistent for an email
            paymentCount: 0,
          });
        }
        usersMap.get(payment.userEmail).paymentCount++;
      });
      setUniqueUsers(Array.from(usersMap.values()));

    } catch (error) {
      console.error("Error fetching manual payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
        status: 'verified',
        verifiedBy: 'Owner'
      });
      alert('Payment verified successfully!');
      fetchPaymentsAndUsers(); // Re-fetch to update all data
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert('Failed to verify payment.');
    }
  };

  const handleReject = async (paymentId) => {
    const notes = prompt('Reason for rejection (optional):') || '';
    try {
      await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
        status: 'rejected',
        notes,
        verifiedBy: 'Owner'
      });
      alert('Payment rejected successfully!');
      fetchPaymentsAndUsers(); // Re-fetch to update all data
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment.');
    }
  };

  const handleUserCardClick = (userEmail) => {
    setSelectedUser(userEmail);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  // Filter payments for the selected user
  const paymentsForSelectedUser = selectedUser
    ? allManualPayments.filter(payment => payment.userEmail === selectedUser)
    : [];

  if (loading) return <div className="loading-spinner">Loading Owner Dashboard...</div>;

  return (
    <div className="owner-dashboard-container form-box slide-in">
      <h2>Owner Dashboard</h2>

      {selectedUser ? (
        // Display payments for the selected user
        <div className="user-payment-history-view">
          <button onClick={handleBackToUsers} className="back-to-users-btn mb-4">
            &larr; Back to All Users
          </button>
          <h3>Payment History for {selectedUser}:</h3>
          {paymentsForSelectedUser.length === 0 ? (
            <p>No payments found for this user.</p>
          ) : (
            <div className="manual-payments-grid"> {/* Reusing grid for layout */}
              {paymentsForSelectedUser.map(payment => (
                <div key={payment._id} className="payment-card">
                  <div className="payment-header">
                    <h4>Payment ID: {payment._id.substring(0, 8)}...</h4> {/* Shorten ID for display */}
                    <span className={`status-badge ${payment.status || 'pending'}`}>
                      {(payment.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                  <p><strong>Amount:</strong> ₹{payment.amount}</p>
                  <p><strong>Room Type:</strong> {payment.roomType}</p>
                  <p><strong>Days:</strong> {payment.days}</p>
                  <p><strong>Method:</strong> {payment.paymentMethod}</p>
                  <p><strong>Submitted:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
                  {payment.notes && <p><strong>Notes:</strong> {payment.notes}</p>}
                  <div className="receipt-display">
                    <strong>Receipt:</strong><br />
                    {payment.receiptPath ? (
                      <a
                        href={`${API_BASE_URL}/${payment.receiptPath.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="receipt-link"
                      >
                        <img
                          src={`${API_BASE_URL}/${payment.receiptPath.replace(/\\/g, '/')}`}
                          alt="Receipt"
                          className="receipt-image"
                        />
                      </a>
                    ) : (
                      <span>No receipt uploaded</span>
                    )}
                  </div>
                  <div className="owner-actions">
                    {(payment.status === 'pending' || !payment.status) && (
                      <>
                        <button onClick={() => handleVerify(payment._id)} className="verify-btn">Verify</button>
                        <button onClick={() => handleReject(payment._id)} className="reject-btn">Reject</button>
                      </>
                    )}
                    {payment.status === 'verified' && <span className="verified-status-text">✅ Verified</span>}
                    {payment.status === 'rejected' && <span className="rejected-status-text">❌ Rejected</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Display unique user cards
        <div className="dashboard-section user-cards-section">
          <h3>Users with Manual Payment Submissions</h3>
          {uniqueUsers.length === 0 ? (
            <p>No users have made manual payment submissions yet.</p>
          ) : (
            <div className="user-cards-grid">
              {uniqueUsers.map(user => (
                <div key={user.email} className="user-card" onClick={() => handleUserCardClick(user.email)}>
                  <div className="user-card-header">
                    <h4>{user.name || 'Unknown User'}</h4>
                    <span className="payment-count-badge">{user.paymentCount} Payments</span>
                  </div>
                  <p className="user-email">{user.email}</p>
                  <span className="view-details-prompt">Click to view payments &rarr;</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}