import React from 'react';
import {
  MdCelebration,
  MdCalendarToday,
  MdCardMembership,
  MdForum,
  MdSystemUpdate,
  MdCampaign,
} from 'react-icons/md';

/**
 * Returns icon corresponding to notification type
 */
export const getTypeIcon = (type, size = 18) => {
  switch (type) {
    case 'FESTIVAL_REMINDER':
      return <MdCelebration size={size} style={{ color: '#E11D48' }} />;
    case 'DAILY_PANCHANG':
      return <MdCalendarToday size={size} style={{ color: '#F59E0B' }} />;
    case 'SUBSCRIPTION_RENEWAL':
      return <MdCardMembership size={size} style={{ color: '#8B5CF6' }} />;
    case 'COMMUNITY_REPLY':
      return <MdForum size={size} style={{ color: '#3B82F6' }} />;
    case 'APP_UPDATE':
      return <MdSystemUpdate size={size} style={{ color: '#10B981' }} />;
    case 'CUSTOM':
    default:
      return <MdCampaign size={size} style={{ color: 'var(--primary-color)' }} />;
  }
};

/**
 * Returns CSS badge class for notification type
 */
export const getTypeBadgeClass = (type) => {
  switch (type) {
    case 'FESTIVAL_REMINDER':
      return 'badge-festival';
    case 'DAILY_PANCHANG':
      return 'badge-panchang';
    case 'SUBSCRIPTION_RENEWAL':
      return 'badge-subscription';
    case 'COMMUNITY_REPLY':
      return 'badge-community';
    case 'APP_UPDATE':
      return 'badge-update';
    case 'CUSTOM':
    default:
      return 'badge-custom';
  }
};

/**
 * Formats timestamp to human readable relative time
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};
