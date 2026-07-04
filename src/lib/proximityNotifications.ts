/**
 * Proximity Notification System
 *
 * Manages location-based notifications for:
 * 1. Vendors: Notified when previous customers are in their vicinity (boosted only)
 * 2. Customers: Notified when they're near boosted vendors in their locality
 */

export interface ProximityNotification {
  id: string;
  type: 'vendor_customer_nearby' | 'customer_vendor_nearby';
  recipientId: string; // vendor or customer ID
  triggerEntityId: string; // customer or vendor ID
  triggerEntityName: string;
  localityId: string;
  localityName: string;
  distance?: number; // in km
  createdAt: number;
  read: boolean;
  actionUrl?: string;
}

export interface ProximityContext {
  entityId: string;
  entityName: string;
  currentLocalityId: string;
  currentLocalityName: string;
  isOpen?: boolean;
  subscriptionTier?: number;
}

/**
 * Calculate approximate distance between two lat/lng coordinates in km
 * Uses Haversine formula for rough distance calculation
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a customer is in the same locality as a vendor
 * or within a reasonable vicinity (e.g., 2km)
 */
export const isInVicinity = (
  customerLatitude: number,
  customerLongitude: number,
  vendorLatitude: number,
  vendorLongitude: number,
  vicinityRadiusKm: number = 2
): boolean => {
  const distance = calculateDistance(
    customerLatitude,
    customerLongitude,
    vendorLatitude,
    vendorLongitude
  );
  return distance <= vicinityRadiusKm;
};

/**
 * Check if a customer and vendor are in the same locality
 */
export const isInSameLocality = (
  customerLocalityId: string,
  vendorLocalityId: string
): boolean => {
  return customerLocalityId === vendorLocalityId;
};

/**
 * Generate vendor notification when a previous customer is in vicinity
 * Only triggered for boosted vendors
 */
export const generateVendorProximityNotification = (
  vendor: {
    id: string;
    business_name: string;
    subscription_tier: number;
    locality_id: string;
    locality_name: string;
    exact_location?: { latitude: number; longitude: number };
  },
  customer: {
    id: string;
    phone_number: string; // or name if available
    locality_id: string;
    locality_name: string;
    current_location?: { latitude: number; longitude: number };
  },
  interactionHistory: Array<{ vendor_id: string; customer_id: string; action: string; timestamp: number }>
): ProximityNotification | null => {
  // Only boosted vendors get proximity notifications
  if (vendor.subscription_tier <= 1) {
    return null;
  }

  // Check if customer has previous interaction with vendor
  const hasPreviousInteraction = interactionHistory.some(
    (interaction) =>
      interaction.vendor_id === vendor.id && interaction.customer_id === customer.id
  );

  if (!hasPreviousInteraction) {
    return null;
  }

  // Check if they're in the same locality
  const inSameLocality = isInSameLocality(customer.locality_id, vendor.locality_id);

  if (!inSameLocality) {
    return null;
  }

  // Calculate distance if coordinates available
  let distance: number | undefined;
  if (
    vendor.exact_location &&
    customer.current_location
  ) {
    distance = calculateDistance(
      customer.current_location.latitude,
      customer.current_location.longitude,
      vendor.exact_location.latitude,
      vendor.exact_location.longitude
    );
  }

  return {
    id: `vendor-prox-${vendor.id}-${customer.id}-${Date.now()}`,
    type: 'vendor_customer_nearby',
    recipientId: vendor.id,
    triggerEntityId: customer.id,
    triggerEntityName: customer.phone_number, // In real app, use customer name
    localityId: vendor.locality_id,
    localityName: vendor.locality_name,
    distance,
    createdAt: Date.now(),
    read: false,
    actionUrl: `/vendor/customer-nearby/${customer.id}`,
  };
};

/**
 * Generate customer notification when they are near boosted vendors
 * Customers get notified when boosted vendors are available in their locality
 */
export const generateCustomerProximityNotification = (
  customer: {
    id: string;
    phone_number?: string;
    locality_id: string;
    locality_name: string;
  },
  boostedVendorsInLocality: Array<{
    id: string;
    business_name: string;
    subscription_tier: number;
    locality_id: string;
    exact_location?: { latitude: number; longitude: number };
  }>,
  customerLocation?: { latitude: number; longitude: number }
): ProximityNotification[] => {
  const notifications: ProximityNotification[] = [];

  // Filter only boosted vendors
  const activeBoosts = boostedVendorsInLocality.filter((v) => v.subscription_tier > 1);

  if (activeBoosts.length === 0) {
    return notifications;
  }

  // Group nearby vendors (within 2km if coordinates available)
  const nearbyVendors = customerLocation
    ? activeBoosts.filter((v) =>
        v.exact_location
          ? isInVicinity(
              customerLocation.latitude,
              customerLocation.longitude,
              v.exact_location.latitude,
              v.exact_location.longitude
            )
          : true
      )
    : activeBoosts;

  if (nearbyVendors.length === 0) {
    return notifications;
  }

  // Generate notification for boosted vendors in proximity
  const vendorNames = nearbyVendors.map((v) => v.business_name).join(', ');
  const notificationCount = nearbyVendors.length;

  return [
    {
      id: `customer-prox-${customer.id}-${Date.now()}`,
      type: 'customer_vendor_nearby',
      recipientId: customer.id,
      triggerEntityId: activeBoosts[0].id, // Primary vendor
      triggerEntityName: vendorNames,
      localityId: customer.locality_id,
      localityName: customer.locality_name,
      createdAt: Date.now(),
      read: false,
      actionUrl: `/customer/boosted-vendors?locality=${customer.locality_id}`,
    },
  ];
};

/**
 * Filter vendors in a specific locality (for customer discovery)
 */
export const getVendorsInLocality = (
  vendors: Array<{ id: string; locality_id: string; subscription_tier: number; is_open: boolean }>,
  localityId: string,
  onlyBoosted: boolean = false,
  onlyOpen: boolean = false
) => {
  return vendors.filter((v) => {
    if (v.locality_id !== localityId) return false;
    if (onlyBoosted && v.subscription_tier <= 1) return false;
    if (onlyOpen && !v.is_open) return false;
    return true;
  });
};

/**
 * Filter previous customer interactions for a vendor
 * Returns list of customers who have interacted with this vendor before
 */
export const getPreviousCustomersForVendor = (
  vendorId: string,
  interactionHistory: Array<{ vendor_id: string; customer_id: string; action: string }>,
  deduplicateByCustomerId: boolean = true
): string[] => {
  let customerIds = interactionHistory
    .filter((i) => i.vendor_id === vendorId)
    .map((i) => i.customer_id);

  if (deduplicateByCustomerId) {
    customerIds = [...new Set(customerIds)];
  }

  return customerIds;
};

/**
 * Compute notification urgency based on frequency and recency
 * Higher score = more urgent to notify
 */
export const computeNotificationUrgency = (
  lastNotificationAt?: number,
  daysSinceLastInteraction?: number
): number => {
  let urgency = 50; // baseline

  // Recent interaction (< 7 days) boosts urgency
  if (daysSinceLastInteraction !== undefined && daysSinceLastInteraction < 7) {
    urgency += 30;
  }

  // If no recent notification, boost urgency
  if (!lastNotificationAt) {
    urgency += 20;
  } else {
    const daysSinceNotification = (Date.now() - lastNotificationAt) / (1000 * 60 * 60 * 24);
    if (daysSinceNotification > 7) {
      urgency += 20;
    }
  }

  return Math.min(100, urgency);
};
