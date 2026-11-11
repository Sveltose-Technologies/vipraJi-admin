import React, { useState, useMemo, useEffect } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdClose,
  MdSave,
  MdLibraryBooks,
  MdSearch,
  MdRefresh,
  MdViewModule,
  MdViewList,
  MdStar,
  MdStarBorder,
  MdOfflinePin,
  MdCloudOff,
  MdPictureAsPdf,
  MdVisibility,
  MdLink,
  MdUploadFile,
  MdFolderOpen,
  MdCheckCircle,
} from 'react-icons/md';
import {
  getAllPoojaCategories,
  getAllPoojaSubCategories,
  createPoojaCategory,
  createPoojaSubCategory,
} from '../api/poojaCategory';
import { getAllPoojas, getPoojaById, createPooja, updatePooja, deletePooja } from '../api/pooja';
import RichTextEditor from '../components/RichTextEditor';

const SECTION_TYPES = ['Heading', 'Description', 'Dhyan', 'Mantra', 'Notes'];

const SECTION_BADGE_STYLES = {
  Heading: { bg: 'rgba(130, 0, 30, 0.1)', color: '#82001E', border: 'rgba(130, 0, 30, 0.25)' },
  Description: { bg: 'rgba(37, 99, 235, 0.1)', color: '#1D4ED8', border: 'rgba(37, 99, 235, 0.25)' },
  Dhyan: { bg: 'rgba(124, 58, 237, 0.1)', color: '#6D28D9', border: 'rgba(124, 58, 237, 0.25)' },
  Mantra: { bg: 'rgba(217, 119, 6, 0.12)', color: '#B45309', border: 'rgba(217, 119, 6, 0.3)' },
  Notes: { bg: 'rgba(5, 150, 105, 0.1)', color: '#047857', border: 'rgba(5, 150, 105, 0.25)' },
};

const INITIAL_FORM = {
  categoryId: '',
  subCategoryId: '',
  sectionType: 'Mantra',
  title: '',
  content: '',
  textEditor: '',
  isFavorite: false,
  isAvailableOffline: true,
  pdf: '',
};

const idOf = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val._id || val.id || '';
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

