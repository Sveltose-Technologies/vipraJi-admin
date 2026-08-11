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
          // The API returns the user details inside the 'data' property
          const userObj = data.data || data.user || data;
          if (userObj) {
            localStorage.setItem('adminUser', JSON.stringify(userObj));
          }
          toast.custom((t) => (
            <div className={`custom-welcome-card ${t.visible ? 'animate-modal-enter' : 'animate-modal-leave'}`}>
              <div className="toast-icon-container">
                <img src="/logo.png" alt="Logo" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </div>
              <div className="toast-content-premium">
                <h4 className="toast-title">Welcome Admin!</h4>
                <p className="toast-subtitle">You have successfully logged in.</p>
                <div className="toast-message-premium">
                  <span className="swastik-premium">卐</span>
                  <span>आपका डिजिटल साथी</span>
                  <span className="swastik-premium">卐</span>
                </div>
              </div>
            </div>
          ), { duration: 4000, position: 'top-center' });
          navigate('/dashboard');
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
          setErrorMsg(msg);
        }
      }
    );
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <img src="/logo.png" alt="Vipra Sarthi Logo" style={{ height: '200px', objectFit: 'contain', marginBottom: '1rem' }} onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="auth-title">Vipra Sarthi</h1>
          <p className="auth-subtitle">Sign in to your admin account</p>
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
              {errorMsg}
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
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
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
