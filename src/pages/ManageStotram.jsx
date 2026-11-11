import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdMusicNote,
  MdClose,
  MdLibraryBooks,
  MdEdit,
  MdDeleteOutline,
  MdSearch,
  MdRefresh,
  MdStar,
  MdStarBorder,
  MdPictureAsPdf,
  MdSave,
  MdAudiotrack,
  MdVisibility,
  MdViewList,
  MdViewModule
} from 'react-icons/md';
import AudioPlayerUI from '../components/AudioPlayerUI';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { getAllStotramCategories } from '../api/stotramCategory';
import {
  getAllStotramSubCategories,
  createStotramSubCategory,
  updateStotramSubCategory,
  deleteStotramSubCategory
} from '../api/stotramSubCategory';

const unwrapData = (res, key) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (key && Array.isArray(res[key])) return res[key];
  if (key && res.data && Array.isArray(res.data[key])) return res.data[key];
  return [];
};

const idOf = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item._id || item.id || '';
};

const emptyStotraForm = {
  categoryId: '',
  title: '',
  textEditor: '',
  audioFile: '',
  pdf: '',
  isFavorite: false,
};

const ManageStotram = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirm } = useConfirmModal();

  // Selected filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modals
  const [selectedStotraForPreview, setSelectedStotraForPreview] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStotraId, setEditingStotraId] = useState(null);
  const [stotraForm, setStotraForm] = useState(emptyStotraForm);

  // Queries
  const {
    data: rawCategories,
    isLoading: isCatLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['stotramCategories'],
    queryFn: getAllStotramCategories,
  });

  const {
    data: rawStotras,
    isLoading: isStotrasLoading,
    refetch: refetchStotras
  } = useQuery({
    queryKey: ['stotramSubCategories'],
    queryFn: getAllStotramSubCategories,
  });

  const categories = useMemo(() => unwrapData(rawCategories, 'categories'), [rawCategories]);
  const stotras = useMemo(() => unwrapData(rawStotras, 'subCategories'), [rawStotras]);

  // Filtered Stotras
  const filteredStotras = useMemo(() => {
    return stotras.filter((stotra) => {
      const cat = stotra.categoryId;
      const catId = typeof cat === 'object' && cat ? idOf(cat) : (cat || '');
      const catName = typeof cat === 'object' && cat ? (cat.categoryName || '') : '';

      // Category filter
      if (selectedCategory !== 'all') {
        const matchesId = catId === selectedCategory;
        const matchesName = catName.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesId && !matchesName) return false;
      }

      // Favorite filter
      if (favoriteOnly && !stotra.isFavorite) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (stotra.title || stotra.subCategoryName || '').toLowerCase();
        const text = (stotra.textEditor || '').toLowerCase();
        const matchesCategory = catName.toLowerCase().includes(q);

        return title.includes(q) || text.includes(q) || matchesCategory;
      }

      return true;
    });
  }, [stotras, selectedCategory, favoriteOnly, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = stotras.length;
    const favorites = stotras.filter((s) => s.isFavorite).length;
    const hasAudio = stotras.filter((s) => Boolean(s.audioFile)).length;
    const hasPdf = stotras.filter((s) => Boolean(s.pdf)).length;
    const totalCats = categories.length;
    return { total, favorites, hasAudio, hasPdf, totalCats };
  }, [stotras, categories]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Stotram added successfully!');
      closeEditModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create stotram');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateStotramSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Stotram updated successfully!');
      closeEditModal();
      if (selectedStotraForPreview) {
        setSelectedStotraForPreview(null);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update stotram');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Stotram deleted successfully!');
      if (selectedStotraForPreview) {
        setSelectedStotraForPreview(null);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete stotram');
    }
  });

  // Modal Handlers
  const openCreateModal = () => {
    setEditingStotraId(null);
    setStotraForm({
      ...emptyStotraForm,
      categoryId: categories.length > 0 ? idOf(categories[0]) : '',
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (stotra) => {
    const rawCat = stotra.categoryId;
    const catId = typeof rawCat === 'object' && rawCat ? idOf(rawCat) : (rawCat || '');

    setEditingStotraId(idOf(stotra));
    setStotraForm({
      categoryId: catId,
      title: stotra.title || stotra.subCategoryName || '',
      textEditor: stotra.textEditor || '',
      audioFile: stotra.audioFile || '',
      pdf: stotra.pdf || '',
      isFavorite: Boolean(stotra.isFavorite),
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStotraId(null);
    setStotraForm(emptyStotraForm);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!stotraForm.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!stotraForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!stotraForm.textEditor.trim()) {
      toast.error('Stotram lyrics/content is required');
      return;
    }

    const payload = {
      categoryId: stotraForm.categoryId.trim(),
      title: stotraForm.title.trim(),
      textEditor: stotraForm.textEditor.trim(),
      audioFile: (stotraForm.audioFile || '').trim(),
      pdf: (stotraForm.pdf || '').trim(),
      isFavorite: Boolean(stotraForm.isFavorite),
    };

    if (editingStotraId) {
      updateMutation.mutate({ id: editingStotraId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteStotra = (stotra) => {
    const id = idOf(stotra);
    showConfirm(`Are you sure you want to delete "${stotra.title || 'this stotram'}"?`, () => {
      deleteMutation.mutate(id);
    });
  };

  const toggleFavorite = (stotra, e) => {
    e.stopPropagation();
    const id = idOf(stotra);
    const cat = stotra.categoryId;
    const catId = typeof cat === 'object' && cat ? idOf(cat) : (cat || '');

    const payload = {
      categoryId: catId,
      title: stotra.title || stotra.subCategoryName || '',
      textEditor: stotra.textEditor || '',
      audioFile: stotra.audioFile || '',
      pdf: stotra.pdf || '',
      isFavorite: !stotra.isFavorite,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-content animate-fade-in">
      {/* TOP HEADER */}
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <div>
          <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <MdMusicNote size={21} />
            Manage Stotram & Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.1rem', marginBottom: 0 }}>
            Manage Vedic stotras, Sanskrit recitations, audio tracks, and devotional categories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              refetchStotras();
              refetchCategories();
              toast.success('Stotram library refreshed');
            }}
            title="Refresh Library"
            style={{ padding: '0.42rem 0.65rem' }}
          >
            <MdRefresh size={16} />
          </button>

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
              title="Card View"
            >
              <MdViewModule size={17} />
            </button>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => navigate('/manage-stotram-categories')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.42rem 0.8rem' }}
          >
            <MdLibraryBooks size={16} />
            Categories
          </button>

          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.42rem 0.9rem' }}
          >
            <MdAdd size={17} />
            Upload Stotra
          </button>
        </div>
      </div>

      {/* COMPACT STAT PILLS + SEARCH & CATEGORY FILTER */}
      <div className="compact-controls-bar">
        <div className="compact-stat-pills">
          <div className="compact-stat-pill">
            <span className="compact-stat-pill-label">Total</span>
            <strong className="compact-stat-pill-val">{stats.total}</strong>
          </div>

          <button
            type="button"
            className={`compact-stat-pill clickable ${favoriteOnly ? 'active-warning' : ''}`}
            onClick={() => setFavoriteOnly((prev) => !prev)}
            title="Click to filter favorite stotrams"
          >
            <MdStar size={14} color="#EAB308" />
            <span className="compact-stat-pill-label">Favorites</span>
            <strong className="compact-stat-pill-val" style={{ color: '#B45309' }}>{stats.favorites}</strong>
          </button>

          <div className="compact-stat-pill">
            <MdAudiotrack size={14} color="#059669" />
            <span className="compact-stat-pill-label">Audio</span>
            <strong className="compact-stat-pill-val" style={{ color: '#047857' }}>{stats.hasAudio}</strong>
          </div>

          <div className="compact-stat-pill">
            <MdPictureAsPdf size={14} color="#2563EB" />
            <span className="compact-stat-pill-label">PDFs</span>
            <strong className="compact-stat-pill-val" style={{ color: '#1D4ED8' }}>{stats.hasPdf}</strong>
          </div>
        </div>

        <div className="compact-filter-toolbar">
          <div className="compact-search-wrap">
            <MdSearch size={16} className="compact-search-icon" />
            <input
              type="text"
              placeholder="Search stotram, category, or lyrics..."
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
            <option value="all">All Categories ({stotras.length})</option>
            {categories.map((cat) => {
              const catId = idOf(cat);
              const count = stotras.filter((s) => {
                const sc = s.categoryId;
                const scId = typeof sc === 'object' && sc ? idOf(sc) : sc;
                return scId === catId;
              }).length;
              return (
                <option key={catId} value={catId}>
                  {cat.categoryName} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* LIST OR GRID OF STOTRAMS */}
      {isStotrasLoading || isCatLoading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto', borderTopColor: 'var(--primary-color)' }}></div>
          <p style={{ marginTop: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>Loading stotram library...</p>
        </div>
      ) : filteredStotras.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <MdMusicNote size={44} style={{ color: 'var(--border-color)', marginBottom: '0.65rem' }} />
          <h3 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary)', fontSize: '1rem' }}>No Stotrams Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1rem auto', fontSize: '0.84rem' }}>
            {searchQuery || selectedCategory !== 'all' || favoriteOnly
              ? 'No stotram matched your current filter criteria. Try resetting the filters.'
              : 'Your stotram library is empty. Click below to add your first stotram.'}
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <MdAdd size={17} /> Upload Stotra
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{filteredStotras.length}</strong> of <strong>{stotras.length}</strong> stotrams
            </span>
          </div>
          <table className="clean-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>#</th>
                <th>Title & Recitation Preview</th>
                <th>Category</th>
                <th>Media</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStotras.map((stotra, idx) => {
                const stotraId = idOf(stotra);
                const cat = stotra.categoryId;
                const catName = typeof cat === 'object' && cat ? cat.categoryName : categories.find((c) => idOf(c) === cat)?.categoryName;
                const plainText = stotra.textEditor ? stotra.textEditor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

                return (
                  <tr key={stotraId} style={{ cursor: 'pointer' }} onClick={() => setSelectedStotraForPreview(stotra)}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stotra.title || stotra.subCategoryName || 'Untitled Stotram'}
                      </div>
                      {plainText && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {plainText}
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
                        {catName || 'Devotional'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {stotra.audioFile ? (
                          <span style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.45rem', borderRadius: '5px', background: '#ECFDF5', color: '#047857', fontWeight: 600 }}>
                            <MdAudiotrack size={12} /> Audio
                          </span>
                        ) : null}
                        {stotra.pdf ? (
                          <span style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.15rem 0.45rem', borderRadius: '5px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                            <MdPictureAsPdf size={12} /> PDF
                          </span>
                        ) : null}
                        {!stotra.audioFile && !stotra.pdf && (
                          <span style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(stotra, e)}
                        className={`clean-flag-pill ${stotra.isFavorite ? 'is-fav' : ''}`}
                        title={stotra.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                      >
                        {stotra.isFavorite ? <MdStar size={12} /> : <MdStarBorder size={12} />}
                        {stotra.isFavorite ? 'Fav' : 'Normal'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          className="btn-icon-sm"
                          title="Preview"
                          onClick={() => setSelectedStotraForPreview(stotra)}
                        >
                          <MdVisibility size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sm edit"
                          title="Edit"
                          onClick={() => openEditModal(stotra)}
                        >
                          <MdEdit size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-sm delete"
                          title="Delete"
                          onClick={() => handleDeleteStotra(stotra)}
                        >
                          <MdDeleteOutline size={15} />
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
        <div className="stotram-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(265px, 100%), 1fr))', gap: '0.75rem' }}>
          {filteredStotras.map((stotra) => {
            const stotraId = idOf(stotra);
            const cat = stotra.categoryId;
            const catName = typeof cat === 'object' && cat ? cat.categoryName : categories.find((c) => idOf(c) === cat)?.categoryName;

            return (
              <div
                key={stotraId}
                className="stotram-list-item glass-panel"
                style={{
                  padding: '0.85rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => setSelectedStotraForPreview(stotra)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(130, 0, 30, 0.08)',
                        color: 'var(--primary-color)',
                        border: '1px solid rgba(130, 0, 30, 0.15)',
                      }}
                    >
                      {catName || 'Devotional'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(stotra, e)}
                      title={stotra.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.15rem',
                        color: stotra.isFavorite ? '#EAB308' : '#9CA3AF',
                      }}
                    >
                      {stotra.isFavorite ? <MdStar size={19} /> : <MdStarBorder size={19} />}
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '0.96rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {stotra.title || stotra.subCategoryName || 'Untitled Stotram'}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.42',
                      maxHeight: '3.4rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      marginBottom: '0.65rem',
                      fontStyle: 'italic',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: stotra.textEditor ? stotra.textEditor.replace(/<[^>]+>/g, ' ').slice(0, 150) + '...' : 'No content available.',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    {stotra.audioFile ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(23, 74, 13, 0.08)',
                          color: 'var(--success-color)',
                          fontWeight: '600',
                        }}
                      >
                        <MdAudiotrack size={12} /> Audio Available
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: '#9CA3AF', padding: '0.15rem 0.4rem' }}>No Audio</span>
                    )}

                    {stotra.pdf && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563EB',
                          fontWeight: '600',
                        }}
                      >
                        <MdPictureAsPdf size={12} /> PDF Document
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.55rem',
                    marginTop: '0.25rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.28rem 0.6rem', fontSize: '0.72rem' }}
                    onClick={() => setSelectedStotraForPreview(stotra)}
                  >
                    <MdVisibility size={13} /> Preview
                  </button>

                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      className="btn-icon-sm edit"
                      title="Edit Stotra"
                      onClick={() => openEditModal(stotra)}
                    >
                      <MdEdit size={15} />
                    </button>
                    <button
                      className="btn-icon-sm delete"
                      title="Delete Stotra"
                      onClick={() => handleDeleteStotra(stotra)}
                    >
                      <MdDeleteOutline size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW STOTRA WITH AUDIO PLAYER & CONTENT       */}
      {/* ======================================================== */}
      {selectedStotraForPreview && (
        <div className="modal-overlay" onClick={() => setSelectedStotraForPreview(null)}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.15rem' }}
          >
            <div className="modal-header" style={{ padding: '0 0 0.7rem 0', marginBottom: '0.85rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(130, 0, 30, 0.08)',
                    color: 'var(--primary-color)',
                  }}
                >
                  {typeof selectedStotraForPreview.categoryId === 'object' && selectedStotraForPreview.categoryId
                    ? selectedStotraForPreview.categoryId.categoryName
                    : 'Stotram'}
                </span>
                <h2 className="modal-title" style={{ marginTop: '0.25rem', color: 'var(--primary-color)', fontSize: '1.05rem' }}>
                  {selectedStotraForPreview.title || selectedStotraForPreview.subCategoryName}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStotraForPreview(null)}>
                <MdClose size={20} />
              </button>
            </div>

            {/* Audio Player if URL exists */}
            {selectedStotraForPreview.audioFile && (
              <div style={{ marginBottom: '0.95rem', background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Recitation Audio Track
                </div>
                <AudioPlayerUI
                  title={selectedStotraForPreview.title}
                  audioUrl={selectedStotraForPreview.audioFile}
                />
              </div>
            )}

            {/* Stotram Text / Lyrics Content */}
            <div style={{ marginBottom: '0.95rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Stotram Text / Recitation Content
              </div>
              <div
                style={{
                  background: '#FAFAFA',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.9rem',
                  fontSize: '0.92rem',
                  lineHeight: '1.65',
                  color: 'var(--text-primary)',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  fontFamily: 'serif',
                }}
                dangerouslySetInnerHTML={{
                  __html: selectedStotraForPreview.textEditor || '<p>No content provided.</p>',
                }}
              />
            </div>

            {/* PDF Download link if available */}
            {selectedStotraForPreview.pdf && (
              <div style={{ marginBottom: '0.95rem' }}>
                <a
                  href={selectedStotraForPreview.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <MdPictureAsPdf size={16} color="#EF4444" /> View PDF Document
                </a>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const s = selectedStotraForPreview;
                  setSelectedStotraForPreview(null);
                  openEditModal(s);
                }}
              >
                <MdEdit size={15} /> Edit Stotra
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedStotraForPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT STOTRA (SUB CATEGORY)               */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MdMusicNote size={18} />
                {editingStotraId ? 'Edit Stotram' : 'Add New Stotram'}
              </h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1rem 1.15rem', gap: '0.7rem' }}>
              {/* Category */}
              <div className="input-group">
                <label className="input-label" htmlFor="stotra-cat">
                  Select Category <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <select
                  id="stotra-cat"
                  className="input-field"
                  value={stotraForm.categoryId}
                  onChange={(e) => setStotraForm({ ...stotraForm, categoryId: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Choose a category...
                  </option>
                  {categories.map((c) => (
                    <option key={idOf(c)} value={idOf(c)}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="input-group">
                <label className="input-label" htmlFor="stotra-title">
                  Stotram Title <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <input
                  id="stotra-title"
                  className="input-field"
                  placeholder="e.g. Shiv Tandav Stotram"
                  value={stotraForm.title}
                  onChange={(e) => setStotraForm({ ...stotraForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Text / Content */}
              <div className="input-group">
                <label className="input-label" htmlFor="stotra-text">
                  Text Content / Sanskrit Lyrics <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <textarea
                  id="stotra-text"
                  className="input-field"
                  rows="6"
                  placeholder="Enter full Sanskrit shlokas, stotram text, or HTML content..."
                  value={stotraForm.textEditor}
                  onChange={(e) => setStotraForm({ ...stotraForm, textEditor: e.target.value })}
                  required
                  style={{ resize: 'vertical', fontFamily: 'serif' }}
                />
              </div>

              {/* Audio URL */}
              <div className="input-group">
                <label className="input-label" htmlFor="stotra-audio">
                  Audio File URL (.mp3 / stream link)
                </label>
                <input
                  id="stotra-audio"
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/audio/stotra.mp3"
                  value={stotraForm.audioFile}
                  onChange={(e) => setStotraForm({ ...stotraForm, audioFile: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Direct MP3 or audio stream URL for in-app audio recitation player.
                </span>
              </div>

              {/* PDF URL */}
              <div className="input-group">
                <label className="input-label" htmlFor="stotra-pdf">
                  PDF Document URL
                </label>
                <input
                  id="stotra-pdf"
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/pdf/stotra.pdf"
                  value={stotraForm.pdf}
                  onChange={(e) => setStotraForm({ ...stotraForm, pdf: e.target.value })}
                />
              </div>

              {/* Is Favorite */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={stotraForm.isFavorite}
                  onChange={(e) => setStotraForm({ ...stotraForm, isFavorite: e.target.checked })}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MdStar color="#EAB308" /> Mark as Favorite
                </span>
              </label>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-outline" onClick={closeEditModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={16} />
                  {isSaving ? 'Saving...' : editingStotraId ? 'Update Stotra' : 'Save Stotra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotram;
