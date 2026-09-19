import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useUpdateProfile } from '../hooks/useAuth';

// Mock ID for demonstration. In a real app, get this from auth context.
const ADMIN_ID = '12345'; 

const UpdateProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    mobileNumber: '',
    email: '',
    experience: '',
    city: '',
    whatsappNumber: '',
    pdfFooterText: '',
    status: 'active'
  });
  
  // File states
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [personalLogo, setPersonalLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [adminId, setAdminId] = useState('12345'); // Default fallback
  
  const updateMutation = useUpdateProfile();

  useEffect(() => {
    const savedUserStr = localStorage.getItem('adminUser');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        // Handle both flat structures and nested { data: {...} } structures
        const actualUser = savedUser.data || savedUser.user || savedUser;
        
        setAdminId(actualUser._id || actualUser.id || '12345');
        
        setFormData(prev => ({
          ...prev,
          fullName: actualUser.fullName || '',
          displayName: actualUser.displayName || '',
          mobileNumber: actualUser.mobileNumber || '',
          email: actualUser.email || '',
          experience: actualUser.experience || '',
          city: actualUser.city || '',
          whatsappNumber: actualUser.whatsappNumber || '',
          pdfFooterText: actualUser.pdfFooterText || '',
          status: actualUser.status || 'active'
        }));
      } catch (err) {
        console.error('Failed to parse admin user from localStorage', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    switch(e.target.id) {
      case 'profilePhoto': setProfilePhoto(file); break;
      case 'personalLogo': setPersonalLogo(file); break;
      case 'signature': setSignature(file); break;
      default: break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    
    // Append text fields
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    // Hardcode role
    submitData.append('role', 'admin');

    // Append file fields
    if (profilePhoto) submitData.append('profilePhoto', profilePhoto);
    if (personalLogo) submitData.append('personalLogo', personalLogo);
    if (signature) submitData.append('signature', signature);

    updateMutation.mutate(
      { id: adminId, formData: submitData },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully!');
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'Update failed.';
          toast.error(msg);
        }
      }
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Update Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your admin details and settings</p>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form className="form-container" onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="Full Name" id="fullName" value={formData.fullName} onChange={handleChange} disabled={updateMutation.isPending} />
            <Input label="Display Name" id="displayName" value={formData.displayName} onChange={handleChange} disabled={updateMutation.isPending} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="Email Address" id="email" type="email" value={formData.email} onChange={handleChange} disabled={updateMutation.isPending} />
            <Input label="Mobile Number" id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} disabled={updateMutation.isPending} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="WhatsApp Number" id="whatsappNumber" type="tel" value={formData.whatsappNumber} onChange={handleChange} disabled={updateMutation.isPending} />
            <Input label="City" id="city" value={formData.city} onChange={handleChange} disabled={updateMutation.isPending} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="Experience (Years)" id="experience" type="number" value={formData.experience} onChange={handleChange} disabled={updateMutation.isPending} />
            <Input label="PDF Footer Text" id="pdfFooterText" value={formData.pdfFooterText} onChange={handleChange} disabled={updateMutation.isPending} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
             <div className="input-group">
                <label className="input-label">Profile Photo</label>
                <input type="file" id="profilePhoto" onChange={handleFileChange} accept="image/*" className="input-field" style={{ padding: '0.5rem' }} />
             </div>
             <div className="input-group">
                <label className="input-label">Personal Logo</label>
                <input type="file" id="personalLogo" onChange={handleFileChange} accept="image/*" className="input-field" style={{ padding: '0.5rem' }} />
             </div>
             <div className="input-group">
                <label className="input-label">Signature</label>
                <input type="file" id="signature" onChange={handleFileChange} accept="image/*" className="input-field" style={{ padding: '0.5rem' }} />
             </div>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" isLoading={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
