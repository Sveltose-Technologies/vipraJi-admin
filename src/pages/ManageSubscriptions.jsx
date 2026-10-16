import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdSearch,
  MdRefresh,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
  MdAllInclusive,
  MdClose,
  MdSave,
  MdVisibility,
  MdCardMembership,
  MdCalendarToday,
  MdPerson,
  MdEmail,
  MdPhone,
  MdAutorenew,
  MdGridView,
  MdViewList,
  MdLayers,
  MdOutlineToggleOn,
  MdOutlineToggleOff,
  MdStar,
  MdCheck,
  MdInfoOutline
} from 'react-icons/md';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import {
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deactivateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllSubscriptions
} from '../api/subscription';

// Feature definitions with human-friendly labels & descriptions
const FEATURE_DEFINITIONS = [
  { key: 'pooja_library', label: 'Pooja Library', desc: 'Access to extensive Vedic pooja rituals & guidelines' },
  { key: 'stotram_library', label: 'Stotram Library', desc: 'Complete stotram text & recitation library' },
  { key: 'availability_calendar', label: 'Availability Calendar', desc: 'Booking & calendar scheduling management' },
  { key: 'community_access', label: 'Community Access', desc: 'Join community forums and priest networks' },
  { key: 'work_activity_history', label: 'Work & Activity History', desc: 'Track past yajman visits, poojas & records' },
  { key: 'muhurt', label: 'Muhurt Calculation', desc: 'Auspicious date and time finder' },
  { key: 'panchang', label: 'Daily Panchang', desc: 'Tithi, nakshatra, and daily astronomical timings' },
  { key: 'branded_pdf', label: 'Branded PDF Export', desc: 'Download custom-branded Kundali and Panchang PDFs' },
  { key: 'kundali_generation', label: 'Kundali Generation', desc: 'Detailed Vedic birth chart generation' },
  { key: 'kundali_matching', label: 'Kundali Matching', desc: 'Horoscope compatibility matching (Kundali Milan)' },
];

// Usage limits definitions
const LIMIT_DEFINITIONS = [
  { key: 'kundali_generation', label: 'Kundali Generation', defaultLimit: 5 },
  { key: 'kundali_matching', label: 'Kundali Matching', defaultLimit: 5 },
  { key: 'muhurt', label: 'Muhurt Calculations', defaultLimit: 20 },
  { key: 'panchang', label: 'Panchang Lookups', defaultLimit: 30 },
  { key: 'branded_pdf', label: 'Branded PDF Exports', defaultLimit: 2 },
];

const INITIAL_FEATURES = {
  pooja_library: true,
  stotram_library: true,
  availability_calendar: true,
  community_access: true,
  work_activity_history: true,
  muhurt: true,
  panchang: true,
  branded_pdf: false,
  kundali_generation: false,
  kundali_matching: false,
};

const INITIAL_LIMITS = {
  kundali_generation: 0,
  kundali_matching: 0,
  muhurt: 10,
  panchang: 30,
  branded_pdf: 0,
};

const INITIAL_PLAN_FORM = {
  name: '',
  code: '',
  price: '',
  currency: 'INR',
  billingInterval: 'monthly',
  description: '',
  features: { ...INITIAL_FEATURES },
  usageLimits: { ...INITIAL_LIMITS },
  isActive: true,
  sortOrder: 1,
};

