// src/services/api.ts
import axios from 'axios';

// const apiUrl = process.env.REACT_APP_API_URL;
// console.log('API URL:', apiUrl); // For debugging

const api = axios.create({
  baseURL: "https://plato-backend-fzfaeqguehfaaahq.eastus2-01.azurewebsites.net",
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Don't redirect here to avoid refresh loops
    }
    return Promise.reject(error);
  }
);

export default api;