import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/constants';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedEmail = sessionStorage.getItem('plantopiaResetEmail');
  const [email, setEmail] = useState(location.state?.email || storedEmail || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return setError('Email is missing. Please start from the forgot password page.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (!/^[0-9]{6}$/.test(code)) {
      return setError('Please enter a valid 6-digit code.');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setSuccess(true);
      sessionStorage.removeItem('plantopiaResetEmail');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px', maxWidth: '450px', width: '100%' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Reset Password</h2>
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              Password reset successfully! Redirecting to login...
            </div>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', width: '100%', padding: '1rem' }}>Login Now</Link>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Enter the 6-digit code sent to <strong>{email}</strong> and your new password.
            </p>
            {error && <div style={{ background: '#f8d7da', color: '#842029', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                onClick={() => navigate('/forgot-password')} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Didn't receive code? Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
