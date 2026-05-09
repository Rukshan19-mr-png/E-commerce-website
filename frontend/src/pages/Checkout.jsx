import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE, DELIVERY_FEE, LKR_TO_USD_RATE, CURRENCY } from '../utils/constants';
import { PayPalButtons } from '@paypal/react-paypal-js';

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
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) nextErrors.phone = 'Valid 10-digit phone number is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

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
        paymentMethod: form.paymentMethod,
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

      clearCart();
      navigate('/success', {
        state: {
          fullName: form.fullName,
          email: form.email,
          total: grandTotal,
          paymentMethod: form.paymentMethod,
        },
      });
    } catch {
      setErrors({ submit: 'Failed to place order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalSuccess = async (details, data) => {
    setSubmitting(true);
    try {
      const orderData = {
        userEmail: form.email,
        userName: form.fullName,
        items: cart,
        total: cartTotal, 
        subtotal: cartTotal,
        tax: 0,
        address: form.orderType === 'Store Pickup' 
          ? `Store Pickup at ${form.branch} Branch`
          : `${form.address1}${form.address2 ? ', ' + form.address2 : ''}, ${form.city}, ${form.state} ${form.postalCode}, ${form.country}`,
        phone: form.phone,
        paymentMethod: 'PayPal',
        orderType: form.orderType,
      };

      // 1. Create the order
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error('Failed to create order');
      const { order } = await res.json();

      // 2. Mark as paid
      await fetch(`${API_BASE}/api/orders/${order.id}/pay`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(details),
      });

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
      setErrors({ submit: 'Payment successful but order creation failed. Please contact support.' });
    } finally {
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
            
            {form.paymentMethod === 'Online Payment' ? (
              <div style={{ marginTop: '1rem' }}>
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
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, fontStyle: 'italic' }}>
                    * Processed as approx. ${(grandTotal * LKR_TO_USD_RATE).toFixed(2)} USD via PayPal
                  </p>
                </div>

                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '0.8rem', 
                  background: '#f1f2f6', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem', 
                  borderLeft: '4px solid var(--primary)' 
                }}>
                  💳 <strong>Secure Card Processing:</strong> The <strong>{CURRENCY} {DELIVERY_FEE}</strong> delivery fee and order total will be deducted from your account once you confirm your card details below.
                </div>

                <PayPalButtons 
                  style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'checkout' }}
                  createOrder={(data, actions) => {
                    if (!validate()) return Promise.reject(new Error('Validation failed'));
                    return actions.order.create({
                      purchase_units: [{
                        amount: {
                          currency_code: 'USD',
                          value: (grandTotal * LKR_TO_USD_RATE).toFixed(2), 
                        },
                        description: `Plantopia Order - ${form.fullName}`,
                        shipping: {
                          name: {
                            full_name: form.fullName
                          },
                          address: {
                            address_line_1: form.address1 || 'Branch Pickup',
                            address_line_2: form.address2 || '',
                            admin_area_2: form.city || 'Colombo',
                            admin_area_1: form.state || '',
                            postal_code: form.postalCode || '00000',
                            country_code: 'LK'
                          }
                        }
                      }],
                      application_context: {
                        shipping_preference: 'SET_PROVIDED_ADDRESS',
                        brand_name: 'Plantopia Sri Lanka',
                      }
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                      handlePayPalSuccess(details, data);
                    });
                  }}
                  onError={(err) => {
                    setErrors({ submit: 'PayPal Checkout failed. Please try again.' });
                  }}
                />
              </div>
            ) : (
              <button type="submit" className="btn-primary checkout-submit" disabled={submitting} style={{ width: '100%', padding: '1rem' }}>
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            )}
          </aside>
        </form>
      )}
    </div>
  );
};

export default Checkout;
