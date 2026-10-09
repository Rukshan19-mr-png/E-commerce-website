import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { DELIVERY_FEE, CURRENCY } from '../utils/constants';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Your Cart</h2>
      
      {cart.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Your cart is empty. Add plants from the shop to get started.</p>
          <Link to="/shop" className="btn-primary">Go to Shop</Link>
        </div>
      ) : (
        <div className="checkout-card glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {cart.map((item) => (
              <div key={item.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem', padding: '1.5rem', borderRadius: '18px', alignItems: 'center' }}>
                <img src={item.image} alt={item.name} style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '14px' }} />
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{item.name}</h3>
                  <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>{CURRENCY} {item.price.toLocaleString()}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button className="btn-secondary" onClick={() => updateQuantity(item.id || item._id, -1)} disabled={item.quantity <= 1} style={{ padding: '4px 12px' }}>-</button>
                      <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn-secondary" onClick={() => updateQuantity(item.id || item._id, 1)} style={{ padding: '4px 12px' }}>+</button>
                    </div>
                    <button className="btn-danger" onClick={() => removeFromCart(item.id || item._id)} style={{ fontSize: '0.85rem' }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-summary" style={{ background: 'var(--secondary)', padding: '2rem', borderRadius: '20px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{CURRENCY} {cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span style={{ fontWeight: 600 }}>{CURRENCY} {DELIVERY_FEE.toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
              * Waived for Store Pickup — set at Checkout
            </p>
            <div className="summary-row total">
              <span>Total</span>
              <span>{CURRENCY} {(cartTotal + DELIVERY_FEE).toLocaleString()}</span>
            </div>
            <button className="btn-primary" onClick={() => navigate('/checkout')} style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}>
              Proceed to Checkout
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
              Shipping and taxes calculated at checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
