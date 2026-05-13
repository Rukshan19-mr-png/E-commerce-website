import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/constants';

const Signup = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phoneNumber: '', 
    password: '', 
    confirmPassword: '', 
    role: 'user' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Phone number validation (Sri Lanka format)
    const phoneRegex = /^(?:\+94|0)7[0-9]{8}$/;
    if (!phoneRegex.test(form.phoneNumber)) {
      setError('Please enter a valid Sri Lankan phone number (e.g. 0771234567).');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed. Please try again.');
      }

      // ✅ Redirect to login page with a success notice
      navigate('/login', {
        state: { signupSuccess: true, email: form.email },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page">
      <div className="auth-card glass-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🌱</span>
          <h2 style={{ marginTop: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Join Plantopia and start your green journey.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Full Name</label>
            <input
              className="form-input"
              placeholder="e.g. Kasun Perera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Phone Number</label>
            <input
              className="form-input"
              type="tel"
              placeholder="e.g. 0771234567"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Confirm Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Account Type</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer', color: '#fff' }}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={form.role === 'user'}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
                🛒 Customer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer', color: '#fff' }}>
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={form.role === 'seller'}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
                🏪 Seller
              </label>
            </div>
          </div>

          {error && (
            <div className="error-text" style={{ background: 'rgba(220,53,69,0.1)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(220,53,69,0.3)', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? '⏳ Creating Account...' : '✅ Create Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
