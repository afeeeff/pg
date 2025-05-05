import React from 'react';
import './NavBar.css';

const NavBar = ({ onNavigate }) => {
  // This function handles navigation clicks
  const handleNavClick = (page, event) => {
    event.preventDefault(); // Prevent default anchor behavior
    onNavigate(page); // Call the parent component's navigation handler
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={(e) => handleNavClick('home', e)}>
          <img src="/logo10.jpg" alt="QuickStay Logo" className="navbar-logo-img" />
        </div>
        <ul className="navbar-links">
          <li><a href="#amenities" onClick={(e) => handleNavClick('amenities', e)}>Amenities</a></li>
          <li><a href="#about" onClick={(e) => handleNavClick('about', e)}>About</a></li>
          <li><a href="#login" onClick={(e) => handleNavClick('login', e)}>Login</a></li>
          <li><a href="#register" onClick={(e) => handleNavClick('register', e)}>Register</a></li>
          <li><a href="#contact" onClick={(e) => handleNavClick('contact', e)}>Contact Us</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;