import React, { useState, useRef } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import toast from 'react-hot-toast';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { useLogos, useCreateLogo, useUpdateLogo, useDeleteLogo } from '../hooks/useLogo';
import Modal from '../components/Modal';
import Button from '../components/Button';

const BASE_URL = 'https://backend.viprasaarthi.com';

// Utility for formatting URL (assuming backend might return relative paths for images)
const getImageUrl = (url) => {
  const { showConfirm } = useConfirmModal();
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Dashboard = () => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedLogoId, setSelectedLogoId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef(null);

  // React Query Hooks
  const { data: logosData, isLoading: isLoadingLogos } = useLogos();
  const createMutation = useCreateLogo();
  const updateMutation = useUpdateLogo();
  const deleteMutation = useDeleteLogo();

  // Safely extract the logos array from various possible API response structures
  const logos = Array.isArray(logosData)
    ? logosData
    : (logosData?.data || logosData?.logos || logosData?.result || []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedLogoId(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (logo) => {
    setModalMode('edit');
    setSelectedLogoId(logo._id || logo.id);
    setSelectedFile(null);
    // Assuming 'url' or 'logo' is the property name returned from API
    setPreviewUrl(getImageUrl(logo.url || logo.logo || ''));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modalMode === 'add' && !selectedFile) {
      return toast.error('Please select a logo file to upload.');
    }

    const formData = new FormData();
    if (selectedFile) formData.append('logo', selectedFile);

    if (modalMode === 'add') {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Logo added successfully!');
          closeModal();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to add logo');
        }
      });
    } else {
      updateMutation.mutate({ id: selectedLogoId, formData }, {
        onSuccess: () => {
          toast.success('Logo updated successfully!');
          closeModal();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update logo');
        }
      });
    }
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this logo?', () => {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Logo deleted!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete logo')
      });
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Home Page Management</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage your website's Branding (Logos)
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600 }}>Logo List</h2>
          <Button onClick={openAddModal} style={{ backgroundColor: '#F59E0B', color: 'white', padding: '0.5rem 1rem' }}>
            <MdAdd size={18} style={{ marginRight: '0.25rem' }} /> Add Logo
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>#</th>
                <th>Preview</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLogos ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Loading logos...</td>
                </tr>
              ) : logos.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No logos found. Add one!</td>
                </tr>
              ) : (
                logos.map((logo, index) => (
                  <tr key={logo._id || logo.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={getImageUrl(logo.url || logo.logo)}
                        alt="Logo Preview"
                        style={{ height: '50px', objectFit: 'contain', border: '1px solid #eee', padding: '2px', borderRadius: '4px' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="action-btn edit" onClick={() => openEditModal(logo)} title="Edit">
                        <MdEdit size={18} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(logo._id || logo.id)} title="Delete">
                        <MdDelete size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Add New Logo' : 'Edit Logo'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="input-group">
            <label className="input-label">Select Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="input-field"
              style={{ padding: '0.5rem' }}
            />
          </div>

          {previewUrl && (
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '1rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preview</p>
              <img src={previewUrl} alt="Preview" style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={closeModal} style={{ backgroundColor: 'white', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {modalMode === 'add' ? 'Upload Logo' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Dashboard;
