import { VendorProfile } from '../types';

// Deterministic ranking so boosted vendors get locality priority while still
// balancing quality and availability signals.
export const rankVendorsForCustomer = (vendors: VendorProfile[]): VendorProfile[] => {
  return [...vendors].sort((a, b) => {
    const aBoost = a.subscription_tier > 1 ? 1 : 0;
    const bBoost = b.subscription_tier > 1 ? 1 : 0;
    if (bBoost !== aBoost) return bBoost - aBoost;

    const aOpen = a.is_open ? 1 : 0;
    const bOpen = b.is_open ? 1 : 0;
    if (bOpen !== aOpen) return bOpen - aOpen;

    if (b.rating !== a.rating) return b.rating - a.rating;

    return a.business_name.localeCompare(b.business_name);
  });
};

/**
 * Calculates Euclidean distance between two points in km (approx).
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const latDiff = lat2 - lat1;
  const lngDiff = lon2 - lon1;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
};
