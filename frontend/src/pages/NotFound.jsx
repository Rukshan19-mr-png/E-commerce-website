import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem', borderRadius: '24px' }}>
        <h1 style={{ fontSize: '5rem', margin: 0 }}>404</h1>
        <p style={{ fontSize: '1.25rem', margin: '1rem 0 2rem', color: 'var(--text-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          You can return to the homepage or explore our shop for the latest plants and offers.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-primary" style={{ padding: '0.9rem 2rem' }}>
            Go Home
          </Link>
          <Link to="/shop" className="btn-secondary" style={{ padding: '0.9rem 2rem' }}>
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
