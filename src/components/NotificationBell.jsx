import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MdNotifications,
  MdNotificationsActive,
  MdCheckCircle,
  MdClose,
  MdLaunch,
} from 'react-icons/md';
import { getAllNotifications } from '../api/notification';
import { getTypeIcon, getTypeBadgeClass, formatTimeAgo } from '../utils/notificationHelpers';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, important
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_notifs') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedNotif, setSelectedNotif] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications for the bell
  const { data: rawNotifs } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => getAllNotifications({ limit: 15 }),
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const notifications = rawNotifs?.data || (Array.isArray(rawNotifs) ? rawNotifs : []);

  // Sync read states to localStorage
  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('admin_read_notifs', JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n._id);
    setReadIds(allIds);
    localStorage.setItem('admin_read_notifs', JSON.stringify(allIds));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n._id)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !readIds.includes(n._id);
    if (filter === 'important') {
      return n.type === 'SUBSCRIPTION_RENEWAL' || n.type === 'FESTIVAL_REMINDER';
    }
    return true;
  });

  const handleOpenDetail = (notif) => {
    markAsRead(notif._id);
    setSelectedNotif(notif);
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="View notifications"
      >
        {unreadCount > 0 ? (
          <MdNotificationsActive size={22} className="bell-active-icon" />
        ) : (
          <MdNotifications size={22} />
        )}
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass-panel animate-fade-in">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="notif-dropdown-title-group">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-read-btn"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notif-dropdown-tabs">
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${filter === 'important' ? 'active' : ''}`}
              onClick={() => setFilter('important')}
            >
              Urgent
            </button>
          </div>

          {/* Notification Items List */}
          <div className="notif-dropdown-list">
            {filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <MdCheckCircle size={36} style={{ color: '#10B981', marginBottom: '0.5rem' }} />
                <p>No notifications found</p>
                <span>You are all caught up!</span>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isRead = readIds.includes(item._id);
                return (
                  <div
                    key={item._id}
                    className={`notif-item ${!isRead ? 'unread' : ''}`}
                    onClick={() => handleOpenDetail(item)}
                  >
                    <div className="notif-item-icon-col">
                      <div className={`notif-item-icon-wrap ${getTypeBadgeClass(item.type)}`}>
                        {getTypeIcon(item.type, 18)}
                      </div>
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-top">
                        <span className="notif-item-title">{item.title}</span>
                        <span className="notif-item-time">
                          {formatTimeAgo(item.sentAt || item.createdAt)}
                        </span>
                      </div>
                      <p className="notif-item-body">{item.body}</p>
                      <div className="notif-item-meta">
                        <span className="notif-item-type-tag">
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.status && (
                          <span className={`notif-status-dot status-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isRead && <span className="notif-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="notif-dropdown-footer">
            <button
              type="button"
              className="notif-view-all-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('/manage-notifications');
              }}
            >
              <span>Go to Notification Center</span>
              <MdLaunch size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNotif && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className={`notif-item-icon-wrap ${getTypeBadgeClass(selectedNotif.type)}`} style={{ width: 36, height: 36 }}>
                  {getTypeIcon(selectedNotif.type, 20)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Notification Details</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedNotif.type} • {selectedNotif.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedNotif(null)}
              >
                <MdClose size={22} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 0' }}>
              <div style={{ marginBottom: '1rem', background: '#F9FAFB', padding: '1rem', borderRadius: '10px' }}>
                <h4 style={{ color: 'var(--primary-color)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                  {selectedNotif.title}
                </h4>
                <p style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                  {selectedNotif.body}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>RECIPIENT TYPE</div>
                  <div style={{ fontSize: '0.9rem', color: '#78350F', fontWeight: 700, marginTop: '2px' }}>
                    {selectedNotif.recipientType}
                  </div>
                </div>
                <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>DELIVERED / TOTAL</div>
                  <div style={{ fontSize: '0.9rem', color: '#14532D', fontWeight: 700, marginTop: '2px' }}>
                    {selectedNotif.successCount || 0} / {selectedNotif.recipientCount || 0}
                  </div>
                </div>
              </div>

              {selectedNotif.data && Object.keys(selectedNotif.data).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Attached Payload Data:
                  </div>
                  <pre style={{ background: '#1F2937', color: '#F3F4F6', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto' }}>
                    {JSON.stringify(selectedNotif.data, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Sent: {selectedNotif.sentAt ? new Date(selectedNotif.sentAt).toLocaleString('en-IN') : 'Not sent yet'}</span>
                <span>Created: {new Date(selectedNotif.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedNotif(null);
                  setIsOpen(false);
                  navigate('/manage-notifications');
                }}
              >
                Open in Admin Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
