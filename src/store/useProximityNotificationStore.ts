import { create } from 'zustand';
import {
  ProximityNotification,
  generateVendorProximityNotification,
  generateCustomerProximityNotification,
  getVendorsInLocality,
  getPreviousCustomersForVendor,
  computeNotificationUrgency,
} from '../lib/proximityNotifications';

interface ProximityNotificationStore {
  // State
  notifications: ProximityNotification[];
  pendingNotifications: ProximityNotification[];
  lastCheckAt?: number;

  // Actions
  addNotification: (notification: ProximityNotification) => void;
  markAsRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Vendor-specific: Check for nearby previous customers
  checkVendorProximityTriggers: (
    vendor: any,
    allCustomers: any[],
    customerLocations: Map<string, { latitude: number; longitude: number }>,
    interactionHistory: any[]
  ) => ProximityNotification[];

  // Customer-specific: Check for nearby boosted vendors
  checkCustomerProximityTriggers: (
    customer: any,
    allVendors: any[],
    customerLocation?: { latitude: number; longitude: number }
  ) => ProximityNotification[];

  // Batch check for all users
  checkAllProximityTriggers: (
    vendors: any[],
    customers: any[],
    customerLocations: Map<string, { latitude: number; longitude: number }>,
    interactionHistory: any[]
  ) => void;
}

export const useProximityNotificationStore = create<ProximityNotificationStore>((set, get) => ({
  notifications: [],
  pendingNotifications: [],
  lastCheckAt: undefined,

  addNotification: (notification: ProximityNotification) => {
    set((state) => {
      // Check if notification already exists (deduplicate)
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        pendingNotifications: [notification, ...state.pendingNotifications],
      };
    });
  },

  markAsRead: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  },

  clearNotification: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
      pendingNotifications: state.pendingNotifications.filter((n) => n.id !== notificationId),
    }));
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      pendingNotifications: [],
    });
  },

  checkVendorProximityTriggers: (vendor, allCustomers, customerLocations, interactionHistory) => {
    const { addNotification } = get();

    // Only check for boosted vendors
    if (vendor.subscription_tier <= 1) {
      return [];
    }

    const newNotifications: ProximityNotification[] = [];

    // Get previous customers of this vendor
    const previousCustomerIds = getPreviousCustomersForVendor(vendor.id, interactionHistory);

    // Check each previous customer
    previousCustomerIds.forEach((customerId) => {
      const customer = allCustomers.find((c) => c.id === customerId);
      if (!customer) return;

      const customerLocation = customerLocations.get(customerId);
      if (!customerLocation) return;

      const notification = generateVendorProximityNotification(
        vendor,
        {
          ...customer,
          current_location: customerLocation,
        },
        interactionHistory
      );

      if (notification) {
        addNotification(notification);
        newNotifications.push(notification);
      }
    });

    return newNotifications;
  },

  checkCustomerProximityTriggers: (customer, allVendors, customerLocation) => {
    const { addNotification } = get();

    const newNotifications: ProximityNotification[] = [];

    // Get boosted vendors in customer's locality
    const boostedVendorsInLocality = (allVendors as any[])
      .filter((v) => v.locality_id === customer.locality_id && v.subscription_tier > 1)
      .map((v) => ({
        id: v.id,
        business_name: v.business_name,
        subscription_tier: v.subscription_tier,
        locality_id: v.locality_id,
        exact_location: v.exact_location,
      }));

    if (boostedVendorsInLocality.length === 0) {
      return [];
    }

    const notifications = generateCustomerProximityNotification(
      customer,
      boostedVendorsInLocality,
      customerLocation
    );

    notifications.forEach((notification) => {
      addNotification(notification);
      newNotifications.push(notification);
    });

    return newNotifications;
  },

  checkAllProximityTriggers: (vendors, customers, customerLocations, interactionHistory) => {
    const { checkVendorProximityTriggers, checkCustomerProximityTriggers } = get();

    // Check vendor triggers for all boosted vendors
    vendors.forEach((vendor) => {
      if (vendor.subscription_tier > 1) {
        checkVendorProximityTriggers(vendor, customers, customerLocations, interactionHistory);
      }
    });

    // Check customer triggers for all customers
    customers.forEach((customer) => {
      const customerLocation = customerLocations.get(customer.id);
      checkCustomerProximityTriggers(customer, vendors, customerLocation);
    });

    set({ lastCheckAt: Date.now() });
  },
}));
