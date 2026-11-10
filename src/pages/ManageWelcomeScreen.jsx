import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdSearch,
  MdRefresh,
  MdClose,
  MdSave,
  MdViewModule,
  MdViewList,
  MdSmartphone,
  MdCloudUpload,
  MdLink,
  MdCollections,
  MdWavingHand,
  MdFilterList,
  MdFormatListNumbered,
  MdArrowForward,
} from 'react-icons/md';

import {
  getAllWelcomeScreens,
  createWelcomeScreen,
  updateWelcomeScreen,
  deleteWelcomeScreen,
} from '../api/welcomeScreen';
import { useConfirmModal } from '../contexts/ConfirmModalContext';

// Curated high quality spiritual/Vedic preset banners for quick selection
const PRESET_BANNERS = [
  {
    title: 'Vedic Sunrise & Temple',
    url: 'https://cdn.viprasaarthi.app/images/welcome-banner.webp',
    tag: 'Official Banner',
  },
  {
    title: 'Sacred Pooja & Diya',
    url: 'https://images.unsplash.com/photo-1609358905581-e5382c473809?w=1000&auto=format&fit=crop&q=80',
    tag: 'Pooja',
  },
  {
    title: 'Divine Temple Architecture',
    url: 'https://images.unsplash.com/photo-1590076215667-873d10034a74?w=1000&auto=format&fit=crop&q=80',
    tag: 'Temple',
  },
  {
    title: 'Spiritual Meditation & Devotion',
    url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1000&auto=format&fit=crop&q=80',
    tag: 'Meditation',
  },
  {
    title: 'Golden Aarti Lamp',
    url: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=1000&auto=format&fit=crop&q=80',
    tag: 'Aarti',
  },
];

const INITIAL_FORM = {
  screenNumber: 1,
  title: '',
  subtitle: '',
  description: '',
  image: '',
};

