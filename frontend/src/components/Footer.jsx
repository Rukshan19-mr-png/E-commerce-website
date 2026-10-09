import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <Link to="/" className="logo" style={{ marginBottom: '1rem', display: 'block' }}>Plantopia 🌿</Link>
            <p style={{ maxWidth: '400px', color: 'var(--text-muted)' }}>
              Premium Sri Lankan flora delivered to your doorstep. Join our community of plant lovers and grow your green thumb with us.
            </p>
          </div>
          <div className="footer-links">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Quick Links</h4>
              <Link to="/shop">Shop Collection</Link>
              <Link to="/care">Care Guides</Link>
              <Link to="/signup">Create Account</Link>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Support</h4>
              <p>Kadawatha Branch (Main)</p>
              <p style={{ fontSize: '0.9rem' }}>📞 Hotline: +94 77 887 0865</p>
              <p style={{ fontSize: '0.9rem' }}>📧 Email: info@plantopia.lk</p>
              <a href="https://facebook.com/plantopia" target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                🌐 Visit our Facebook
              </a>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(45, 106, 79, 0.08)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <p>Plantopia © {new Date().getFullYear()} — Cultivating elegance in every corner.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
