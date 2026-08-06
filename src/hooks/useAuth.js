import { useMutation } from '@tanstack/react-query';
import * as api from '../api/auth';

export const useSignup = () => {
  return useMutation({
    mutationFn: api.signup,
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: api.verifyOtp,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: api.login,
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: api.resendOtp,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: api.forgotPassword,
  });
};

export const useVerifyForgotPasswordOtp = () => {
  return useMutation({
    mutationFn: api.verifyForgotPasswordOtp,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: api.resetPassword,
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: api.updateProfile,
  });
};
