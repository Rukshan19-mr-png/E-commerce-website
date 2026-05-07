import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Please sign in</h2>
        <p>Access is limited to signed-in users.</p>
        <Link to="/login" className="btn-primary" style={{ marginTop: '1rem' }}>Go to Sign In</Link>
      </div>
    );
  }

  const roleContent = {
    user: {
      title: 'Welcome back, customer',
      description: 'Browse products, manage your cart, and enjoy a secure shopping experience.',
    },
    seller: {
      title: 'Seller Dashboard',
      description: 'Review store activity, monitor orders, and manage your Sri Lankan plant inventory.',
    },
    manager: {
      title: 'Administrator Panel',
      description: 'Review overall store activity, monitor all orders, and keep the shop running smoothly.',
    },
    delivery: {
      title: 'Delivery Staff Dashboard',
      description: 'Manage plant stock and view orders for home delivery.',
    },
  };

  const current = roleContent[auth.role] || roleContent.user;

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        <h2>{current.title}</h2>
        <p>{current.description}</p>
        <div style={{ marginTop: '1.5rem' }}>
          <p><strong>Name:</strong> {auth.name}</p>
          <p><strong>Email:</strong> {auth.email}</p>
          <p><strong>Account Type:</strong> {auth.role === 'user' ? 'Customer' : auth.role.charAt(0).toUpperCase() + auth.role.slice(1)}</p>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link to="/shop" className="btn-primary">Go to Shop</Link>
          {['seller', 'manager', 'delivery'].includes(auth.role) && (
            <Link to="/manager-dashboard" className="btn-secondary">Staff Dashboard</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
