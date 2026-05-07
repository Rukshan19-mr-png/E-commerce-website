import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/constants';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check if user just signed up (redirected from Signup page)
  const justSignedUp = location.state?.signupSuccess;
  const prefilledEmail = location.state?.email || '';

  // Pre-fill email if coming from signup
  const [emailValue, setEmailValue] = useState(prefilledEmail || form.email);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: form.password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Check your email and password.');
      }

      // ✅ Save session to localStorage via AuthContext — user stays logged in forever
      login(data);
      navigate('/dashboard');
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
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
          <h2 style={{ marginTop: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to your Plantopia account.</p>
        </div>

        {/* ✅ Success banner shown after signup */}
        {justSignedUp && (
          <div style={{
            background: 'rgba(40, 167, 69, 0.15)',
            border: '1px solid rgba(40, 167, 69, 0.4)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            color: '#fff',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            ✅ <span><strong>Account created successfully!</strong> Please sign in below to continue.</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="error-text" style={{ background: 'rgba(220,53,69,0.1)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(220,53,69,0.3)', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>
            Don&apos;t have an account yet?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Create one — it&apos;s free!
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