// Demo/fallback plans in case server returns 502/empty
const DEMO_PLANS = [
  {
    _id: 'plan_demo_001',
    name: 'Vipra Saarthi Basic',
    code: 'VIPRA_BASIC_MONTHLY',
    price: 51,
    currency: 'INR',
    billingInterval: 'monthly',
    description: 'Essential toolkit for purohits with daily panchang, pooja library and essential muhurt calculations.',
    features: {
      pooja_library: true,
      stotram_library: true,
      availability_calendar: true,
      community_access: true,
      work_activity_history: true,
      muhurt: true,
      panchang: true,
      branded_pdf: false,
      kundali_generation: true,
      kundali_matching: false
    },
    usageLimits: {
      kundali_generation: 5,
      kundali_matching: 0,
      muhurt: 30,
      panchang: 60,
      branded_pdf: 0
    },
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'plan_demo_002',
    name: 'Vipra Saarthi Premium',
    code: 'VIPRA_PREMIUM_MONTHLY',
    price: 199,
    currency: 'INR',
    billingInterval: 'monthly',
    description: 'Comprehensive professional package including unlimited Kundali generations, branded PDF exports, and matching.',
    features: {
      pooja_library: true,
      stotram_library: true,
      availability_calendar: true,
      community_access: true,
      work_activity_history: true,
      muhurt: true,
      panchang: true,
      branded_pdf: true,
      kundali_generation: true,
      kundali_matching: true
    },
    usageLimits: {
      kundali_generation: -1,
      kundali_matching: -1,
      muhurt: -1,
      panchang: -1,
      branded_pdf: 100
    },
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'plan_demo_003',
    name: 'Vipra Saarthi Annual Acharya',
    code: 'VIPRA_ACHARYA_YEARLY',
    price: 1899,
    currency: 'INR',
    billingInterval: 'yearly',
    description: 'Full year access with priority support, unlimited branded PDFs, and maximum astrology tool access.',
    features: {
      pooja_library: true,
      stotram_library: true,
      availability_calendar: true,
      community_access: true,
      work_activity_history: true,
      muhurt: true,
      panchang: true,
      branded_pdf: true,
      kundali_generation: true,
      kundali_matching: true
    },
    usageLimits: {
      kundali_generation: -1,
      kundali_matching: -1,
      muhurt: -1,
      panchang: -1,
      branded_pdf: -1
    },
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString()
  }
];

// Helper to safely unwrap list from varying API formats
const unwrapPlans = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.plans)) return response.plans;
  if (response.data && Array.isArray(response.data.plans)) return response.data.plans;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.subscriptions && Array.isArray(response.subscriptions)) return response.subscriptions;
  return [];
};

