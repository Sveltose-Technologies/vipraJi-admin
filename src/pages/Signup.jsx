import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useSignup } from '../hooks/useAuth';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // Forced admin role
  });
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const signupMutation = useSignup();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic validation
    if (!formData.fullName || !formData.mobileNumber || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    signupMutation.mutate(
      formData,
      {
        onSuccess: (data) => {
          console.log('Signup successful', data);
          toast.success('Signup successful! Please verify your email.');
          // Redirect to Verify OTP screen, passing email in state
          navigate('/verify-otp', { state: { email: formData.email } });
        },
        onError: (error) => {
          // Attempt to read error message from response
          const msg = error.response?.data?.message || error.message || 'Signup failed. Please try again.';
          setErrorMsg(msg);
        }
      }
    );
  };

  return (
    <div className="auth-layout" style={{ padding: '2rem 1rem', overflowY: 'auto' }}>
      <div className="auth-card glass-panel animate-fade-in" style={{ maxWidth: '600px', marginTop: '2rem', marginBottom: '2rem' }}>
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <img src="/logo.png?v=2" alt="Vipra Sarthi Logo" className="auth-logo" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Vipra Sarthi admin team</p>
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ color: 'var(--error-color)', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Full Name *"
              id="fullName"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
            <Input
              label="Display Name"
              id="displayName"
              placeholder="e.g. John"
              value={formData.displayName}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Mobile Number *"
              id="mobileNumber"
              type="tel"
              placeholder="+91 9876543210"
              value={formData.mobileNumber}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
            <Input
              label="Email Address *"
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Password *"
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
            <Input
              label="Confirm Password *"
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={signupMutation.isPending}
            />
          </div>

          <Button type="submit" isLoading={signupMutation.isPending} style={{ marginTop: '1rem' }}>
            {signupMutation.isPending ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
