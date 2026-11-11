import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdCloudUpload, MdImage } from 'react-icons/md';
import Input from '../components/Input';
import Button from '../components/Button';
import { useUpdateProfile } from '../hooks/useAuth';

const PRESET_SPECIALISATIONS = [
  'Vedic Astrology',
  'Vastu Shastra',
  'Pooja Vidhi',
  'Kundali Reading',
  'Numerology',
  'Palmistry',
  'Katha & Pravachan',
  'Navgrah Shanti'
];

const UpdateProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    mobileNumber: '',
    email: '',
    role: 'admin',
    experience: '',
    city: '',
    whatsappNumber: '',
    pdfFooterText: '',
    status: 'active'
  });

  const [specialisations, setSpecialisations] = useState([]);
  const [customSpec, setCustomSpec] = useState('');

  // File states & previews
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState('');
  
  const [personalLogo, setPersonalLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');
  
  const [signature, setSignature] = useState(null);
  const [previewSig, setPreviewSig] = useState('');

  const [adminId, setAdminId] = useState('6acf153354960408d52b2558'); // Fallback default admin ID

  const updateMutation = useUpdateProfile();

  useEffect(() => {
    const savedUserStr = localStorage.getItem('adminUser');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        const actualUser = savedUser.data || savedUser.user || savedUser;
        const currentId = actualUser.id || actualUser._id || '6acf153354960408d52b2558';
        setAdminId(currentId);

        setFormData({
          fullName: actualUser.fullName || '',
          displayName: actualUser.displayName || '',
          mobileNumber: actualUser.mobileNumber || '',
          email: actualUser.email || '',
          role: actualUser.role || 'admin',
          experience: actualUser.experience !== undefined && actualUser.experience !== null ? actualUser.experience : '',
          city: actualUser.city || '',
          whatsappNumber: actualUser.whatsappNumber || '',
          pdfFooterText: actualUser.pdfFooterText || '',
          status: actualUser.status === 'deactive' || actualUser.status === 'inactive' ? 'deactive' : 'active'
        });

        if (Array.isArray(actualUser.specialisations)) {
          setSpecialisations(actualUser.specialisations);
        } else if (typeof actualUser.specialisations === 'string' && actualUser.specialisations) {
          try {
            const parsed = JSON.parse(actualUser.specialisations);
            setSpecialisations(Array.isArray(parsed) ? parsed : [actualUser.specialisations]);
          } catch {
            setSpecialisations(actualUser.specialisations.split(',').map(s => s.trim()).filter(Boolean));
          }
        }

        if (actualUser.profilePhoto) setPreviewPhoto(actualUser.profilePhoto);
        if (actualUser.personalLogo) setPreviewLogo(actualUser.personalLogo);
        if (actualUser.signature) setPreviewSig(actualUser.signature);
      } catch (err) {
        console.error('Failed to parse admin user from localStorage', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    switch (e.target.id) {
      case 'profilePhoto':
        setProfilePhoto(file);
        setPreviewPhoto(URL.createObjectURL(file));
        break;
      case 'personalLogo':
        setPersonalLogo(file);
        setPreviewLogo(URL.createObjectURL(file));
        break;
      case 'signature':
        setSignature(file);
        setPreviewSig(URL.createObjectURL(file));
        break;
      default:
        break;
    }
  };

  const addSpecialisation = (name) => {
    const toAdd = (name || customSpec).trim();
    if (toAdd && !specialisations.includes(toAdd)) {
      setSpecialisations(prev => [...prev, toAdd]);
      if (!name) setCustomSpec('');
    }
  };

  const removeSpecialisation = (indexToRemove) => {
    setSpecialisations(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = new FormData();

    // Required fields specified in update endpoint
    submitData.append('fullName', formData.fullName || '');
    submitData.append('displayName', formData.displayName || '');
    submitData.append('mobileNumber', formData.mobileNumber || '');
    submitData.append('email', formData.email || '');
    submitData.append('role', formData.role || 'admin');
    submitData.append('experience', formData.experience || 0);
    submitData.append('city', formData.city || '');
    submitData.append('whatsappNumber', formData.whatsappNumber || '');
    submitData.append('pdfFooterText', formData.pdfFooterText || '');
    submitData.append('status', formData.status || 'active');

    // Append specialisations array
    if (specialisations && specialisations.length > 0) {
      specialisations.forEach((spec) => {
        if (spec && spec.trim()) {
          submitData.append('specialisations', spec.trim());
        }
      });
    }

    // Append file uploads
    if (profilePhoto) submitData.append('profilePhoto', profilePhoto);
    if (personalLogo) submitData.append('personalLogo', personalLogo);
    if (signature) submitData.append('signature', signature);

    updateMutation.mutate(
      { id: adminId, formData: submitData },
      {
        onSuccess: (res) => {
          toast.success('Profile updated successfully!');
          const updatedUser = res?.data || res?.user || res;

          // Sync localStorage adminUser so Header and entire app update immediately
          const existingStr = localStorage.getItem('adminUser');
          let merged = {
            ...formData,
            specialisations,
            id: adminId
          };

          if (existingStr) {
            try {
              const parsedExisting = JSON.parse(existingStr);
              const prev = parsedExisting?.data || parsedExisting?.user || parsedExisting;
              merged = {
                ...prev,
                ...(typeof updatedUser === 'object' ? updatedUser : {}),
                ...formData,
                specialisations,
                token: prev.token || parsedExisting.token
              };
            } catch (err) {
              console.error(err);
            }
          }

          localStorage.setItem('adminUser', JSON.stringify(merged));
          // Notify Header and other components
          window.dispatchEvent(new Event('storage'));
        },
        onError: (error) => {
          const msg = error.response?.data?.message || error.message || 'Update failed.';
          toast.error(msg);
        }
      }
    );
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '1.25rem' }}>
      <div style={{ marginBottom: '0.85rem' }}>
        <h1 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.15rem' }}>
          Update Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
          Manage your account profile, branding assets, and system details
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.15rem 1.25rem' }}>
        <form className="form-container" onSubmit={handleSubmit}>
          
          {/* SECTION 1: PERSONAL INFORMATION */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '0.95rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--vipra-color)', marginBottom: '0.65rem' }}>
              Personal & Contact Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <Input
                label="Full Name"
                id="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Pandit Rajesh Sharma"
                disabled={updateMutation.isPending}
                required
              />

              <Input
                label="Display Name"
                id="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g. Rajesh Ji (Shown on Header)"
                disabled={updateMutation.isPending}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.65rem' }}>
              <Input
                label="Email Address"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@viprasaarthi.com"
                disabled={updateMutation.isPending}
                required
              />

              <Input
                label="Mobile Number"
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                disabled={updateMutation.isPending}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.65rem' }}>
              <Input
                label="WhatsApp Number"
                id="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="WhatsApp contact number"
                disabled={updateMutation.isPending}
              />

              <Input
                label="City"
                id="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Varanasi, Ujjain, Delhi"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* SECTION 2: PROFESSIONAL & STATUS */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '0.95rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--vipra-color)', marginBottom: '0.65rem' }}>
              Role, Experience & Status
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="role">Role</label>
                <select
                  id="role"
                  className="input-field"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={updateMutation.isPending}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="pandit">Pandit</option>
                </select>
              </div>

              <Input
                label="Experience (Years)"
                id="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 10"
                disabled={updateMutation.isPending}
              />

              <div className="input-group">
                <label className="input-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="input-field"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={updateMutation.isPending}
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '0.65rem' }}>
              <Input
                label="PDF Footer Text"
                id="pdfFooterText"
                value={formData.pdfFooterText}
                onChange={handleChange}
                placeholder="Footer text to print on generated PDFs / reports"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* SECTION 3: SPECIALISATIONS [ ] */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '0.95rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--vipra-color)', marginBottom: '0.25rem' }}>
              Specialisations [ ]
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.65rem' }}>
              Add multiple areas of Vedic expertise and services
            </p>

            {/* Existing Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem', minHeight: '28px' }}>
              {specialisations.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                  No specialisations added yet. Type below or pick presets.
                </span>
              ) : (
                specialisations.map((spec, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.22rem 0.6rem',
                      backgroundColor: 'rgba(155, 42, 31, 0.08)',
                      color: 'var(--vipra-color)',
                      borderRadius: '16px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid rgba(155, 42, 31, 0.2)'
                    }}
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialisation(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        color: 'var(--vipra-color)'
                      }}
                      title="Remove"
                    >
                      <MdClose size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '0.45rem', maxWidth: '460px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Type a specialisation (e.g. Kundali Matching)..."
                value={customSpec}
                onChange={(e) => setCustomSpec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialisation();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => addSpecialisation()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem' }}
              >
                <MdAdd size={16} />
                Add
              </button>
            </div>

            {/* Preset Suggestions */}
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Quick Presets:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem', marginTop: '0.3rem' }}>
                {PRESET_SPECIALISATIONS.map((preset, idx) => {
                  const isAdded = specialisations.includes(preset);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isAdded && addSpecialisation(preset)}
                      style={{
                        padding: '0.18rem 0.5rem',
                        fontSize: '0.72rem',
                        borderRadius: '10px',
                        border: isAdded ? '1px solid #CBD5E1' : '1px solid #94A3B8',
                        background: isAdded ? '#F1F5F9' : '#FFFFFF',
                        color: isAdded ? '#94A3B8' : 'var(--text-primary)',
                        cursor: isAdded ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      disabled={isAdded}
                    >
                      {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4: IMAGES & UPLOADS */}
          <div style={{ marginBottom: '0.95rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--vipra-color)', marginBottom: '0.25rem' }}>
              Branding & Signature Assets
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
              Upload your profile photo, personal branding logo, and official signature
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
              
              {/* Profile Photo */}
              <div style={{
                border: '1px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '0.8rem',
                textAlign: 'center',
                backgroundColor: '#FAFAFA'
              }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Profile Photo
                </label>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  margin: '0 auto 0.55rem auto',
                  border: '2px solid rgba(155, 42, 31, 0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF'
                }}>
                  {previewPhoto ? (
                    <img src={previewPhoto} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <MdImage size={30} color="#94A3B8" />
                  )}
                </div>
                <input
                  type="file"
                  id="profilePhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="profilePhoto"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    padding: '0.3rem 0.65rem'
                  }}
                >
                  <MdCloudUpload size={14} />
                  {previewPhoto ? 'Change Photo' : 'Upload Photo'}
                </label>
              </div>

              {/* Personal Logo */}
              <div style={{
                border: '1px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '0.8rem',
                textAlign: 'center',
                backgroundColor: '#FAFAFA'
              }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Personal Logo
                </label>
                <div style={{
                  width: '96px',
                  height: '68px',
                  borderRadius: '6px',
                  margin: '0 auto 0.55rem auto',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: '3px'
                }}>
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <MdImage size={30} color="#94A3B8" />
                  )}
                </div>
                <input
                  type="file"
                  id="personalLogo"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="personalLogo"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    padding: '0.3rem 0.65rem'
                  }}
                >
                  <MdCloudUpload size={14} />
                  {previewLogo ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>

              {/* Signature */}
              <div style={{
                border: '1px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '0.8rem',
                textAlign: 'center',
                backgroundColor: '#FAFAFA'
              }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Signature
                </label>
                <div style={{
                  width: '110px',
                  height: '68px',
                  borderRadius: '6px',
                  margin: '0 auto 0.55rem auto',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: '3px'
                }}>
                  {previewSig ? (
                    <img src={previewSig} alt="Signature Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <MdImage size={30} color="#94A3B8" />
                  )}
                </div>
                <input
                  type="file"
                  id="signature"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="signature"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    padding: '0.3rem 0.65rem'
                  }}
                >
                  <MdCloudUpload size={14} />
                  {previewSig ? 'Change Signature' : 'Upload Signature'}
                </label>
              </div>

            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" isLoading={updateMutation.isPending} style={{ minWidth: '160px' }}>
              {updateMutation.isPending ? 'Updating Profile...' : 'Save & Update Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
