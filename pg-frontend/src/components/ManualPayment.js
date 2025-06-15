import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManualPayment = ({ formData, cost, userId, onSuccess, onBack, isLoggedIn, uid }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [userPayments, setUserPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://pgbackend-p3p0.onrender.com';

  // Recipient details (replace with your actual details)
  const recipientDetails = {
    phoneNumber: '+91 6363722888',
    upiId: 'quickstay@paytm',
    name: 'Quick Stay PG'
  };

  const paymentMethods = [
    { value: 'googlepay', label: 'Google Pay' },
    { value: 'phonepe', label: 'PhonePe' },
    { value: 'paytm', label: 'Paytm' }
  ];

  // Generate QR code on component mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Generate UPI payment link
        const upiLink = `upi://pay?pa=${recipientDetails.upiId}&pn=${encodeURIComponent(recipientDetails.name)}&am=${cost}&tn=PG Payment for ${formData.roomType}`;
        
        // Use a free QR code generator API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
        
        setQrCodeUrl(qrCodeUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [cost, formData.roomType]);

  // Fetch user payments if logged in
  useEffect(() => {
    if (isLoggedIn && uid) {
      setLoadingPayments(true);
      axios
        .get(`${API_BASE_URL}/api/payment/user-payments/${uid}`)
        .then(res => setUserPayments(res.data.payments || []))
        .finally(() => setLoadingPayments(false));
    }
  }, [isLoggedIn, uid]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only image files (JPEG, PNG, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    if (!uploadedFile) {
      alert('Please upload payment receipt');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('paymentMethod', selectedPaymentMethod);
      formDataToSend.append('receipt', uploadedFile);
      formDataToSend.append('userId', userId);
      formDataToSend.append('amount', cost);
      formDataToSend.append('roomType', formData.roomType);
      formDataToSend.append('days', formData.days);
      formDataToSend.append('userName', formData.name);
      formDataToSend.append('userEmail', formData.email);
      formDataToSend.append('userPhone', formData.mobile);
      
      const response = await axios.post(`${API_BASE_URL}/api/payment/manual-payment`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSubmitStatus('success');
        onSuccess({
          paymentMethod: selectedPaymentMethod,
          paymentId: response.data.paymentId
        });
      } else {
        throw new Error('Failed to submit payment details');
      }
    } catch (error) {
console.error('Error submitting payment:', error);
if (error.response) {
  console.error('Backend response:', error.response.data);
}
setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="form-box slide-in">
      <h2>Complete Your Payment</h2>
      
      {/* Payment Summary */}
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <p><strong>Room Type:</strong> {formData.roomType}</p>
        <p><strong>Duration:</strong> {formData.days} days</p>
        <p><strong>Total Amount:</strong> ₹{cost}</p>
      </div>

      <div className="payment-container">
        {/* QR Code Section */}
        <div className="qr-section">
          <h3>📱 Scan QR Code to Pay</h3>
          <div className="qr-code-container">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="UPI QR Code" className="qr-code" />
            ) : (
              <div className="qr-placeholder">Loading QR Code...</div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="payment-details">
          <div className="detail-card">
            <h4>📞 Phone Number</h4>
            <p className="detail-value">{recipientDetails.phoneNumber}</p>
          </div>

          <div className="detail-card">
            <h4>💳 UPI ID</h4>
            <p className="detail-value">{recipientDetails.upiId}</p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="payment-form">
          {/* Payment Method Selection */}
          <div className="form-group">
            <label>Select Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              required
            >
              <option value="">Choose payment method...</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>Upload Payment Receipt/Screenshot</label>
            <div className="file-upload-area">
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                required
                className="file-input"
              />
              <label htmlFor="receipt-upload" className="file-upload-label">
                📤 {uploadedFile ? uploadedFile.name : 'Choose file or drag and drop'}
              </label>
              <p className="file-info">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" onClick={onBack} className="back-btn">
              ← Back to Room Selection
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment Details'}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="success-message">
            ✅ Payment details submitted successfully! We will verify your payment shortly.
            
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="error-message">
            ✅ Payment details submitted successfully! We will verify your payment shortly.
            
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="payment-instructions">
        <h4>Payment Instructions:</h4>
        <ol>
          <li>Scan the QR code or use the provided phone number/UPI ID</li>
          <li>Make the payment using your preferred payment app</li>
          <li>Take a screenshot of the successful payment</li>
          <li>Select your payment method and upload the screenshot</li>
          <li>Submit the form - we'll verify your payment within 24 hours</li>
        </ol>
      </div>
    </div>
  );
};

export default ManualPayment;