const ManageSubscriptions = () => {
  const queryClient = useQueryClient();
  const { showConfirm } = useConfirmModal();

  // Top Tabs: 'plans' or 'subscribers'
  const [activeTab, setActiveTab] = useState('plans');

  // Plan Management States
  const [searchQuery, setSearchQuery] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('all'); // all, monthly, yearly
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [includeInactive, setIncludeInactive] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState(INITIAL_PLAN_FORM);
  const [viewDetailsPlan, setViewDetailsPlan] = useState(null);

  // Subscribers Tab States
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  // Fetch Subscription Plans
  const {
    data: rawPlansResponse,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ['subscription-plans', { includeInactive }],
    queryFn: () => getAllSubscriptionPlans({ includeInactive, limit: 100 }),
    retry: 1
  });

  // Fetch Subscribers (mock/existing data)
  const {
    data: subscribersData,
    isLoading: isLoadingSubscribers,
    refetch: refetchSubscribers
  } = useQuery({
    queryKey: ['subscribers-list'],
    queryFn: getAllSubscriptions,
  });

  // Decide if we should show demo plans if backend is 502/empty
  const plans = useMemo(() => {
    const list = unwrapPlans(rawPlansResponse);
    if (list.length > 0) return list;
    if (isPlansError) return DEMO_PLANS;
    return [];
  }, [rawPlansResponse, isPlansError]);

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (plan.name && plan.name.toLowerCase().includes(q)) ||
        (plan.code && plan.code.toLowerCase().includes(q)) ||
        (plan.description && plan.description.toLowerCase().includes(q));

      const matchesInterval =
        intervalFilter === 'all' ||
        (plan.billingInterval && plan.billingInterval.toLowerCase() === intervalFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && plan.isActive) ||
        (statusFilter === 'inactive' && !plan.isActive);

      return matchesSearch && matchesInterval && matchesStatus;
    });
  }, [plans, searchQuery, intervalFilter, statusFilter]);

  // Filtered Subscribers
  const subscribers = subscribersData?.subscriptions || [];
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const user = sub.user || {};
      const planName = sub.plan ? sub.plan.name.toLowerCase() : 'none';
      const q = subSearchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        (user.fullName && user.fullName.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.mobileNumber && user.mobileNumber.toLowerCase().includes(q)) ||
        planName.includes(q);

      const matchesStatus = subStatusFilter === 'all' || sub.status === subStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, subSearchQuery, subStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.isActive).length;
    const inactive = total - active;
    const monthly = plans.filter((p) => p.billingInterval === 'monthly').length;
    const yearly = plans.filter((p) => p.billingInterval === 'yearly').length;
    return { total, active, inactive, monthly, yearly };
  }, [plans]);

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: (data) => createSubscriptionPlan(data),
    onSuccess: () => {
      toast.success('Subscription plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      closePlanModal();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create plan';
      toast.error(msg);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => updateSubscriptionPlan(id, data),
    onSuccess: () => {
      toast.success('Subscription plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      closePlanModal();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update plan';
      toast.error(msg);
    }
  });

  const deactivatePlanMutation = useMutation({
    mutationFn: (id) => deactivateSubscriptionPlan(id),
    onSuccess: () => {
      toast.success('Plan status updated!');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to deactivate plan';
      toast.error(msg);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => deleteSubscriptionPlan(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete plan';
      toast.error(msg);
    }
  });

  // Handlers for Plan Modal
  const openCreateModal = () => {
    setEditingPlanId(null);
    setPlanForm({
      ...INITIAL_PLAN_FORM,
      features: { ...INITIAL_FEATURES },
      usageLimits: { ...INITIAL_LIMITS }
    });
    setIsPlanModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlanId(plan._id || plan.id);
    setPlanForm({
      name: plan.name || '',
      code: plan.code || '',
      price: plan.price ?? '',
      currency: plan.currency || 'INR',
      billingInterval: plan.billingInterval || 'monthly',
      description: plan.description || '',
      features: {
        ...INITIAL_FEATURES,
        ...(plan.features || {})
      },
      usageLimits: {
        ...INITIAL_LIMITS,
        ...(plan.usageLimits || {})
      },
      isActive: plan.isActive !== undefined ? Boolean(plan.isActive) : true,
      sortOrder: plan.sortOrder ?? 1,
    });
    setIsPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setIsPlanModalOpen(false);
    setEditingPlanId(null);
    setPlanForm(INITIAL_PLAN_FORM);
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();

    if (!planForm.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!planForm.code.trim()) {
      toast.error('Plan code is required');
      return;
    }
    if (planForm.price === '' || isNaN(Number(planForm.price))) {
      toast.error('Valid price is required');
      return;
    }

    const payload = {
      name: planForm.name.trim(),
      code: planForm.code.trim().toUpperCase(),
      price: Number(planForm.price),
      currency: planForm.currency.trim().toUpperCase() || 'INR',
      billingInterval: planForm.billingInterval,
      description: planForm.description.trim(),
      features: { ...planForm.features },
      usageLimits: {
        kundali_generation: Number(planForm.usageLimits.kundali_generation ?? 0),
        kundali_matching: Number(planForm.usageLimits.kundali_matching ?? 0),
        muhurt: Number(planForm.usageLimits.muhurt ?? 0),
        panchang: Number(planForm.usageLimits.panchang ?? 0),
        branded_pdf: Number(planForm.usageLimits.branded_pdf ?? 0),
      },
      isActive: Boolean(planForm.isActive),
      sortOrder: Number(planForm.sortOrder) || 1,
    };

    if (editingPlanId) {
      updatePlanMutation.mutate({ id: editingPlanId, data: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  const handleDeletePlan = (plan) => {
    const id = plan._id || plan.id;
    showConfirm(`Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`, () => {
      deletePlanMutation.mutate(id);
    });
  };

  const handleToggleDeactivate = (plan) => {
    const id = plan._id || plan.id;
    deactivatePlanMutation.mutate(id);
  };

  const handleSelectAllFeatures = (select) => {
    const updated = {};
    FEATURE_DEFINITIONS.forEach((f) => {
      updated[f.key] = select;
    });
    setPlanForm((prev) => ({
      ...prev,
      features: updated,
    }));
  };

  const handleLimitChange = (key, value) => {
    setPlanForm((prev) => ({
      ...prev,
      usageLimits: {
        ...prev.usageLimits,
        [key]: value,
      },
    }));
  };

  const calculateDaysLeft = (endDateStr) => {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isSaving = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <div className="page-content animate-fade-in" style={{ paddingTop: '0.5rem' }}>

      {/* PAGE HEADER */}
      <div className="top-header" style={{ margin: '-2rem -2rem 1.5rem -2rem' }}>
        <div>
          <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <MdCardMembership size={28} />
            Subscription & Plans Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Configure Vedic astrology subscription packages, feature permissions, and user limits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              refetchPlans();
              refetchSubscribers();
              toast.success('Refreshing data...');
            }}
            title="Refresh Data"
            style={{ padding: '0.6rem 0.9rem' }}
          >
            <MdRefresh size={19} />
          </button>

          {activeTab === 'plans' && (
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              <MdAdd size={20} />
              Create New Plan
            </button>
          )}
        </div>
      </div>

      {/* SERVER STATUS BANNER (If remote server returned 502/down) */}
      {isPlansError && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MdInfoOutline size={22} color="#D97706" />
            <div>
              <strong style={{ color: '#92400E' }}>Backend Notice:</strong>{' '}
              <span style={{ color: '#B45309' }}>
                {plansError?.response?.status === 502
                  ? 'Remote backend is currently returning 502 Bad Gateway. Displaying interactive preview plans so you can test all features and configurations.'
                  : (plansError?.message || 'Backend connection is intermittent.')}
              </span>
            </div>
          </div>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderColor: '#D97706', color: '#B45309' }}
            onClick={() => refetchPlans()}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* STATS TILES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(130, 0, 30, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
            <MdCardMembership size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Total Plans</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--primary-color)', lineHeight: 1.2 }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(23, 74, 13, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
            <MdCheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Active Plans</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--success-color)', lineHeight: 1.2 }}>{stats.active}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(240, 190, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
            <MdCalendarToday size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Billing Cycles</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {stats.monthly} Monthly <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>|</span> {stats.yearly} Yearly
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <MdPerson size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Subscribers</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#2563EB', lineHeight: 1.2 }}>{subscribers.length}</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div
        role="tablist"
        aria-label="Subscription Management Views"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          role="tab"
          aria-selected={activeTab === 'plans'}
          className={`btn ${activeTab === 'plans' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('plans')}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdCardMembership size={18} />
          Subscription Plans ({plans.length})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'subscribers'}
          className={`btn ${activeTab === 'subscribers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('subscribers')}
          style={{ borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MdPerson size={18} />
          Subscribers & Usage ({subscribers.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUBSCRIPTION PLANS MANAGEMENT                    */}
      {/* ======================================================== */}
      {activeTab === 'plans' && (
        <div>
          {/* SEARCH & FILTERS BAR */}
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 280px', gap: '0.5rem', background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <MdSearch size={22} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search plan by name, code, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <MdClose size={16} />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {/* Billing Interval Filter */}
              <select
                className="input-field"
                value={intervalFilter}
                onChange={(e) => setIntervalFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
              >
                <option value="all">All Intervals</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>

              {/* Status Filter */}
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Include Inactive Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                Include Inactive
              </label>

              {/* View Toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: viewMode === 'grid' ? 'var(--primary-color)' : '#fff',
                    color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Card View"
                >
                  <MdGridView size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: viewMode === 'table' ? 'var(--primary-color)' : '#fff',
                    color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Table View"
                >
                  <MdViewList size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {isLoadingPlans && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary-color)' }}></div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoadingPlans && filteredPlans.length === 0 && (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(130, 0, 30, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <MdCardMembership size={36} color="var(--primary-color)" />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Subscription Plans Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                {searchQuery || intervalFilter !== 'all' || statusFilter !== 'all'
                  ? 'No plans match your current filters. Try resetting the filters or search term.'
                  : 'Start by creating your first subscription plan to monetize your Vedic services.'}
              </p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <MdAdd size={20} /> Create New Plan
              </button>
            </div>
          )}

          {/* GRID VIEW */}
          {!isLoadingPlans && filteredPlans.length > 0 && viewMode === 'grid' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {filteredPlans.map((plan) => {
                const planId = plan._id || plan.id;
                const features = plan.features || {};
                const limits = plan.usageLimits || {};
                const activeFeatureCount = FEATURE_DEFINITIONS.filter((f) => Boolean(features[f.key])).length;

                return (
                  <div
                    key={planId}
                    className="glass-panel"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      borderTop: `4px solid ${plan.isActive ? 'var(--primary-color)' : '#9CA3AF'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Top Row: Title, Code, Status Badge */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: '#F3F4F6',
                                color: '#4B5563',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                              }}
                            >
                              {plan.code || 'PLAN_CODE'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              #{plan.sortOrder ?? 1}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                            {plan.name}
                          </h3>
                        </div>

                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleDeactivate(plan)}
                          title={plan.isActive ? 'Click to deactivate' : 'Click to activate'}
                          style={{
                            background: plan.isActive ? 'rgba(23, 74, 13, 0.1)' : 'rgba(155, 42, 31, 0.1)',
                            color: plan.isActive ? 'var(--success-color)' : 'var(--error-color)',
                            border: `1px solid ${plan.isActive ? 'rgba(23, 74, 13, 0.3)' : 'rgba(155, 42, 31, 0.3)'}`,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: plan.isActive ? 'var(--success-color)' : 'var(--error-color)'
                            }}
                          />
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      {/* Pricing Tag */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '1rem 0 0.5rem 0' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                          ₹{plan.price}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          / {plan.billingInterval || 'monthly'} ({plan.currency || 'INR'})
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          minHeight: '2.4rem',
                          lineHeight: '1.4',
                          marginBottom: '1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {plan.description || 'No description provided.'}
                      </p>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.75rem 0 1rem 0' }} />

                      {/* Usage Limits Highlights */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Quota Limits
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                          <div style={{ background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Kundali: </span>
                            <strong>{limits.kundali_generation === -1 ? '∞ Unlimited' : limits.kundali_generation ?? 0}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Matching: </span>
                            <strong>{limits.kundali_matching === -1 ? '∞ Unlimited' : limits.kundali_matching ?? 0}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Muhurt: </span>
                            <strong>{limits.muhurt === -1 ? '∞ Unlimited' : limits.muhurt ?? 0}</strong>
                          </div>
                          <div style={{ background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Panchang: </span>
                            <strong>{limits.panchang === -1 ? '∞ Unlimited' : limits.panchang ?? 0}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Feature Badges Count */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            Enabled Features
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                            {activeFeatureCount} / {FEATURE_DEFINITIONS.length}
                          </span>
                        </div>

                        {/* Visual chips of first few enabled features */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {FEATURE_DEFINITIONS.filter((f) => features[f.key]).slice(0, 4).map((f) => (
                            <span
                              key={f.key}
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(130, 0, 30, 0.06)',
                                color: 'var(--primary-color)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(130, 0, 30, 0.15)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <MdCheck size={12} /> {f.label}
                            </span>
                          ))}
                          {activeFeatureCount > 4 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: '#F3F4F6',
                                color: 'var(--text-secondary)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px'
                              }}
                            >
                              +{activeFeatureCount - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '1rem',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setViewDetailsPlan(plan)}
                        title="View Full Details"
                      >
                        <MdVisibility size={16} /> Details
                      </button>

                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: 'var(--primary-color)' }}
                        onClick={() => openEditModal(plan)}
                        title="Edit Plan"
                      >
                        <MdEdit size={16} /> Edit
                      </button>

                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: 'var(--error-color)', borderColor: '#FECACA' }}
                        onClick={() => handleDeletePlan(plan)}
                        title="Delete Plan"
                      >
                        <MdDeleteOutline size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {!isLoadingPlans && filteredPlans.length > 0 && viewMode === 'table' && (
            <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sort</th>
                    <th>Plan Name & Code</th>
                    <th>Price</th>
                    <th>Interval</th>
                    <th>Features Enabled</th>
                    <th>Limits (Kundali / Muhurt)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => {
                    const planId = plan._id || plan.id;
                    const features = plan.features || {};
                    const limits = plan.usageLimits || {};
                    const activeCount = FEATURE_DEFINITIONS.filter((f) => Boolean(features[f.key])).length;

                    return (
                      <tr key={planId}>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                            #{plan.sortOrder ?? 1}
                          </span>
                        </td>
                        <td>
                          <div>
                            <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{plan.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              {plan.code}
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>
                            ₹{plan.price}
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{
                              textTransform: 'capitalize',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: '#F3F4F6',
                              fontSize: '0.75rem'
                            }}
                          >
                            {plan.billingInterval || 'monthly'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                            {activeCount} / {FEATURE_DEFINITIONS.length}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem' }}>
                            K: {limits.kundali_generation === -1 ? '∞' : limits.kundali_generation ?? 0} | M: {limits.muhurt === -1 ? '∞' : limits.muhurt ?? 0}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleDeactivate(plan)}
                            style={{
                              background: plan.isActive ? 'rgba(23, 74, 13, 0.1)' : 'rgba(155, 42, 31, 0.1)',
                              color: plan.isActive ? 'var(--success-color)' : 'var(--error-color)',
                              border: 'none',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-icon"
                            title="View Details"
                            onClick={() => setViewDetailsPlan(plan)}
                            style={{ marginRight: '0.25rem' }}
                          >
                            <MdVisibility size={18} />
                          </button>
                          <button
                            className="btn-icon edit"
                            title="Edit"
                            onClick={() => openEditModal(plan)}
                            style={{ marginRight: '0.25rem' }}
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="btn-icon delete"
                            title="Delete"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <MdDeleteOutline size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SUBSCRIBERS / ACTIVE SUBSCRIPTIONS               */}
      {/* ======================================================== */}
      {activeTab === 'subscribers' && (
        <div>
          {/* Search Bar for Subscribers */}
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 300px', gap: '0.5rem', background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <MdSearch size={22} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search subscribers by name, email, or mobile..."
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="input-field"
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Subscribers List */}
          {filteredSubscribers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <MdPerson size={64} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <h3>No Subscribers Found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="user-list">
              {filteredSubscribers.map((sub) => {
                const daysLeft = calculateDaysLeft(sub.endDate);
                const user = sub.user || {};
                const plan = sub.plan;
                const features = sub.features || {};

                return (
                  <div key={sub._id} className="user-list-item glass-panel" style={{ display: 'block', marginBottom: '1.25rem' }}>
                    {/* Top Row: User Info & Subscription Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="user-avatar-large" style={{ width: '54px', height: '54px', fontSize: '1.35rem' }}>
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.fullName} className="avatar-img" />
                          ) : (
                            <span>{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{user.fullName}</h3>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MdEmail /> {user.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MdPhone /> {user.mobileNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className={`user-status-badge ${sub.status === 'active' ? 'active' : 'inactive'}`} style={{ display: 'inline-block', marginBottom: '0.35rem', padding: '0.35rem 0.85rem' }}>
                          {sub.status === 'active' ? 'Active Subscription' : 'Expired'}
                        </span>
                        {plan && (
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            ₹{plan.price} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {plan.billingInterval || 'Month'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Plan Details & Limits */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {/* Left: Plan Info */}
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                          <MdCardMembership color="var(--primary-color)" /> {plan ? plan.name : 'No Active Plan'}
                        </h4>

                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Start Date</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500', marginTop: '0.2rem' }}>
                              <MdCalendarToday size={13} color="var(--text-secondary)" />
                              {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>End Date</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500', marginTop: '0.2rem' }}>
                              <MdCalendarToday size={13} color="var(--text-secondary)" />
                              {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Days Left</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold', marginTop: '0.2rem', color: daysLeft > 5 ? 'var(--success-color)' : 'var(--error-color)' }}>
                              <MdAutorenew size={14} />
                              {daysLeft} Days
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Feature Limits */}
                      <div style={{ background: 'var(--bg-color)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
                          Quota Usage
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <FeatureProgressBar name="Kundali Generation" used={features.kundaliGeneration?.used} limit={features.kundaliGeneration?.limit} />
                          <FeatureProgressBar name="Panchang Calls" used={features.panchang?.used} limit={features.panchang?.limit} />
                          <FeatureProgressBar name="Muhurat" used={features.muhurat?.used} limit={features.muhurat?.limit} />
                          <FeatureProgressBar name="Branded PDF" used={features.brandedPdf?.used} limit={features.brandedPdf?.limit} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN                  */}
      {/* ======================================================== */}
      {isPlanModalOpen && (
        <div className="modal-overlay" onClick={closePlanModal}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdCardMembership />
                {editingPlanId ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h2>
              <button className="modal-close-btn" onClick={closePlanModal}>
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              {/* SECTION 1: BASIC INFORMATION */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></span>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary-color)', fontWeight: '700' }}>
                    1. Basic & Pricing Details
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-name">
                      Plan Name <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    <input
                      id="plan-name"
                      className="input-field"
                      placeholder="e.g. Vipra Saarthi Acharya"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-code">
                      Plan Code <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    <input
                      id="plan-code"
                      className="input-field"
                      placeholder="e.g. VIPRA_ACHARYA_YEARLY"
                      value={planForm.code}
                      onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-price">
                      Price <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>₹</span>
                      <input
                        id="plan-price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field"
                        placeholder="199"
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-interval">
                      Billing Interval <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    <select
                      id="plan-interval"
                      className="input-field"
                      value={planForm.billingInterval}
                      onChange={(e) => setPlanForm({ ...planForm, billingInterval: e.target.value })}
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-sort-order">
                      Sort Order
                    </label>
                    <input
                      id="plan-sort-order"
                      type="number"
                      min="1"
                      className="input-field"
                      placeholder="1"
                      value={planForm.sortOrder}
                      onChange={(e) => setPlanForm({ ...planForm, sortOrder: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="plan-currency">
                      Currency
                    </label>
                    <input
                      id="plan-currency"
                      className="input-field"
                      placeholder="INR"
                      value={planForm.currency}
                      onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label" htmlFor="plan-desc">
                    Description
                  </label>
                  <textarea
                    id="plan-desc"
                    className="input-field"
                    rows="2"
                    placeholder="Brief description of the package, target audience, and key highlights..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={planForm.isActive}
                      onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    />
                    <span>Plan is Active (Visible to users)</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: FEATURE PERMISSIONS */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></span>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary-color)', fontWeight: '700' }}>
                      2. Feature Access (10 Features)
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => handleSelectAllFeatures(true)}
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => handleSelectAllFeatures(false)}
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {FEATURE_DEFINITIONS.map((feat) => {
                    const isChecked = Boolean(planForm.features[feat.key]);
                    return (
                      <label
                        key={feat.key}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: `1px solid ${isChecked ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          backgroundColor: isChecked ? 'rgba(130, 0, 30, 0.03)' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              features: {
                                ...planForm.features,
                                [feat.key]: e.target.checked
                              }
                            })
                          }
                          style={{ marginTop: '0.2rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: isChecked ? 'var(--primary-color)' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {feat.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.3' }}>
                            {feat.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: USAGE LIMITS */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></span>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--primary-color)', fontWeight: '700' }}>
                    3. Usage Quota & Limits
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Set quantitative quota allowances per billing period. Check <strong>Unlimited (∞)</strong> for unrestricted calls or enter a specific numerical threshold.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {LIMIT_DEFINITIONS.map((limit) => {
                    const currentVal = planForm.usageLimits[limit.key] ?? 0;
                    const isUnlimited = currentVal === -1;

                    return (
                      <div
                        key={limit.key}
                        style={{
                          background: '#FAFAFA',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.85rem 1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {limit.label}
                          </span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: '600' }}>
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => handleLimitChange(limit.key, e.target.checked ? -1 : limit.defaultLimit)}
                            />
                            Unlimited (∞)
                          </label>
                        </div>

                        {isUnlimited ? (
                          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(23, 74, 13, 0.08)', borderRadius: '6px', color: 'var(--success-color)', fontWeight: '700', fontSize: '0.85rem', textAlign: 'center' }}>
                            ∞ Unlimited Access
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="number"
                              min="0"
                              className="input-field"
                              value={currentVal}
                              onChange={(e) => handleLimitChange(limit.key, Number(e.target.value))}
                              placeholder="0"
                              style={{ padding: '0.5rem 0.75rem' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              calls / period
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closePlanModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px' }}
                >
                  <MdSave size={18} />
                  {isSaving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW PLAN DETAILS                                */}
      {/* ======================================================== */}
      {viewDetailsPlan && (
        <div className="modal-overlay" onClick={() => setViewDetailsPlan(null)}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
          >
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', background: '#F3F4F6', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {viewDetailsPlan.code}
                </span>
                <h2 className="modal-title" style={{ marginTop: '0.4rem', color: 'var(--primary-color)' }}>
                  {viewDetailsPlan.name}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setViewDetailsPlan(null)}>
                <MdClose size={24} />
              </button>
            </div>

            {/* Price & Status Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Price & Interval</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                  ₹{viewDetailsPlan.price}{' '}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                    / {viewDetailsPlan.billingInterval} ({viewDetailsPlan.currency || 'INR'})
                  </span>
                </div>
              </div>

              <div>
                <span
                  style={{
                    background: viewDetailsPlan.isActive ? 'rgba(23, 74, 13, 0.1)' : 'rgba(155, 42, 31, 0.1)',
                    color: viewDetailsPlan.isActive ? 'var(--success-color)' : 'var(--error-color)',
                    padding: '0.4rem 1rem',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}
                >
                  {viewDetailsPlan.isActive ? 'Active Plan' : 'Inactive Plan'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Description
              </h4>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {viewDetailsPlan.description || 'No description provided.'}
              </p>
            </div>

            {/* Quota Limits */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Usage Limits
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                {LIMIT_DEFINITIONS.map((lim) => {
                  const val = viewDetailsPlan.usageLimits?.[lim.key];
                  const isUnlim = val === -1;
                  return (
                    <div key={lim.key} style={{ background: '#F9FAFB', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lim.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: isUnlim ? 'var(--success-color)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {isUnlim ? '∞ Unlimited' : (val ?? 0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features Checklist */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Features & Capabilities
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                {FEATURE_DEFINITIONS.map((feat) => {
                  const isEnabled = Boolean(viewDetailsPlan.features?.[feat.key]);
                  return (
                    <div
                      key={feat.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: isEnabled ? 'rgba(23, 74, 13, 0.05)' : '#F9FAFB',
                        color: isEnabled ? 'var(--success-color)' : '#9CA3AF',
                        fontSize: '0.85rem',
                        fontWeight: isEnabled ? '600' : 'normal'
                      }}
                    >
                      {isEnabled ? <MdCheckCircle size={18} /> : <MdCancel size={18} />}
                      <span>{feat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setViewDetailsPlan(null);
                  openEditModal(viewDetailsPlan);
                }}
              >
                <MdEdit size={16} /> Edit Plan
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setViewDetailsPlan(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Subscriber Quota Progress Bar
const FeatureProgressBar = ({ name, used = 0, limit = 0 }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100);

  let progressColor = 'var(--primary-color)';
  if (!isUnlimited) {
    if (percentage >= 90) progressColor = 'var(--error-color)';
    else if (percentage >= 75) progressColor = '#F5A623';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{name}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isUnlimited ? (
            <><strong style={{ color: 'var(--text-primary)' }}>{used}</strong> / Unlimited</>
          ) : (
            <><strong style={{ color: percentage >= 100 ? 'var(--error-color)' : 'var(--text-primary)' }}>{used}</strong> / {limit}</>
          )}
        </span>
      </div>
      <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: isUnlimited ? '100%' : `${percentage}%`,
            background: isUnlimited ? 'var(--success-color)' : progressColor,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
};

export default ManageSubscriptions;
