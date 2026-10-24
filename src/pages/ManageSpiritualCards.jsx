import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdCheckCircle,
  MdOutlineRadioButtonUnchecked,
  MdPublish,
  MdVisibility,
  MdCalendarToday,
  MdTranslate,
  MdFormatQuote,
  MdSelfImprovement,
  MdTempleHindu,
  MdAutoAwesome,
  MdViewModule,
  MdViewList,
  MdClose,
  MdSave,
  MdArrowBack,
  MdArrowForward,
  MdContentCopy,
  MdInfoOutline,
} from 'react-icons/md';

import {
  getAllSpiritualCards,
  getSpiritualCardById,
  createSpiritualCard,
  updateSpiritualCard,
  publishSpiritualCard,
  unpublishSpiritualCard,
  deleteSpiritualCard,
} from '../api/dailySpiritualCard';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import Modal from '../components/Modal';

const LANGUAGE_OPTIONS = [
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'en', label: 'English' },
  { value: 'sa', label: 'Sanskrit (संस्कृत)' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
];

const INITIAL_FORM_STATE = {
  date: new Date().toISOString().split('T')[0],
  language: 'hi',
  status: 'published',
  thought: {
    title: '',
    content: '',
  },
  mantra: {
    title: '',
    text: '',
    meaning: '',
  },
  quote: {
    text: '',
    author: '',
  },
  festival: {
    isFestival: false,
    name: '',
    description: '',
  },
};

const SAMPLE_TEMPLATES = [
  {
    label: 'Gayatri Mantra & Bhagavad Gita',
    data: {
      thought: {
        title: 'आन्तरिक शुद्धि (Inner Purity)',
        content: 'सच्ची भक्ति और आध्यात्मिक उन्नति अहंकार और द्वेष से मुक्त शुद्ध मन से प्रारम्भ होती है।',
      },
      mantra: {
        title: 'गायत्री मन्त्र (Gayatri Mantra)',
        text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥',
        meaning: 'हम उस प्राणस्वरूप, दुःखनाशक, सुखस्वरूप, श्रेष्ठ, तेजस्वी, पापनाशक, देवस्वरूप परमात्मा का ध्यान करते हैं। वह परमात्मा हमारी बुद्धि को सन्मार्ग पर प्रेरित करे।',
      },
      quote: {
        text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
        author: 'श्रीमद्भगवद्गीता २.४७',
      },
      festival: {
        isFestival: false,
        name: '',
        description: '',
      },
    },
  },
  {
    label: 'Maha Mrityunjaya & Shiva Tattva',
    data: {
      thought: {
        title: 'शिव तत्व और वैराग्य (Divine Detachment)',
        content: 'भगवान शिव का स्मरण हमें भौतिक बंधनों से मुक्त कर आत्म-साक्षात्कार और परम शान्ति की ओर ले जाता है।',
      },
      mantra: {
        title: 'महामृत्युंजय मन्त्र (Maha Mrityunjaya Mantra)',
        text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥',
        meaning: 'हम त्रिनेत्रधारी भगवान शिव की आराधना करते हैं, जो प्रत्येक श्वास में जीवन शक्ति का संचार करते हैं और हमें सांसारिक बंधनों व भय से मुक्त करते हैं।',
      },
      quote: {
        text: 'शान्तं पद्मासनस्थं शशिधरमुकुटं पञ्चवक्त्रं त्रिनेत्रम्।',
        author: 'शिव स्तुति',
      },
      festival: {
        isFestival: true,
        name: 'मासिक शिवरात्रि (Masik Shivaratri)',
        description: 'भगवान शिव एवं माता पार्वती की आराधना का पावन अवसर।',
      },
    },
  },
];

