/**
 * Notification Center Utilities
 *
 * Provides formatting, filtering, and display logic for notifications
 */

import { ProximityNotification } from './proximityNotifications';

export interface NotificationDisplayItem extends ProximityNotification {
  displayTime: string;
  displayTitle: string;
  displayBody: string;
  displayIcon: string;
}

/**
 * Format relative time for notification display
 */
export const formatNotificationTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Convert ProximityNotification to display format
 */
export const formatNotificationForDisplay = (
  notification: ProximityNotification
): NotificationDisplayItem => {
  let displayTitle = '';
  let displayBody = '';
  let displayIcon = 'bell';

  if (notification.type === 'vendor_customer_nearby') {
    displayTitle = 'Previous Customer Nearby';
    displayBody = `${notification.triggerEntityName} is in ${notification.localityName}${
      notification.distance ? ` (~${notification.distance.toFixed(1)}km away)` : ''
    }. Reach out!`;
    displayIcon = 'person-add-outline';
  } else if (notification.type === 'customer_vendor_nearby') {
    displayTitle = 'Boosted Vendors Near You';
    displayBody = `Check out ${notification.triggerEntityName} in ${notification.localityName}. Browse new deals!`;
    displayIcon = 'star-outline';
  }

  return {
    ...notification,
    displayTime: formatNotificationTime(notification.createdAt),
    displayTitle,
    displayBody,
    displayIcon,
  };
};

/**
 * Filter notifications by type and read status
 */
export const filterNotifications = (
  notifications: ProximityNotification[],
  options?: {
    type?: ProximityNotification['type'];
    unreadOnly?: boolean;
    limit?: number;
  }
): ProximityNotification[] => {
  let filtered = notifications;

  if (options?.type) {
    filtered = filtered.filter((n) => n.type === options.type);
  }

  if (options?.unreadOnly) {
    filtered = filtered.filter((n) => !n.read);
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
};

/**
 * Get summary stats for notifications
 */
export const getNotificationStats = (notifications: ProximityNotification[]) => {
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const vendorNotifCount = notifications.filter((n) => n.type === 'vendor_customer_nearby').length;
  const customerNotifCount = notifications.filter((n) => n.type === 'customer_vendor_nearby').length;

  return {
    totalCount,
    unreadCount,
    vendorNotifCount,
    customerNotifCount,
    hasUnread: unreadCount > 0,
  };
};

/**
 * Group notifications by type and/or locality
 */
export const groupNotifications = (
  notifications: ProximityNotification[],
  groupBy: 'type' | 'locality' | 'both' = 'type'
): Record<string, ProximityNotification[]> => {
  const grouped: Record<string, ProximityNotification[]> = {};

  notifications.forEach((notif) => {
    let key = '';

    if (groupBy === 'type' || groupBy === 'both') {
      key = notif.type === 'vendor_customer_nearby' ? 'Vendor Alerts' : 'Vendor Discovery';
    }

    if (groupBy === 'locality' || groupBy === 'both') {
      if (key) key += ' - ';
      key += notif.localityName;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(notif);
  });

  return grouped;
};

/**
 * Get action context for notification
 */
export const getNotificationAction = (
  notification: ProximityNotification,
  userRole: 'vendor' | 'customer'
) => {
  if (notification.type === 'vendor_customer_nearby' && userRole === 'vendor') {
    return {
      label: 'View Customer',
      action: 'view_customer',
      targetId: notification.triggerEntityId,
      routeName: 'CustomerProfile',
    };
  }

  if (notification.type === 'customer_vendor_nearby' && userRole === 'customer') {
    return {
      label: 'View Vendors',
      action: 'view_vendors',
      targetId: notification.triggerEntityId,
      routeName: 'ExploreCategory',
      params: { localityId: notification.localityId },
    };
  }

  return {
    label: 'Dismiss',
    action: 'dismiss',
    targetId: notification.id,
  };
};

/**
 * Determine notification priority (for sorting/display)
 * Higher = more important
 */
export const getNotificationPriority = (notification: ProximityNotification): number => {
  let priority = 50; // baseline

  // Unread = higher priority
  if (!notification.read) {
    priority += 30;
  }

  // Vendor notifications for previous customers = slightly higher
  if (notification.type === 'vendor_customer_nearby') {
    priority += 10;
  }

  // Newer = higher priority
  const ageHours = (Date.now() - notification.createdAt) / (1000 * 60 * 60);
  if (ageHours < 1) {
    priority += 20;
  } else if (ageHours < 24) {
    priority += 10;
  }

  return priority;
};

/**
 * Sort notifications by priority and recency
 */
export const sortNotificationsByPriority = (
  notifications: ProximityNotification[]
): ProximityNotification[] => {
  return [...notifications].sort((a, b) => {
    const priorityDiff = getNotificationPriority(b) - getNotificationPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt - a.createdAt;
  });
};
