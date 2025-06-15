import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://pgbackend-p3p0.onrender.com';

export default function OwnerDashboard() {
  const [manualPayments, setManualPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/payment/manual-payments`)
      .then(res => {
        setManualPayments(res.data.payments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVerify = async (paymentId) => {
    await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
      status: 'verified',
      
      verifiedBy: 'Owner'
    });
    // Refresh list
    const res = await axios.get(`${API_BASE_URL}/api/payment/manual-payments`);
    setManualPayments(res.data.payments || []);
  };

  const handleReject = async (paymentId) => {
    const notes = prompt('Reason for rejection (optional):') || '';
    await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
      status: 'rejected',
      notes,
      verifiedBy: 'Owner'
    });
    // Refresh list
    const res = await axios.get(`${API_BASE_URL}/api/payment/manual-payments`);
    setManualPayments(res.data.payments || []);
  };

  if (loading) return <div>Loading manual payments...</div>;

  return (
    <div className="form-box slide-in">
      <h2>Owner Dashboard</h2>
      <div className="dashboard-section">
        <h3>Manual Payment Submissions</h3>
        {manualPayments.length === 0 ? (
          <p>No manual payment submissions.</p>
        ) : (
          <div className="manual-payments-grid">
            {manualPayments.map(payment => (
              <div key={payment._id} className="payment-card">
                <div className="payment-header">
                  <h4>User: {payment.userName} ({payment.userEmail})</h4>
                  <span className={`status-badge ${payment.status || (payment.accepted ? 'verified' : 'pending')}`}>
                    {(payment.status || (payment.accepted ? 'verified' : 'pending')).toUpperCase()}
                  </span>
                </div>
                <p><strong>Payment Method:</strong> {payment.paymentMethod}</p>
                <p><strong>Amount:</strong> ₹{payment.amount}</p>
                <p><strong>Room Type:</strong> {payment.roomType}</p>
                <p><strong>Days:</strong> {payment.days}</p>
                <p><strong>Submitted:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
                <div>
                  <strong>Receipt:</strong><br />
                  {payment.receiptPath ? (
                    <a
                      href={`${API_BASE_URL}/${payment.receiptPath.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`${API_BASE_URL}/${payment.receiptPath.replace(/\\/g, '/')}`}
                        alt="Receipt"
                        style={{ maxWidth: 150, marginTop: 8 }}
                      />
                    </a>
                  ) : (
                    <span>No receipt uploaded</span>
                  )}
                </div>
                <div className="payment-actions" style={{ marginTop: 10 }}>
                  {(payment.status === 'pending' || !payment.status) && (
                    <>
                      <button onClick={() => handleVerify(payment._id)} className="verify-btn">Verify</button>
                      <button onClick={() => handleReject(payment._id)} className="reject-btn">Reject</button>
                    </>
                  )}
                  {payment.status === 'verified' && <span>✅ Verified</span>}
                  {payment.status === 'rejected' && <span>❌ Rejected</span>}
                </div>
                {payment.notes && (
                  <p><strong>Notes:</strong> {payment.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}