const ManageSpiritualCards = () => {
  const queryClient = useQueryClient();
  const { showConfirm } = useConfirmModal();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  // Today's ISO date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch Cards with React Query
  const {
    data: cardsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['spiritualCards', page, limit, statusFilter, languageFilter, searchQuery, startDate, endDate],
    queryFn: () =>
      getAllSpiritualCards({
        page,
        limit,
        status: statusFilter,
        language: languageFilter,
        search: searchQuery,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    keepPreviousData: true,
  });

  const cards = cardsResponse?.data || [];
  const totalCount = cardsResponse?.total || cards.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Compute summary stats
  const stats = useMemo(() => {
    let published = 0;
    let drafts = 0;
    let hasTodayCard = false;

    cards.forEach((c) => {
      if (c.status === 'published') published++;
      if (c.status === 'draft') drafts++;
      if (c.date === todayStr && c.status === 'published') hasTodayCard = true;
    });

    return {
      total: totalCount,
      published,
      drafts,
      hasTodayCard,
    };
  }, [cards, totalCount, todayStr]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSpiritualCard,
    onSuccess: () => {
      queryClient.invalidateQueries(['spiritualCards']);
      toast.success('Spiritual card created successfully!');
      setFormModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to create card';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSpiritualCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['spiritualCards']);
      toast.success('Spiritual card updated successfully!');
      setFormModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to update card';
      toast.error(msg);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishSpiritualCard,
    onSuccess: () => {
      queryClient.invalidateQueries(['spiritualCards']);
      toast.success('Card published successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to publish card');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishSpiritualCard,
    onSuccess: () => {
      queryClient.invalidateQueries(['spiritualCards']);
      toast.success('Card unpublished successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unpublish card');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpiritualCard,
    onSuccess: () => {
      queryClient.invalidateQueries(['spiritualCards']);
      toast.success('Spiritual card deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete card');
    },
  });

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingCardId(null);
    setFormErrors({});
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (card) => {
    setEditingCardId(card._id || card.id);
    setFormData({
      date: card.date ? card.date.substring(0, 10) : todayStr,
      language: card.language || 'hi',
      status: card.status || 'draft',
      thought: {
        title: card.thought?.title || '',
        content: card.thought?.content || '',
      },
      mantra: {
        title: card.mantra?.title || '',
        text: card.mantra?.text || '',
        meaning: card.mantra?.meaning || '',
      },
      quote: {
        text: card.quote?.text || '',
        author: card.quote?.author || '',
      },
      festival: {
        isFestival: !!card.festival?.isFestival,
        name: card.festival?.name || '',
        description: card.festival?.description || '',
      },
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      errors.date = 'Date is required in YYYY-MM-DD format';
    }
    if (!formData.thought?.content?.trim()) {
      errors.thoughtContent = 'Thought content is required';
    }
    if (!formData.mantra?.text?.trim()) {
      errors.mantraText = 'Mantra text/shloka is required';
    }
    if (!formData.quote?.text?.trim()) {
      errors.quoteText = 'Quote text is required';
    }
    if (formData.festival?.isFestival && !formData.festival?.name?.trim()) {
      errors.festivalName = 'Festival name is required when marked as a festival';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    const payload = {
      date: formData.date,
      language: formData.language,
      status: formData.status,
      thought: {
        title: formData.thought.title?.trim() || null,
        content: formData.thought.content.trim(),
      },
      mantra: {
        title: formData.mantra.title?.trim() || null,
        text: formData.mantra.text.trim(),
        meaning: formData.mantra.meaning?.trim() || null,
      },
      quote: {
        text: formData.quote.text.trim(),
        author: formData.quote.author?.trim() || null,
      },
      festival: {
        isFestival: Boolean(formData.festival.isFestival),
        name: formData.festival.isFestival ? formData.festival.name?.trim() || null : null,
        description: formData.festival.isFestival ? formData.festival.description?.trim() || null : null,
      },
    };

    if (editingCardId) {
      updateMutation.mutate({ id: editingCardId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleTogglePublish = (card) => {
    const cardId = card._id || card.id;
    const isPub = card.status === 'published';
    const actionLabel = isPub ? 'Unpublish' : 'Publish';

    showConfirm(
      `Are you sure you want to ${actionLabel.toLowerCase()} this spiritual card for ${card.date}?`,
      () => {
        if (isPub) {
          unpublishMutation.mutate(cardId);
        } else {
          publishMutation.mutate(cardId);
        }
      }
    );
  };

  const handleDelete = (card) => {
    const cardId = card._id || card.id;
    showConfirm(`Are you sure you want to delete the spiritual card for ${card.date}?`, () => {
      deleteMutation.mutate(cardId);
    });
  };

  const handleApplyTemplate = (tpl) => {
    setFormData((prev) => ({
      ...prev,
      thought: { ...tpl.data.thought },
      mantra: { ...tpl.data.mantra },
      quote: { ...tpl.data.quote },
      festival: { ...tpl.data.festival },
    }));
    toast.success(`Loaded "${tpl.label}" template`);
  };

  const handleQuickTodayFilter = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLanguageFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    languageFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <div className="page-content" style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Banner / Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8EE 100%)',
          borderLeft: '5px solid var(--primary-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '1.5rem',
                backgroundColor: 'rgba(130, 0, 30, 0.08)',
                padding: '0.5rem',
                borderRadius: '12px',
                color: 'var(--primary-color)',
                display: 'inline-flex',
              }}
            >
              <MdSelfImprovement size={28} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.6rem', color: 'var(--primary-color)' }}>
                  Daily Spiritual Cards
                </h1>
                <span
                  style={{
                    backgroundColor: 'var(--secondary-color)',
                    color: '#4A2C10',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Admin Portal
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Create, curate, publish, and manage daily sacred mantras, inspirational thoughts, festival alerts, and quotes for devotees.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn"
            style={{
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Refresh list"
          >
            <MdRefresh size={18} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* View mode toggle */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#F3F4F6',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: viewMode === 'grid' ? 600 : 500,
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title="Card View"
            >
              <MdViewModule size={18} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: viewMode === 'table' ? 600 : 500,
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title="Table View"
            >
              <MdViewList size={18} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: '#FFFFFF',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.4rem',
              borderRadius: '10px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(130, 0, 30, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.15s, background-color 0.2s',
            }}
          >
            <MdAdd size={20} />
            <span>Create New Card</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(130, 0, 30, 0.08)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdSelfImprovement size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Cards
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(23, 74, 13, 0.1)',
              color: 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdCheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Published Cards
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success-color)' }}>
              {stats.published}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(240, 190, 60, 0.15)',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdOutlineRadioButtonUnchecked size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Drafts / Unassigned
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#B45309' }}>
              {stats.drafts}
            </div>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderLeft: stats.hasTodayCard ? '4px solid var(--success-color)' : '4px solid #F59E0B',
            background: stats.hasTodayCard ? '#F6FDF6' : '#FFFDF7',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: stats.hasTodayCard ? 'rgba(23, 74, 13, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: stats.hasTodayCard ? 'var(--success-color)' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdCalendarToday size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Today ({todayStr})
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: stats.hasTodayCard ? 'var(--success-color)' : '#D97706' }}>
              {stats.hasTodayCard ? 'Active Card Live 🟢' : 'No Live Card for Today ⚠️'}
            </div>
          </div>
          {!stats.hasTodayCard && (
            <button
              onClick={() => {
                resetForm();
                setFormData((prev) => ({ ...prev, date: todayStr, status: 'published' }));
                setFormModalOpen(true);
              }}
              style={{
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Add Today
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Glass Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Search box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              minWidth: '240px',
            }}
          >
            <MdSearch
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              placeholder="Search by thought, mantra, quote, festival, or author..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                backgroundColor: '#FAFAFA',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <MdClose size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>

          {/* Language Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Language:</span>
            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Languages</option>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* Quick buttons */}
          <button
            onClick={handleQuickTodayFilter}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--primary-color)',
              cursor: 'pointer',
            }}
          >
            Today's Card
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: '#FEE2E2',
                color: '#991B1B',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MdClose size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {isLoading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Spiritual Cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(130, 0, 30, 0.05)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
            }}
          >
            <MdSelfImprovement size={44} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Daily Spiritual Cards Found
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            {hasActiveFilters
              ? 'No spiritual cards match your current search and filter criteria. Try adjusting your filters.'
              : 'Start inspiring devotees every day by creating the first Daily Spiritual Card with a sacred mantra, thought, and quote.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: 'var(--text-primary)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={handleOpenCreateModal}
              className="btn"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: '#FFFFFF',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MdAdd size={20} />
              <span>Create Spiritual Card</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Visual Devotee Cards */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {cards.map((card) => {
            const cardId = card._id || card.id;
            const isToday = card.date === todayStr;
            const isPublished = card.status === 'published';

            return (
              <div
                key={cardId}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: isToday ? '2px solid var(--secondary-color)' : '1px solid var(--border-color)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: isToday
                    ? '0 10px 25px -5px rgba(240, 190, 60, 0.25)'
                    : '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Festival Gold Banner if marked as festival */}
                {card.festival?.isFestival && (
                  <div
                    style={{
                      background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      padding: '0.45rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MdTempleHindu size={18} />
                      <span>{card.festival.name || 'Festival / Special Occasion'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>पर्व विशेष</span>
                  </div>
                )}

                {/* Card Header */}
                <div
                  style={{
                    padding: '1.25rem 1.25rem 0.75rem 1.25rem',
                    borderBottom: '1px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isToday ? 'rgba(253, 249, 241, 0.8)' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        backgroundColor: isToday ? 'var(--primary-color)' : '#F3F4F6',
                        color: isToday ? '#FFFFFF' : 'var(--text-primary)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <MdCalendarToday size={14} />
                      <span>{card.date}</span>
                    </div>
                    {isToday && (
                      <span
                        style={{
                          backgroundColor: 'var(--secondary-color)',
                          color: '#4A2C10',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                        }}
                      >
                        TODAY
                      </span>
                    )}
                    <span
                      style={{
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {card.language || 'hi'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isPublished ? 'rgba(23, 74, 13, 0.1)' : '#FEF3C7',
                      color: isPublished ? 'var(--success-color)' : '#92400E',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isPublished ? 'var(--success-color)' : '#D97706',
                      }}
                    />
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {/* Thought Section */}
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--primary-color)',
                        letterSpacing: '0.04em',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {card.thought?.title || 'Daily Spiritual Thought (दैनिक विचार)'}
                    </div>
                    <p
                      style={{
                        fontSize: '0.92rem',
                        lineHeight: '1.55',
                        color: 'var(--text-primary)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {card.thought?.content}
                    </p>
                  </div>

                  {/* Mantra Section in ornamental box */}
                  <div
                    style={{
                      backgroundColor: '#FFFDF7',
                      border: '1px solid #F5E6CC',
                      borderRadius: '12px',
                      padding: '0.9rem 1rem',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#82001E',
                          textTransform: 'uppercase',
                        }}
                      >
                        {card.mantra?.title || "Today's Sacred Mantra"}
                      </span>
                      <span style={{ fontSize: '1rem', color: '#82001E' }}>🕉️</span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'serif',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#4A2C10',
                        lineHeight: '1.5',
                        marginBottom: card.mantra?.meaning ? '0.4rem' : 0,
                      }}
                    >
                      {card.mantra?.text}
                    </div>
                    {card.mantra?.meaning && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          borderTop: '1px dashed #F5E6CC',
                          paddingTop: '0.35rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {card.mantra.meaning}
                      </div>
                    )}
                  </div>

                  {/* Quote Section */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      backgroundColor: '#F9FAFB',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                    }}
                  >
                    <MdFormatQuote size={20} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          fontStyle: 'italic',
                          color: 'var(--text-primary)',
                          margin: 0,
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        "{card.quote?.text}"
                      </p>
                      {card.quote?.author && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textAlign: 'right',
                            marginTop: '0.2rem',
                          }}
                        >
                          — {card.quote.author}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    onClick={() => {
                      setPreviewCard(card);
                      setPreviewModalOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.5rem',
                      borderRadius: '6px',
                    }}
                    title="Devotee Preview"
                  >
                    <MdVisibility size={16} />
                    <span>Preview</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {/* Publish / Unpublish Button */}
                    <button
                      onClick={() => handleTogglePublish(card)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: isPublished ? '#FFFBEB' : '#ECFDF5',
                        color: isPublished ? '#92400E' : '#065F46',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      title={isPublished ? 'Unpublish to draft' : 'Publish to devotees'}
                    >
                      <MdPublish size={14} />
                      <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(card)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--primary-color)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      title="Edit Card"
                    >
                      <MdEdit size={14} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(card)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error-color)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete Card"
                    >
                      <MdDeleteOutline size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Compact rows */
        <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Language</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Festival</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Thought</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mantra</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quote</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => {
                  const cardId = card._id || card.id;
                  const isToday = card.date === todayStr;
                  const isPublished = card.status === 'published';

                  return (
                    <tr
                      key={cardId}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isToday ? 'rgba(253, 249, 241, 0.5)' : '#FFFFFF',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{card.date}</div>
                        {isToday && (
                          <span
                            style={{
                              backgroundColor: 'var(--secondary-color)',
                              color: '#4A2C10',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '8px',
                            }}
                          >
                            TODAY
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isPublished ? 'rgba(23, 74, 13, 0.1)' : '#FEF3C7',
                            color: isPublished ? 'var(--success-color)' : '#92400E',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isPublished ? 'var(--success-color)' : '#D97706',
                            }}
                          />
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {card.language || 'hi'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {card.festival?.isFestival ? (
                          <span
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <MdTempleHindu size={14} />
                            <span>{card.festival.name || 'Festival'}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--primary-color)' }}>
                          {card.thought?.title || 'Daily Thought'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {card.thought?.content}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#4A2C10' }}>
                          {card.mantra?.title || 'Mantra'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {card.mantra?.text}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', maxWidth: '200px' }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontStyle: 'italic',
                          }}
                        >
                          "{card.quote?.text}"
                        </div>
                        {card.quote?.author && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            — {card.quote.author}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setPreviewCard(card);
                              setPreviewModalOpen(true);
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="Preview"
                          >
                            <MdVisibility size={15} />
                          </button>

                          <button
                            onClick={() => handleTogglePublish(card)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: isPublished ? '#FFFBEB' : '#ECFDF5',
                              color: isPublished ? '#92400E' : '#065F46',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isPublished ? 'Unpublish' : 'Publish'}
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(card)}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: '#FFFFFF',
                              color: 'var(--primary-color)',
                              cursor: 'pointer',
                            }}
                            title="Edit"
                          >
                            <MdEdit size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(card)}
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--error-color)',
                              cursor: 'pointer',
                            }}
                            title="Delete"
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
        </div>
      )}

      {/* Pagination Bar */}
      {cards.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>
              Showing {cards.length} cards (Page {page} of {totalPages}) &bull; Total {totalCount}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: page <= 1 ? '#F9FAFB' : '#FFFFFF',
                color: page <= 1 ? '#9CA3AF' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <MdArrowBack size={16} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: page >= totalPages ? '#F9FAFB' : '#FFFFFF',
                color: page >= totalPages ? '#9CA3AF' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <span>Next</span>
              <MdArrowForward size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCardId ? 'Edit Daily Spiritual Card' : 'Create Daily Spiritual Card'}
      >
        <div style={{ maxWidth: '980px', width: '100%' }}>
          {/* Quick template loader for fast drafting */}
          {!editingCardId && (
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px dashed #F59E0B',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E', fontSize: '0.85rem' }}>
                <MdAutoAwesome size={18} />
                <span style={{ fontWeight: 600 }}>Quick Starter Templates:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SAMPLE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #F59E0B',
                      color: '#92400E',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Row: Date, Language, Status */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                backgroundColor: '#F9FAFB',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <label className="input-label" style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Card Date (YYYY-MM-DD) <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: formErrors.date ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.9rem',
                  }}
                  required
                />
                {formErrors.date && (
                  <span style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    {formErrors.date}
                  </span>
                )}
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Language <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.9rem',
                  }}
                  required
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Publication Status <span style={{ color: 'var(--error-color)' }}>*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: formData.status === 'published' ? 'var(--success-color)' : '#92400E',
                  }}
                  required
                >
                  <option value="published">Published (Visible to Devotees)</option>
                  <option value="draft">Draft (Saved Privately)</option>
                </select>
              </div>
            </div>

            {/* Festival / Special Occasion Section */}
            <div
              style={{
                backgroundColor: formData.festival.isFestival ? '#FFFBEB' : '#FFFFFF',
                border: formData.festival.isFestival ? '1px solid #F59E0B' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: formData.festival.isFestival ? '0.75rem' : 0 }}>
                <input
                  type="checkbox"
                  id="isFestivalCheckbox"
                  checked={formData.festival.isFestival}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      festival: { ...formData.festival, isFestival: e.target.checked },
                    })
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                />
                <label
                  htmlFor="isFestivalCheckbox"
                  style={{ fontWeight: 700, color: '#4A2C10', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <MdTempleHindu size={18} style={{ color: '#D97706' }} />
                  <span>Mark as a Festival / Special Tithi Occasion</span>
                </label>
              </div>

              {formData.festival.isFestival && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Festival / Tithi Name <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vijaya Dashami / Maha Shivaratri / Ekadashi"
                      value={formData.festival.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          festival: { ...formData.festival, name: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: formErrors.festivalName ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                    {formErrors.festivalName && (
                      <span style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>
                        {formErrors.festivalName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Festival Significance / Short Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Celebration of triumph of dharma and light over darkness"
                      value={formData.festival.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          festival: { ...formData.festival, description: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Thought of the Day */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--primary-color)' }}>💡</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  Daily Spiritual Thought (दैनिक विचार)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Thought Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Purity in Thought / सत्य और धर्म का मार्ग"
                    value={formData.thought.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thought: { ...formData.thought, title: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Thought Content <span style={{ color: 'var(--error-color)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write an inspirational reflection to uplift the devotee's day..."
                    value={formData.thought.content}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thought: { ...formData.thought, content: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: formErrors.thoughtContent ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                      resize: 'vertical',
                      fontSize: '0.9rem',
                    }}
                    required
                  />
                  {formErrors.thoughtContent && (
                    <span style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>
                      {formErrors.thoughtContent}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mantra of the Day */}
            <div
              style={{
                border: '1px solid #F5E6CC',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: '#FFFDF9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--primary-color)' }}>🕉️</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  Sacred Mantra (दैनिक मन्त्र)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Mantra Title / Deity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gayatri Mantra / ॐ नमः शिवाय"
                      value={formData.mantra.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mantra: { ...formData.mantra, title: e.target.value },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Mantra Text / Shloka <span style={{ color: 'var(--error-color)' }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter Sanskrit / Hindi mantra text (e.g. ॐ भूर्भुवः स्वः...)"
                    value={formData.mantra.text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mantra: { ...formData.mantra, text: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: formErrors.mantraText ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                      resize: 'vertical',
                      fontFamily: 'serif',
                      fontSize: '0.95rem',
                      backgroundColor: '#FFFFFF',
                    }}
                    required
                  />
                  {formErrors.mantraText && (
                    <span style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>
                      {formErrors.mantraText}
                    </span>
                  )}
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Mantra Meaning & Spiritual Significance
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain the meaning and essence for devotees..."
                    value={formData.mantra.meaning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mantra: { ...formData.mantra, meaning: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      resize: 'vertical',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sacred Quote */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MdFormatQuote size={20} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  Sacred Quote / Subhashita (सुभाषित / अनमोल वचन)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Quote Text <span style={{ color: 'var(--error-color)' }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter sacred quote or spiritual proverb..."
                    value={formData.quote.text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quote: { ...formData.quote, text: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: formErrors.quoteText ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                      resize: 'vertical',
                      fontStyle: 'italic',
                    }}
                    required
                  />
                  {formErrors.quoteText && (
                    <span style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>
                      {formErrors.quoteText}
                    </span>
                  )}
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Author / Source Scripture
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhagavad Gita 2.47 / Swami Vivekananda / Upanishads"
                    value={formData.quote.author}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quote: { ...formData.quote, author: e.target.value },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '1rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="btn"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: 'var(--text-primary)',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="btn"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: '#FFFFFF',
                  padding: '0.7rem 1.75rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(130, 0, 30, 0.25)',
                }}
              >
                <MdSave size={18} />
                <span>
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving Card...'
                    : editingCardId
                    ? 'Update Card'
                    : 'Save & Create Card'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DEVOTEE MOBILE PREVIEW MODAL */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Devotee Mobile App Preview"
      >
        {previewCard && (
          <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'left' }}>
            <div
              style={{
                backgroundColor: '#FFFDF9',
                border: '2px solid #E6D5B8',
                borderRadius: '24px',
                padding: '1.75rem 1.5rem',
                boxShadow: '0 20px 40px -10px rgba(74, 44, 16, 0.15)',
                position: 'relative',
              }}
            >
              {/* Header with Temple Motif */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>🕉️</div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--primary-color)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Vipra Saarthi &bull; दैनिक आध्यात्मिक विचार
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {previewCard.date}
                </div>
              </div>

              {/* Festival Banner if any */}
              {previewCard.festival?.isFestival && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#B45309', fontWeight: 700, fontSize: '0.9rem' }}>
                    <MdTempleHindu size={18} />
                    <span>{previewCard.festival.name}</span>
                  </div>
                  {previewCard.festival.description && (
                    <div style={{ fontSize: '0.78rem', color: '#92400E', marginTop: '0.2rem' }}>
                      {previewCard.festival.description}
                    </div>
                  )}
                </div>
              )}

              {/* Thought */}
              <div style={{ marginBottom: '1.25rem' }}>
                {previewCard.thought?.title && (
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.35rem' }}>
                    {previewCard.thought.title}
                  </h4>
                )}
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {previewCard.thought?.content}
                </p>
              </div>

              {/* Mantra in special sacred card frame */}
              <div
                style={{
                  backgroundColor: '#FFF8EE',
                  border: '1.5px solid #F0BE3C',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                  boxShadow: 'inset 0 1px 3px rgba(240, 190, 60, 0.2)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#82001E',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  {previewCard.mantra?.title || 'आज का दिव्य मन्त्र'}
                </div>
                <div
                  style={{
                    fontFamily: 'serif',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#82001E',
                    lineHeight: '1.55',
                    marginBottom: previewCard.mantra?.meaning ? '0.6rem' : 0,
                  }}
                >
                  {previewCard.mantra?.text}
                </div>
                {previewCard.mantra?.meaning && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: '#4A2C10',
                      borderTop: '1px dashed #E5D5BA',
                      paddingTop: '0.5rem',
                      lineHeight: '1.45',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>अर्थ: </span>
                    {previewCard.mantra.meaning}
                  </div>
                )}
              </div>

              {/* Quote */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  padding: '1rem',
                  borderLeft: '4px solid var(--secondary-color)',
                }}
              >
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                  "{previewCard.quote?.text}"
                </p>
                {previewCard.quote?.author && (
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    — {previewCard.quote.author}
                  </div>
                )}
              </div>

              {/* Devotee Action bar mock */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #E6D5B8',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const text = `${previewCard.thought?.content}\n\n🕉️ ${previewCard.mantra?.text}\n\n"${previewCard.quote?.text}" — ${previewCard.quote?.author || ''}\n\n- Via Vipra Saarthi`;
                    navigator.clipboard.writeText(text);
                    toast.success('Card text copied to clipboard!');
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <MdContentCopy size={16} />
                  <span>Copy Devotee Text</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageSpiritualCards;
