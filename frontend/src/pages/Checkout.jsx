import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE, DELIVERY_FEE, CURRENCY } from '../utils/constants';

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
    phone: auth?.phoneNumber || '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = cartTotal + (form.orderType === 'Home Delivery' ? DELIVERY_FEE : 0);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
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

  const handlePayHerePayment = async (order, merchantId) => {
    const payhere = window?.payhere;
    if (!payhere) {
      throw new Error('PayHere SDK is not loaded. Refresh the page and try again.');
    }

    const payhereOrderId = order.id || order._id;
    const nameParts = form.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Name';

    const paymentDetails = {
      sandbox: true,
      merchant_id: merchantId || '1211149',
      return_url: `${window.location.origin}/success`,
      cancel_url: `${window.location.origin}/checkout`,
      notify_url: `${API_BASE}/api/payments/payhere-notify`,
      order_id: payhereOrderId,
      items: `Order #${String(payhereOrderId).slice(-8).toUpperCase()}`,
      amount: grandTotal.toFixed(2),
      currency: 'LKR',
      first_name: firstName,
      last_name: lastName,
      email: form.email,
      phone: form.phone,
      address: form.orderType === 'Store Pickup' ? 'Store Pickup' : form.address1,
      city: form.orderType === 'Store Pickup' ? 'Kadawatha' : form.city,
      country: 'Sri Lanka'
    };

    payhere.onCompleted = async function onCompleted(orderId) {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}/pay`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token}`
          },
          body: JSON.stringify({
            id: 'payhere-tr-' + Date.now(),
            status: 'completed',
          })
        });

        if (!res.ok) throw new Error('Failed to update order payment');

        clearCart();
        navigate('/success', {
          state: {
            fullName: form.fullName,
            email: form.email,
            total: grandTotal,
            paymentMethod: 'PayHere Online',
            isPaid: true
          },
        });
      } catch {
        setErrors({ submit: 'Payment successful but status sync failed. Please contact support.' });
        setSubmitting(false);
      }
    };

    payhere.onDismissed = function onDismissed() {
      setErrors({ submit: 'Payment was cancelled or dismissed.' });
      setSubmitting(false);
    };

    payhere.onError = function onError(error) {
      setErrors({ submit: `Payment gateway error: ${error}` });
      setSubmitting(false);
    };

    payhere.startPayment(paymentDetails);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
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
        paymentMethod: form.paymentMethod === 'Online Payment' ? 'PayHere Online' : form.paymentMethod,
        orderType: form.orderType,
      };

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      const order = data.order;

      if (form.paymentMethod !== 'Online Payment') {
        clearCart();
        navigate('/success', {
          state: {
            fullName: form.fullName,
            email: form.email,
            total: grandTotal,
            paymentMethod: form.paymentMethod,
          },
        });
      } else {
        // Online Payment with PayHere
        let merchantId = '1211149';
        try {
          const configRes = await fetch(`${API_BASE}/api/config/payhere`);
          if (configRes.ok) {
            const configData = await configRes.json();
            merchantId = configData.merchantId;
          }
        } catch {
          // ignore config error, use sandbox fallback
        }
        await handlePayHerePayment(order, merchantId);
      }
    } catch {
      setErrors({ submit: 'Failed to place order. Please try again.' });
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
                <input className="form-input" value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
              <div className="form-field">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input className="form-input" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="07XXXXXXXX" />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div className="form-field" style={{ marginTop: '1.5rem' }}>
                <label>Order Type</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="orderType" value="Home Delivery" checked={form.orderType === 'Home Delivery'} onChange={(e) => handleChange('orderType', e.target.value)} />
                    Home Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="orderType" value="Store Pickup" checked={form.orderType === 'Store Pickup'} onChange={(e) => handleChange('orderType', e.target.value)} />
                    Store Pickup
                  </label>
                </div>
              </div>

              {form.orderType === 'Home Delivery' ? (
                <>
                  <div className="form-field" style={{ marginTop: '1.5rem' }}>
                    <label>Address Line 1</label>
                    <input className="form-input" value={form.address1} onChange={(e) => handleChange('address1', e.target.value)} />
                    {errors.address1 && <p className="error-text">{errors.address1}</p>}
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>City</label>
                      <input className="form-input" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                      {errors.city && <p className="error-text">{errors.city}</p>}
                    </div>
                    <div className="form-field">
                      <label>State / Region</label>
                      <input className="form-input" value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label>Pickup Branch</label>
                  <select className="form-input" value={form.branch} onChange={(e) => handleChange('branch', e.target.value)}>
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
                    <input type="radio" name="paymentMethod" value="Cash on Delivery" checked={form.paymentMethod === 'Cash on Delivery'} onChange={(e) => handleChange('paymentMethod', e.target.value)} />
                    {form.orderType === 'Store Pickup' ? 'Pay at Shop' : 'Cash on Delivery'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="Online Payment" checked={form.paymentMethod === 'Online Payment'} onChange={(e) => handleChange('paymentMethod', e.target.value)} />
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
                  {CURRENCY} {grandTotal.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.4' }}>
                  💳 Secure checkout via <strong>PayHere</strong> (supports local Cards, Genie, eZ Cash, mCash & Internet Banking).
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary checkout-submit" disabled={submitting} style={{ width: '100%', padding: '1rem' }}>
              {submitting ? 'Processing...' : (form.paymentMethod === 'Online Payment' ? 'Pay with PayHere' : 'Place Order')}
            </button>
          </aside>
        </form>
      )}
    </div>
  );
};

export default Checkout;
