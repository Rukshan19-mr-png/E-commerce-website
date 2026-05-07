import { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('plantopiaCookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('plantopiaCookieConsent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-copy">
        <p>
          <strong>We value your experience.</strong> Cookies help us remember your cart and keep your shopping smooth.
        </p>
        <div className="cookie-actions">
          <button type="button" className="btn-primary" onClick={handleAccept}>Accept Cookies</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
