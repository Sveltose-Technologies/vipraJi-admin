import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useForgotPassword } from '../hooks/useAuth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  
  const navigate = useNavigate();
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    forgotPasswordMutation.mutate(
      { email, role: 'admin' },
      {
        onSuccess: () => {
          toast.success('OTP sent to your email.');
          navigate('/reset-password', { state: { email } });
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'Request failed. Please try again.';
          toast.error(msg);
        }
      }
    );
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your email to receive an OTP</p>
        </div>
        
        <form className="form-container" onSubmit={handleSubmit}>
          <Input 
            label="Email Address" 
            id="email" 
            type="email" 
            placeholder="admin@vipraji.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={forgotPasswordMutation.isPending}
          />
          
          <Button type="submit" isLoading={forgotPasswordMutation.isPending}>
            Send OTP
          </Button>
        </form>
        
        <div className="auth-footer">
          Remembered your password? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
