import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const demoEmail = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' ? import.meta.env.VITE_DEMO_EMAIL || '' : '';
const demoPassword = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' ? import.meta.env.VITE_DEMO_PASSWORD || '' : '';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Auction House</div>
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Sign in to manage your auction platform</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <button className="quick-login-btn" onClick={handleQuickLogin} disabled={loading || !demoEmail || !demoPassword}>
          Quick Login (Demo Account)
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
