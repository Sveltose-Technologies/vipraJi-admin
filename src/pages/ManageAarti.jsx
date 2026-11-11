import React, { useState, useMemo, useCallback } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AudioPlayerUI from '../components/AudioPlayerUI';
import {
  MdAdd,
  MdPlayArrow,
  MdClose,
  MdEdit,
  MdDelete,
  MdMusicNote,
  MdSearch,
  MdViewList,
  MdViewModule,
  MdPictureAsPdf,
  MdAudiotrack,
} from 'react-icons/md';
import { getAllAartis, createAarti, updateAarti, deleteAarti } from '../api/aarti';
import { getAllAartiCategories } from '../api/aartiCategory';

const ManageAarti = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [playingAarti, setPlayingAarti] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const { data: rawCategories = [] } = useQuery({
    queryKey: ['aartiCategories'],
    queryFn: getAllAartiCategories,
  });

  // Depending on API structure, it could be rawAartis.data or just rawAartis
  const aartis = useMemo(
    () => (Array.isArray(rawAartis) ? rawAartis : (rawAartis?.data || rawAartis?.aartis || [])),
    [rawAartis]
  );
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || [])),
    [rawCategories]
  );

  const getCategoryInfo = useCallback((aarti) => {
    if (!aarti.aartiCategoryId) return { id: '', name: 'No Category' };
    if (typeof aarti.aartiCategoryId === 'object' && aarti.aartiCategoryId !== null) {
      return {
        id: aarti.aartiCategoryId._id || aarti.aartiCategoryId.id || '',
        name: aarti.aartiCategoryId.categoryName || 'Unknown Category',
      };
    }
    const category = categories.find((c) => (c._id || c.id) === aarti.aartiCategoryId);
    return {
      id: aarti.aartiCategoryId,
      name: category ? category.categoryName : String(aarti.aartiCategoryId),
    };
  }, [categories]);

  const filteredAartis = useMemo(() => {
    return aartis.filter((aarti) => {
      const catInfo = getCategoryInfo(aarti);
      if (selectedCategory !== 'all' && catInfo.id !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (aarti.title || '').toLowerCase();
        const content = (aarti.content || '').toLowerCase();
        const catName = (catInfo.name || '').toLowerCase();
        return title.includes(q) || content.includes(q) || catName.includes(q);
      }
      return true;
    });
  }, [aartis, getCategoryInfo, selectedCategory, searchQuery]);

  const aartiStats = useMemo(() => {
    return {
      total: aartis.length,
      categories: categories.length,
      withAudio: aartis.filter((a) => Boolean(a.audioFile)).length,
      withPdf: aartis.filter((a) => Boolean(a.pdf)).length,
    };
  }, [aartis, categories]);

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
    showConfirm('Are you sure you want to delete this Aarti?', () => {
      deleteMutation.mutate(id);
    });
  };

  const getImageUrl = (aarti) => {
    if (aarti.aartiImage) {
      if (aarti.aartiImage.startsWith('http')) return aarti.aartiImage;
      const API_URL = import.meta.env.DEV ? '/api-proxy' : 'https://backend.viprasaarthi.com';
      return `${API_URL}/${aarti.aartiImage}`;
    }
    return 'https://images.unsplash.com/photo-1579564639904-e5357c9ee364?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <h1 className="header-title">Manage Aarti</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="view-toggle-group">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="List View"
            >
              <MdViewList size={17} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
            >
              <MdViewModule size={17} />
            </button>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/manage-aarti-categories')}>
            <MdMusicNote size={17} />
            Categories
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <MdAdd size={17} /> Add Aarti
          </button>
        </div>
      </div>

      {/* Compact Stat Pills + Search & Filter Bar */}
      <div className="compact-controls-bar">
        <div className="compact-stat-pills">
          <div className="compact-stat-pill">
            <span className="compact-stat-pill-label">Total</span>
            <strong className="compact-stat-pill-val">{aartiStats.total}</strong>
          </div>
          <div className="compact-stat-pill">
            <span className="compact-stat-pill-label">Categories</span>
            <strong className="compact-stat-pill-val">{aartiStats.categories}</strong>
          </div>
          <div className="compact-stat-pill">
            <MdAudiotrack size={14} color="#059669" />
            <span className="compact-stat-pill-label">Audio</span>
            <strong className="compact-stat-pill-val" style={{ color: '#047857' }}>{aartiStats.withAudio}</strong>
          </div>
          <div className="compact-stat-pill">
            <MdPictureAsPdf size={14} color="#DC2626" />
            <span className="compact-stat-pill-label">PDFs</span>
            <strong className="compact-stat-pill-val" style={{ color: '#DC2626' }}>{aartiStats.withPdf}</strong>
          </div>
        </div>

        <div className="compact-filter-toolbar">
          <div className="compact-search-wrap">
            <MdSearch size={16} className="compact-search-icon" />
            <input
              type="text"
              placeholder="Search aarti title, category, lyrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="compact-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="compact-search-clear" title="Clear search">
                <MdClose size={14} />
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="compact-filter-select"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent', width: '32px', height: '32px', borderWidth: '3px', marginBottom: '0.65rem' }}></div>
          <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>Loading Aartis...</p>
        </div>
      ) : filteredAartis.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2.25rem 1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem' }}>
            <MdPlayArrow size={28} color="var(--primary-color)" />
          </div>
          <h2 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '1.05rem' }}>No Aartis Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.15rem', maxWidth: '380px', fontSize: '0.84rem' }}>
            {searchQuery || selectedCategory !== 'all'
              ? 'No Aartis match your current search or category filter.'
              : 'Your Aarti library is currently empty. Click the button below to add your first Aarti.'}
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <MdAdd size={17} /> Add New Aarti
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{filteredAartis.length}</strong> of <strong>{aartis.length}</strong> aartis
            </span>
          </div>
          <table className="clean-table">
            <thead>
              <tr>
                <th style={{ width: '64px' }}>Cover</th>
                <th>Title & Content</th>
                <th>Category</th>
                <th>Audio</th>
                <th>PDF</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAartis.map((aarti) => {
                const { name: categoryName } = getCategoryInfo(aarti);
                return (
                  <tr key={aarti._id || aarti.id}>
                    <td>
                      <img
                        src={getImageUrl(aarti)}
                        alt={aarti.title}
                        style={{ width: '44px', height: '34px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{aarti.title}</div>
                      {aarti.content && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {aarti.content}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.16rem 0.48rem',
                          borderRadius: '5px',
                          background: 'rgba(130, 0, 30, 0.08)',
                          color: 'var(--primary-color)',
                          border: '1px solid rgba(130, 0, 30, 0.14)',
                        }}
                      >
                        {categoryName}
                      </span>
                    </td>
                    <td>
                      {aarti.audioFile ? (
                        <button
                          type="button"
                          onClick={() => setPlayingAarti(aarti)}
                          className="clean-flag-pill is-active"
                          title="Play Aarti Audio"
                        >
                          <MdPlayArrow size={13} /> Play Audio
                        </button>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {aarti.pdf ? (
                        <a
                          href={aarti.pdf.startsWith('http') ? aarti.pdf : `${import.meta.env.DEV ? '/api-proxy' : 'https://backend.viprasaarthi.com'}/${aarti.pdf}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.18rem 0.48rem',
                            borderRadius: '5px',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <MdPictureAsPdf size={13} /> PDF
                        </a>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn-icon-sm edit"
                          title="Edit Aarti"
                          onClick={() => openEditModal(aarti)}
                        >
                          <MdEdit size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sm delete"
                          title="Delete Aarti"
                          onClick={() => handleDelete(aarti._id || aarti.id)}
                        >
                          <MdDelete size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="aarti-grid">
          {filteredAartis.map(aarti => {
            const { name: categoryName } = getCategoryInfo(aarti);
            
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
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', width: '92%' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontWeight: 700 }}>
                {editingId ? 'Edit Aarti Details' : 'Add New Aarti'}
              </h2>
              <button className="modal-close-btn" type="button" onClick={closeModal}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 1.25rem' }}>
              <form onSubmit={handleSubmit} className="responsive-form-grid-2">
                
                <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
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
                
                <div className="input-group" style={{ marginBottom: 0 }}>
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

                <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="input-label">Content (Sanskrit / Hindi)</label>
                  <textarea
                    name="content"
                    className="input-field"
                    rows="3"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter the full text of the Aarti..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="input-label">Text Editor (HTML/Rich Text)</label>
                  <textarea
                    name="textEditor"
                    className="input-field"
                    rows="3"
                    value={formData.textEditor}
                    onChange={handleInputChange}
                    placeholder="Enter rich text or HTML content here..."
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Aarti Cover Image</label>
                  <div style={{ border: '1.5px dashed var(--border-color)', borderRadius: '6px', padding: '0.75rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => document.getElementById('aartiImageUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="aartiImageUpload"
                      type="file"
                      name="aartiImage"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      {files.aartiImage ? files.aartiImage.name : 'Click to upload image'}
                    </p>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Audio File</label>
                  <div style={{ border: '1.5px dashed var(--border-color)', borderRadius: '6px', padding: '0.75rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => document.getElementById('audioFileUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="audioFileUpload"
                      type="file"
                      name="audioFile"
                      style={{ display: 'none' }}
                      accept="audio/*"
                      onChange={handleFileChange}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      {files.audioFile ? files.audioFile.name : 'Click to upload audio (MP3)'}
                    </p>
                  </div>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="input-label">PDF Document</label>
                  <div style={{ border: '1.5px dashed var(--border-color)', borderRadius: '6px', padding: '0.75rem', textAlign: 'center', backgroundColor: '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => document.getElementById('pdfUpload').click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <input
                      id="pdfUpload"
                      type="file"
                      name="pdf"
                      style={{ display: 'none' }}
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      {files.pdf ? files.pdf.name : 'Click to upload PDF'}
                    </p>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
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
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setCatModalOpen(false)}><MdClose size={20} /></button>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.85rem' }}>Save Category</button>
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
