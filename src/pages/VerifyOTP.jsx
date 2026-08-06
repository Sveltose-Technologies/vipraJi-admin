import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useVerifyOtp, useResendOtp } from '../hooks/useAuth';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get email passed from Signup page
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');

  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP.');
      return;
    }

    if (!email) {
      toast.error('Email is missing. Please sign up again.');
      return;
    }

    verifyOtpMutation.mutate(
      { email, otp },
      {
        onSuccess: (data) => {
          toast.success('Email verified successfully!');
          setTimeout(() => navigate('/login'), 2000);
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'OTP verification failed.';
          toast.error(msg);
        }
      }
    );
  };

  const handleResend = () => {
    if (!email) {
      toast.error('Email is missing.');
      return;
    }
    resendOtpMutation.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success('OTP has been resent to your email.');
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'Failed to resend OTP.';
          toast.error(msg);
        }
      }
    );
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Verify OTP</h1>
          <p className="auth-subtitle">Enter the OTP sent to {email || 'your email'}</p>
        </div>
        
        <form className="form-container" onSubmit={handleSubmit}>
          
          <Input 
            label="One Time Password (OTP)" 
            id="otp" 
            type="text" 
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={verifyOtpMutation.isPending}
          />
          
          <Button type="submit" isLoading={verifyOtpMutation.isPending}>
            Verify
          </Button>

          <Button type="button" onClick={handleResend} isLoading={resendOtpMutation.isPending} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            Resend OTP
          </Button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
