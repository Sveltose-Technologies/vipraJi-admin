import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UpdateProfile from './pages/UpdateProfile';
import Dashboard from './pages/Dashboard';
import ManageStotram from './pages/ManageStotram';
import ManageAarti from './pages/ManageAarti';
import ManagePooja from './pages/ManagePooja';
import ManagePoojaCategory from './pages/ManagePoojaCategory';
import ManageStotramCategory from './pages/ManageStotramCategory';
import ManagePoojaSamagri from './pages/ManagePoojaSamagri';
import ManageAartiCategory from './pages/ManageAartiCategory';
import AdminLayout from './components/AdminLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes wrapped in Layout */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/manage-pooja" element={<ManagePooja />} />
            <Route path="/manage-pooja-categories" element={<ManagePoojaCategory />} />
            <Route path="/manage-pooja-samagri" element={<ManagePoojaSamagri />} />
            <Route path="/manage-stotram" element={<ManageStotram />} />
            <Route path="/manage-stotram-categories" element={<ManageStotramCategory />} />
            <Route path="/manage-aarti" element={<ManageAarti />} />
            <Route path="/manage-aarti-categories" element={<ManageAartiCategory />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
            <Route path="/settings" element={<div style={{padding: '2rem'}}><h1>Settings</h1><p>Settings content here</p></div>} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
