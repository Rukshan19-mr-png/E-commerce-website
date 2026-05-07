import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/constants';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setSuccess(true);
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
              Enter your new password below.
            </p>
            {error && <div style={{ background: '#f8d7da', color: '#842029', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
