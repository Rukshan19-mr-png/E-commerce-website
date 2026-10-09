import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Header = () => {
  const { auth, logout, isStaff } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <div className="container nav-header">
        <Link to="/" className="logo">Plantopia 🌿</Link>
        <nav>
          <ul className="nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/shop">Shop Plants</NavLink></li>
            <li><NavLink to="/care">Care Guides</NavLink></li>
            {auth ? (
              <>
                <li>
                  <NavLink to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Cart {cartCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{cartCount}</span>}
                  </NavLink>
                </li>
                {isStaff ? (
                  <>
                    <li><NavLink to="/delivery">Delivery</NavLink></li>
                    <li><NavLink to="/manager-dashboard" className="btn-secondary" style={{ padding: '6px 16px' }}>Staff Panel</NavLink></li>
                  </>
                ) : (
                  <li><NavLink to="/orders">My Orders</NavLink></li>
                )}
                <li><button className="btn-secondary" onClick={handleLogout} style={{ padding: '6px 16px' }}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/signup" className="btn-primary" style={{ padding: '8px 20px', color: '#fff' }}>Join Us</Link></li>
              </>
            )}
            <li>
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun size={18} strokeWidth={2.2} />
                ) : (
                  <Moon size={18} strokeWidth={2.2} />
                )}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
