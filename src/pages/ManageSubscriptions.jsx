import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllSubscriptions } from '../api/subscription';
import { 
  MdPerson, MdEmail, MdPhone, MdFilterList, 
  MdSearch, MdOutlineErrorOutline, MdCardMembership,
  MdCalendarToday, MdAutorenew
} from 'react-icons/md';
import Modal from '../components/Modal';

const ManageSubscriptions = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getAllSubscriptions,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const subscriptions = data?.subscriptions || [];

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const user = sub.user || {};
      const planName = sub.plan ? sub.plan.name.toLowerCase() : 'none';
      const query = searchQuery.toLowerCase();
      
      const matchesSearch = 
        (user.fullName && user.fullName.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.mobileNumber && user.mobileNumber.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesPlan = planFilter === 'all' || 
                         (planFilter === 'premium' && planName.includes('premium')) ||
                         (planFilter === 'basic' && planName.includes('basic')) ||
                         (planFilter === 'none' && !sub.plan);

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  const calculateDaysLeft = (endDateStr) => {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary-color)' }}></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--error-color)' }}>
        <MdOutlineErrorOutline size={48} style={{ marginBottom: '1rem' }} />
        <h2>Error Loading Subscriptions</h2>
        <p>{error.message || 'An unexpected error occurred while fetching subscriptions.'}</p>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in ecom-layout" style={{ paddingTop: '0.5rem' }}>
      
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filters">
        <div className="filter-section">
          <h4>Plan Type</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input type="radio" checked={planFilter === 'all'} onChange={() => setPlanFilter('all')} />
              All Plans
            </label>
            <label className="filter-label">
              <input type="radio" checked={planFilter === 'basic'} onChange={() => setPlanFilter('basic')} />
              Vipra Saarthi Basic
            </label>
            <label className="filter-label">
              <input type="radio" checked={planFilter === 'premium'} onChange={() => setPlanFilter('premium')} />
              Vipra Saarthi Premium
            </label>
            <label className="filter-label">
              <input type="radio" checked={planFilter === 'none'} onChange={() => setPlanFilter('none')} />
              No Plan / Expired
            </label>
          </div>
        </div>

        <div className="filter-section">
          <h4>Subscription Status</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input type="radio" checked={statusFilter === 'all'} onChange={() => setStatusFilter('all')} />
              All Status
            </label>
            <label className="filter-label">
              <input type="radio" checked={statusFilter === 'active'} onChange={() => setStatusFilter('active')} />
              Active
            </label>
            <label className="filter-label">
              <input type="radio" checked={statusFilter === 'expired'} onChange={() => setStatusFilter('expired')} />
              Expired
            </label>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{width: '100%', marginTop: '1rem'}}
          onClick={() => setIsFilterModalOpen(false)}
        >
          Apply Filters
        </button>
      </Modal>

      <div className="ecom-container">

        {/* RIGHT MAIN: LIST VIEW & SEARCH */}
        <main className="ecom-main">
          
          {/* Search Bar */}
          <div className="search-container glass-panel" style={{ position: 'sticky', top: 0, zIndex: 40, marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
              <MdSearch className="search-icon" size={24} />
              <input 
                type="text" 
                className="search-input" 
                style={{ padding: '0.5rem 0' }}
                placeholder="Search by name, email, or mobile number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Active Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {statusFilter !== 'all' && <span className="detail-tag" style={{ margin: 0, textTransform: 'capitalize' }}>Status: {statusFilter}</span>}
              {planFilter !== 'all' && <span className="detail-tag" style={{ margin: 0, textTransform: 'capitalize' }}>Plan: {planFilter}</span>}
              
              {(statusFilter !== 'all' || planFilter !== 'all' || searchQuery !== '') && (
                <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => { setPlanFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}>
                  Clear All
                </button>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => setIsFilterModalOpen(true)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdFilterList size={20} />
              Filters
            </button>
          </div>

          {/* Subscriptions List */}
          {filteredSubscriptions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
              <MdCardMembership size={64} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <h3>No Subscriptions Found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="user-list">
              {filteredSubscriptions.map((sub) => {
                const daysLeft = calculateDaysLeft(sub.endDate);
                const user = sub.user || {};
                const plan = sub.plan;
                const features = sub.features || {};

                return (
                  <div key={sub._id} className="user-list-item glass-panel" style={{ display: 'block' }}>
                    
                    {/* Top Row: User Info & Subscription Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="user-avatar-large" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.fullName} className="avatar-img" />
                          ) : (
                            <span>{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{user.fullName}</h3>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MdEmail /> {user.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MdPhone /> {user.mobileNumber}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span className={`user-status-badge ${sub.status === 'active' ? 'active' : 'inactive'}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '0.4rem 1rem' }}>
                          {sub.status === 'active' ? 'Active Subscription' : 'Expired / None'}
                        </span>
                        {plan && (
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            ₹{plan.price} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {plan.billingCycle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Plan Details & Limits */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                      
                      {/* Left side: Plan Info */}
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MdCardMembership color="var(--primary-color)" /> {plan ? plan.name : 'No Active Plan'}
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Start Date</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500', marginTop: '0.25rem' }}>
                              <MdCalendarToday size={14} color="var(--text-secondary)" />
                              {new Date(sub.startDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>End Date</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500', marginTop: '0.25rem' }}>
                              <MdCalendarToday size={14} color="var(--text-secondary)" />
                              {new Date(sub.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Days Left</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold', marginTop: '0.25rem', color: daysLeft > 5 ? 'var(--success-color)' : 'var(--error-color)' }}>
                              <MdAutorenew size={16} />
                              {daysLeft} Days
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Feature Limits */}
                      <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Feature Usage (API Calls)</h5>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </main>
      </div>

    </div>
  );
};

const FeatureProgressBar = ({ name, used = 0, limit = 0 }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
  
  let progressColor = 'var(--primary-color)';
  if (!isUnlimited) {
    if (percentage >= 90) progressColor = 'var(--error-color)';
    else if (percentage >= 75) progressColor = '#F5A623'; // warning orange
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{name}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isUnlimited ? (
             <><strong style={{color: 'var(--text-primary)'}}>{used}</strong> / Unlimited</>
          ) : (
            <><strong style={{color: percentage >= 100 ? 'var(--error-color)' : 'var(--text-primary)'}}>{used}</strong> / {limit}</>
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
