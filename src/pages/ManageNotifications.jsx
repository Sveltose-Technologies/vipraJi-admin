import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdSend,
  MdSchedule,
  MdCancel,
  MdRefresh,
  MdReplay,
  MdAssessment,
  MdDeleteOutline,
  MdEdit,
  MdSearch,
  MdClose,
  MdCampaign,
  MdGroup,
  MdCardMembership,
  MdPhoneIphone,
  MdAutorenew,
  MdContentCopy,
  MdInfoOutline,
  MdCheckCircle,
} from 'react-icons/md';

import {
  getAllNotifications,
  getNotificationStatistics,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  sendNotificationNow,
  scheduleNotification,
  cancelNotification,
  retryFailedNotification,
  getDeliveryReport,
  previewNotification,
  triggerRenewalReminders,
  NOTIFICATION_TYPES,
  TARGET_PLAN_CODES,
} from '../api/notification';
import { getAllUsers } from '../api/auth';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import Modal from '../components/Modal';
import { getTypeIcon, getTypeBadgeClass, formatTimeAgo } from '../utils/notificationHelpers';

// Suggested deep-link screens available in the mobile app
const MOBILE_APP_SCREENS = [
  { value: 'Home', label: 'Home Screen' },
  { value: 'Panchang', label: 'Daily Panchang' },
  { value: 'Subscription', label: 'Subscription / Plans' },
  { value: 'PoojaDetail', label: 'Pooja Details' },
  { value: 'AartiDetail', label: 'Aarti Player' },
  { value: 'CommunityPostDetail', label: 'Community Post' },
];

