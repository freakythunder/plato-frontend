import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Auth0Provider
  domain="dev-77xfvtq4jkx78p2i.us.auth0.com"
  clientId="H4YHXQ9vK1TlBBuUAsQbC5Fno7ZE96F1"
  authorizationParams={{
    redirect_uri: "https://plato-education.com"
  }}
>
  <App />
</Auth0Provider>,
);