const ManagePooja = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters & view state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterFavOnly, setFilterFavOnly] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [pdfInputMode, setPdfInputMode] = useState('url'); // 'url' | 'upload'
  const [uploadedPdfName, setUploadedPdfName] = useState('');

  // View detail modal state (uses GET /pooja/get-by-id/:id)
  const [viewingId, setViewingId] = useState(null);

  // Nested category modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [subCatModalOpen, setSubCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  // Queries
  const { data: rawCategories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['poojaCategories'],
    queryFn: getAllPoojaCategories,
  });

  const { data: rawSubCategories = [], isLoading: isSubCatLoading } = useQuery({
    queryKey: ['poojaSubCategories'],
    queryFn: getAllPoojaSubCategories,
  });

  const {
    data: rawPoojas = [],
    isLoading: isPoojaLoading,
    isFetching: isPoojaFetching,
    refetch: refetchPoojas,
  } = useQuery({
    queryKey: ['poojas'],
    queryFn: () => getAllPoojas(),
  });

  // Fetch single pooja by ID when viewing or editing
  const { data: rawEditDetail, isFetching: isEditDetailFetching } = useQuery({
    queryKey: ['poojaDetail', editingId],
    queryFn: () => getPoojaById(editingId),
    enabled: Boolean(isFormOpen && editingId),
  });

  const { data: rawViewDetail, isFetching: isViewDetailFetching } = useQuery({
    queryKey: ['poojaDetail', viewingId],
    queryFn: () => getPoojaById(viewingId),
    enabled: Boolean(viewingId),
  });

  // Sync fetched detail into formState when editing
  useEffect(() => {
    if (!isFormOpen || !editingId || !rawEditDetail) return;
    const detail = rawEditDetail?.data || rawEditDetail;
    if (!detail || !detail._id) return;

    setFormState({
      categoryId: idOf(detail.categoryId),
      subCategoryId: idOf(detail.subCategoryId),
      sectionType: detail.sectionType || 'Mantra',
      title: detail.title || '',
      content: detail.content || '',
      textEditor: detail.textEditor || '',
      isFavorite: Boolean(detail.isFavorite),
      isAvailableOffline: detail.isAvailableOffline !== undefined ? Boolean(detail.isAvailableOffline) : true,
      pdf: detail.pdf || '',
    });
    if (detail.pdf?.startsWith('data:')) {
      setPdfInputMode('upload');
      setUploadedPdfName('Attached PDF Document');
    } else {
      setPdfInputMode('url');
      setUploadedPdfName('');
    }
  }, [rawEditDetail, editingId, isFormOpen]);

  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : rawCategories?.data || rawCategories?.categories || []),
    [rawCategories]
  );

  const subCategories = useMemo(
    () => (Array.isArray(rawSubCategories) ? rawSubCategories : rawSubCategories?.data || rawSubCategories?.subCategories || []),
    [rawSubCategories]
  );

  const poojas = useMemo(
    () => (Array.isArray(rawPoojas) ? rawPoojas : rawPoojas?.data || rawPoojas?.poojas || []),
    [rawPoojas]
  );

  // Filtered subcategories for selected category in form
  const filteredSubCategories = useMemo(() => {
    if (!formState.categoryId) return [];
    return subCategories.filter((sub) => String(idOf(sub.categoryId)) === String(formState.categoryId));
  }, [subCategories, formState.categoryId]);

  // Filtered list for UI
  const filteredPoojas = useMemo(() => {
    return poojas.filter((item) => {
      if (filterCategory !== 'all' && String(idOf(item.categoryId)) !== String(filterCategory)) {
        return false;
      }
      if (filterSection !== 'all' && item.sectionType !== filterSection) {
        return false;
      }
      if (filterFavOnly && !item.isFavorite) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        const richText = stripHtml(item.textEditor).toLowerCase();
        const catName = (item.categoryId?.categoryName || '').toLowerCase();
        const subName = (item.subCategoryId?.subCategoryName || '').toLowerCase();
        return (
          title.includes(q) ||
          content.includes(q) ||
          richText.includes(q) ||
          catName.includes(q) ||
          subName.includes(q)
        );
      }
      return true;
    });
  }, [poojas, filterCategory, filterSection, filterFavOnly, searchQuery]);

  // Summary metrics
  const stats = useMemo(() => {
    const total = poojas.length;
    const favorites = poojas.filter((p) => p.isFavorite).length;
    const offline = poojas.filter((p) => p.isAvailableOffline).length;
    const withPdf = poojas.filter((p) => p.pdf && p.pdf.trim() !== '').length;
    return { total, favorites, offline, withPdf };
  }, [poojas]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPooja,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojas'] });
      toast.success('Pooja created successfully!');
      closeFormModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to create pooja';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePooja(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poojas'] });
      queryClient.invalidateQueries({ queryKey: ['poojaDetail', variables.id] });
      toast.success('Pooja updated successfully!');
      if (isFormOpen) closeFormModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to update pooja';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePooja,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojas'] });
      toast.success('Pooja deleted successfully');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err.message || 'Failed to delete pooja';
      toast.error(msg);
    },
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormState(INITIAL_FORM);
    setPdfInputMode('url');
    setUploadedPdfName('');
    setIsFormOpen(true);
  };

  const openEditModal = (pooja) => {
    const id = idOf(pooja);
    setEditingId(id);
    // Pre-fill immediately with list row data while GET /pooja/get-by-id/:id refreshes in background
    setFormState({
      categoryId: idOf(pooja.categoryId),
      subCategoryId: idOf(pooja.subCategoryId),
      sectionType: pooja.sectionType || 'Mantra',
      title: pooja.title || '',
      content: pooja.content || '',
      textEditor: pooja.textEditor || '',
      isFavorite: Boolean(pooja.isFavorite),
      isAvailableOffline: pooja.isAvailableOffline !== undefined ? Boolean(pooja.isAvailableOffline) : true,
      pdf: pooja.pdf || '',
    });
    if (pooja.pdf?.startsWith('data:')) {
      setPdfInputMode('upload');
      setUploadedPdfName('Attached PDF Document');
    } else {
      setPdfInputMode('url');
      setUploadedPdfName('');
    }
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState(INITIAL_FORM);
    setUploadedPdfName('');
  };

  const handlePdfFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF file must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((prev) => ({ ...prev, pdf: reader.result }));
      setUploadedPdfName(file.name);
      toast.success(`Loaded "${file.name}"`);
    };
    reader.onerror = () => toast.error('Failed to read PDF file');
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!formState.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!formState.subCategoryId) {
      toast.error('Please select a sub category');
      return;
    }
    if (!formState.sectionType) {
      toast.error('Please select a section type');
      return;
    }
    if (!formState.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const payload = {
      categoryId: formState.categoryId,
      subCategoryId: formState.subCategoryId,
      sectionType: formState.sectionType,
      title: formState.title.trim(),
      content: formState.content.trim(),
      textEditor: formState.textEditor || '',
      isFavorite: Boolean(formState.isFavorite),
      isAvailableOffline: Boolean(formState.isAvailableOffline),
      pdf: (formState.pdf || '').trim(),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleQuickToggle = (pooja, field) => {
    const id = idOf(pooja);
    const nextVal = !pooja[field];
    updateMutation.mutate({
      id,
      data: { [field]: nextVal },
    });
  };

  const handleDelete = (pooja) => {
    const id = idOf(pooja);
    showConfirm(
      `Are you sure you want to delete "${pooja.title}"? This action cannot be undone.`,
      () => deleteMutation.mutate(id)
    );
  };

  const resolveCategoryName = (pooja) => {
    if (pooja.categoryId && typeof pooja.categoryId === 'object' && pooja.categoryId.categoryName) {
      return pooja.categoryId.categoryName;
    }
    const found = categories.find((c) => String(idOf(c)) === String(idOf(pooja.categoryId)));
    return found ? found.categoryName : 'Uncategorized';
  };

  const resolveSubCategoryName = (pooja) => {
    if (pooja.subCategoryId && typeof pooja.subCategoryId === 'object' && pooja.subCategoryId.subCategoryName) {
      return pooja.subCategoryId.subCategoryName;
    }
    const found = subCategories.find((s) => String(idOf(s)) === String(idOf(pooja.subCategoryId)));
    return found ? found.subCategoryName : 'Uncategorized';
  };

  const viewedPooja = useMemo(() => {
    if (!viewingId) return null;
    const fromDetail = rawViewDetail?.data || rawViewDetail;
    if (fromDetail && fromDetail._id) return fromDetail;
    return poojas.find((p) => String(idOf(p)) === String(viewingId)) || null;
  }, [viewingId, rawViewDetail, poojas]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="pooja-page-container animate-fade-in">
      {/* Compact Professional Header */}
      <div className="pooja-header">
        <div className="pooja-header-left">
          <div className="pooja-icon-badge">
            <MdLibraryBooks size={20} color="var(--primary-color)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 className="pooja-header-title">Manage Pooja Library</h1>
              <span className="pooja-badge-pill">{stats.total} Sections</span>
            </div>
            <p className="pooja-header-subtitle">
              Heading, Description, Dhyan, Mantra &amp; Notes with rich text and PDF guides
            </p>
          </div>
        </div>

        <div className="pooja-header-actions">
          <button
            onClick={() => refetchPoojas()}
            disabled={isPoojaFetching}
            className="btn-outline-action"
            title="Refresh poojas"
          >
            <MdRefresh size={16} className={isPoojaFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/manage-pooja-categories')}
            className="btn-outline-action"
          >
            <MdFolderOpen size={16} />
            <span>Categories</span>
          </button>

          <div className="view-toggle-group">
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="List View"
            >
              <MdViewList size={17} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
            >
              <MdViewModule size={17} />
            </button>
          </div>

          <button onClick={openAddModal} className="btn-primary-action">
            <MdAdd size={18} />
            <span>Add Pooja</span>
          </button>
        </div>
      </div>

      {/* Compact Metrics + Search & Filter Toolbar */}
      <div className="pooja-controls-bar">
        <div className="stat-pills-strip">
          <div className="stat-pill">
            <MdLibraryBooks size={14} color="var(--primary-color)" />
            <span className="stat-pill-label">Total</span>
            <strong className="stat-pill-val">{stats.total}</strong>
          </div>

          <button
            type="button"
            className={`stat-pill clickable ${filterFavOnly ? 'active-fav' : ''}`}
            onClick={() => setFilterFavOnly((prev) => !prev)}
            title="Click to filter Favorites"
          >
            <MdStar size={14} color="#D97706" />
            <span className="stat-pill-label">Favorites</span>
            <strong className="stat-pill-val" style={{ color: '#B45309' }}>{stats.favorites}</strong>
          </button>

          <div className="stat-pill">
            <MdOfflinePin size={14} color="#059669" />
            <span className="stat-pill-label">Offline</span>
            <strong className="stat-pill-val" style={{ color: '#047857' }}>{stats.offline}</strong>
          </div>

          <div className="stat-pill">
            <MdPictureAsPdf size={14} color="#DC2626" />
            <span className="stat-pill-label">PDFs</span>
            <strong className="stat-pill-val" style={{ color: '#DC2626' }}>{stats.withPdf}</strong>
          </div>
        </div>

        <div className="filter-toolbar">
          <div className="search-input-wrap">
            <MdSearch size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search title, content, mantra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear" title="Clear">
                <MdClose size={15} />
              </button>
            )}
          </div>

          <div className="filter-controls">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={idOf(c)} value={idOf(c)}>
                  {c.categoryName}
                </option>
              ))}
            </select>

            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Sections</option>
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isPoojaLoading || isCatLoading || isSubCatLoading ? (
        <div className="loading-box">
          <div className="spinner" />
          <p>Loading pooja library...</p>
        </div>
      ) : filteredPoojas.length === 0 ? (
        <div className="empty-box">
          <MdLibraryBooks size={44} color="var(--primary-color)" style={{ opacity: 0.7 }} />
          <h3>No Poojas Found</h3>
          <p>
            {searchQuery || filterCategory !== 'all' || filterSection !== 'all' || filterFavOnly
              ? 'No pooja items match your active filters.'
              : 'Get started by adding your first formatted Pooja section.'}
          </p>
          {searchQuery || filterCategory !== 'all' || filterSection !== 'all' || filterFavOnly ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterSection('all');
                setFilterFavOnly(false);
              }}
              className="btn-outline-action"
            >
              Reset Filters
            </button>
          ) : (
            <button onClick={openAddModal} className="btn-primary-action">
              <MdAdd size={20} /> Add First Pooja
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="pooja-grid">
          {filteredPoojas.map((pooja) => {
            const id = idOf(pooja);
            const catName = resolveCategoryName(pooja);
            const subName = resolveSubCategoryName(pooja);
            const badgeStyle = SECTION_BADGE_STYLES[pooja.sectionType] || SECTION_BADGE_STYLES.Notes;
            const richPreview = stripHtml(pooja.textEditor);

            return (
              <div key={id} className="pooja-card">
                {/* Card Top Badges */}
                <div className="pooja-card-top">
                  <span
                    className="section-type-badge"
                    style={{
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      borderColor: badgeStyle.border,
                    }}
                  >
                    {pooja.sectionType || 'Notes'}
                  </span>

                  <div className="card-status-icons">
                    <button
                      type="button"
                      onClick={() => handleQuickToggle(pooja, 'isFavorite')}
                      className={`status-icon-btn ${pooja.isFavorite ? 'is-fav' : ''}`}
                      title={pooja.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      {pooja.isFavorite ? <MdStar size={19} /> : <MdStarBorder size={19} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickToggle(pooja, 'isAvailableOffline')}
                      className={`status-icon-btn ${pooja.isAvailableOffline ? 'is-offline' : ''}`}
                      title={pooja.isAvailableOffline ? 'Available Offline' : 'Online Only'}
                    >
                      {pooja.isAvailableOffline ? <MdOfflinePin size={18} /> : <MdCloudOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Category Breadcrumb */}
                <div className="pooja-breadcrumb">
                  <span>{catName}</span>
                  <span>›</span>
                  <span className="sub-crumb">{subName}</span>
                </div>

                {/* Title & Content */}
                <h3 className="pooja-card-title">{pooja.title}</h3>
                {pooja.content && <p className="pooja-card-content">{pooja.content}</p>}

                {/* Formatted Text Editor Snippet */}
                <div className="pooja-rte-snippet">
                  <div className="snippet-label">Formatted Text Content:</div>
                  <p className="snippet-body">
                    {richPreview || 'No rich text formatted content added yet.'}
                  </p>
                </div>

                {/* PDF Indicator */}
                {pooja.pdf && (
                  <div className="pooja-pdf-chip">
                    <MdPictureAsPdf size={15} color="#DC2626" />
                    <span>PDF Guide Attached</span>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="pooja-card-footer">
                  <button
                    type="button"
                    onClick={() => setViewingId(id)}
                    className="btn-view-detail"
                  >
                    <MdVisibility size={16} /> View Full Content
                  </button>

                  <div className="card-action-btns">
                    <button
                      type="button"
                      onClick={() => openEditModal(pooja)}
                      className="btn-icon-sm edit"
                      title="Edit Pooja"
                    >
                      <MdEdit size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pooja)}
                      className="btn-icon-sm delete"
                      title="Delete Pooja"
                    >
                      <MdDeleteOutline size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="table-wrap glass-panel">
          <div className="table-list-header">
            <span className="table-list-count">
              Showing <strong>{filteredPoojas.length}</strong> of <strong>{poojas.length}</strong> Pooja entries
            </span>
          </div>
          <table className="pooja-table">
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                <th>Title & Content</th>
                <th>Category / Sub Category</th>
                <th style={{ width: '120px' }}>Section</th>
                <th style={{ width: '170px' }}>Status</th>
                <th style={{ width: '90px' }}>PDF</th>
                <th style={{ width: '115px' }}>Updated</th>
                <th style={{ textAlign: 'right', width: '135px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoojas.map((pooja, index) => {
                const id = idOf(pooja);
                const badgeStyle = SECTION_BADGE_STYLES[pooja.sectionType] || SECTION_BADGE_STYLES.Notes;
                const richPreview = stripHtml(pooja.textEditor);
                const summaryPreview = pooja.content || richPreview || '—';

                return (
                  <tr key={id}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {index + 1}
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => setViewingId(id)}
                        title="Click to view full formatted content"
                      >
                        {pooja.title}
                      </div>
                      <div className="table-content-preview" title={summaryPreview}>
                        {summaryPreview}
                      </div>
                      {richPreview && pooja.content && (
                        <div className="table-rte-preview" title={richPreview}>
                          <span className="rte-tag">Rich Text</span> {richPreview}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {resolveCategoryName(pooja)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary-color)', fontWeight: 600, marginTop: '2px' }}>
                        {resolveSubCategoryName(pooja)}
                      </div>
                    </td>
                    <td>
                      <span
                        className="section-type-badge"
                        style={{
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          borderColor: badgeStyle.border,
                        }}
                      >
                        {pooja.sectionType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(pooja, 'isFavorite')}
                          className={`table-flag-pill ${pooja.isFavorite ? 'is-fav' : ''}`}
                          title="Click to toggle Favorite"
                        >
                          {pooja.isFavorite ? <MdStar size={14} /> : <MdStarBorder size={14} />}
                          <span>{pooja.isFavorite ? 'Fav' : 'Normal'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(pooja, 'isAvailableOffline')}
                          className={`table-flag-pill ${pooja.isAvailableOffline ? 'is-offline' : ''}`}
                          title="Click to toggle Offline Availability"
                        >
                          {pooja.isAvailableOffline ? <MdOfflinePin size={14} /> : <MdCloudOff size={14} />}
                          <span>{pooja.isAvailableOffline ? 'Offline' : 'Online'}</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      {pooja.pdf ? (
                        <a
                          href={pooja.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={pooja.pdf.startsWith('data:') ? `${pooja.title || 'pooja'}.pdf` : undefined}
                          className="table-pdf-badge"
                        >
                          <MdPictureAsPdf size={15} /> PDF
                        </a>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {pooja.updatedAt || pooja.createdAt
                        ? new Date(pooja.updatedAt || pooja.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button type="button" onClick={() => setViewingId(id)} className="btn-icon-sm" title="View Details">
                          <MdVisibility size={17} />
                        </button>
                        <button type="button" onClick={() => openEditModal(pooja)} className="btn-icon-sm edit" title="Edit">
                          <MdEdit size={17} />
                        </button>
                        <button type="button" onClick={() => handleDelete(pooja)} className="btn-icon-sm delete" title="Delete">
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
          CREATE / EDIT MODAL WITH RICH TEXT EDITOR
          ========================================================================= */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div
            className="modal-content glass-panel pooja-modal-wide animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="modal-header-icon">
                  {editingId ? <MdEdit size={20} /> : <MdAdd size={20} />}
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0 }}>
                    {editingId ? 'Edit Pooja Section' : 'Create New Pooja Section'}
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {isEditDetailFetching
                      ? 'Syncing latest details from server...'
                      : 'Fill out the metadata and format your rich text content in any style.'}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" type="button" onClick={closeFormModal}>
                <MdClose size={24} />
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSave} style={{ padding: '0.95rem 1.15rem' }}>
              {/* Row 1: Category & SubCategory */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formState.categoryId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setCatModalOpen(true);
                      } else {
                        setFormState((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                          subCategoryId: '',
                        }));
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={idOf(cat)} value={idOf(cat)}>
                        {cat.categoryName}
                      </option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      + Add New Category
                    </option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Sub Category <span className="req">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formState.subCategoryId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        if (!formState.categoryId) {
                          toast.error('Please select a category first');
                          return;
                        }
                        setSubCatModalOpen(true);
                      } else {
                        setFormState((prev) => ({ ...prev, subCategoryId: e.target.value }));
                      }
                    }}
                    required
                  >
                    <option value="" disabled>
                      {formState.categoryId ? 'Select a sub category' : 'Select a category first'}
                    </option>
                    {filteredSubCategories.map((sub) => (
                      <option key={idOf(sub)} value={idOf(sub)}>
                        {sub.subCategoryName}
                      </option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      + Add New Sub Category
                    </option>
                  </select>
                </div>
              </div>

              {/* Row 2: Section Type & Title */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">
                    Section Type <span className="req">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formState.sectionType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, sectionType: e.target.value }))}
                    required
                  >
                    {SECTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Title <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Ganesh Maha Mantra"
                    value={formState.title}
                    onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Short Content */}
              <div className="input-group">
                <label className="input-label">Content (Summary / Subtitle / Plain Text)</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="e.g. Om Gan Ganapataye Namah"
                  value={formState.content}
                  onChange={(e) => setFormState((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>

              {/* Row 4: Full Rich Text Editor (textEditor parameter) */}
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Text Editor (Rich Format / Any Content) <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>— Headings, Lists, Tables, Colors, Links, Images, Sacred Symbols, or Raw HTML</span>
                  </span>
                </label>
                <RichTextEditor
                  value={formState.textEditor}
                  onChange={(html) => setFormState((prev) => ({ ...prev, textEditor: html }))}
                  placeholder="Write mantras, vidhi steps, tables, headings, notes, or switch to HTML Source to paste custom markup..."
                  minHeight="185px"
                />
              </div>

              {/* Row 5: PDF Attachment (URL or Local File Upload) */}
              <div className="input-group" style={{ marginTop: '0.65rem' }}>
                <label className="input-label">PDF Document (Optional)</label>
                <div className="pdf-mode-row">
                  <div className="pdf-tabs">
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('url')}
                      className={`pdf-tab-btn ${pdfInputMode === 'url' ? 'active' : ''}`}
                    >
                      <MdLink size={15} /> PDF URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfInputMode('upload')}
                      className={`pdf-tab-btn ${pdfInputMode === 'upload' ? 'active' : ''}`}
                    >
                      <MdUploadFile size={15} /> Upload PDF File
                    </button>
                  </div>

                  {formState.pdf && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({ ...prev, pdf: '' }));
                        setUploadedPdfName('');
                      }}
                      className="pdf-clear-btn"
                    >
                      <MdClose size={14} /> Remove PDF
                    </button>
                  )}
                </div>

                {pdfInputMode === 'url' ? (
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://example.com/pooja-guide.pdf"
                    value={formState.pdf.startsWith('data:') ? '' : formState.pdf}
                    onChange={(e) => setFormState((prev) => ({ ...prev, pdf: e.target.value }))}
                  />
                ) : (
                  <div className="pdf-upload-box" onClick={() => document.getElementById('poojaPdfFileInput').click()}>
                    <input
                      id="poojaPdfFileInput"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfFileUpload}
                      style={{ display: 'none' }}
                    />
                    <MdPictureAsPdf size={24} color="#DC2626" />
                    <span>
                      {uploadedPdfName
                        ? `Attached: ${uploadedPdfName} (Click to replace)`
                        : 'Click to upload a PDF document (Max 10MB)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 6: Boolean Flags (isFavorite, isAvailableOffline) */}
              <div className="flags-row">
                <label className={`flag-toggle-card ${formState.isFavorite ? 'checked-fav' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.isFavorite}
                    onChange={(e) => setFormState((prev) => ({ ...prev, isFavorite: e.target.checked }))}
                  />
                  <MdStar size={20} color={formState.isFavorite ? '#D97706' : '#9CA3AF'} />
                  <div>
                    <div className="flag-title">Mark as Favorite</div>
                    <div className="flag-sub">Highlight this Pooja for quick user access</div>
                  </div>
                </label>

                <label className={`flag-toggle-card ${formState.isAvailableOffline ? 'checked-offline' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formState.isAvailableOffline}
                    onChange={(e) => setFormState((prev) => ({ ...prev, isAvailableOffline: e.target.checked }))}
                  />
                  <MdOfflinePin size={20} color={formState.isAvailableOffline ? '#059669' : '#9CA3AF'} />
                  <div>
                    <div className="flag-title">Available Offline</div>
                    <div className="flag-sub">Allow devotees to read without internet</div>
                  </div>
                </label>
              </div>

              {/* Submit Footer */}
              <div className="modal-footer-actions">
                <button type="button" onClick={closeFormModal} className="btn-outline-action" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action" disabled={isSaving}>
                  <MdSave size={18} />
                  <span>{isSaving ? 'Saving...' : editingId ? 'Update Pooja' : 'Create Pooja'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAIL MODAL (GET BY ID)
          ========================================================================= */}
      {viewingId && viewedPooja && (
        <div className="modal-overlay" onClick={() => setViewingId(null)}>
          <div
            className="modal-content glass-panel pooja-modal-wide animate-fade-in"
            style={{ maxWidth: '780px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    className="section-type-badge"
                    style={{
                      background: (SECTION_BADGE_STYLES[viewedPooja.sectionType] || SECTION_BADGE_STYLES.Notes).bg,
                      color: (SECTION_BADGE_STYLES[viewedPooja.sectionType] || SECTION_BADGE_STYLES.Notes).color,
                      borderColor: (SECTION_BADGE_STYLES[viewedPooja.sectionType] || SECTION_BADGE_STYLES.Notes).border,
                    }}
                  >
                    {viewedPooja.sectionType}
                  </span>
                  {viewedPooja.isFavorite && (
                    <span className="detail-chip fav">
                      <MdStar size={14} /> Favorite
                    </span>
                  )}
                  {viewedPooja.isAvailableOffline && (
                    <span className="detail-chip offline">
                      <MdCheckCircle size={14} /> Available Offline
                    </span>
                  )}
                </div>
                <h2 className="modal-title" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  {viewedPooja.title}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {resolveCategoryName(viewedPooja)} › {resolveSubCategoryName(viewedPooja)}
                  {isViewDetailFetching && ' (Refreshing...)'}
                </p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setViewingId(null)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0.95rem 1.15rem' }}>
              {viewedPooja.content && (
                <div className="detail-summary-box">
                  <div className="detail-label">Content Summary</div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.5 }}>{viewedPooja.content}</p>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <div className="detail-label">Formatted Rich Text (Text Editor Output)</div>
                <div
                  className="detail-rte-reader"
                  dangerouslySetInnerHTML={{
                    __html: viewedPooja.textEditor || '<p style="color:#9CA3AF;font-style:italic;">No rich formatted content provided.</p>',
                  }}
                />
              </div>

              {viewedPooja.pdf && (
                <div style={{ marginTop: '1.25rem' }}>
                  <a
                    href={viewedPooja.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={viewedPooja.pdf.startsWith('data:') ? `${viewedPooja.title || 'pooja'}.pdf` : undefined}
                    className="btn-outline-action"
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                  >
                    <MdPictureAsPdf size={18} color="#DC2626" />
                    <span>{viewedPooja.pdf.startsWith('data:') ? 'Download Attached PDF' : 'Open PDF Document'}</span>
                  </a>
                </div>
              )}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewedPooja;
                    setViewingId(null);
                    openEditModal(target);
                  }}
                  className="btn-outline-action"
                >
                  <MdEdit size={16} /> Edit This Pooja
                </button>
                <button type="button" onClick={() => setViewingId(null)} className="btn-primary-action">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NESTED MODAL: ADD CATEGORY
          ========================================================================= */}
      {catModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 120 }} onClick={() => setCatModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setCatModalOpen(false)}>
                <MdClose size={24} />
              </button>
            </div>
            <form
              className="modal-body"
              onSubmit={async (e) => {
                e.preventDefault();
                const loadingToast = toast.loading('Creating category...');
                try {
                  const res = await createPoojaCategory({ categoryName: newCatName.trim() });
                  queryClient.invalidateQueries({ queryKey: ['poojaCategories'] });
                  toast.success('Category created', { id: loadingToast });
                  const newId = res?.data?._id || res?.data?.id || res?._id || res?.id || res?.category?._id;
                  if (newId) {
                    setFormState((prev) => ({ ...prev, categoryId: String(newId), subCategoryId: '' }));
                  }
                  setCatModalOpen(false);
                  setNewCatName('');
                } catch {
                  toast.error('Failed to create category', { id: loadingToast });
                }
              }}
            >
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          NESTED MODAL: ADD SUB CATEGORY
          ========================================================================= */}
      {subCatModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 120 }} onClick={() => setSubCatModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Sub Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setSubCatModalOpen(false)}>
                <MdClose size={24} />
              </button>
            </div>
            <form
              className="modal-body"
              onSubmit={async (e) => {
                e.preventDefault();
                const loadingToast = toast.loading('Creating sub-category...');
                try {
                  const res = await createPoojaSubCategory({
                    categoryId: formState.categoryId,
                    subCategoryName: newSubCatName.trim(),
                  });
                  queryClient.invalidateQueries({ queryKey: ['poojaSubCategories'] });
                  toast.success('Sub-category created', { id: loadingToast });
                  const newSubId = res?.data?._id || res?.data?.id || res?._id || res?.id;
                  if (newSubId) {
                    setFormState((prev) => ({ ...prev, subCategoryId: String(newSubId) }));
                  }
                  setSubCatModalOpen(false);
                  setNewSubCatName('');
                } catch {
                  toast.error('Failed to create sub-category', { id: loadingToast });
                }
              }}
            >
              <div className="input-group">
                <label className="input-label">Sub Category Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
                Save Sub Category
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .pooja-page-container {
          color: var(--text-primary);
        }
        .pooja-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.6rem 0.85rem;
          margin-bottom: 0.7rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--border-color);
        }
        .pooja-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .pooja-icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, rgba(130,0,30,0.1), rgba(240,190,60,0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(130,0,30,0.14);
          flex-shrink: 0;
        }
        .pooja-header-title {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 700;
          color: var(--primary-color);
          line-height: 1.2;
        }
        .pooja-badge-pill {
          background-color: rgba(240, 190, 60, 0.25);
          color: #7A5C43;
          font-size: 0.66rem;
          font-weight: 700;
          padding: 0.12rem 0.5rem;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pooja-header-subtitle {
          margin: 0.12rem 0 0 0;
          color: var(--text-secondary);
          font-size: 0.78rem;
          line-height: 1.3;
        }
        .pooja-header-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .btn-outline-action {
          background: #FFFFFF;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 0.38rem 0.7rem;
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.15s;
        }
        .btn-outline-action:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .btn-primary-action {
          background: var(--primary-color);
          color: #FFFFFF;
          border: none;
          padding: 0.4rem 0.85rem;
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.81rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          box-shadow: 0 2px 4px rgba(130,0,30,0.2);
          transition: all 0.15s;
        }
        .btn-primary-action:hover {
          background: var(--primary-hover);
        }
        .view-toggle-group {
          display: inline-flex;
          background: #F3F4F6;
          padding: 2px;
          border-radius: 7px;
          border: 1px solid var(--border-color);
        }
        .view-toggle-btn {
          background: transparent;
          border: none;
          padding: 0.3rem 0.48rem;
          border-radius: 5px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .view-toggle-btn.active {
          background: #FFFFFF;
          color: var(--primary-color);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Compact Overview + Controls Bar */
        .pooja-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .stat-pills-strip {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          padding: 0.3rem 0.6rem;
          font-size: 0.76rem;
        }
        .stat-pill.clickable {
          cursor: pointer;
          transition: all 0.15s;
        }
        .stat-pill.clickable:hover {
          border-color: #F59E0B;
        }
        .stat-pill.active-fav {
          background: #FFFBEB;
          border-color: #F59E0B;
        }
        .stat-pill-label {
          color: var(--text-secondary);
          font-weight: 600;
        }
        .stat-pill-val {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.82rem;
        }

        /* Filter Bar */
        .filter-toolbar {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
          align-items: center;
          flex: 1;
          justify-content: flex-end;
        }
        .search-input-wrap {
          position: relative;
          min-width: 200px;
          max-width: 280px;
          flex: 1;
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
          padding: 0.38rem 1.7rem 0.38rem 2rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          background: #FFFFFF;
          font-size: 0.82rem;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .filter-controls {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .filter-select {
          padding: 0.38rem 0.65rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          background: #FFFFFF;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
        }

        /* Grid Cards */
        .pooja-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(265px, 100%), 1fr));
          gap: 0.85rem;
        }
        .pooja-card {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
        }
        .pooja-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.06);
          border-color: rgba(130,0,30,0.3);
        }
        .pooja-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .section-type-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.16rem 0.52rem;
          border-radius: 20px;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .card-status-icons {
          display: flex;
          gap: 0.25rem;
        }
        .status-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid transparent;
          background: #F9FAFB;
          color: #9CA3AF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .status-icon-btn:hover { background: #F3F4F6; }
        .status-icon-btn.is-fav { color: #D97706; background: #FFFBEB; border-color: #FDE68A; }
        .status-icon-btn.is-offline { color: #059669; background: #ECFDF5; border-color: #A7F3D0; }

        .pooja-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        .sub-crumb { color: var(--primary-color); }
        .pooja-card-title {
          margin: 0 0 0.3rem 0;
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .pooja-card-content {
          margin: 0 0 0.5rem 0;
          font-size: 0.81rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .pooja-rte-snippet {
          background: #FDF9F1;
          border: 1px solid rgba(130,0,30,0.1);
          border-radius: 7px;
          padding: 0.55rem 0.65rem;
          margin-bottom: 0.6rem;
          flex: 1;
        }
        .snippet-label {
          font-size: 0.66rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #7A5C43;
          margin-bottom: 0.2rem;
        }
        .snippet-body {
          margin: 0;
          font-size: 0.79rem;
          color: var(--text-primary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pooja-pdf-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 0.2rem 0.5rem;
          border-radius: 5px;
          align-self: flex-start;
          margin-bottom: 0.6rem;
        }
        .pooja-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.6rem;
          border-top: 1px solid var(--border-color);
        }
        .btn-view-detail {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          color: var(--primary-color);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.32rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }
        .btn-view-detail:hover {
          border-color: var(--primary-color);
          background: rgba(130,0,30,0.04);
        }
        .card-action-btns {
          display: flex;
          gap: 0.3rem;
        }
        .btn-icon-sm {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: #FFFFFF;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .btn-icon-sm:hover { border-color: var(--primary-color); color: var(--primary-color); }
        .btn-icon-sm.edit:hover { border-color: #2563EB; color: #2563EB; }
        .btn-icon-sm.delete:hover { border-color: #DC2626; color: #DC2626; }

        /* Table */
        .table-wrap {
          overflow-x: auto;
          background: #FFFFFF;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .pooja-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.83rem;
        }
        .pooja-table th {
          background: #F9FAFB;
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }
        .pooja-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .pooja-table tr:last-child td { border-bottom: none; }
        .pooja-table tbody tr:hover td { background: #FDF9F1; }
        .table-list-header {
          padding: 0.45rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          background: #FFFFFF;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .table-list-count {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .table-content-preview {
          font-size: 0.77rem;
          color: var(--text-secondary);
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }
        .table-rte-preview {
          font-size: 0.74rem;
          color: #6B7280;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .rte-tag {
          display: inline-block;
          font-size: 0.64rem;
          font-weight: 700;
          background: rgba(130, 0, 30, 0.08);
          color: var(--primary-color);
          padding: 1px 4px;
          border-radius: 4px;
          margin-right: 4px;
          text-transform: uppercase;
        }
        .table-flag-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 0.18rem 0.48rem;
          border-radius: 14px;
          font-size: 0.7rem;
          font-weight: 700;
          border: 1px solid var(--border-color);
          background: #F9FAFB;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .table-flag-pill:hover {
          border-color: var(--primary-color);
        }
        .table-flag-pill.is-fav {
          background: #FFFBEB;
          color: #B45309;
          border-color: #FDE68A;
        }
        .table-flag-pill.is-offline {
          background: #ECFDF5;
          color: #047857;
          border-color: #A7F3D0;
        }
        .table-pdf-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.2rem 0.48rem;
          border-radius: 5px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          font-size: 0.73rem;
          font-weight: 700;
          text-decoration: none;
        }
        .table-pdf-badge:hover {
          background: #FEE2E2;
        }

        /* Modal */
        .pooja-modal-wide {
          max-width: 840px !important;
          width: 95%;
          max-height: 92vh;
          overflow-y: auto;
          padding: 0 !important;
          border-radius: 12px;
        }
        .modal-header-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(130,0,30,0.1);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 680px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }
        .req { color: #DC2626; }
        .pdf-mode-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.45rem;
        }
        .pdf-tabs {
          display: inline-flex;
          background: #F3F4F6;
          padding: 2px;
          border-radius: 7px;
        }
        .pdf-tab-btn {
          border: none;
          background: transparent;
          padding: 0.28rem 0.6rem;
          border-radius: 5px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .pdf-tab-btn.active {
          background: #FFFFFF;
          color: var(--primary-color);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .pdf-clear-btn {
          background: none;
          border: none;
          color: #DC2626;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
        .pdf-upload-box {
          border: 2px dashed var(--border-color);
          border-radius: 7px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          background: #FAFAFA;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .pdf-upload-box:hover {
          border-color: var(--primary-color);
          background: rgba(130,0,30,0.02);
        }
        .flags-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 0.85rem;
        }
        @media (max-width: 640px) {
          .flags-row { grid-template-columns: 1fr; }
        }
        .flag-toggle-card {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          background: #FFFFFF;
          transition: all 0.2s;
        }
        .flag-toggle-card input {
          width: 16px;
          height: 16px;
          accent-color: var(--primary-color);
        }
        .flag-toggle-card.checked-fav {
          border-color: #FDE68A;
          background: #FFFBEB;
        }
        .flag-toggle-card.checked-offline {
          border-color: #A7F3D0;
          background: #ECFDF5;
        }
        .flag-title {
          font-size: 0.83rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .flag-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        /* Detail Reader */
        .detail-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.16rem 0.5rem;
          border-radius: 20px;
        }
        .detail-chip.fav { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
        .detail-chip.offline { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
        .detail-summary-box {
          background: #F9FAFB;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          padding: 0.7rem 0.85rem;
        }
        .detail-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 0.3rem;
        }
        .detail-rte-reader {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.85rem;
          background: #FFFFFF;
          max-height: 320px;
          overflow-y: auto;
          line-height: 1.55;
          font-size: 0.88rem;
        }
        .detail-rte-reader h1, .detail-rte-reader h2, .detail-rte-reader h3 {
          color: var(--primary-color);
        }
        .detail-rte-reader blockquote {
          border-left: 4px solid var(--primary-color);
          background: #FDF9F1;
          padding: 0.5rem 0.85rem;
          margin: 0.6rem 0;
          border-radius: 0 8px 8px 0;
        }

        /* Loading / Empty */
        .loading-box, .empty-box {
          text-align: center;
          padding: 2rem 1.25rem;
          background: #FFFFFF;
          border-radius: 10px;
          border: 1px dashed var(--border-color);
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
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .pooja-header-actions {
            width: 100%;
          }
          .pooja-controls-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-toolbar {
            justify-content: flex-start;
            width: 100%;
          }
          .search-input-wrap {
            min-width: 0;
            max-width: 100%;
            width: 100%;
            flex: 1 1 100%;
          }
          .filter-controls {
            width: 100%;
          }
          .filter-select {
            flex: 1 1 130px;
            min-width: 0;
          }
          .pooja-modal-wide {
            width: 100% !important;
            max-width: calc(100vw - 1rem) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagePooja;
