import { useLocation, Link, Navigate } from 'react-router-dom';
import { CURRENCY } from '../utils/constants';

const Success = () => {
  const location = useLocation();
  const state = location.state;

  if (!state) return <Navigate to="/" replace />;

  const { fullName, email, total, paymentMethod } = state;

  return (
    <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '4rem', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌿</div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Order Confirmed!</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '2rem' }}>
          Thank you{fullName ? `, ${fullName}` : ''}! Your order has been placed successfully.
        </p>
        
        <div style={{ background: 'var(--secondary)', padding: '2rem', borderRadius: '20px', textAlign: 'left', marginBottom: '2.5rem' }}>
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(45, 106, 79, 0.1)', paddingBottom: '0.5rem' }}>Order Details</h4>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <p><strong>Confirmation sent to:</strong> {email}</p>
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
            {state.isPaid && <p><strong>Payment Status:</strong> <span style={{ color: '#27ae60', fontWeight: 600 }}>Paid ✅</span></p>}
            <p><strong>Grand Total:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{CURRENCY} {total?.toLocaleString()}</span></p>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Our team will contact you shortly to confirm the delivery schedule.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          <Link to="/orders" className="btn-secondary">View Order History</Link>
        </div>
      </div>
    </div>
  );
};

export default Success;
