import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '../api/auth';
import { 
  MdPerson, MdEmail, MdPhone, MdVerified, MdOutlineErrorOutline, 
  MdSearch, MdFilterList, MdCheckCircle, MdCancel
} from 'react-icons/md';

const ManageUsers = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const users = data?.auths || [];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Search Query (Name, Email, Phone)
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (user.fullName && user.fullName.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.mobileNumber && user.mobileNumber.toLowerCase().includes(query));

      // 2. Role Filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // 3. Status Filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

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
        <h2>Error Loading Users</h2>
        <p>{error.message || 'An unexpected error occurred while fetching users.'}</p>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in ecom-layout">
      
      {/* Header Section */}
      <div className="top-header" style={{ marginBottom: '2rem', padding: 0, borderBottom: 'none' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>User Management</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Manage and view all registered users ({filteredUsers.length} shown)</p>
        </div>
      </div>

      <div className="ecom-container">
        
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="ecom-sidebar glass-panel">
          <div className="filter-header">
            <MdFilterList size={20} />
            <h3>Filters</h3>
          </div>
          
          <div className="filter-section">
            <h4>Role</h4>
            <div className="filter-options">
              <label className="filter-label">
                <input type="radio" name="role" checked={roleFilter === 'all'} onChange={() => setRoleFilter('all')} />
                All Roles
              </label>
              <label className="filter-label">
                <input type="radio" name="role" checked={roleFilter === 'admin'} onChange={() => setRoleFilter('admin')} />
                Admin
              </label>
              <label className="filter-label">
                <input type="radio" name="role" checked={roleFilter === 'user'} onChange={() => setRoleFilter('user')} />
                User
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h4>Account Status</h4>
            <div className="filter-options">
              <label className="filter-label">
                <input type="radio" name="status" checked={statusFilter === 'all'} onChange={() => setStatusFilter('all')} />
                All Status
              </label>
              <label className="filter-label">
                <input type="radio" name="status" checked={statusFilter === 'active'} onChange={() => setStatusFilter('active')} />
                Active
              </label>
              <label className="filter-label">
                <input type="radio" name="status" checked={statusFilter === 'inactive'} onChange={() => setStatusFilter('inactive')} />
                Inactive
              </label>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{width: '100%', marginTop: '1rem'}}
            onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
          >
            Clear Filters
          </button>
        </aside>

        {/* RIGHT MAIN: LIST VIEW & SEARCH */}
        <main className="ecom-main">
          
          {/* Search Bar */}
          <div className="search-container glass-panel">
            <MdSearch className="search-icon" size={24} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search users by name, email, or mobile number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
              <MdPerson size={64} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <h3>No Users Found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="user-list">
              {filteredUsers.map((user) => (
                <div key={user._id} className="user-list-item glass-panel">
                  
                  {/* Left: Avatar & Badges */}
                  <div className="user-item-left">
                    <div className="user-avatar-large">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.fullName} className="avatar-img" />
                      ) : (
                        <span>{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div className="user-badges">
                      <span className="user-role-badge">{user.role}</span>
                      <span className={`user-status-badge ${user.status === 'active' ? 'active' : 'inactive'}`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Middle: Details */}
                  <div className="user-item-middle">
                    <h3 className="user-name-display">
                      {user.fullName}
                      {user.isVerified && <MdVerified className="verified-icon" title="Verified User" />}
                    </h3>
                    
                    <div className="user-contact-grid">
                      <div className="contact-item">
                        <MdEmail className="contact-icon" />
                        <span title={user.email}>{user.email || 'N/A'}</span>
                      </div>
                      <div className="contact-item">
                        <MdPhone className="contact-icon" />
                        <span>{user.mobileNumber || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="user-extra-details">
                       <span className="detail-tag"><strong>Exp:</strong> {user.experience || 0} Yrs</span>
                       <span className="detail-tag"><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</span>
                       <span className="detail-tag">
                         <strong>Pass Reset OTP:</strong> 
                         {user.resetOtpVerified ? <MdCheckCircle color="var(--success-color)" style={{marginLeft:'4px', verticalAlign:'middle'}}/> : <MdCancel color="var(--error-color)" style={{marginLeft:'4px', verticalAlign:'middle'}}/>}
                       </span>
                    </div>
                  </div>
                  
                  {/* Right: Actions (Placeholder for future actions like Edit/Delete) */}
                  <div className="user-item-right">
                     <button className="btn btn-outline">View Details</button>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        /* E-Commerce Layout */
        .ecom-container {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .ecom-sidebar {
          flex: 0 0 280px;
          padding: 1.5rem;
          position: sticky;
          top: 2rem;
        }

        .ecom-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Sidebar Filters */
        .filter-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .filter-header h3 {
          font-size: 1.25rem;
          margin: 0;
          color: var(--text-primary);
        }

        .filter-section {
          margin-bottom: 1.5rem;
        }

        .filter-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem 0;
        }

        .filter-label input[type="radio"] {
          accent-color: var(--primary-color);
          width: 1.1rem;
          height: 1.1rem;
          cursor: pointer;
        }

        /* Search Bar */
        .search-container {
          display: flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          background: white;
        }

        .search-icon {
          color: var(--text-secondary);
          margin-right: 1rem;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 1rem 0;
          font-size: 1.1rem;
          color: var(--text-primary);
          background: transparent;
        }
        
        .search-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.7;
        }

        /* User List Items */
        .user-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-list-item {
          display: flex;
          flex-direction: row;
          padding: 1.5rem;
          gap: 2rem;
          background: #ffffff;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
        }

        .user-list-item:hover {
          transform: translateX(4px);
          border-left-color: var(--primary-color);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .user-item-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex: 0 0 100px;
        }

        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(230, 126, 34, 0.1), rgba(155, 42, 31, 0.1));
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-badges {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
          width: 100%;
        }

        .user-role-badge, .user-status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          width: 100%;
        }

        .user-role-badge {
          background-color: var(--border-color);
          color: var(--text-secondary);
        }

        .user-status-badge.active {
          background-color: rgba(22, 163, 74, 0.1);
          color: var(--success-color);
        }

        .user-status-badge.inactive {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .user-item-middle {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .user-name-display {
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .verified-icon {
          color: #3B82F6;
          font-size: 1.25rem;
        }

        .user-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .contact-icon {
          color: var(--primary-color);
          font-size: 1.25rem;
        }

        .user-extra-details {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px dashed var(--border-color);
        }

        .detail-tag {
          font-size: 0.85rem;
          color: var(--text-secondary);
          background-color: var(--bg-color);
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
        }
        
        .detail-tag strong {
          color: var(--text-primary);
          margin-right: 0.25rem;
        }

        .user-item-right {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-end;
          padding-top: 0.5rem;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
        }

        .btn-outline:hover {
          background: var(--primary-color);
          color: white;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .ecom-container {
            flex-direction: column;
          }
          .ecom-sidebar {
            flex: auto;
            width: 100%;
            position: static;
          }
          .filter-options {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 1.5rem;
          }
          .user-list-item {
            flex-direction: column;
          }
          .user-item-left {
            flex-direction: row;
            flex: auto;
            align-items: center;
            justify-content: space-between;
          }
          .user-badges {
            flex-direction: row;
            width: auto;
          }
          .user-role-badge, .user-status-badge {
            width: auto;
          }
          .user-item-right {
            align-items: stretch;
            padding-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageUsers;
