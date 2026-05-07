import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <PayPalScriptProvider options={{ "client-id": "test" }}>
          <App />
        </PayPalScriptProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
