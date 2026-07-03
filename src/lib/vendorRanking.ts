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
