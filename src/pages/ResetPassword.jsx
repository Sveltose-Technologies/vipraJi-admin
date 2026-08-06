import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useVerifyForgotPasswordOtp, useResetPassword } from '../hooks/useAuth';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1: Verify OTP, 2: Set New Password

  const verifyOtpMutation = useVerifyForgotPasswordOtp();
  const resetPasswordMutation = useResetPassword();

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter OTP.');
    if (!email) return toast.error('Email is missing.');

    verifyOtpMutation.mutate(
      { email, otp },
      {
        onSuccess: () => {
          toast.success('OTP verified! Please set your new password.');
          setStep(2);
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || error.message || 'OTP verification failed.');
        }
      }
    );
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) return toast.error('Please fill in all fields.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');

    resetPasswordMutation.mutate(
      { email, newPassword, confirmPassword },
      {
        onSuccess: () => {
          toast.success('Password reset successful! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || error.message || 'Password reset failed.');
        }
      }
    );
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">
            {step === 1 ? `Verify the OTP sent to ${email}` : 'Enter your new password below'}
          </p>
        </div>
        
        {step === 1 ? (
          <form className="form-container" onSubmit={handleVerifyOtp}>
            <Input 
              label="OTP" 
              id="otp" 
              type="text" 
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={verifyOtpMutation.isPending}
            />
            
            <Button type="submit" isLoading={verifyOtpMutation.isPending}>
              Verify OTP
            </Button>
          </form>
        ) : (
          <form className="form-container" onSubmit={handleResetPassword}>
            <Input 
              label="New Password" 
              id="newPassword" 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending}
            />
            <Input 
              label="Confirm New Password" 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending}
            />
            
            <Button type="submit" isLoading={resetPasswordMutation.isPending}>
              Reset Password
            </Button>
          </form>
        )}
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
