import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import './index.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeLoaderTest from './components/StripeLoaderTest'; 
import HeroSection from './components/HeroSection';
import Payment from './components/Payment';
import NavBar from './components/NavBar';
const API_BASE_URL = 'https://pgbackend.onrender.com' || 'http://localhost:5000' ;


export default function PGAutomation() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', aadhar: '', mobile: '', address: '', roomType: '', days: '' });
  const [uid, setUid] = useState('');
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState('register');
  const [isOwner, setIsOwner] = useState(false);
  const [cost, setCost] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      axios.get(`${API_BASE_URL}/api/owner/dashboard`)
        .then(res => setPayments(res.data))
        .catch(err => console.error(err));
    }
  }, [isOwner]);

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
      setUid(formData.email);
      setIsLoggedIn(true);
      setFormData(prev => ({
        ...prev,
        name: res.data.name || prev.name
      }));
      setCurrentPage('room');
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

    try {
      await axios.post(`${API_BASE_URL}/api/payments`, {
        uid,
        amount: cost,
        paid: true,
      });
      setCurrentPage('payment');
    } catch (err) {
      console.error(err);
      alert("Payment failed.");
    }
  };

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('PG Stay Invoice', 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Field', 'Value']],
      body: [
        ['Name', formData.name],
        ['Email', formData.email],
        ['UID', uid],
        ['Room Type', formData.roomType],
        ['Days', formData.days],
        ['Total Paid', `₹${cost}`],
      ],
    });

    doc.save(`invoice-${uid}.pdf`);
  };

  const handleLoginAsOwner = () => {
    const pass = prompt('Enter Owner Password');
    if (pass === 'pgowner123') {
      setIsOwner(true);
    } else {
      alert('Incorrect Password');
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
  
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment/confirm`,
        {
          paymentId: paymentResult.paymentIntent.id,
          uid: formData.email,
          amount: cost
        }
      );
      
      if (response.data.success) {
        setCurrentPage('invoice');
      }
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      alert('Payment succeeded but confirmation failed. Please contact support.');
    }
  };

  return (
    <div className="top-bar">
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
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Email (UID):</strong> {uid}</p>
                  <button onClick={handleLogout}>Logout</button>
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
              <button onClick={handleRoomSelection}>Proceed</button>
            </div>
          )}
          
          {currentPage === 'payment' && (
            <Elements stripe={stripePromise}>
              <Payment
                formData={formData}
                cost={cost}
                onSuccess={() => setCurrentPage('invoice')}
                onBack={() => setCurrentPage('room')}
              />
            </Elements>
          )}
          
          {currentPage === 'invoice' && (
            <div className="form-box slide-in">
              <h2>Invoice</h2>
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Room Type:</strong> {formData.roomType}</p>
              <p><strong>Days:</strong> {formData.days}</p>
              <p><strong>Cost:</strong> ₹{cost}</p>
              <button onClick={handleDownloadInvoice}>Download Invoice</button>
            </div>
          )}
          
          {isOwner && (
            <div className="form-box slide-in">
              <h2>Owner Dashboard</h2>
              {payments.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((user, idx) => (
                      <tr key={idx}>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email || user.uid}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>₹{user.amount}</td>
                        <td className={user.paid ? 'paid-status' : 'pending-status'}>
                          {user.paid ? 'Paid' : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No records.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}