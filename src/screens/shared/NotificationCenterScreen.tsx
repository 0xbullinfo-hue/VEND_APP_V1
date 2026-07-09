import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useProximityNotificationStore } from '../../store/useProximityNotificationStore';
import {
  formatNotificationForDisplay,
  sortNotificationsByPriority,
  getNotificationStats,
  getNotificationAction,
} from '../../lib/notificationCenterUtils';

interface NotificationCenterScreenProps {
  onBackToHome: () => void;
  onViewCustomerProfile?: (customerId: string) => void;
  onViewVendors?: (localityId: string) => void;
  userRole: 'vendor' | 'customer';
}

export const NotificationCenterScreen: React.FC<NotificationCenterScreenProps> = ({
  onBackToHome,
  onViewCustomerProfile,
  onViewVendors,
  userRole,
}) => {
  const { notifications, pendingNotifications, markAsRead, clearNotification, clearAllNotifications } =
    useProximityNotificationStore();

  const [filterType, setFilterType] = useState<'all' | 'unread' | 'vendor' | 'customer'>('all');

  // Filter and sort notifications
  const displayNotifications = useMemo(() => {
    let filtered = notifications;

    if (filterType === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (filterType === 'vendor') {
      filtered = filtered.filter((n) => n.type === 'vendor_customer_nearby');
    } else if (filterType === 'customer') {
      filtered = filtered.filter((n) => n.type === 'customer_vendor_nearby');
    }

    return sortNotificationsByPriority(filtered);
  }, [notifications, filterType]);

  // Get stats
  const stats = useMemo(() => getNotificationStats(notifications), [notifications]);

  const handleNotificationPress = useCallback(
    (notifId: string) => {
      const notification = notifications.find((n) => n.id === notifId);
      if (!notification) return;

      // Mark as read
      if (!notification.read) {
        markAsRead(notifId);
      }

      // Handle action based on type and user role
      const action = getNotificationAction(notification, userRole);
      if (action.action === 'view_customer' && onViewCustomerProfile) {
        onViewCustomerProfile(action.targetId);
      } else if (action.action === 'view_vendors' && onViewVendors) {
        onViewVendors(notification.localityId);
      }
    },
    [notifications, markAsRead, userRole, onViewCustomerProfile, onViewVendors]
  );

  const handleClearNotification = useCallback(
    (notifId: string) => {
      clearNotification(notifId);
    },
    [clearNotification]
  );

  const renderNotificationItem = ({ item: notification }: any) => {
    const formatted = formatNotificationForDisplay(notification);
    const action = getNotificationAction(notification, userRole);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotificationPress(notification.id)}
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationCardUnread,
          theme.shadows.soft,
        ]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.iconAndContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={formatted.displayIcon as any}
                size={normalize(18)}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.notificationContent}>
              <VText variant="h3" style={{ fontSize: normalize(14) }}>
                {formatted.displayTitle}
              </VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
                {formatted.displayBody}
              </VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 6, fontSize: 11 }}>
                {formatted.displayTime}
              </VText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => handleClearNotification(notification.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle-outline" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {(action.action === 'view_customer' || action.action === 'view_vendors') && (
          <TouchableOpacity style={[styles.actionBtn, { marginTop: theme.spacing.sm }]}>
            <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>
              {action.label} →
            </VText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={normalize(48)} color={theme.colors.textMuted} />
      <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginTop: theme.spacing.md }}>
        No notifications yet
      </VText>
      <VText variant="caption" color={theme.colors.textMuted} align="center" style={{ marginTop: theme.spacing.sm }}>
        {filterType === 'unread'
          ? "You're all caught up!"
          : "We'll notify you when vendors or customers are nearby"}
      </VText>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Notifications"
        showBack={true}
        onBack={onBackToHome}
      />

      {/* Filter pills */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            onPress={() => setFilterType('all')}
            style={[
              styles.filterChip,
              filterType === 'all' && styles.filterChipActive,
            ]}
          >
            <VText
              variant="caption"
              color={filterType === 'all' ? '#FFF' : theme.colors.primary}
              style={{ fontWeight: '700' }}
            >
              All {stats.totalCount}
            </VText>
          </TouchableOpacity>

          {stats.unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => setFilterType('unread')}
              style={[
                styles.filterChip,
                filterType === 'unread' && styles.filterChipActive,
              ]}
            >
              <VText
                variant="caption"
                color={filterType === 'unread' ? '#FFF' : theme.colors.primary}
                style={{ fontWeight: '700' }}
              >
                Unread {stats.unreadCount}
              </VText>
            </TouchableOpacity>
          )}

          {userRole === 'vendor' && stats.vendorNotifCount > 0 && (
            <TouchableOpacity
              onPress={() => setFilterType('vendor')}
              style={[
                styles.filterChip,
                filterType === 'vendor' && styles.filterChipActive,
              ]}
            >
              <VText
                variant="caption"
                color={filterType === 'vendor' ? '#FFF' : theme.colors.primary}
                style={{ fontWeight: '700' }}
              >
                Customers {stats.vendorNotifCount}
              </VText>
            </TouchableOpacity>
          )}

          {userRole === 'customer' && stats.customerNotifCount > 0 && (
            <TouchableOpacity
              onPress={() => setFilterType('customer')}
              style={[
                styles.filterChip,
                filterType === 'customer' && styles.filterChipActive,
              ]}
            >
              <VText
                variant="caption"
                color={filterType === 'customer' ? '#FFF' : theme.colors.primary}
                style={{ fontWeight: '700' }}
              >
                Vendors {stats.customerNotifCount}
              </VText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Notification list */}
      <View style={styles.content}>
        {displayNotifications.length > 0 && stats.totalCount > 1 && (
          <TouchableOpacity
            onPress={() => clearAllNotifications()}
            style={styles.clearAllBtn}
          >
            <VText variant="caption" color={theme.colors.textMuted}>
              Clear all
            </VText>
          </TouchableOpacity>
        )}

        <FlatList
          data={displayNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          scrollEnabled={false}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={displayNotifications.length === 0 ? styles.emptyContent : undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  filterBar: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContent: {
    paddingVertical: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  clearAllBtn: {
    alignSelf: 'flex-end',
    paddingBottom: theme.spacing.sm,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: normalize(12),
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationCardUnread: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconAndContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  closeBtn: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(80),
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
