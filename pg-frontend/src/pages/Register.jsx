//Register.jsx
import React, { useState } from 'react';
import API from '../api';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadhar: '',
    address: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/register', form);
      alert('User registered successfully');
      console.log(response.data);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />
      <input name="aadhar" placeholder="Aadhar" onChange={handleChange} />
      <input name="address" placeholder="Address" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
