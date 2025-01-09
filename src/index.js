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
  clientId="MvYdG9otTbOpowJuPFdo2I58FTmht3x6"
  authorizationParams={{
    redirect_uri: "http://localhost:3000"
  }}
>
  <App />
</Auth0Provider>,
);

