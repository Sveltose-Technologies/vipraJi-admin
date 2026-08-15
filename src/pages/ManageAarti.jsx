import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AudioPlayerUI from '../components/AudioPlayerUI';
import { MdAdd, MdPlayArrow, MdClose, MdEdit, MdDelete, MdMusicNote } from 'react-icons/md';
import { getAllAartis, createAarti, updateAarti, deleteAarti } from '../api/aarti';
import { getAllAartiCategories } from '../api/aartiCategory';

const ManageAarti = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [playingAarti, setPlayingAarti] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    aartiCategoryId: '',
    content: '',
    textEditor: '',
  });
  
  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [files, setFiles] = useState({
    audioFile: null,
    aartiImage: null,
    pdf: null,
  });

  const { data: rawAartis = [], isLoading } = useQuery({
    queryKey: ['aartis'],
    queryFn: getAllAartis,
  });

  const { data: rawCategories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['aartiCategories'],
    queryFn: getAllAartiCategories,
  });

  // Depending on API structure, it could be rawAartis.data or just rawAartis
  const aartis = Array.isArray(rawAartis) ? rawAartis : (rawAartis?.data || rawAartis?.aartis || []);
  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  const createMutation = useMutation({
    mutationFn: createAarti,
    onSuccess: () => {
      queryClient.invalidateQueries(['aartis']);
      toast.success('Aarti created successfully');
      closeModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Error creating Aarti');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAarti(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['aartis']);
      toast.success('Aarti updated successfully');
      closeModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Error updating Aarti');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAarti,
    onSuccess: () => {
      queryClient.invalidateQueries(['aartis']);
      toast.success('Aarti deleted successfully');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Error deleting Aarti');
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: '', aartiCategoryId: '', content: '', textEditor: '' });
    setFiles({ audioFile: null, aartiImage: null, pdf: null });
    setIsModalOpen(true);
  };

  const openEditModal = (aarti) => {
    setEditingId(aarti._id || aarti.id);
    const catId = aarti.aartiCategoryId;
    setFormData({
      title: aarti.title || '',
      aartiCategoryId: (typeof catId === 'object' && catId !== null ? (catId._id || catId.id) : catId) || '',
      content: aarti.content || '',
      textEditor: aarti.textEditor || '',
    });
    setFiles({ audioFile: null, aartiImage: null, pdf: null });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('aartiCategoryId', formData.aartiCategoryId);
    data.append('content', formData.content);
    data.append('textEditor', formData.textEditor);

    if (files.audioFile) data.append('audioFile', files.audioFile);
    if (files.aartiImage) data.append('aartiImage', files.aartiImage);
    if (files.pdf) data.append('pdf', files.pdf);

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this Aarti?')) {
      deleteMutation.mutate(id);
    }
  };

  const getImageUrl = (aarti) => {
    if (aarti.aartiImage) {
      if (aarti.aartiImage.startsWith('http')) return aarti.aartiImage;
      const API_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://backend.vipraji.com';
      return `${API_URL}/${aarti.aartiImage}`;
    }
    return 'https://images.unsplash.com/photo-1579564639904-e5357c9ee364?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Aarti</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => navigate('/manage-aarti-categories')} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <MdMusicNote size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Manage Categories
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <MdAdd size={20} /> Add Aarti
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent', width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }}></div>
          <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>Loading Aartis...</p>
        </div>
      ) : aartis.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <MdPlayArrow size={40} color="var(--primary-color)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Aartis Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>Your Aarti library is currently empty. Click the button below to add your first beautiful Aarti.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <MdAdd size={20} /> Add New Aarti
          </button>
        </div>
      ) : (
        <div className="aarti-grid">
          {aartis.map(aarti => {
            let categoryName = 'No Category';
            if (aarti.aartiCategoryId) {
              if (typeof aarti.aartiCategoryId === 'object' && aarti.aartiCategoryId !== null) {
                categoryName = aarti.aartiCategoryId.categoryName || 'Unknown Category';
              } else {
                const category = categories.find(c => (c._id || c.id) === aarti.aartiCategoryId);
                categoryName = category ? category.categoryName : String(aarti.aartiCategoryId);
              }
            }
            
            return (
              <div key={aarti._id || aarti.id} className="aarti-large-card glass-panel" style={{ position: 'relative' }}>
                <div className="aarti-image-container">
                  <img src={getImageUrl(aarti)} alt={aarti.title} className="aarti-image" />
                  <div className="aarti-overlay">
                    <div className="aarti-top-actions">
                      <span className="badge">{categoryName}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="aarti-favorite-btn" onClick={(e) => { e.stopPropagation(); openEditModal(aarti); }} style={{ width: '36px', height: '36px', color: 'var(--secondary-color)' }}>
                          <MdEdit size={18} />
                        </button>
                        <button className="aarti-favorite-btn" onClick={(e) => { e.stopPropagation(); handleDelete(aarti._id || aarti.id); }} style={{ width: '36px', height: '36px', color: 'var(--error-color)' }}>
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </div>
                  
                  <div className="aarti-bottom-info">
                    <h3 className="aarti-card-title">{aarti.title}</h3>
                    {aarti.audioFile && (
                      <button 
                        className="aarti-play-btn"
                        onClick={() => setPlayingAarti(aarti)}
                      >
                        <MdPlayArrow size={32} color="#fff" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingId ? 'Edit Aarti Details' : 'Add New Aarti'}
              </h2>
              <button className="modal-close-btn" type="button" onClick={closeModal}>
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Aarti Title</label>
                  <input
                    type="text"
                    name="title"
                    className="input-field"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter the title of the Aarti"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Aarti Category</label>
                  <select
                    name="aartiCategoryId"
                    className="input-field"
                    value={formData.aartiCategoryId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setCatModalOpen(true);
                      } else {
                        handleInputChange(e);
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.categoryName}
                      </option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>+ Add New Category</option>
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Content (Sanskrit / Hindi)</label>
                  <textarea
                    name="content"
                    className="input-field"
                    rows="4"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter the full text of the Aarti..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Text Editor (HTML/Rich Text)</label>
                  <textarea
                    name="textEditor"
                    className="input-field"
                    rows="4"
                    value={formData.textEditor}
                    onChange={handleInputChange}
                    placeholder="Enter rich text or HTML content here..."
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Aarti Cover Image</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => document.getElementById('aartiImageUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="aartiImageUpload"
                      type="file"
                      name="aartiImage"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {files.aartiImage ? files.aartiImage.name : 'Click to upload image'}
                    </p>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Audio File</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => document.getElementById('audioFileUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="audioFileUpload"
                      type="file"
                      name="audioFile"
                      style={{ display: 'none' }}
                      accept="audio/*"
                      onChange={handleFileChange}
                    />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {files.audioFile ? files.audioFile.name : 'Click to upload audio (MP3)'}
                    </p>
                  </div>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">PDF Document</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => document.getElementById('pdfUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="pdfUpload"
                      type="file"
                      name="pdf"
                      style={{ display: 'none' }}
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {files.pdf ? files.pdf.name : 'Click to upload PDF'}
                    </p>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <button type="button" className="btn" onClick={closeModal} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Aarti' : 'Save Aarti'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Category Modal */}
      {catModalOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 110 }} onClick={() => setCatModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setCatModalOpen(false)}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={async (e) => {
              e.preventDefault();
              const loadingToast = toast.loading('Creating category...');
              try {
                const { createAartiCategory } = await import('../api/aartiCategory');
                const res = await createAartiCategory({ categoryName: newCatName.trim() });
                queryClient.invalidateQueries(['aartiCategories']);
                toast.success('Category created', { id: loadingToast });
                const newId = res?.data?._id || res?.data?.id || res?._id || res?.id || res?.category?._id || res?.category?.id;
                if (newId) handleInputChange({ target: { name: 'aartiCategoryId', value: String(newId) } });
                setCatModalOpen(false);
                setNewCatName('');
              } catch (err) {
                toast.error('Failed to create category', { id: loadingToast });
              }
            }}>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input type="text" className="input-field" value={newCatName} onChange={e => setNewCatName(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Save Category</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Audio Player Preview Modal */}
      {playingAarti && createPortal(
        <div className="modal-overlay" onClick={() => setPlayingAarti(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', backgroundColor: 'transparent', boxShadow: 'none' }}>
            <div style={{ position: 'relative' }}>
              <button className="modal-close-btn" onClick={() => setPlayingAarti(null)} style={{ position: 'absolute', top: '-40px', right: 0, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.5rem' }}>
                <MdClose size={24} />
              </button>
              <AudioPlayerUI title={playingAarti.title} audioUrl={playingAarti.audioFile} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageAarti;
