import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_BASE, DELIVERY_FEE, CURRENCY } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const fetchPayPalConfig = async () => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/config/paypal`);
  } catch {
    throw new Error('Cannot reach the payment API. Confirm its Vercel deployment is public and allows requests from this site.');
  }

  if (response.redirected && /vercel\.com\/login|\/sso-api/.test(response.url)) {
    throw new Error('The payment API is protected by Vercel login. Make the backend deployment public to enable PayPal.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('The payment API returned a non-JSON response. Check the backend URL and make its Vercel deployment public.');
  }

  const config = await response.json();
  if (!response.ok) {
    throw new Error(config.message || 'The payment API is temporarily unavailable.');
  }

  const exchangeRate = Number(config.lkrToUsdRate);
  if (!config.enabled || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error(config.message || 'PayPal is not configured on the backend.');
  }

  return { ...config, exchangeRate };
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { auth } = useAuth();
  const [form, setForm] = useState({
    fullName: auth?.name || '',
    email: auth?.email || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Sri Lanka',
    paymentMethod: 'Cash on Delivery',
    orderType: 'Home Delivery',
    branch: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingCapture, setPendingCapture] = useState(null);
  const [paypalExchangeRate, setPaypalExchangeRate] = useState(null);
  const [paypalConfigStatus, setPaypalConfigStatus] = useState('idle');
  const [paypalConfigError, setPaypalConfigError] = useState('');

  const grandTotal = cartTotal + (form.orderType === 'Home Delivery' ? DELIVERY_FEE : 0);

  useEffect(() => {
    if (form.paymentMethod !== 'Online Payment') return undefined;
    let current = true;
    const loadPayPalConfiguration = async () => {
      try {
        const config = await fetchPayPalConfig();
        if (current) {
          setPaypalExchangeRate(config.exchangeRate);
          setPaypalConfigStatus('ready');
        }
      } catch (error) {
        if (current) {
          setPaypalConfigError(error.message);
          setPaypalConfigStatus('error');
        }
      }
    };
    loadPayPalConfiguration();
    return () => {
      current = false;
    };
  }, [form.paymentMethod]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'paymentMethod') {
      setPaypalConfigStatus(value === 'Online Payment' ? 'loading' : 'idle');
      setPaypalConfigError('');
      setPaypalExchangeRate(null);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Valid email is required.';
    if (form.orderType === 'Home Delivery' && !form.address1.trim()) nextErrors.address1 = 'Address line 1 is required.';
    if (form.orderType === 'Home Delivery' && !form.city.trim()) nextErrors.city = 'City is required.';
    if (form.orderType === 'Store Pickup' && !form.branch) nextErrors.branch = 'Please select a branch for pickup.';
    
    // Sri Lankan phone number validation regex
    const phoneRegex = /^(?:\+94|0)7[0-9]{8}$/;
    if (!form.phone.trim() || !phoneRegex.test(form.phone.trim())) {
      nextErrors.phone = 'Valid Sri Lankan phone number is required (e.g. 0771234567).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && window.paypal) return resolve();
    if (existing) existing.remove();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load script: ' + src));
    document.head.appendChild(s);
  });

  const capturePayPalOrder = async (paypalOrderId, backendOrderId) => {
    const capRes = await fetch(`${API_BASE}/api/payments/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth?.token}`,
      },
      body: JSON.stringify({ paypalOrderId, orderId: backendOrderId }),
    });
    const capData = await capRes.json();
    if (!capRes.ok) throw new Error(capData.message || 'Failed to capture PayPal order');
    return capData;
  };

  const handlePayPalPayment = async () => {
    try {
      const config = await fetchPayPalConfig();
      setPaypalExchangeRate(config.exchangeRate);
      setPaypalConfigStatus('ready');
      setPaypalConfigError('');
      const clientId = config.clientId || '';
      if (!clientId) {
        throw new Error('PayPal is not configured on the backend.');
      }
      const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`;
      await loadScript(sdkUrl);
    } catch (error) {
      setPaypalConfigError(error.message);
      setPaypalConfigStatus('error');
      setErrors({ submit: error.message });
      setSubmitting(false);
      return;
    }

    // The server calculates the amount, verifies current prices and stock, and
    // creates the pending order before requesting the PayPal checkout token.
    let paypalOrderId = null;
    let backendOrderId = null;
    try {
      const createRes = await fetch(`${API_BASE}/api/payments/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify({
          userEmail: form.email,
          userName: form.fullName,
          items: cart,
          total: cartTotal,
          tax: 0,
          address: form.orderType === 'Store Pickup'
            ? `Store Pickup at ${form.branch} Branch`
            : `${form.address1}${form.address2 ? ', ' + form.address2 : ''}, ${form.city}, ${form.state} ${form.postalCode}, ${form.country}`,
          phone: form.phone,
          orderType: form.orderType,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.message || 'Failed to create PayPal order');
      paypalOrderId = createData.id;
      backendOrderId = createData.orderId;
    } catch (err) {
      setErrors({ submit: `Payment setup failed: ${err.message}` });
      setSubmitting(false);
      return;
    }

    const cancelPendingOrder = async () => {
      const cancelRes = await fetch(`${API_BASE}/api/payments/paypal/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify({ paypalOrderId, orderId: backendOrderId }),
      });
      if (!cancelRes.ok) {
        const cancelData = await cancelRes.json().catch(() => ({}));
        throw new Error(cancelData.message || 'Could not release the pending checkout.');
      }
    };

    // Render PayPal Buttons
    try {
      // Ensure container exists and is empty
      const container = document.getElementById('paypal-button-container');
      if (container) container.innerHTML = '';

       
      window.paypal.Buttons({
        createOrder: () => paypalOrderId,
        onApprove: async (data) => {
          try {
            await capturePayPalOrder(data.orderID, backendOrderId);

            clearCart();
            navigate('/success', {
              state: {
                fullName: form.fullName,
                email: form.email,
                total: grandTotal,
                paymentMethod: 'PayPal',
                isPaid: true
              },
            });
          } catch (err) {
            console.error('PayPal capture error:', err);
            setPendingCapture({
              paypalOrderId: data.orderID,
              backendOrderId,
              fullName: form.fullName,
              email: form.email,
              total: grandTotal,
            });
            setErrors({ submit: 'We could not confirm the payment. Retry confirmation below; do not start a new payment.' });
            setSubmitting(false);
            if (container) container.innerHTML = '';
          }
        },
        onCancel: async () => {
          try {
            await cancelPendingOrder();
            setErrors({ submit: 'Payment was cancelled. You can try again.' });
          } catch (err) {
            setErrors({ submit: `${err.message} Any reserved items will be released on the next checkout attempt after 30 minutes.` });
          } finally {
            const container = document.getElementById('paypal-button-container');
            if (container) container.innerHTML = '';
            setSubmitting(false);
          }
        },
        onError: async (err) => {
          console.error('PayPal error:', err);
          try {
            await cancelPendingOrder();
            setErrors({ submit: 'Payment gateway error. Please try again.' });
          } catch (cancelError) {
            setErrors({ submit: `${cancelError.message} If PayPal shows a completed payment, contact support before retrying.` });
          } finally {
            setSubmitting(false);
          }
          if (container) container.innerHTML = '';
        }
      }).render('#paypal-button-container');
    } catch (err) {
      console.error('Failed to render PayPal Buttons:', err);
      try {
        await cancelPendingOrder();
        setErrors({ submit: 'Failed to render the PayPal payment widget. Please try again.' });
      } catch (cancelError) {
        setErrors({ submit: `${cancelError.message} Reserved items will be released after 30 minutes.` });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      if (pendingCapture) {
        await capturePayPalOrder(pendingCapture.paypalOrderId, pendingCapture.backendOrderId);
        setPendingCapture(null);
        clearCart();
        navigate('/success', {
          state: {
            fullName: pendingCapture.fullName,
            email: pendingCapture.email,
            total: pendingCapture.total,
            paymentMethod: 'PayPal',
            isPaid: true,
          },
        });
        return;
      }

      const orderData = {
        userEmail: form.email,
        userName: form.fullName,
        items: cart,
        total: cartTotal, // Sending subtotal as 'total' because backend adds DELIVERY_FEE
        subtotal: cartTotal,
        tax: 0,
        address: form.orderType === 'Store Pickup' 
          ? `Store Pickup at ${form.branch} Branch`
          : `${form.address1}${form.address2 ? ', ' + form.address2 : ''}, ${form.city}, ${form.state} ${form.postalCode}, ${form.country}`,
        phone: form.phone,
        paymentMethod: form.paymentMethod === 'Online Payment' ? 'PayPal' : form.paymentMethod,
        orderType: form.orderType,
      };

      // Check latest stock for each cart item to avoid placing orders for out-of-stock items
      for (const item of cart) {
        try {
          const prodRes = await fetch(`${API_BASE}/api/products/${item.id}`);
          if (prodRes.ok) {
            const prod = await prodRes.json();
            const available = prod.countInStock !== undefined ? prod.countInStock : prod.count || 0;
            if (available < item.quantity) {
              setErrors({ submit: `Insufficient stock for ${item.name}. Only ${available} left.` });
              setSubmitting(false);
              return;
            }
          }
        } catch {
          // ignore individual product check errors and continue; backend will still validate
        }
      }

      if (form.paymentMethod === 'Online Payment') {
        await handlePayPalPayment();
        return;
      }

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        // Try to extract server error message for a clearer UI message
        let errMsg = 'Failed to place order. Please try again.';
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) errMsg = errBody.message;
          else if (typeof errBody === 'string') errMsg = errBody;
        } catch {
          // ignore parse errors and use fallback message
        }
        setErrors({ submit: errMsg });
        setSubmitting(false);
        return;
      }

      await response.json();
      clearCart();
      navigate('/success', {
        state: {
          fullName: form.fullName,
          email: form.email,
          total: grandTotal,
          paymentMethod: form.paymentMethod,
        },
      });
    } catch (error) {
      setErrors({
        submit: pendingCapture
          ? `Payment confirmation retry failed: ${error.message}`
          : 'Failed to place order. Please try again.',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2>Checkout</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty. Add plants from the shop to continue.</p>
      ) : (
        <form onSubmit={handleSubmit} className="checkout-card glass-card">
          <div className="checkout-main">
            <section className="checkout-section">
              <h3>Delivery & Contact</h3>
              <div className="form-field">
                <label>Full Name</label>
                <input className="form-input" value={form.fullName} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('fullName', e.target.value)} />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
              <div className="form-field">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('email', e.target.value)} />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input className="form-input" type="tel" value={form.phone} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('phone', e.target.value)} placeholder="07XXXXXXXX" />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div className="form-field" style={{ marginTop: '1.5rem' }}>
                <label>Order Type</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="orderType" value="Home Delivery" checked={form.orderType === 'Home Delivery'} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('orderType', e.target.value)} />
                    Home Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="orderType" value="Store Pickup" checked={form.orderType === 'Store Pickup'} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('orderType', e.target.value)} />
                    Store Pickup
                  </label>
                </div>
              </div>

              {form.orderType === 'Home Delivery' ? (
                <>
                  <div className="form-field" style={{ marginTop: '1.5rem' }}>
                    <label>Address Line 1</label>
                    <input className="form-input" value={form.address1} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('address1', e.target.value)} />
                    {errors.address1 && <p className="error-text">{errors.address1}</p>}
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>City</label>
                      <input className="form-input" value={form.city} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('city', e.target.value)} />
                      {errors.city && <p className="error-text">{errors.city}</p>}
                    </div>
                    <div className="form-field">
                      <label>State / Region</label>
                      <input className="form-input" value={form.state} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('state', e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label>Pickup Branch</label>
                  <select className="form-input" value={form.branch} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('branch', e.target.value)}>
                    <option value="">Select a branch</option>
                    <option value="Kadawatha">Kadawatha</option>
                  </select>
                  {errors.branch && <p className="error-text">{errors.branch}</p>}
                </div>
              )}
            </section>

            <section className="checkout-section">
              <h3>Payment Method</h3>
              <div className="form-field">
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="Cash on Delivery" checked={form.paymentMethod === 'Cash on Delivery'} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('paymentMethod', e.target.value)} />
                    {form.orderType === 'Store Pickup' ? 'Pay at Shop' : 'Cash on Delivery'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="Online Payment" checked={form.paymentMethod === 'Online Payment'} disabled={submitting || Boolean(pendingCapture)} onChange={(e) => handleChange('paymentMethod', e.target.value)} />
                    Online Payment
                  </label>
                </div>
              </div>
            </section>
          </div>

          <aside className="checkout-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>{CURRENCY} {cartTotal.toLocaleString()}</span></div>
            {form.orderType === 'Home Delivery' && (
              <div className="summary-row"><span>Delivery Fee</span><span>{CURRENCY} {DELIVERY_FEE.toLocaleString()}</span></div>
            )}
            <div className="summary-row total"><span>Total</span><span>{CURRENCY} {grandTotal.toLocaleString()}</span></div>
            
            {errors.submit && <p className="error-text" style={{ marginBottom: '1rem' }}>{errors.submit}</p>}
            {form.paymentMethod === 'Online Payment' && ['idle', 'loading'].includes(paypalConfigStatus) && (
              <p role="status" style={{ marginBottom: '1rem' }}>Connecting to PayPal...</p>
            )}
            {paypalConfigError && form.paymentMethod === 'Online Payment' && (
              <p role="alert" className="error-text" style={{ marginBottom: '1rem' }}>{paypalConfigError}</p>
            )}
            
            {form.paymentMethod === 'Online Payment' && (
              <div style={{ 
                background: 'rgba(45, 106, 79, 0.05)', 
                padding: '1rem', 
                borderRadius: '12px', 
                marginBottom: '1rem', 
                border: '1px solid rgba(45, 106, 79, 0.1)' 
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total to Pay:</p>
                <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {CURRENCY} {grandTotal.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                    {paypalExchangeRate
                      ? `(approx. $${(grandTotal * paypalExchangeRate).toFixed(2)} USD)`
                      : '(final USD amount confirmed at PayPal checkout)'}
                  </span>
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.4' }}>
                  💳 Secure checkout via <strong>PayPal</strong>.
                </p>
              </div>
            )}

            <div id="paypal-button-container" style={{ marginBottom: '1rem' }} />
            <button
              type="submit"
              className="btn-primary checkout-submit"
              disabled={submitting || (form.paymentMethod === 'Online Payment' && paypalConfigStatus !== 'ready' && !pendingCapture)}
              style={{ width: '100%', padding: '1rem' }}
            >
              {submitting ? 'Processing...' : (pendingCapture ? 'Retry payment confirmation' : (form.paymentMethod === 'Online Payment' ? 'Pay with PayPal' : 'Place Order'))}
            </button>
          </aside>
        </form>
      )}
    </div>
  );
};

export default Checkout;