const ManageWelcomeScreen = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Search & view state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [imagePreview, setImagePreview] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Phone Mockup Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Query: Get all welcome screens
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['welcomeScreens'],
    queryFn: () => getAllWelcomeScreens(),
  });

  const screens = useMemo(() => {
    if (!responseData) return [];
    let list = [];
    if (Array.isArray(responseData)) list = responseData;
    else if (Array.isArray(responseData?.data)) list = responseData.data;
    else if (Array.isArray(responseData?.welcomeScreens)) list = responseData.welcomeScreens;

    // Sort screens by screenNumber ascending (Screen 1, Screen 2, ...)
    return [...list].sort((a, b) => (Number(a.screenNumber) || 0) - (Number(b.screenNumber) || 0));
  }, [responseData]);

  // Compute next available screen number
  const getNextScreenNumber = () => {
    if (!screens || screens.length === 0) return 1;
    const existing = screens
      .map((s) => Number(s.screenNumber))
      .filter((n) => !isNaN(n));
    if (existing.length === 0) return 1;
    return Math.max(...existing) + 1;
  };

  // Filtered screens for UI search
  const filteredScreens = useMemo(() => {
    if (!searchQuery.trim()) return screens;
    const q = searchQuery.toLowerCase().trim();
    return screens.filter((item) => {
      const screenNumMatch = String(item.screenNumber || '').includes(q);
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const subtitleMatch = (item.subtitle || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      return screenNumMatch || titleMatch || subtitleMatch || descMatch;
    });
  }, [screens, searchQuery]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createWelcomeScreen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcomeScreens'] });
      toast.success('Welcome screen created successfully!');
      closeFormModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to create welcome screen';
      toast.error(msg);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateWelcomeScreen(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcomeScreens'] });
      toast.success('Welcome screen updated successfully!');
      closeFormModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to update welcome screen';
      toast.error(msg);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWelcomeScreen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcomeScreens'] });
      toast.success('Welcome screen deleted successfully');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to delete welcome screen';
      toast.error(msg);
    },
  });

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    const nextNum = getNextScreenNumber();
    setFormData({
      ...INITIAL_FORM,
      screenNumber: nextNum,
    });
    setImagePreview('');
    setImageInputMode('upload');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      screenNumber: item.screenNumber ?? 1,
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      image: item.image || '',
    });
    setImagePreview(item.image || '');
    setImageInputMode(item.image?.startsWith('data:') ? 'upload' : 'url');
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setImagePreview('');
  };

  // Open Mobile Phone Preview Modal
  const openMobilePreview = (item) => {
    setPreviewData(item);
    setPreviewModalOpen(true);
  };

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Local Image File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    setIsImageLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, image: result }));
      setIsImageLoading(false);
      toast.success('Image loaded successfully');
    };
    reader.onerror = () => {
      setIsImageLoading(false);
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Handle URL change
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  // Select Preset Banner
  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({ ...prev, image: preset.url }));
    setImagePreview(preset.url);
    toast.success(`Selected "${preset.title}"`);
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const screenNum = Number(formData.screenNumber);
    if (!screenNum || isNaN(screenNum) || screenNum < 1) {
      toast.error('Please enter a valid Screen Number (1, 2, 3...)');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the welcome screen');
      return;
    }

    if (!formData.subtitle.trim()) {
      toast.error('Please enter a subtitle');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.image || !formData.image.trim()) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    const payload = {
      screenNumber: screenNum,
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
    };

    if (editingItem) {
      const id = editingItem._id || editingItem.id;
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Delete Handler
  const handleDelete = (item) => {
    const id = item._id || item.id;
    showConfirm(
      `Are you sure you want to delete Screen #${item.screenNumber} "${item.title}"?`,
      () => {
        deleteMutation.mutate(id);
      }
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="welcome-screen-container animate-fade-in">
      {/* Top Header */}
      <div className="welcome-header">
        <div className="welcome-header-left">
          <div className="header-icon-badge">
            <MdWavingHand size={20} color="var(--primary-color)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 className="header-title-text">Welcome Screen Management</h1>
              <span className="badge-portal">Onboarding Flow</span>
            </div>
            <p className="header-subtitle-text">
              Manage onboarding walkthrough screens in sequential order
            </p>
          </div>
        </div>

        <div className="welcome-header-actions">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary-outline"
            title="Refresh list"
          >
            <MdRefresh size={16} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* View mode toggle */}
          <div className="view-toggle-group">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
            >
              <MdViewModule size={17} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <MdViewList size={17} />
            </button>
          </div>

          <button onClick={openAddModal} className="btn btn-primary btn-add-screen">
            <MdAdd size={17} />
            <span>Add Welcome Screen</span>
          </button>
        </div>
      </div>

      {/* Compact Metrics & Search Bar */}
      <div className="welcome-controls-bar">
        <div className="welcome-stat-pills">
          <div className="welcome-stat-pill">
            <MdCollections size={14} color="var(--primary-color)" />
            <span className="w-pill-label">Screens</span>
            <strong className="w-pill-val">{screens.length}</strong>
          </div>

          <div className="welcome-stat-pill">
            <MdFormatListNumbered size={14} color="#92400E" />
            <span className="w-pill-label">Sequence</span>
            <strong className="w-pill-val" style={{ color: 'var(--primary-color)' }}>
              {screens.length > 0
                ? `1 – ${screens[screens.length - 1]?.screenNumber || screens.length}`
                : 'None'}
            </strong>
          </div>

          <button
            type="button"
            className="welcome-stat-pill clickable"
            onClick={openAddModal}
            title="Click to add next slide"
          >
            <MdAdd size={14} color="#059669" />
            <span className="w-pill-label">Next Slide</span>
            <strong className="w-pill-val" style={{ color: '#047857' }}>
              #{getNextScreenNumber()}
            </strong>
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <MdSearch size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search screen #, title, subtitle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear-btn" title="Clear search">
                <MdClose size={15} />
              </button>
            )}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            {filteredScreens.length}/{screens.length} shown
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading welcome screens...</p>
        </div>
      ) : filteredScreens.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon-wrap">
            <MdWavingHand size={42} />
          </div>
          <h3>No Welcome Screens Found</h3>
          <p>
            {searchQuery
              ? `No welcome screens match "${searchQuery}". Clear your search query to see all screens.`
              : 'You have not added any onboarding welcome screens yet. Add your first screen to guide new users through the app!'}
          </p>
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
              Clear Search
            </button>
          ) : (
            <button onClick={openAddModal} className="btn btn-primary">
              <MdAdd size={20} /> Add Welcome Screen #1
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="welcome-cards-grid">
          {filteredScreens.map((item) => {
            const id = item._id || item.id;
            const screenNum = item.screenNumber ?? 1;

            return (
              <div key={id} className="welcome-card">
                {/* Image Section */}
                <div className="card-image-box">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="card-image"
                    onError={(e) => {
                      e.target.src = 'https://cdn.viprasaarthi.app/images/welcome-banner.webp';
                    }}
                  />
                  <div className="card-image-overlay">
                    <button
                      onClick={() => openMobilePreview(item)}
                      className="card-preview-btn"
                      title="Preview on mobile device"
                    >
                      <MdSmartphone size={16} /> View Mockup
                    </button>
                  </div>

                  {/* Screen Number Badge */}
                  <span className="card-screen-badge">
                    Screen #{screenNum}
                  </span>
                </div>

                {/* Body Content */}
                <div className="card-body">
                  <div className="card-screen-tag">Slide {screenNum} in Onboarding</div>
                  <h3 className="card-title" title={item.title}>
                    {item.title}
                  </h3>
                  <h5 className="card-subtitle" title={item.subtitle}>
                    {item.subtitle}
                  </h5>
                  <p className="card-description" title={item.description}>
                    {item.description}
                  </p>

                  <div className="card-footer-meta">
                    <span className="meta-date">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {item.createdBy?.fullName && (
                      <span className="meta-author" title={`Added by ${item.createdBy.fullName}`}>
                        {item.createdBy.fullName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="card-actions-bar">
                  <button
                    onClick={() => openMobilePreview(item)}
                    className="btn-mockup-trigger"
                    title="View how user sees this on their phone"
                  >
                    <MdSmartphone size={16} />
                    <span>Phone Mockup</span>
                  </button>

                  <div className="card-right-actions">
                    <button
                      onClick={() => openEditModal(item)}
                      className="btn-icon-action edit"
                      title="Edit Content"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="btn-icon-action delete"
                      title="Delete Content"
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-wrapper glass-panel">
          <table className="welcome-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Slide #</th>
                <th style={{ width: '90px' }}>Banner</th>
                <th>Title & Subtitle</th>
                <th>Description</th>
                <th style={{ width: '140px' }}>Created</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScreens.map((item) => {
                const id = item._id || item.id;
                const screenNum = item.screenNumber ?? 1;

                return (
                  <tr key={id}>
                    <td>
                      <span className="table-screen-pill">
                        Screen #{screenNum}
                      </span>
                    </td>
                    <td>
                      <div
                        className="table-img-thumb"
                        onClick={() => openMobilePreview(item)}
                        title="Click to preview"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          onError={(e) => {
                            e.target.src = 'https://cdn.viprasaarthi.app/images/welcome-banner.webp';
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="table-title-cell">
                        <strong className="table-title-text">{item.title}</strong>
                        <span className="table-subtitle-text">{item.subtitle}</span>
                      </div>
                    </td>
                    <td>
                      <p className="table-desc-text">{item.description}</p>
                    </td>
                    <td>
                      <div className="table-date-cell">
                        <span>
                          {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {item.createdBy?.fullName && (
                          <small className="table-author-text">{item.createdBy.fullName}</small>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-btns">
                        <button
                          onClick={() => openMobilePreview(item)}
                          className="table-action-btn"
                          title="Mobile Mockup Preview"
                        >
                          <MdSmartphone size={17} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="table-action-btn edit"
                          title="Edit"
                        >
                          <MdEdit size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="table-action-btn delete"
                          title="Delete"
                        >
                          <MdDeleteOutline size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT MODAL WITH LIVE INTERACTIVE PREVIEW
          ========================================================================= */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div
            className="modal-content glass-panel modal-wide animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="modal-icon-wrap">
                  {editingItem ? <MdEdit size={20} /> : <MdAdd size={20} />}
                </div>
                <div>
                  <h2 className="modal-title">
                    {editingItem
                      ? `Edit Welcome Screen #${formData.screenNumber}`
                      : 'Add New Welcome Screen'}
                  </h2>
                  <p className="modal-subtitle">
                    Configure the slide order, imagery, headline, and description for this onboarding step.
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeFormModal} type="button">
                <MdClose size={24} />
              </button>
            </div>

            {/* Modal Body: Two Columns (Form on Left, Live Mobile Preview on Right) */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body modal-split-grid">
                {/* Left Column: Form Fields */}
                <div className="form-fields-col">
                  {/* Screen Number Input */}
                  <div className="input-group">
                    <label className="input-label">
                      Screen Number (Slide Order) <span className="req-star">*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="number"
                        name="screenNumber"
                        className="input-field"
                        min="1"
                        step="1"
                        placeholder="1, 2, 3..."
                        value={formData.screenNumber}
                        onChange={handleChange}
                        required
                        style={{ maxWidth: '140px', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-color)' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Determines the sequential order (e.g. 1 is first slide, 2 is second).
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="input-group">
                    <label className="input-label">
                      Screen Title <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="input-field"
                      placeholder="e.g. Welcome to Vipra Saarthi"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                    <small className="input-hint">Main headline shown at the top of the welcome screen.</small>
                  </div>

                  {/* Subtitle */}
                  <div className="input-group">
                    <label className="input-label">
                      Subtitle / Tagline <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      className="input-field"
                      placeholder="e.g. Your Companion in Spiritual Service"
                      value={formData.subtitle}
                      onChange={handleChange}
                      required
                    />
                    <small className="input-hint">Catchy spiritual motto or secondary greeting.</small>
                  </div>

                  {/* Description */}
                  <div className="input-group">
                    <label className="input-label">
                      Description <span className="req-star">*</span>
                    </label>
                    <textarea
                      name="description"
                      className="input-field"
                      rows={4}
                      placeholder="e.g. Discover authentic Vedic pooja services, connect with verified Pandits, and seamlessly manage your spiritual ceremonies."
                      value={formData.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                    <small className="input-hint">
                      Explains the app features and guides the user through this onboarding step.
                    </small>
                  </div>

                  {/* Image Source Selection */}
                  <div className="input-group">
                    <label className="input-label">
                      Welcome Banner Image <span className="req-star">*</span>
                    </label>

                    {/* Source Tab Toggle */}
                    <div className="image-mode-tabs">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`image-tab-btn ${imageInputMode === 'upload' ? 'active' : ''}`}
                      >
                        <MdCloudUpload size={16} /> Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`image-tab-btn ${imageInputMode === 'url' ? 'active' : ''}`}
                      >
                        <MdLink size={16} /> Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('presets')}
                        className={`image-tab-btn ${imageInputMode === 'presets' ? 'active' : ''}`}
                      >
                        <MdCollections size={16} /> Preset Library
                      </button>
                    </div>

                    {/* Mode: Local Upload */}
                    {imageInputMode === 'upload' && (
                      <div className="file-dropzone-box">
                        <input
                          type="file"
                          id="welcomeImageFileInput"
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                        <div
                          className="dropzone-inner"
                          onClick={() => document.getElementById('welcomeImageFileInput').click()}
                        >
                          <MdCloudUpload size={38} className="dropzone-icon" />
                          <p className="dropzone-title">
                            {isImageLoading ? 'Reading image...' : 'Click or Drag & Drop image file here'}
                          </p>
                          <span className="dropzone-note">
                            Supports PNG, JPG, JPEG, WebP (Max 5MB)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mode: Direct URL */}
                    {imageInputMode === 'url' && (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/banner.jpg"
                          value={formData.image.startsWith('data:') ? '' : formData.image}
                          onChange={handleImageUrlChange}
                          className="input-field"
                        />
                        <small className="input-hint">
                          Paste a direct public CDN or web URL for your banner image.
                        </small>
                      </div>
                    )}

                    {/* Mode: Preset Gallery */}
                    {imageInputMode === 'presets' && (
                      <div className="presets-list">
                        {PRESET_BANNERS.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectPreset(preset)}
                            className={`preset-item ${formData.image === preset.url ? 'selected' : ''}`}
                          >
                            <img src={preset.url} alt={preset.title} className="preset-thumb" />
                            <div className="preset-info">
                              <span className="preset-title">{preset.title}</span>
                              <span className="preset-tag">{preset.tag}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Mockup Preview Box */}
                <div className="preview-pane-col">
                  <div className="preview-pane-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MdSmartphone size={18} color="var(--primary-color)" />
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Live Mobile App Preview
                      </strong>
                    </div>
                    <span className="preview-screen-num-badge">
                      Screen #{formData.screenNumber || 1}
                    </span>
                  </div>

                  {/* Phone Screen Frame */}
                  <div className="phone-screen-mockup">
                    {/* Top Phone Status Bar */}
                    <div className="phone-notch-bar">
                      <span className="phone-time">9:41</span>
                      <div className="phone-speaker"></div>
                      <div className="phone-icons">
                        <span className="phone-signal">●●●</span>
                        <span className="phone-battery">100%</span>
                      </div>
                    </div>

                    {/* Phone App Bar */}
                    <div className="phone-app-header">
                      <span className="phone-logo-text">VIPRA SAARTHI</span>
                      <span className="phone-skip-btn">Skip</span>
                    </div>

                    {/* Banner Image Preview inside Phone */}
                    <div className="phone-banner-area">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Banner Preview"
                          className="phone-banner-img"
                          onError={(e) => {
                            e.target.src = 'https://cdn.viprasaarthi.app/images/welcome-banner.webp';
                          }}
                        />
                      ) : (
                        <div className="phone-banner-placeholder">
                          <MdCloudUpload size={32} />
                          <span>Image preview will appear here</span>
                        </div>
                      )}
                    </div>

                    {/* Screen Content Preview */}
                    <div className="phone-content-area">
                      <div className="phone-sacred-symbol">ॐ</div>
                      <h3 className="phone-title">
                        {formData.title || 'Screen Title'}
                      </h3>
                      <h4 className="phone-subtitle">
                        {formData.subtitle || 'Subtitle Tagline'}
                      </h4>
                      <p className="phone-desc">
                        {formData.description ||
                          'Description of what users can do in Vipra Saarthi.'}
                      </p>

                      {/* Dots pagination showing this screen's position */}
                      <div className="phone-dots">
                        {[1, 2, 3].map((dotNum) => {
                          const isActiveDot = Number(formData.screenNumber) === dotNum;
                          return (
                            <span
                              key={dotNum}
                              className={`phone-dot ${isActiveDot ? 'active' : ''}`}
                            ></span>
                          );
                        })}
                      </div>

                      {/* CTA button */}
                      <div className="phone-cta-button">
                        <span>{Number(formData.screenNumber) >= 3 ? 'Get Started' : 'Next'}</span>
                      </div>
                    </div>

                    {/* Phone Home Bar */}
                    <div className="phone-home-indicator"></div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={18} />
                  <span>
                    {isSaving
                      ? 'Saving...'
                      : editingItem
                      ? 'Update Welcome Screen'
                      : 'Create Welcome Screen'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEDICATED FULL PHONE MOCKUP PREVIEW MODAL
          ========================================================================= */}
      {previewModalOpen && previewData && (
        <div className="modal-overlay" onClick={() => setPreviewModalOpen(false)}>
          <div
            className="modal-content glass-panel phone-preview-modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '1.25rem' }}
          >
            <div className="preview-modal-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdSmartphone size={22} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Screen #{previewData.screenNumber} Phone Mockup
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setPreviewModalOpen(false)}
                type="button"
              >
                <MdClose size={22} />
              </button>
            </div>

            {/* High-fidelity Phone Simulator */}
            <div className="phone-standalone-mockup">
              <div className="phone-notch-bar">
                <span className="phone-time">9:41</span>
                <div className="phone-speaker"></div>
                <div className="phone-icons">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="phone-app-header">
                <span className="phone-logo-text">VIPRA SAARTHI</span>
                <span className="phone-skip-btn">Skip</span>
              </div>

              <div className="phone-banner-area">
                <img
                  src={previewData.image}
                  alt={previewData.title}
                  className="phone-banner-img"
                  onError={(e) => {
                    e.target.src = 'https://cdn.viprasaarthi.app/images/welcome-banner.webp';
                  }}
                />
              </div>

              <div className="phone-content-area">
                <div className="phone-sacred-symbol">ॐ</div>
                <h2 className="phone-title">{previewData.title}</h2>
                <h4 className="phone-subtitle">{previewData.subtitle}</h4>
                <p className="phone-desc">{previewData.description}</p>

                <div className="phone-dots">
                  {[1, 2, 3].map((dotNum) => (
                    <span
                      key={dotNum}
                      className={`phone-dot ${Number(previewData.screenNumber) === dotNum ? 'active' : ''}`}
                    ></span>
                  ))}
                </div>

                <div className="phone-cta-button">
                  <span>{Number(previewData.screenNumber) >= 3 ? 'Get Started' : 'Next'}</span>
                </div>
              </div>

              <div className="phone-home-indicator"></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setPreviewModalOpen(false);
                  openEditModal(previewData);
                }}
                className="btn btn-secondary-sm"
              >
                <MdEdit size={16} /> Edit Screen #{previewData.screenNumber}
              </button>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="btn btn-primary-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Page Styles */}
      <style>{`
        .welcome-screen-container {
          padding: 0;
          color: var(--text-primary);
        }

        /* Top Header */
        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem 0.85rem;
          margin-bottom: 0.7rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--border-color);
        }

        .welcome-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          max-width: 650px;
        }

        .header-icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, rgba(130,0,30,0.12), rgba(240,190,60,0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(130,0,30,0.15);
          flex-shrink: 0;
        }

        .header-title-text {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 700;
          color: var(--primary-color);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .badge-portal {
          background-color: var(--secondary-color);
          color: #4A2C10;
          font-size: 0.66rem;
          font-weight: 700;
          padding: 0.14rem 0.5rem;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .header-subtitle-text {
          margin: 0.15rem 0 0 0;
          color: var(--text-secondary);
          font-size: 0.78rem;
          line-height: 1.3;
        }

        .welcome-header-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .btn-secondary-outline {
          background-color: #FFFFFF;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.38rem 0.72rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary-outline:hover {
          background-color: #F9FAFB;
          border-color: var(--primary-color);
        }

        .btn-add-screen {
          background-color: var(--primary-color);
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.4rem 0.88rem;
          font-size: 0.81rem;
          font-weight: 600;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(130,0,30,0.22);
          transition: all 0.2s ease;
        }

        .btn-add-screen:hover {
          background-color: var(--primary-hover);
          transform: translateY(-1px);
        }

        .view-toggle-group {
          display: inline-flex;
          background-color: #F3F4F6;
          padding: 2px;
          border-radius: 7px;
          border: 1px solid var(--border-color);
        }

        .view-toggle-btn {
          background: transparent;
          color: var(--text-secondary);
          border: none;
          padding: 0.32rem 0.5rem;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .view-toggle-btn.active {
          background: #FFFFFF;
          color: var(--primary-color);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Compact Controls & Metrics Bar */
        .welcome-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-bottom: 0.8rem;
        }

        .welcome-stat-pills {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .welcome-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          padding: 0.32rem 0.62rem;
          font-size: 0.77rem;
        }

        .welcome-stat-pill.clickable {
          cursor: pointer;
          transition: all 0.15s;
        }

        .welcome-stat-pill.clickable:hover {
          border-color: #059669;
          background: #ECFDF5;
        }

        .w-pill-label {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .w-pill-val {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.82rem;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.6rem;
          flex: 1;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .search-input {
          width: 100%;
          padding: 0.38rem 1.8rem 0.38rem 2rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          font-size: 0.82rem;
          background: #FFFFFF;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: var(--primary-color);
          outline: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        /* Welcome Cards Grid */
        .welcome-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 0.85rem;
        }

        .welcome-card {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
        }

        .welcome-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.07);
          border-color: rgba(130,0,30,0.3);
        }

        .card-image-box {
          position: relative;
          width: 100%;
          height: 138px;
          background: #F3F4F6;
          overflow: hidden;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .welcome-card:hover .card-image {
          transform: scale(1.04);
        }

        .card-image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .welcome-card:hover .card-image-overlay {
          opacity: 1;
        }

        .card-preview-btn {
          background: #FFFFFF;
          color: var(--primary-color);
          border: none;
          padding: 0.35rem 0.7rem;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
          transition: transform 0.15s;
        }

        .card-preview-btn:hover {
          transform: scale(1.05);
        }

        .card-screen-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(130, 0, 30, 0.9);
          color: #FFFFFF;
          padding: 0.18rem 0.55rem;
          border-radius: 16px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .card-body {
          padding: 0.8rem 0.9rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-screen-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #92400E;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.2rem;
        }

        .card-title {
          margin: 0;
          font-size: 0.96rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .card-subtitle {
          margin: 0.2rem 0 0.45rem 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary-color);
        }

        .card-description {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .card-footer-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.65rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--border-color);
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .meta-author {
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-actions-bar {
          background: #FAFAFA;
          border-top: 1px solid var(--border-color);
          padding: 0.55rem 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-mockup-trigger {
          background: none;
          border: 1px solid var(--border-color);
          background-color: #FFFFFF;
          color: var(--primary-color);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.28rem 0.6rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-mockup-trigger:hover {
          border-color: var(--primary-color);
          background: rgba(130,0,30,0.05);
        }

        .card-right-actions {
          display: flex;
          gap: 0.3rem;
        }

        .btn-icon-action {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon-action:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(130,0,30,0.05);
        }

        .btn-icon-action.edit:hover {
          border-color: #2563EB;
          color: #2563EB;
          background: rgba(37,99,235,0.06);
        }

        .btn-icon-action.delete:hover {
          border-color: #DC2626;
          color: #DC2626;
          background: rgba(220,38,38,0.06);
        }

        /* Table View */
        .table-wrapper {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: #FFFFFF;
        }

        .welcome-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.83rem;
        }

        .welcome-table th {
          background: #F9FAFB;
          color: var(--text-secondary);
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--border-color);
        }

        .welcome-table td {
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .welcome-table tr:last-child td {
          border-bottom: none;
        }

        .welcome-table tr:hover td {
          background: #FCFDFD;
        }

        .table-screen-pill {
          display: inline-block;
          background: rgba(130,0,30,0.1);
          color: var(--primary-color);
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 10px;
          border: 1px solid rgba(130,0,30,0.2);
        }

        .table-img-thumb {
          width: 58px;
          height: 38px;
          border-radius: 5px;
          overflow: hidden;
          background: #F3F4F6;
          cursor: pointer;
          border: 1px solid var(--border-color);
        }

        .table-img-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .table-title-cell {
          display: flex;
          flex-direction: column;
        }

        .table-title-text {
          color: var(--text-primary);
          font-size: 0.92rem;
        }

        .table-subtitle-text {
          color: var(--primary-color);
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 0.15rem;
        }

        .table-desc-text {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.84rem;
          line-height: 1.45;
          max-width: 360px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .table-date-cell {
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .table-author-text {
          color: var(--text-primary);
          font-weight: 600;
          margin-top: 0.15rem;
        }

        .table-action-btns {
          display: inline-flex;
          gap: 0.35rem;
        }

        .table-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: #FFFFFF;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .table-action-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .table-action-btn.edit:hover {
          border-color: #2563EB;
          color: #2563EB;
        }

        .table-action-btn.delete:hover {
          border-color: #DC2626;
          color: #DC2626;
        }

        /* Empty / Loading States */
        .loading-state {
          padding: 2rem 1.25rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(130,0,30,0.15);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 0.75rem auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state-box {
          text-align: center;
          padding: 2rem 1.25rem;
          background: #FFFFFF;
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          max-width: 480px;
          margin: 1rem auto;
        }

        .empty-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(130,0,30,0.08);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.85rem auto;
        }

        .empty-state-box h3 {
          margin: 0 0 0.35rem 0;
          font-size: 1.08rem;
          color: var(--text-primary);
        }

        .empty-state-box p {
          color: var(--text-secondary);
          font-size: 0.83rem;
          line-height: 1.45;
          margin: 0 0 1rem 0;
        }

        /* Modal Styles */
        .modal-wide {
          max-width: 860px !important;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0 !important;
          border-radius: 12px;
        }

        .modal-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(130,0,30,0.1);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-subtitle {
          margin: 0.1rem 0 0 0;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .modal-split-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1rem;
          margin-top: 0;
        }

        @media (max-width: 860px) {
          .modal-split-grid {
            grid-template-columns: 1fr;
          }
        }

        .req-star {
          color: #DC2626;
        }

        .input-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        /* Image source tabs */
        .image-mode-tabs {
          display: flex;
          gap: 0.4rem;
          background: #F3F4F6;
          padding: 3px;
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }

        .image-tab-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.45rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .image-tab-btn.active {
          background: #FFFFFF;
          color: var(--primary-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .file-dropzone-box {
          border: 2px dashed var(--border-color);
          border-radius: 10px;
          background: #FAFAFA;
          padding: 1.25rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .file-dropzone-box:hover {
          border-color: var(--primary-color);
          background: rgba(130,0,30,0.02);
        }

        .dropzone-icon {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .dropzone-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .dropzone-note {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .presets-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .preset-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-item:hover {
          border-color: var(--primary-color);
          background: #FAFAFA;
        }

        .preset-item.selected {
          border-color: var(--primary-color);
          background: rgba(130,0,30,0.05);
        }

        .preset-thumb {
          width: 54px;
          height: 36px;
          border-radius: 4px;
          object-fit: cover;
        }

        .preset-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .preset-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .preset-tag {
          font-size: 0.7rem;
          color: var(--primary-color);
        }

        /* Right Preview Pane */
        .preview-pane-col {
          background: #F8F9FA;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .preview-pane-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .preview-screen-num-badge {
          background: rgba(130,0,30,0.1);
          color: var(--primary-color);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 10px;
          text-transform: uppercase;
        }

        /* Phone Screen Mockup */
        .phone-screen-mockup, .phone-standalone-mockup {
          width: 100%;
          max-width: 290px;
          background: #FFFFFF;
          border: 8px solid #2D3748;
          border-radius: 36px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .phone-notch-bar {
          background: #FFFFFF;
          padding: 6px 14px 4px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: #1F2937;
        }

        .phone-speaker {
          width: 48px;
          height: 4px;
          background: #CBD5E1;
          border-radius: 4px;
        }

        .phone-icons {
          display: flex;
          gap: 4px;
          font-size: 0.6rem;
        }

        .phone-app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 14px;
          background: #FFFFFF;
        }

        .phone-logo-text {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--primary-color);
        }

        .phone-skip-btn {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .phone-banner-area {
          width: 100%;
          height: 145px;
          background: #FFFBF0;
          position: relative;
          overflow: hidden;
        }

        .phone-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .phone-banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9CA3AF;
          font-size: 0.72rem;
          gap: 0.4rem;
          padding: 0.75rem;
          text-align: center;
        }

        .phone-content-area {
          padding: 0.75rem 0.95rem 0.95rem 0.95rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #FFFFFF;
          flex: 1;
        }

        .phone-sacred-symbol {
          font-size: 1.2rem;
          color: var(--secondary-color);
          margin-bottom: 0.2rem;
          line-height: 1;
        }

        .phone-title {
          margin: 0;
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1.25;
        }

        .phone-subtitle {
          margin: 0.2rem 0 0.4rem 0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #7A5C43;
        }

        .phone-desc {
          margin: 0;
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .phone-dots {
          display: flex;
          gap: 5px;
          margin: 0.65rem 0;
        }

        .phone-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E5E7EB;
        }

        .phone-dot.active {
          width: 16px;
          border-radius: 6px;
          background: var(--primary-color);
        }

        .phone-cta-button {
          width: 100%;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
          color: #FFFFFF;
          padding: 0.45rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: 0 3px 8px rgba(130,0,30,0.22);
        }

        .phone-home-indicator {
          width: 80px;
          height: 4px;
          background: #1F2937;
          border-radius: 4px;
          margin: 6px auto 5px auto;
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          padding: 0.7rem 1.15rem;
          border-top: 1px solid var(--border-color);
        }

        .preview-modal-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .phone-standalone-mockup {
          margin: 0 auto;
          max-width: 320px;
        }
      `}</style>
    </div>
  );
};

export default ManageWelcomeScreen;
