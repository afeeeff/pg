import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import './index.css';
import './ManualPayment.css';
import HeroSection from './components/HeroSection';
import ManualPayment from './components/ManualPayment';
import NavBar from './components/NavBar';
import OwnerDashboard from './components/OwnerDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://pgbackend-p3p0.onrender.com';

export default function PGAutomation() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', aadhar: '', mobile: '', address: '', roomType: '', days: '' });
  const [uid, setUid] = useState('');
  const [payments, setPayments] = useState([]);
  const [manualPayments, setManualPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState('register');
  const [cost, setCost] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

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
    // Owner dashboard data fetch (if needed)
    if (isOwnerLoggedIn) {
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
  }, [isOwnerLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && uid) {
      setLoadingPayments(true);
      axios
        .get(`${API_BASE_URL}/api/payment/user-payments/${uid}`)
        .then(res => {
          setUserPayments(res.data.payments || []);
          setLoadingPayments(false);
        })
        .catch(err => {
          console.error("Error fetching user payments:", err);
          setLoadingPayments(false);
        });
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
      const user = res.data.user;
      setUid(user._id);
      setIsLoggedIn(true);
      setFormData({
        name: user.name,
        email: user.email,
        mobile: user.phone,
        aadhar: user.aadhar,
        address: user.address,
        roomType: '',
        days: '',
        password: ''
      });
      setCurrentPage('dashboard');
    } catch (err) {
      console.error(err);
      alert('Login failed. Check your email and password.');
    }
  };

  

  const handleRoomSelection = async () => {
    if (!uid) return alert("UID missing");
    setCurrentPage('payment');
  };

  const handleDownloadInvoice = (payment) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(40, 70, 150);
    doc.text('🏠 PG Stay Invoice', 14, 18);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Invoice Date: ${new Date(payment.createdAt).toLocaleString()}`, 14, 28);
    doc.text(`Invoice ID: ${payment.paymentId}`, 14, 34);

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

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Thank you for choosing our PG Stay!', 14, doc.internal.pageSize.height - 18);

    doc.save(`invoice-${payment.paymentId}.pdf`);
  };

  const handleLoginAsOwner = () => {
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
    setIsOwnerLoggedIn(false);
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const roomImages = {
    single: '/single.jpg',
    double: '/double.jpg',
    triple: '/triple.avif',
  };

  const handlePaymentSuccess = async (paymentData) => {
    setCurrentPage('invoice');
  };

  const updatePaymentStatus = async (paymentId, status, notes = '') => {
    try {
      await axios.put(`${API_BASE_URL}/api/payment/manual-payments/${paymentId}/status`, {
        status: status,
        notes,
        verifiedBy: 'Owner'
      });

      const response = await axios.get(`${API_BASE_URL}/api/payment/manual-payments`);
      setManualPayments(response.data.payments || []);

      alert(`Payment ${status} successfully!`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    }
  };
  const [selectedRoom, setSelectedRoom] = useState(null);
const [roomStep, setRoomStep] = useState(1);

const roomDetails = {
  single: {
    name: "Single Room",
    img: "/single.jpg",
    amenities: ["Private bed", "Study table", "Wardrobe", "Attached bathroom", "AC", "WiFi"],
    deposit: 12000,
    rate: 10000,
    description: "A private room for one person with all modern amenities."
  },
  double: {
    name: "Double Sharing",
    img: "/double.jpg",
    amenities: ["Shared bed", "Study table", "Wardrobe", "Common bathroom", "Fan", "WiFi"],
    deposit: 12000,
    rate: 8000,
    description: "A comfortable room shared by two people."
  },
  triple: {
    name: "Triple Sharing",
    img: "/triple.avif",
    amenities: ["Shared bed", "Study table", "Wardrobe", "Common bathroom", "Fan", "WiFi"],
    deposit: 12000,
    rate: 6000,
    description: "A budget-friendly room shared by three people."
  }
};

function handleRoomClick(type) {
  setSelectedRoom(type);
  setRoomStep(2);
}

function handleBackToRooms() {
  setRoomStep(1);
  setSelectedRoom(null);
  setFormData(prev => ({ ...prev, roomType: "" }));
}

function handleMonthSelect(e) {
  handleChange(e);
  const months = parseInt(e.target.value) / 30;
  setCost(roomDetails[selectedRoom].rate * months);
}

  return (
    <div className="top-bar">
      {isOwnerLoggedIn ? (
        <OwnerDashboard updatePaymentStatus={updatePaymentStatus} />
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
                  <div className="navbar-logo" onClick={() => {
                    setShowLanding(true);
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }}>
                    
                  </div>
                  <NavBar onNavigate={handleNavigation} />
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
                    <input name="name" placeholder="Full Name" onChange={handleChange} className="input-style"  />
                    <input name="email" placeholder="Email" onChange={handleChange} className="input-style"  />
                    <input name="password" placeholder="Password" type="password" onChange={handleChange} />
                    <input name="aadhar" placeholder="Aadhar Number" onChange={handleChange} className="input-style"  />
                    <input name="mobile" placeholder="Mobile" onChange={handleChange} className="input-style" />
                    <input name="address" placeholder="Address" onChange={handleChange} className="input-style" />
                    <button onClick={handleRegister}>Register</button>
                    <p>Already registered? <button className="text-button" onClick={() => setCurrentPage('login')}>Login</button></p>
                  </div>
                </div>
              )}

              {currentPage === 'login' && (
                <>
                  <div className="auth-wrapper">
                    <div className="auth-box slide-in">
                      <h2>Login</h2>
                      <input
  name="email"
  placeholder="Email"
  className="input-style"
  onChange={handleChange}
/>
<input
  name="password"
  placeholder="Password"
  type="password"
  className="input-style"
  onChange={handleChange}
/>
                      <button onClick={handleLogin}>Login</button>
                      <p>Don't have an account? <button className="text-button" onClick={() => setCurrentPage('register')}>Register</button></p>
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
        {roomStep === 1 && (
  <>
    <h2>Select Room Type</h2>
    <div className="room-options-vertical">
      {Object.keys(roomDetails).map(type => (
        <div
          key={type}
          className={`room-card-horizontal ${formData.roomType === type ? 'selected' : ''}`}
          onClick={() => handleRoomClick(type)}
        >
          <img src={roomDetails[type].img} alt={type} className="room-img-horizontal" />
          <div className="room-info">
            <h3>{roomDetails[type].name}</h3>
            <div className="room-meta">
              <div>
                <span className="room-price-label">Rent: </span>
                <span className="room-price">₹{roomDetails[type].rate}</span>
              </div>
              <div>
                <span className="room-deposit-label">Deposit: </span>
                <span className="room-deposit">₹{roomDetails[type].deposit}</span>
              </div>
            </div>
            <p>{roomDetails[type].description}</p>
          </div>
        </div>
      ))}
    </div>
    <button
  className="back-btn"
  onClick={() => setCurrentPage('dashboard')}
  style={{ marginTop: '24px' }}
>
  ← Back
</button>
  </>
)}
{roomStep === 2 && selectedRoom && (
  <div className="room-details-card">
    <h2>{roomDetails[selectedRoom].name}</h2>
  <img id='yo' src={roomDetails[selectedRoom].img} alt={selectedRoom} className="room-detail-img" />
  <div className="room-details-content">
    
    <p className="room-desc">{roomDetails[selectedRoom].description}</p>
    <div className="room-amenities">
      <h4>Amenities:</h4>
      <ul>
        {roomDetails[selectedRoom].amenities.map(am => (
          <li key={am}>✅ {am}</li>
        ))}
      </ul>
    </div>
    <div className="room-highlight">
      <span className="deposit">💰 Deposit/Advance: <b>₹{roomDetails[selectedRoom].deposit}</b></span>
      <span className="price">🏷️ Price/Month: <b>₹{roomDetails[selectedRoom].rate}</b></span>
    </div>
    <label className="duration-label">Select Duration (in days):</label>
    <select name="days" onChange={handleMonthSelect} value={formData.days} className="duration-select">
      <option value="">Select Days</option>
      <option value="30">30 (1 Month)</option>
      <option value="60">60 (2 Months)</option>
      <option value="90">90 (3 Months)</option>
    </select>
    {formData.days && (
      <p className="mb-4 total-cost">
        <strong>Estimated Cost:</strong> <span>₹{cost}</span> + <strong>Deposit:</strong> <span>₹{roomDetails[selectedRoom].deposit}</span>
      </p>
    )}
    <button
      onClick={() => {
        setFormData(prev => ({ ...prev, roomType: selectedRoom }));
        setCurrentPage('payment');
      }}
      disabled={!formData.days}
      className="proceed-btn"
    >
      Proceed to Payment
    </button>
    <button className="back-btn" onClick={handleBackToRooms}>← Back</button>
  </div>
</div>
)}
      </div>
    )}

              {currentPage === 'payment' && (
                <ManualPayment
                  formData={formData}
                  cost={cost}
                  userId={uid}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setCurrentPage('room')}
                  isLoggedIn={isLoggedIn}
                  uid={uid}
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
                  <button onClick={() => setCurrentPage('dashboard')} className="mt-4">Go to Dashboard</button>
                </div>
              )}

              {isLoggedIn && currentPage === 'dashboard' && (
                <div className="user-dashboard">
                  <h2>Welcome, {formData.name}!</h2>
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
    <li key={payment._id} className="payment-row">
      <div className="payment-info">
        <strong>{idx === 0 ? 'Latest: ' : ''}</strong>
        Paid ₹{payment.amount} for {payment.days} days ({payment.roomType}) on {new Date(payment.createdAt).toLocaleDateString()}
      </div>
      <div className="payment-status-actions">
        <span className={payment.status === 'verified' ? 'verified-status' : 'pending-status'}>
          {payment.status || (payment.accepted ? 'verified' : 'pending')}
        </span>
        {payment.status === 'verified' && (
          <button
            className="download-btn"
            onClick={() => handleDownloadInvoice(payment)}
          >
            Download Invoice
          </button>
        )}
      </div>
    </li>
  ))}
</ul>
                      <div className="button-group">
                        <button onClick={() => setCurrentPage('room')}>Pay for Next Month</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>You have not paid for any month yet.</p>
                      <div className="button-group">
                        <button onClick={() => setCurrentPage('room')}>Pay Now</button>
                      </div>
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