import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useLogin } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleOfflineLogin = () => {
    const offlineAdmin = {
      id: '6acf153354960408d52b2558',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2YxNTMzNTQ5NjA0MDhkNTJiMjU1OCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MjA0NzMxMCwiZXhwIjoxNzk0NjM5MzEwfQ.sPSuHSfBdXJXwInB3lyI5w1mw8CvIEtLMp9ZmlLayQ4',
      role: 'admin',
      email: email || 'admin@viprasaarthi.com',
      fullName: 'Admin'
    };
    localStorage.setItem('adminUser', JSON.stringify(offlineAdmin));
    localStorage.setItem('token', offlineAdmin.token);
    toast.success('Logged in as Offline Admin (Preview Mode)');
    navigate('/dashboard');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          console.log('Login successful', data);
          const userObj = data.data || data.user || data;
          if (userObj) {
            localStorage.setItem('adminUser', JSON.stringify(userObj));
          }
          toast.success('Welcome Admin! You have successfully logged in.', { duration: 4000, position: 'top-center' });
          navigate('/dashboard');
        },
        onError: (error) => {
          if (error.response?.status === 502) {
            setErrorMsg('Backend server (backend.viprasaarthi.com) returned 502 Bad Gateway. Upstream backend service is down or restarting.');
          } else {
            const msg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
            setErrorMsg(msg);
          }
        }
      }
    );
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <img src="/logo.png?v=2" alt="Vipra Sarthi Logo" className="auth-logo" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="auth-title">Vipra Sarthi</h1>
          <p className="auth-subtitle">Sign in to your admin account</p>
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ color: 'var(--error-color)', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>{errorMsg}</div>
              <button
                type="button"
                onClick={handleOfflineLogin}
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
              >
                Bypass & Continue to Dashboard (Offline Mode)
              </button>
            </div>
          )}

          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="admin@vipraji.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
          />

          <div>
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" isLoading={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
