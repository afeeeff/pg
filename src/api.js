//api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const registerUser = (userData) => API.post('/users/register', userData);
export const selectRoom = (roomData) => API.post('/users/select-room', roomData);
export const makePayment = (paymentData) => API.post('/payments', paymentData);
export const getPayments = () => API.get('/payments');