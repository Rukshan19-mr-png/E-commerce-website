import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/constants';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setMessage(data.message);
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }
      sessionStorage.setItem('plantopiaResetEmail', email);
      // Navigate to reset password page after a brief delay
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 4000); // Increased delay so user has time to click the link
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px', maxWidth: '450px', width: '100%' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Forgot Password?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Enter your email and we'll send you a 6-digit verification code to reset your password.
        </p>

        {message && (
          <div style={{ background: 'rgba(45, 106, 79, 0.1)', color: 'var(--primary-dark)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid var(--primary-light)' }}>
            ✅ {message}
            {previewUrl && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff', borderRadius: '8px' }}>
                <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>👉 Click here to view the email (Test Mode)</a>
              </div>
            )}
            <div style={{ marginTop: '0.5rem' }}>Redirecting...</div>
          </div>
        )}
        {error && <div style={{ background: '#f8d7da', color: '#842029', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