const ManageNotifications = () => {
  const queryClient = useQueryClient();
  const { showConfirm } = useConfirmModal();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recipientFilter, setRecipientFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [targetNotification, setTargetNotification] = useState(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [deliveryReportModalOpen, setDeliveryReportModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formType, setFormType] = useState('CUSTOM');
  const [formRecipientType, setFormRecipientType] = useState('ALL');
  const [formRecipientUserIds, setFormRecipientUserIds] = useState([]);
  const [formTargetPlanCodes, setFormTargetPlanCodes] = useState([]);
  const [formPersonalization, setFormPersonalization] = useState(true);
  const [selectedMobileScreen, setSelectedMobileScreen] = useState('Home');
  const [formCustomDataJson, setFormCustomDataJson] = useState('{\n  "screen": "Home"\n}');
  const [userSearchText, setUserSearchText] = useState('');
  const [phoneOsPreview, setPhoneOsPreview] = useState('ios'); // 'ios' | 'android'
  const [livePreviewResult, setLivePreviewResult] = useState(null);
  const [isLivePreviewLoading, setIsLivePreviewLoading] = useState(false);

  // 1. Fetch Notifications List
  const {
    data: rawNotifications,
    isLoading: isNotifsLoading,
    isFetching: isNotifsFetching,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getAllNotifications({ limit: 100 }),
  });

  const notifications = useMemo(() => {
    return rawNotifications?.data || (Array.isArray(rawNotifications) ? rawNotifications : []);
  }, [rawNotifications]);

  // 2. Fetch Notifications Statistics
  const {
    data: rawStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['notifications', 'statistics'],
    queryFn: getNotificationStatistics,
  });

  const stats = rawStats?.data || {
    totalNotifications: notifications.length,
    totalDeliveries: 0,
    totalReadDeliveries: 0,
    readRate: '0%',
    byStatus: {},
    byType: {},
  };

  // 3. Fetch Users (for SELECTED_USERS targeting)
  const { data: rawUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  const usersList = useMemo(() => {
    return rawUsers?.data || rawUsers?.auths || rawUsers?.users || (Array.isArray(rawUsers) ? rawUsers : []);
  }, [rawUsers]);

  // 4. Fetch Delivery Report (when report modal is open)
  const {
    data: rawDeliveryReport,
    isLoading: isReportLoading,
    refetch: refetchDeliveryReport,
  } = useQuery({
    queryKey: ['notifications', 'report', targetNotification?._id],
    queryFn: () => getDeliveryReport(targetNotification?._id),
    enabled: !!(deliveryReportModalOpen && targetNotification?._id),
  });

  const deliveryReport = rawDeliveryReport?.data || rawDeliveryReport || null;
  const deliverySummary = rawDeliveryReport?.summary || null;

  // --- MUTATIONS ---

  // Trigger Renewal Reminders Mutation
  const triggerRenewalMutation = useMutation({
    mutationFn: triggerRenewalReminders,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(
        res.message || 'Renewal scan completed! New reminders triggered if due.',
        { duration: 5000 }
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to trigger renewal reminders');
    },
  });

  // Create Notification Mutation
  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Mobile notification campaign created successfully');
      resetForm();
      setCreateModalOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create notification';
      toast.error(msg);
    },
  });

  // Update Notification Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Mobile notification campaign updated successfully');
      resetForm();
      setCreateModalOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update notification';
      toast.error(msg);
    },
  });

  // Delete Notification Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification campaign deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    },
  });

  // Send Now Mutation
  const sendNowMutation = useMutation({
    mutationFn: sendNotificationNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Push notification dispatched to user mobile devices!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch notification');
    },
  });

  // Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: ({ id, data }) => scheduleNotification(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(res.message || 'Notification scheduled successfully!');
      setScheduleModalOpen(false);
      setTargetNotification(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule notification');
    },
  });

  // Cancel Scheduled Mutation
  const cancelMutation = useMutation({
    mutationFn: cancelNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Scheduled notification cancelled.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel notification');
    },
  });

  // Retry Failed Deliveries Mutation
  const retryFailedMutation = useMutation({
    mutationFn: retryFailedNotification,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(res.message || 'Failed mobile deliveries re-queued!');
      if (deliveryReportModalOpen) refetchDeliveryReport();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Unable to retry failed deliveries');
    },
  });

  // --- FORM HANDLERS ---

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormType('CUSTOM');
    setFormRecipientType('ALL');
    setFormRecipientUserIds([]);
    setFormTargetPlanCodes([]);
    setFormPersonalization(true);
    setSelectedMobileScreen('Home');
    setFormCustomDataJson('{\n  "screen": "Home"\n}');
    setEditingItem(null);
    setLivePreviewResult(null);
    setUserSearchText('');
  };

  const handleOpenCreateModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title || '');
      setFormBody(item.body || '');
      setFormType(item.type || 'CUSTOM');
      setFormRecipientType(item.recipientType || 'ALL');
      setFormRecipientUserIds(item.recipientUserIds || []);
      setFormTargetPlanCodes(item.targetPlanCodes || []);
      setFormPersonalization(item.personalizationEnabled ?? true);
      const scr = item.data?.screen || 'Home';
      setSelectedMobileScreen(scr);
      setFormCustomDataJson(
        item.data ? JSON.stringify(item.data, null, 2) : '{\n  "screen": "Home"\n}'
      );
    } else {
      resetForm();
    }
    setCreateModalOpen(true);
  };

  const handleScreenSelectChange = (screenVal) => {
    setSelectedMobileScreen(screenVal);
    try {
      const current = JSON.parse(formCustomDataJson || '{}');
      current.screen = screenVal;
      setFormCustomDataJson(JSON.stringify(current, null, 2));
    } catch {
      setFormCustomDataJson(JSON.stringify({ screen: screenVal }, null, 2));
    }
  };

  const handleInsertVariable = (variable) => {
    setFormBody((prev) => `${prev} {{${variable}}}`);
  };

  const handleInsertTitleVariable = (variable) => {
    setFormTitle((prev) => `${prev} {{${variable}}}`);
  };

  const handleRunLivePreview = async () => {
    if (!formTitle) {
      toast.error('Please enter a title to test preview');
      return;
    }
    try {
      setIsLivePreviewLoading(true);
      let parsedData = {};
      try {
        if (formCustomDataJson.trim()) {
          parsedData = JSON.parse(formCustomDataJson);
        }
      } catch {
        // ignore invalid json for preview
      }

      const res = await previewNotification({
        title: formTitle,
        body: formBody,
        personalizationEnabled: formPersonalization,
        recipientUserIds: formRecipientUserIds.slice(0, 1),
        data: parsedData,
      });

      setLivePreviewResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to render live preview');
    } finally {
      setIsLivePreviewLoading(false);
    }
  };

  const handleSaveForm = (dispatchImmediately = false) => {
    if (!formTitle.trim()) {
      toast.error('Notification title is required');
      return;
    }
    if (!formBody.trim()) {
      toast.error('Notification message body is required');
      return;
    }

    let parsedData = {};
    if (formCustomDataJson.trim()) {
      try {
        parsedData = JSON.parse(formCustomDataJson);
      } catch {
        toast.error('Attached data must be valid JSON format');
        return;
      }
    }

    if (formRecipientType === 'SELECTED_USERS' && formRecipientUserIds.length === 0) {
      toast.error('Please select at least one recipient user');
      return;
    }

    if (formRecipientType === 'SUBSCRIBERS' && formTargetPlanCodes.length === 0) {
      toast.error('Please select at least one target subscription plan');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      body: formBody.trim(),
      type: formType,
      recipientType: formRecipientType,
      recipientUserIds: formRecipientType === 'SELECTED_USERS' ? formRecipientUserIds : [],
      targetPlanCodes: formRecipientType === 'SUBSCRIBERS' ? formTargetPlanCodes : [],
      personalizationEnabled: formPersonalization,
      data: parsedData,
    };

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem._id,
        data: payload,
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res) => {
          const createdId = res.data?._id;
          if (dispatchImmediately && createdId) {
            sendNowMutation.mutate(createdId);
          }
        },
      });
    }
  };

  const handleOpenScheduleModal = (notif) => {
    setTargetNotification(notif);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    setScheduleDateTime(tomorrow.toISOString().slice(0, 16));
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDateTime) {
      toast.error('Please select schedule date and time');
      return;
    }
    const isoString = new Date(scheduleDateTime).toISOString();
    if (new Date(isoString).getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future');
      return;
    }
    scheduleMutation.mutate({
      id: targetNotification._id,
      data: { scheduledAt: isoString },
    });
  };

  const handleOpenDeliveryReport = (notif) => {
    setTargetNotification(notif);
    setDeliveryReportModalOpen(true);
  };

  const handleOpenPreviewModal = (notif) => {
    setTargetNotification(notif);
    setPreviewData({
      renderedTitle: notif.title,
      renderedBody: notif.body,
      type: notif.type,
      time: notif.sentAt || notif.createdAt,
    });
    setPreviewModalOpen(true);
  };

  const handleViewDetails = async (notif) => {
    try {
      const res = await getNotificationById(notif._id);
      setDetailItem(res.data || notif);
      setDetailsModalOpen(true);
    } catch {
      setDetailItem(notif);
      setDetailsModalOpen(true);
    }
  };

  const handleDelete = (id, title) => {
    showConfirm(`Delete push notification campaign "${title}" and all its mobile delivery records?`, () => {
      deleteMutation.mutate(id);
    });
  };

  const handleSendNow = (notif) => {
    showConfirm(`Dispatch push notification "${notif.title}" immediately to all ${notif.recipientType} mobile devices?`, () => {
      sendNowMutation.mutate(notif._id);
    });
  };

  const handleCancelSchedule = (notif) => {
    showConfirm(`Cancel scheduled push notification "${notif.title}"?`, () => {
      cancelMutation.mutate(notif._id);
    });
  };

  // Filtered Notifications for Table
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.body && item.body.toLowerCase().includes(q));

      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesRecipient = recipientFilter === 'ALL' || item.recipientType === recipientFilter;

      return matchesSearch && matchesType && matchesStatus && matchesRecipient;
    });
  }, [notifications, searchQuery, typeFilter, statusFilter, recipientFilter]);

  // Filtered user list for selection
  const filteredUsersList = useMemo(() => {
    if (!userSearchText.trim()) return usersList;
    const q = userSearchText.toLowerCase();
    return usersList.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(q))
    );
  }, [usersList, userSearchText]);

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div className="notif-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="header-title" style={{ margin: 0 }}>Mobile Push Notifications</h1>
            <span
              style={{
                background: 'rgba(130, 0, 30, 0.1)',
                color: 'var(--primary-color)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
              }}
            >
              Admin Dispatch & Management
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Broadcast push alerts to users' mobile devices: puja reminders, daily panchang, festival wishes, and subscription updates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            style={{
              background: 'white',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            onClick={() => {
              refetchNotifications();
              refetchStats();
              toast.success('Notifications list refreshed');
            }}
            disabled={isNotifsFetching}
          >
            <MdRefresh size={18} className={isNotifsFetching ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn"
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
            }}
            onClick={() => {
              showConfirm('Scan and trigger subscription renewal reminder push alerts to all active subscribers whose plans expire soon?', () => {
                triggerRenewalMutation.mutate();
              });
            }}
            disabled={triggerRenewalMutation.isPending}
          >
            <MdAutorenew size={18} />
            <span>{triggerRenewalMutation.isPending ? 'Scanning...' : 'Trigger Renewal Reminders'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MdAdd size={20} />
            <span>Create Push Notification</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="notif-stats-grid">
        <div className="notif-stat-card">
          <div className="notif-stat-icon-wrap" style={{ background: '#FFF1F2', color: '#BE123C' }}>
            <MdCampaign size={26} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-value">{stats.totalNotifications || 0}</span>
            <span className="notif-stat-label">Total Push Campaigns</span>
          </div>
        </div>

        <div className="notif-stat-card">
          <div className="notif-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            <MdSend size={26} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-value">{stats.totalDeliveries || 0}</span>
            <span className="notif-stat-label">Dispatched to Devices</span>
          </div>
        </div>

        <div className="notif-stat-card">
          <div className="notif-stat-icon-wrap" style={{ background: '#ECFDF5', color: '#047857' }}>
            <MdCheckCircle size={26} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-value">{stats.totalReadDeliveries || 0}</span>
            <span className="notif-stat-label">Opened / Read on App</span>
          </div>
        </div>

        <div className="notif-stat-card">
          <div className="notif-stat-icon-wrap" style={{ background: '#F5F3FF', color: '#6D28D9' }}>
            <MdAssessment size={26} />
          </div>
          <div className="notif-stat-info">
            <span className="notif-stat-value">{stats.readRate || '0%'}</span>
            <span className="notif-stat-label">Device Open Rate</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="notif-filter-bar">
        <div className="notif-search-input-wrap">
          <MdSearch size={20} className="notif-search-icon" />
          <input
            type="text"
            className="notif-search-input"
            placeholder="Search by title, message content, or target keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <MdClose size={16} />
            </button>
          )}
        </div>

        <select
          className="notif-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Push Types</option>
          {NOTIFICATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          className="notif-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DRAFT">Draft</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          className="notif-filter-select"
          value={recipientFilter}
          onChange={(e) => setRecipientFilter(e.target.value)}
        >
          <option value="ALL">All Target Audiences</option>
          <option value="ALL">All Users (Broadcast)</option>
          <option value="SELECTED_USERS">Selected Users</option>
          <option value="SUBSCRIBERS">Subscribers</option>
        </select>

        {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL' || recipientFilter !== 'ALL') && (
          <button
            type="button"
            className="btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
              setRecipientFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Notifications Campaigns Table */}
      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        {isNotifsLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto', width: 28, height: 28 }} />
            <p>Loading push notification campaigns...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: 'var(--text-secondary)',
              }}
            >
              <MdCampaign size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              No push notifications found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 1.5rem auto' }}>
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No notification campaigns matched your current search filters.'
                : 'Create your first push notification to broadcast festival updates or auspicious timings to mobile app users.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenCreateModal(null)}
            >
              <MdAdd size={18} /> Create Push Notification
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Notification Type</th>
                <th>Message & Screen Target</th>
                <th style={{ width: 150 }}>Target Audience</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 140 }}>Dispatch Date</th>
                <th style={{ width: 110, textAlign: 'center' }}>Deliveries</th>
                <th style={{ width: 200, textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((notif) => {
                const statusClass = (notif.status || 'DRAFT').toLowerCase();
                const isDraft = notif.status === 'DRAFT';
                const isScheduled = notif.status === 'SCHEDULED';

                return (
                  <tr key={notif._id}>
                    {/* Type */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className={`notif-item-icon-wrap ${getTypeBadgeClass(notif.type)}`} style={{ width: 32, height: 32 }}>
                          {getTypeIcon(notif.type, 16)}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {notif.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Title & Body */}
                    <td>
                      <div style={{ maxWidth: 360 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            color: 'var(--text-primary)',
                            marginBottom: '0.2rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleViewDetails(notif)}
                          title="Click to view full details"
                        >
                          {notif.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#4B5563',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={notif.body}
                        >
                          {notif.body}
                        </div>

                        {/* Mobile Screen Tag & Personalization */}
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          {notif.data?.screen && (
                            <span style={{ fontSize: '0.68rem', background: '#EFF6FF', color: '#1E40AF', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600 }}>
                              📱 Screen: {notif.data.screen}
                            </span>
                          )}
                          {notif.personalizationEnabled && (
                            <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#92400E', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600 }}>
                              Dynamic Tags
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Audience */}
                    <td>
                      <div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {notif.recipientType === 'ALL' && '📢 All Mobile Users'}
                          {notif.recipientType === 'SELECTED_USERS' && `👥 ${notif.recipientUserIds?.length || 0} Users`}
                          {notif.recipientType === 'SUBSCRIBERS' && '⭐ Subscribers'}
                        </span>
                        {notif.targetPlanCodes && notif.targetPlanCodes.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Plans: {notif.targetPlanCodes.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        {notif.status}
                      </span>
                    </td>

                    {/* Dispatch Date */}
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {notif.scheduledAt ? (
                          <div style={{ color: '#0284C7', fontWeight: 600 }}>
                            <MdSchedule size={14} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {new Date(notif.scheduledAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : notif.sentAt ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#166534' }}>Sent</div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              {formatTimeAgo(notif.sentAt)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Created: {new Date(notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Delivery Stats mini-button */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: '#F9FAFB',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenDeliveryReport(notif)}
                        title="View Mobile Delivery Report"
                      >
                        <span style={{ color: '#166534' }}>{notif.successCount || 0}</span>
                        <span style={{ color: '#9CA3AF' }}> / </span>
                        <span>{notif.recipientCount || 0}</span>
                        {notif.failureCount > 0 && (
                          <span style={{ color: '#DC2626', marginLeft: 4 }}>
                            ({notif.failureCount} fail)
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Admin Actions */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        {/* Send Now (Draft / Scheduled) */}
                        {(isDraft || isScheduled) && (
                          <button
                            type="button"
                            className="action-btn"
                            style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}
                            onClick={() => handleSendNow(notif)}
                            title="Dispatch Push to Devices Now"
                          >
                            <MdSend size={16} />
                          </button>
                        )}

                        {/* Schedule Dispatch (Draft) */}
                        {isDraft && (
                          <button
                            type="button"
                            className="action-btn"
                            style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}
                            onClick={() => handleOpenScheduleModal(notif)}
                            title="Schedule Dispatch Time..."
                          >
                            <MdSchedule size={16} />
                          </button>
                        )}

                        {/* Cancel Schedule */}
                        {isScheduled && (
                          <button
                            type="button"
                            className="action-btn"
                            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECDD3' }}
                            onClick={() => handleCancelSchedule(notif)}
                            title="Cancel Scheduled Dispatch"
                          >
                            <MdCancel size={16} />
                          </button>
                        )}

                        {/* Delivery Report */}
                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                          onClick={() => handleOpenDeliveryReport(notif)}
                          title="Mobile Delivery Report"
                        >
                          <MdAssessment size={16} />
                        </button>

                        {/* Smartphone Lockscreen Preview */}
                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: '#FDF2F4', color: 'var(--primary-color)', border: '1px solid #FBCFE8' }}
                          onClick={() => handleOpenPreviewModal(notif)}
                          title="Preview on Smartphone Lock Screen"
                        >
                          <MdPhoneIphone size={16} />
                        </button>

                        {/* View Full Details */}
                        <button
                          type="button"
                          className="action-btn"
                          style={{ background: '#F9FAFB', color: '#4B5563', border: '1px solid #E5E7EB' }}
                          onClick={() => handleViewDetails(notif)}
                          title="View Full Details"
                        >
                          <MdInfoOutline size={16} />
                        </button>

                        {/* Edit or Duplicate */}
                        {isDraft ? (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleOpenCreateModal(notif)}
                            title="Edit Notification"
                          >
                            <MdEdit size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => {
                              handleOpenCreateModal({
                                ...notif,
                                _id: null,
                                title: `${notif.title} (Copy)`,
                              });
                              toast.success('Cloned into new push notification draft');
                            }}
                            title="Duplicate as new draft"
                          >
                            <MdContentCopy size={16} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          className="action-btn text-red"
                          onClick={() => handleDelete(notif._id, notif.title)}
                          title="Delete Notification"
                        >
                          <MdDeleteOutline size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT PUSH NOTIFICATION MODAL */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title={editingItem ? 'Edit Push Notification Campaign' : 'Create Mobile Push Notification'}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Left: Configuration Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveForm(false);
              }}
            >
              {/* Type Selection */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Push Notification Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem' }}>
                  {NOTIFICATION_TYPES.map((t) => {
                    const isSelected = formType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormType(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: isSelected ? '#FFF5F7' : 'white',
                          color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {getTypeIcon(t, 16)}
                        <span>{t.replace(/_/g, ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input with Quick Variable Inserters */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" htmlFor="formTitle">
                    Notification Title *
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleInsertTitleVariable('name')}
                      style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      + {"{{name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTitleVariable('date')}
                      style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      + {"{{date}}"}
                    </button>
                  </div>
                </div>
                <input
                  id="formTitle"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Shubh Muhurat for Today, {{name}}"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Message Body with Quick Variable Inserters */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" htmlFor="formBody">
                    Message Body (Push Alert Text) *
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('name')}
                      style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      + {"{{name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('date')}
                      style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      + {"{{date}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('festivalName')}
                      style={{ fontSize: '0.72rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                    >
                      + {"{{festivalName}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  id="formBody"
                  className="input-field"
                  rows={3}
                  placeholder="e.g. Pranam {{name}}, view today's auspicious timings and Rahu Kaal on Vipra Saarthi."
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '0.2rem' }}>
                  {formBody.length} characters
                </div>
              </div>

              {/* Target Audience */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Target Audience *</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { type: 'ALL', label: 'All Users (Broadcast)', icon: <MdCampaign size={16} /> },
                    { type: 'SELECTED_USERS', label: 'Specific Users', icon: <MdGroup size={16} /> },
                    { type: 'SUBSCRIBERS', label: 'Subscribers Only', icon: <MdCardMembership size={16} /> },
                  ].map((aud) => (
                    <button
                      key={aud.type}
                      type="button"
                      onClick={() => setFormRecipientType(aud.type)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.4rem',
                        borderRadius: 8,
                        border: formRecipientType === aud.type ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: formRecipientType === aud.type ? '#FFF5F7' : 'white',
                        color: formRecipientType === aud.type ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                      }}
                    >
                      {aud.icon}
                      <span>{aud.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-form: TARGET_PLAN_CODES when SUBSCRIBERS selected */}
                {formRecipientType === 'SUBSCRIBERS' && (
                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B21A8', marginBottom: '0.35rem' }}>
                      Select Target Subscription Plans:
                    </div>
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                      {TARGET_PLAN_CODES.map((plan) => (
                        <label key={plan.code} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formTargetPlanCodes.includes(plan.code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormTargetPlanCodes([...formTargetPlanCodes, plan.code]);
                              } else {
                                setFormTargetPlanCodes(formTargetPlanCodes.filter((c) => c !== plan.code));
                              }
                            }}
                          />
                          <span>{plan.label} ({plan.code})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-form: SELECTED_USERS user list picker */}
                {formRecipientType === 'SELECTED_USERS' && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem', background: '#F9FAFB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        Select Devotees ({formRecipientUserIds.length} selected)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => setFormRecipientUserIds(usersList.map((u) => u._id || u.id))}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                          onClick={() => setFormRecipientUserIds([])}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Search user by name, email or phone..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.78rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        marginBottom: '0.5rem',
                      }}
                    />

                    <div className="user-select-box">
                      {filteredUsersList.map((u) => {
                        const uid = u._id || u.id;
                        const isSelected = formRecipientUserIds.includes(uid);
                        return (
                          <div
                            key={uid}
                            className={`user-select-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setFormRecipientUserIds(formRecipientUserIds.filter((id) => id !== uid));
                              } else {
                                setFormRecipientUserIds([...formRecipientUserIds, uid]);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <div className="user-select-avatar">
                              {(u.fullName || u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, fontSize: '0.78rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {u.fullName || 'User'}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                {u.email || u.mobileNumber || uid}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Mobile Screen & Deep Link Payload */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Target Mobile Screen on Tap</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  {MOBILE_APP_SCREENS.map((screen) => (
                    <button
                      key={screen.value}
                      type="button"
                      onClick={() => handleScreenSelectChange(screen.value)}
                      style={{
                        padding: '0.4rem 0.5rem',
                        borderRadius: 6,
                        border: selectedMobileScreen === screen.value ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: selectedMobileScreen === screen.value ? '#FFF5F7' : 'white',
                        color: selectedMobileScreen === screen.value ? 'var(--primary-color)' : '#4B5563',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {screen.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Payload Data (JSON):
                  </span>
                </div>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formCustomDataJson}
                  onChange={(e) => setFormCustomDataJson(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                />
              </div>

              {/* Personalization Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', padding: '0.65rem 0.85rem', borderRadius: 8, marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Personalization Engine
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Auto-replace {"{{name}}"} with devotee's registered name.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formPersonalization}
                    onChange={(e) => setFormPersonalization(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#F3F4F6', color: '#374151' }}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}
                  onClick={() => handleSaveForm(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
                </button>

                {!editingItem && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSaveForm(true)}
                    disabled={createMutation.isPending || sendNowMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <MdSend size={16} />
                    <span>Send to Devices Now</span>
                  </button>
                )}
              </div>
            </form>

            {/* Right: Live Smartphone Push Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 320, marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📱 Mobile Lockscreen Preview
                </span>
                <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: 6, padding: 2 }}>
                  <button
                    type="button"
                    onClick={() => setPhoneOsPreview('ios')}
                    style={{
                      border: 'none',
                      background: phoneOsPreview === 'ios' ? 'white' : 'transparent',
                      color: phoneOsPreview === 'ios' ? 'var(--primary-color)' : '#6B7280',
                      borderRadius: 4,
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    iOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneOsPreview('android')}
                    style={{
                      border: 'none',
                      background: phoneOsPreview === 'android' ? 'white' : 'transparent',
                      color: phoneOsPreview === 'android' ? 'var(--primary-color)' : '#6B7280',
                      borderRadius: 4,
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Android
                  </button>
                </div>
              </div>

              {/* Smartphone Shell */}
              <div className="phone-mockup-frame" style={{ width: 300, height: 480 }}>
                <div className="phone-notch"></div>
                <div className="phone-screen" style={{ paddingTop: '1.75rem' }}>
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <span>5G • 100%</span>
                  </div>

                  <div className="phone-clock-center" style={{ marginBottom: '1.25rem' }}>
                    <div className="phone-clock-time" style={{ fontSize: '2.5rem' }}>09:41</div>
                    <div className="phone-clock-date" style={{ fontSize: '0.78rem' }}>
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Push Notification Banner */}
                  <div
                    className="lockscreen-push-card"
                    style={{
                      borderRadius: phoneOsPreview === 'ios' ? 16 : 8,
                      background: phoneOsPreview === 'ios' ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF',
                      color: phoneOsPreview === 'ios' ? 'white' : '#1F2937',
                    }}
                  >
                    <div className="lockscreen-push-header">
                      <div className="lockscreen-app-brand" style={{ color: phoneOsPreview === 'ios' ? 'white' : '#82001E' }}>
                        <div className="lockscreen-app-icon">VS</div>
                        <span>VIPRA SAARTHI</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', opacity: 0.75, color: phoneOsPreview === 'ios' ? 'white' : '#6B7280' }}>
                        now
                      </span>
                    </div>

                    <div
                      className="lockscreen-push-title"
                      style={{ color: phoneOsPreview === 'ios' ? 'white' : '#111827' }}
                    >
                      {livePreviewResult?.renderedTitle || formTitle || 'Notification Title'}
                    </div>
                    <p
                      className="lockscreen-push-body"
                      style={{ color: phoneOsPreview === 'ios' ? 'rgba(255, 255, 255, 0.9)' : '#4B5563' }}
                    >
                      {livePreviewResult?.renderedBody || formBody || 'Your push notification message preview will render here.'}
                    </p>
                  </div>

                  <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.7rem', opacity: 0.75 }}>
                    Tap to open {selectedMobileScreen}
                  </div>
                </div>
              </div>

              {/* Test Render Button */}
              <button
                type="button"
                onClick={handleRunLivePreview}
                disabled={isLivePreviewLoading}
                style={{
                  marginTop: '0.75rem',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.85rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <MdAutorenew size={14} className={isLivePreviewLoading ? 'spinner' : ''} />
                <span>{isLivePreviewLoading ? 'Testing...' : 'Test Render via Preview API'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SCHEDULE NOTIFICATION MODAL */}
      {scheduleModalOpen && targetNotification && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Push Dispatch to Mobile Devices"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Choose the exact date and time to automatically dispatch <b>"{targetNotification.title}"</b> to {targetNotification.recipientType} mobile devices.
            </p>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label" htmlFor="scheduleDateTime">
                Select Dispatch Date & Time (Local Time) *
              </label>
              <input
                id="scheduleDateTime"
                type="datetime-local"
                className="input-field"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                UTC Time: {scheduleDateTime ? new Date(scheduleDateTime).toUTCString() : '--'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#F3F4F6', color: '#374151' }}
                onClick={() => setScheduleModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSchedule}
                disabled={scheduleMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <MdSchedule size={18} />
                <span>{scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MOBILE DELIVERY REPORT MODAL */}
      {deliveryReportModalOpen && targetNotification && (
        <Modal
          isOpen={deliveryReportModalOpen}
          onClose={() => setDeliveryReportModalOpen(false)}
          title={`Mobile Delivery Report: ${targetNotification.title}`}
        >
          <div style={{ padding: '0.5rem 0' }}>
            {isReportLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
                <p>Loading delivery metrics...</p>
              </div>
            ) : (
              <div>
                {/* Summary Metrics */}
                {deliverySummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TARGET DEVICES</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                        {deliverySummary.total || 0}
                      </div>
                    </div>
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 600 }}>ACCEPTED / SENT</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857', marginTop: 2 }}>
                        {deliverySummary.statusBreakdown?.ACCEPTED || deliverySummary.statusBreakdown?.DELIVERED || 0}
                      </div>
                    </div>
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>READ ON APP</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>
                        {deliverySummary.readCount || 0}
                      </div>
                    </div>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 600 }}>FAILED DELIVERIES</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#B91C1C', marginTop: 2 }}>
                        {deliverySummary.statusBreakdown?.FAILED || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Retry Failed Action Bar */}
                {deliverySummary?.statusBreakdown?.FAILED > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#991B1B' }}>
                      There are <b>{deliverySummary.statusBreakdown.FAILED}</b> failed deliveries for this push campaign.
                    </div>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#DC2626', color: 'white', fontSize: '0.78rem', fontWeight: 600 }}
                      onClick={() => retryFailedMutation.mutate(targetNotification._id)}
                      disabled={retryFailedMutation.isPending}
                    >
                      <MdReplay size={16} style={{ marginRight: 4 }} />
                      {retryFailedMutation.isPending ? 'Retrying...' : 'Retry Failed Deliveries'}
                    </button>
                  </div>
                )}

                {/* Recipient Deliveries Table */}
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  User Device Delivery Log
                </h4>
                <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  {Array.isArray(deliveryReport) && deliveryReport.length > 0 ? (
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Recipient Devotee</th>
                          <th>Delivery Status</th>
                          <th>App Read Status</th>
                          <th>Sent Timestamp</th>
                          <th>Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryReport.map((rec) => (
                          <tr key={rec._id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                {rec.userId?.fullName || rec.userId?.email || 'Devotee'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                {rec.userId?.mobileNumber || rec.userId?.email || ''}
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 4,
                                  background: rec.deliveryStatus === 'ACCEPTED' || rec.deliveryStatus === 'DELIVERED' ? '#DCFCE7' : '#FEE2E2',
                                  color: rec.deliveryStatus === 'ACCEPTED' || rec.deliveryStatus === 'DELIVERED' ? '#166534' : '#991B1B',
                                }}
                              >
                                {rec.deliveryStatus}
                              </span>
                            </td>
                            <td>
                              {rec.isRead ? (
                                <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}>
                                  ✓ Read on app ({formatTimeAgo(rec.readAt)})
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>Unread</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {rec.sentAt ? new Date(rec.sentAt).toLocaleString('en-IN') : '--'}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                              {rec.failureReason || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No individual delivery records found. Notification may be in draft or queued state.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#F3F4F6', color: '#374151' }}
                    onClick={() => setDeliveryReportModalOpen(false)}
                  >
                    Close Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* SMARTPHONE LOCKSCREEN PUSH PREVIEW MODAL */}
      {previewModalOpen && previewData && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title="Mobile Device Lockscreen Push Preview"
        >
          <div className="phone-mockup-wrapper">
            <div className="phone-mockup-frame">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <span>5G • 100%</span>
                </div>

                <div className="phone-clock-center">
                  <div className="phone-clock-time">09:41</div>
                  <div className="phone-clock-date">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Push Notification Card Banner */}
                <div className="lockscreen-push-card">
                  <div className="lockscreen-push-header">
                    <div className="lockscreen-app-brand">
                      <div className="lockscreen-app-icon">VS</div>
                      <span>VIPRA SAARTHI</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>now</span>
                  </div>

                  <div className="lockscreen-push-title">
                    {previewData.renderedTitle}
                  </div>
                  <p className="lockscreen-push-body">
                    {previewData.renderedBody}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.72rem', opacity: 0.7 }}>
                  User taps banner to launch app
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#F3F4F6', color: '#374151' }}
                onClick={() => setPreviewModalOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* FULL NOTIFICATION DETAILS MODAL (GET-BY-ID) */}
      {detailsModalOpen && detailItem && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Notification Campaign Details"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className={`notif-item-icon-wrap ${getTypeBadgeClass(detailItem.type)}`} style={{ width: 44, height: 44 }}>
                {getTypeIcon(detailItem.type, 22)}
              </div>
              <div>
                <span className={`notif-item-type-tag ${getTypeBadgeClass(detailItem.type)}`}>
                  {detailItem.type.replace(/_/g, ' ')}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                  {detailItem.title}
                </h3>
              </div>
            </div>

            {/* Message Body Card */}
            <div style={{ background: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Push Alert Text
              </div>
              <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                {detailItem.body}
              </p>
            </div>

            {/* Campaign Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CAMPAIGN STATUS</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`status-pill ${(detailItem.status || 'DRAFT').toLowerCase()}`}>
                    {detailItem.status}
                  </span>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TARGET AUDIENCE</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  {detailItem.recipientType}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DELIVERIES (SUCCESS / TOTAL)</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534', marginTop: 4 }}>
                  {detailItem.successCount || 0} / {detailItem.recipientCount || 0}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SENT TIMESTAMP</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: 4 }}>
                  {detailItem.sentAt ? new Date(detailItem.sentAt).toLocaleString('en-IN') : 'Not sent yet'}
                </div>
              </div>
            </div>

            {/* Attached Payload Data */}
            {detailItem.data && Object.keys(detailItem.data).length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Mobile Deep Link & Action Payload
                </div>
                <pre style={{ background: '#1F2937', color: '#F3F4F6', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', overflowX: 'auto', margin: 0 }}>
                  {JSON.stringify(detailItem.data, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#F3F4F6', color: '#374151' }}
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageNotifications;
