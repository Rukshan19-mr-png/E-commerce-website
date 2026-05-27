import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const payhereScriptUrl = import.meta.env.VITE_PAYHERE_SCRIPT_URL || 'https://www.payhere.lk/lib/payhere.js';

const loadPayHereScript = () => {
  if (window.payhere) {
    console.log('PayHere already loaded');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = payhereScriptUrl;
    script.async = true;
    script.onload = () => {
      console.log('PayHere script loaded:', payhereScriptUrl);
      resolve();
    };
    script.onerror = (event) => {
      console.error('Failed to load PayHere script:', payhereScriptUrl, event);
      if (payhereScriptUrl !== 'https://www.payhere.lk/lib/payhere.js') {
        console.warn('Falling back to default PayHere script URL');
        const fallbackScript = document.createElement('script');
        fallbackScript.type = 'text/javascript';
        fallbackScript.src = 'https://www.payhere.lk/lib/payhere.js';
        fallbackScript.async = true;
        fallbackScript.onload = () => {
          console.log('Fallback PayHere script loaded successfully');
          resolve();
        };
        fallbackScript.onerror = (fallbackEvent) => {
          console.error('Fallback PayHere script also failed to load', fallbackEvent);
          reject(new Error('Failed to load PayHere script from both configured and fallback URLs'));
        };
        document.head.appendChild(fallbackScript);
      } else {
        reject(new Error(`Failed to load PayHere script: ${payhereScriptUrl}`));
      }
    };
    document.head.appendChild(script);
  });
};

loadPayHereScript().catch((error) => {
  console.error(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
