import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import './index.css';
// Remove Stripe imports since we're replacing with manual payment
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import StripeLoaderTest from './components/StripeLoaderTest'; 
import HeroSection from './components/HeroSection';
// Replace Payment component with ManualPayment
import ManualPayment from './components/ManualPayment';
import NavBar from './components/NavBar';
import OwnerDashboard from './components/OwnerDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
//import UserDashboard from './components/UserDashboard';

const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000' // your local backend URL
    : 'https://pgbackend-p3p0.onrender.com'; // hosted backend URL

export default function PGAutomation() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', aadhar: '', mobile: '', address: '', roomType: '', days: '' });
  const [uid, setUid] = useState('');
  const [payments, setPayments] = useState([]);
  const [manualPayments, setManualPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState('register');
  const [isOwner, setIsOwner] = useState(false);
  const [cost, setCost] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  // Remove Stripe promise since we're not using it anymore
  // const stripePromise = loadStripe('pk_test_51RI4JE2RYxgGiQ1OHkrWl5Nm7W6brFecxKWvEF8VzWxw2dAVUcWdc4YM73KtGqw4VQ8Go7kYBNt9tq4ge5QpZGCc00r9pavBhe');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // Updated shouldShowNav function to include login and register pages but exclude room, payment, and invoice
  const shouldShowNav = () => {
    return showLanding || 
          currentPage === 'login' || 
          currentPage === 'register';
  };
  
  const handleNavigation = (page) => {
    if (page === 'home') {
      setShowLanding(true);
      setCurrentPage('login');
    } else if (page === 'login' || page === 'register') {
      setShowLanding(false);
      setCurrentPage(page);
    } else if (page === 'amenities' || page === 'about' || page === 'contact') {
      if (showLanding) {
        const element = document.getElementById(page);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setShowLanding(true);
        setTimeout(() => {
          const element = document.getElementById(page);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (isOwner) {
      // Fetch both regular payments and manual payments for owner dashboard
      Promise.all([
        axios.get(`${API_BASE_URL}/api/owner/dashboard`),
        axios.get(`${API_BASE_URL}/api/payment/manual-payments`)
      ])
      .then(([paymentsRes, manualPaymentsRes]) => {
        setPayments(paymentsRes.data);
        setManualPayments(manualPaymentsRes.data.payments || []);
      })
      .catch(err => console.error(err));
    }
  }, [isOwner]);

  useEffect(() => {
    if (isLoggedIn && uid) {
      axios
        .get(`${API_BASE_URL}/api/payment/user-payments/${uid}`)
        .then(res => setUserPayments(res.data.payments || []));
    }
  }, [isLoggedIn, uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'days' || name === 'roomType') {
      const days = name === 'days' ? parseInt(value) : parseInt(formData.days);
      const room = name === 'roomType' ? value : formData.roomType;  
      let rate = room === 'single' ? 10000 : room === 'double' ? 8000 : 6000;
      if (!isNaN(days)) setCost(rate * (days / 30));
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.mobile,
        aadhar: formData.aadhar,
        address: formData.address,
      });
      alert("Registration successful! You can now log in.");
      setCurrentPage('login');
    } catch (err) {
      console.error(err);
      alert('Registration failed.');
    }
  };

  const handleLogin = async () => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/users/login`, {
      email: formData.email,
      password: formData.password,
    });
    const user = res.data.user; // Make sure backend sends { user: { ... } }
    setUid(user._id); // Use MongoDB _id for user identification
    setIsLoggedIn(true);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.phone,
      aadhar: user.aadhar,
      address: user.address,
      // ...add other fields if needed
    });
    setCurrentPage('dashboard');
  } catch (err) {
    console.error(err);
    alert('Login failed. Check your email and password.');
  }
};

  const handleRoomClick = (roomType) => {
    setFormData(prev => ({ ...prev, roomType }));
    handleChange({ target: { name: 'roomType', value: roomType } });
  };

  const handleRoomSelection = async () => {
    if (!uid) return alert("UID missing");

    // Instead of creating a payment record immediately, just proceed to manual payment
    setCurrentPage('payment');
  };

  

const handleDownloadInvoice = (payment) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 70, 150);
  doc.text('🏠 PG Stay Invoice', 14, 18);

  // Sub-header
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Invoice Date: ${new Date(payment.createdAt).toLocaleString()}`, 14, 28);
  doc.text(`Invoice ID: ${payment.paymentId}`, 14, 34);

  // Table with details
  autoTable(doc, {
    startY: 40,
    head: [['Field', 'Value']],
    body: [
      ['Name', payment.userName],
      ['Email', payment.userEmail],
      ['Mobile', payment.userPhone],
      ['Room Type', payment.roomType],
      ['Days', payment.days],
      ['Total Amount', `₹${payment.amount}`],
      ['Status', payment.status === 'verified' ? 'Payment Verified' : 'Pending Verification'],
    ],
    styles: {
      fontSize: 12,
      cellPadding: 4,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [40, 70, 150],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 245, 255],
    },
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Thank you for choosing our PG Stay!', 14, doc.internal.pageSize.height - 18);

  doc.save(`invoice-${payment.paymentId}.pdf`);
};

  const handleLoginAsOwner = () => {
  // You can add a password prompt or a modal here
  const password = prompt('Enter owner password:');
  if (password === '123') {
    setIsOwnerLoggedIn(true);
  } else {
    alert('Incorrect password!');
  }
};

  const handleLogout = () => {
    setFormData({ name: '', email: '', password: '', aadhar: '', mobile: '', address: '', roomType: '', days: '' });
    setUid('');
    setIsLoggedIn(false);
    setCurrentPage('register');
    setShowDropdown(false);
    setIsOwner(false);
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const roomImages = {
    single: '/single.jpg',
    double: '/double.jpg',
    triple: '/triple.avif',
  };
  
  // Updated payment success handler for manual payments
  const handlePaymentSuccess = async (paymentData) => {
    try {
    // Optionally, create a payment record in your system here
    setCurrentPage('invoice');
  } catch (err) {
    console.error('Payment record creation failed:', err);
    alert('Payment submitted but record creation failed. Please contact support.');
  }
  };

  // Function to update manual payment status (for owner)
  const updatePaymentStatus = async (paymentId, status, notes = '') => {
    try {
      await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
        status:'verified',
        notes,
        verifiedBy: 'Owner' // You can make this dynamic based on logged-in owner
      });
      
      // Refresh manual payments list
      const response = await axios.get(`${API_BASE_URL}/api/payment/manual-payments`);
      setManualPayments(response.data.payments || []);
      
      alert(`Payment ${status} successfully!`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    }
  };

  return (
    <div className="top-bar">
      {isOwnerLoggedIn ? (
        <OwnerDashboard />
      ) : (
        <>
          {showLanding ? (
            <div className="landing-dashboard">
              <NavBar onNavigate={handleNavigation} />
              <HeroSection 
                handleRegisterClick={() => {
                  setShowLanding(false);
                  setCurrentPage('register');
                }}
              />
              <section id="amenities" className="info-section">
                <h2>Amenities</h2>
                <div className="feature-grid">
                  <div className="feature-card">🛏️ Comfortable Rooms</div>
                  <div className="feature-card">👮‍♂️ 24/7 Security</div>
                  <div className="feature-card">🍽️ Healthy Food</div>
                  <div className="feature-card">🚿 24x7 Water Supply</div>
                  <div className="feature-card">📹 CCTV Secured</div>
                  <div className="feature-card">🧺 Laundry Facility</div>
                </div>
              </section>
              <section id="about" className="info-section">
                <h2>About Us</h2>
                <p>Quick Stay provides top-notch accommodation for students and professionals in Bangalore. We focus on comfort, hygiene, and safety with modern amenities and a home-like atmosphere.</p>
              </section>
              <section id="contact" className="info-section">
                <h2>Contact Us</h2>
                <p><strong>Phone:</strong> +91 6363722888</p>
                <p><strong>Email:</strong> info@quickstay.in</p>
                <p><strong>Address:</strong> 123 Residency Lane, Bangalore, India</p>
              </section>
              <footer className="landing-footer">
                <p>© 2025 Quick Stay. All rights reserved.</p>
              </footer>
            </div>
          ) : (
            <>
              {shouldShowNav() && (
                <nav className="dashboard-nav">
                  <div className="logo" onClick={() => {
                    setShowLanding(true);
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }}>
                  </div>
                  <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    <NavBar onNavigate={handleNavigation} />
                  </div>
                </nav>
              )}

              {isLoggedIn && (
                <div className="user-icon-container-right">
                  <div className="user-icon-large" onClick={toggleDropdown}>👤</div>
                  {showDropdown && (
                    <div className="user-dropdown">
                      <div>
  <strong>Name:</strong> {formData.name}
  <br />
  <strong>Email:</strong> {formData.email}
  <br />
  <button onClick={handleLogout}>Logout</button>
</div>
                    </div>
                  )}
                </div>
              )}

              {currentPage === 'register' && (
                <div className="auth-wrapper">
                  <div className="auth-box slide-in">
                    <h2>Register</h2>
                    <input name="name" placeholder="Full Name" onChange={handleChange} />
                    <input name="email" placeholder="Email" onChange={handleChange} />
                    <input name="password" placeholder="Password" type="password" onChange={handleChange} />
                    <input name="aadhar" placeholder="Aadhar Number" onChange={handleChange} />
                    <input name="mobile" placeholder="Mobile" onChange={handleChange} />
                    <input name="address" placeholder="Address" onChange={handleChange} />
                    <button onClick={handleRegister}>Register</button>
                    <p>Already registered? <button onClick={() => setCurrentPage('login')}>Login</button></p>
                  </div>
                </div>
              )}

              {currentPage === 'login' && (
                <>
                  <div className="auth-wrapper">
                    <div className="auth-box slide-in">
                      <h2>Login</h2>
                      <input name="email" placeholder="Email" onChange={handleChange} />
                      <input name="password" placeholder="Password" type="password" onChange={handleChange} />
                      <button onClick={handleLogin}>Login</button>
                      <p>Don't have an account? <button onClick={() => setCurrentPage('register')}>Register</button></p>
                    </div>
                  </div>
                  <div className="owner-panel">
                    <h2>Owner Panel</h2>
                    <button onClick={handleLoginAsOwner}>Login as Owner</button>
                  </div>
                </>
              )}

              {currentPage === 'room' && (
                <div className="form-box slide-in">
                  <h2>Select Room Type</h2>
                  <div className="room-options">
                    {['single', 'double', 'triple'].map(type => (
                      <div
                        key={type}
                        className={`room-card ${formData.roomType === type ? 'selected' : ''}`}
                        onClick={() => handleRoomClick(type)}
                      >
                        <img src={roomImages[type]} alt={type} className="room-img" />
                        <p>
                          {type === 'single'
                            ? 'Single Room'
                            : type === 'double'
                            ? 'Double Sharing'
                            : 'Triple Sharing'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <select name="days" onChange={handleChange} value={formData.days}>
                    <option value="">Select Days</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="90">90</option>
                  </select>
                  <p><strong>Estimated Cost:</strong> ₹{cost}</p>
                  <button onClick={handleRoomSelection}>Proceed to Payment</button>
                </div>
              )}
              
              {currentPage === 'payment' && (
                <ManualPayment
                  formData={formData}
                  cost={cost}
                  userId={uid}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setCurrentPage('room')}
                />
              )}
              
              {currentPage === 'invoice' && (
                <div className="form-box slide-in">
                  <h2>Payment Submitted</h2>
                  <div className="payment-success-message">
                    <p>✅ Your payment details have been submitted successfully!</p>
                    <p>Our team will verify your payment within 24 hours.</p>
                  </div>
                  <div className="invoice-details">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Room Type:</strong> {formData.roomType}</p>
                    <p><strong>Days:</strong> {formData.days}</p>
                    <p><strong>Amount:</strong> ₹{cost}</p>
                    <p><strong>Status:</strong> <span className="pending-status">Pending Verification</span></p>
                  </div>
                  
                </div>
              )}

              {isLoggedIn && currentPage === 'dashboard' && (
                <div className="user-dashboard">
                  <h2>Welcome, {formData.name}</h2>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Mobile:</strong> {formData.mobile}</p>
                  <p><strong>Aadhar:</strong> {formData.aadhar}</p>
                  <p><strong>Address:</strong> {formData.address}</p>
                  <hr />
                  {loadingPayments ? (
                    <p>Loading your payment status...</p>
                  ) : userPayments.length > 0 ? (
                    <div>
                      <h3>Your Payment History</h3>
                      <ul>
  {userPayments.map((payment, idx) => (
    <li key={payment._id} style={{ marginBottom: 10 }}>
      <strong>{idx === 0 ? 'Latest: ' : ''}</strong>
      Paid ₹{payment.amount} for {payment.days} days ({payment.roomType}) on {new Date(payment.createdAt).toLocaleDateString()}
      &nbsp;| Status: {payment.status || (payment.accepted ? 'verified' : 'pending')}
      {payment.status === 'verified' && (
        <button
          style={{ marginLeft: 12 }}
          onClick={() => handleDownloadInvoice(payment)}
        >
          Download Invoice
        </button>
      )}
    </li>
  ))}
</ul>
                      {userPayments[0].status === 'verified' && (
          <button onClick={() => handleDownloadInvoice(userPayments[0])}>
            Download Invoice
          </button>
        )}
                      <button onClick={() => setCurrentPage('room')}>Pay for Next Month</button> {/* <-- Go to room selection */}
                    </div>
                  ) : (
                    <div>
                      <p>You have not paid for any month yet.</p>
                      <button onClick={() => setCurrentPage('room')}>Pay Now</button> {/* <-- Go to room selection */}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}