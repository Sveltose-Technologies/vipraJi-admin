import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllYajmanEntries } from '../api/yajmanEntry';
import { MdPerson, MdPhone, MdLocationOn, MdOutlineErrorOutline } from 'react-icons/md';

const ManageYajman = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['yajman-entries'],
    queryFn: getAllYajmanEntries,
  });

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
        <h2>Error Loading Yajman Entries</h2>
        <p>{error.message || 'An unexpected error occurred while fetching yajman data.'}</p>
      </div>
    );
  }

  // Fallback to empty array if structure differs slightly
  const yajmans = data?.data || data?.yajmans || data || [];
  // Ensure it's an array
  const yajmanList = Array.isArray(yajmans) ? yajmans : (Array.isArray(data?.entries) ? data.entries : []);

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ marginBottom: '2rem', padding: 0, borderBottom: 'none' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Manage Yajman</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>View and manage all yajman entries in the system ({yajmanList.length} total)</p>
        </div>
      </div>

      {yajmanList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <MdPerson size={64} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
          <h3>No Yajman Entries Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>There are no yajman entries registered yet.</p>
        </div>
      ) : (
        <div className="yajman-grid">
          {yajmanList.map((yajman, index) => (
            <div key={yajman._id || index} className="yajman-card glass-panel">
              <div className="yajman-card-header">
                <div className="yajman-avatar">
                  {yajman.image || yajman.photo ? (
                    <img src={yajman.image || yajman.photo} alt={yajman.name || 'Yajman'} className="avatar-img" />
                  ) : (
                    <span>{(yajman.name || yajman.fullName || 'Y').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="yajman-status-badge">
                  {yajman.status || 'Active'}
                </div>
              </div>
              
              <div className="yajman-card-body">
                <h3 className="yajman-name">{yajman.name || yajman.fullName || 'Unknown Yajman'}</h3>
                <p className="yajman-category">{yajman.category?.name || yajman.category || 'General'}</p>
                
                <div className="yajman-contact-info">
                  <div className="contact-item">
                    <MdPhone className="contact-icon" />
                    <span>{yajman.mobile || yajman.phone || yajman.mobileNumber || 'N/A'}</span>
                  </div>
                  {(yajman.city || yajman.location || yajman.address) && (
                    <div className="contact-item">
                      <MdLocationOn className="contact-icon" />
                      <span>{yajman.city || yajman.location || yajman.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .yajman-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .yajman-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-left: 4px solid var(--secondary-color);
        }

        .yajman-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
        }

        .yajman-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem 1.25rem 0;
        }

        .yajman-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(245, 166, 35, 0.15);
          color: var(--secondary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          overflow: hidden;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yajman-status-badge {
          background-color: rgba(230, 126, 34, 0.1);
          color: var(--primary-color);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .yajman-card-body {
          padding: 1.25rem;
          flex-grow: 1;
        }

        .yajman-name {
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .yajman-category {
          font-size: 0.85rem;
          color: var(--vipra-color);
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .yajman-contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .contact-icon {
          color: var(--text-secondary);
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default ManageYajman;
