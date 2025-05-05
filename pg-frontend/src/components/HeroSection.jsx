import React from 'react';
import './HeroSection.css';

const HeroSection = ({ handleRegisterClick }) => {
  return (
    <section className="hero-container">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">Find Your Perfect PG Stay- Only at</h1>
        <h1 className="hero-title">Quick Stay</h1>
        <p className="hero-description">
          Book, Pay, Track Bills & Manage Everything in One Place.
        </p>
        <div className="hero-buttons">
          <button 
            onClick={handleRegisterClick} 
            className="btn btn-primary"
          >
            Book your stay
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;