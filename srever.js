// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Proxy middleware for API requests
app.use('/api', async (req, res) => {
  try {
    const backendUrl = process.env.REACT_APP_API_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ 
        error: 'Backend API URL is not configured' 
      });
    }

    // Construct full backend URL
    const targetUrl = `${backendUrl}${req.url}`;

    // Forward the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(backendUrl).hostname
      }
    });

    // Send backend response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Backend request failed' });
  }
});

// Serve React's index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
  console.log(`Proxying API requests to: ${process.env.REACT_APP_API_URL}`);
});