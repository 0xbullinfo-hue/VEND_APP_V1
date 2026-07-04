import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';

/**
 * Promotion Model
 */
export interface Promotion {
  promoId: string;
  vendorId: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'bogo'; // Buy-One-Get-One
  discountValue: number; // 10 for 10% or fixed amount
  minPurchaseAmount?: number; // Minimum order to apply promo
  applicableProducts?: string[]; // If empty, applies to all
  startDate: number; // Timestamp
  endDate: number; // Timestamp
  maxRedemptions?: number; // Total uses allowed
  currentRedemptions: number; // Current uses
  maxPerCustomer?: number; // Max uses per customer
  targetAudience: 'all' | 'returning' | 'new'; // Who can use
  createdAt: number;
  isActive: boolean;
}

/**
 * Customer Promo Tracking
 */
export interface PromoUsage {
  customerId: string;
  promoId: string;
  vendorId: string;
  usedAt: number;
  discountApplied: number;
}

/**
 * Promo Performance Summary
 */
export interface VendorPromoStats {
  vendorId: string;
  totalPromos: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  averageDiscountPerRedemption: number;
  conversionRate: number; // % of displayed promos that were redeemed
  uniqueCustomersReached: number;
  topPerformingPromo?: string; // promoId
  recentPerformance?: {
    period: '7d' | '30d' | '90d';
    redemptions: number;
    discountGiven: number;
    estimatedRevenueLift: number;
  };
}

/**
 * Zustand Store for Promotions
 */
interface PromoStore {
  // Data
  promos: Map<string, Promotion[]>; // vendorId -> Promotion[]
  usageHistory: PromoUsage[];

  // Actions
  createPromo: (promo: Promotion) => void;
  updatePromo: (vendorId: string, promoId: string, updates: Partial<Promotion>) => void;
  deactivatePromo: (vendorId: string, promoId: string) => void;
  getVendorPromos: (vendorId: string) => Promotion[];
  getActivePromos: (vendorId: string) => Promotion[];
  recordPromoUsage: (usage: PromoUsage) => void;
  getPromoStats: (vendorId: string) => VendorPromoStats;
  getPromoUsageByCustomer: (customerId: string, vendorId: string) => PromoUsage[];
  canCustomerUsePromo: (customerId: string, promoId: string, vendorId: string) => boolean;
  getEligiblePromos: (vendorId: string, customerType: 'all' | 'returning' | 'new') => Promotion[];
  calculateDiscountAmount: (promoId: string, vendorId: string, purchaseAmount: number) => number;
}

const asyncStorageSupport: PersistStorage<PromoStore> = {
  getItem: async (name: string) => {
    const data = await AsyncStorage.getItem(name);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        promos: new Map(parsed.promos || []),
      };
    }
    return null;
  },
  setItem: async (name: string, value) => {
    const store = value as unknown as PromoStore;
    const toStore = {
      ...store,
      promos: Array.from(store.promos.entries()),
    };
    await AsyncStorage.setItem(name, JSON.stringify(toStore));
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

export const usePromoStore = create<PromoStore>()(
  persist(
    (set, get) => ({
      promos: new Map(),
      usageHistory: [],

      createPromo: (promo: Promotion) => {
        set((state) => {
          const vendorPromos = state.promos.get(promo.vendorId) || [];
          return {
            promos: new Map(state.promos).set(promo.vendorId, [...vendorPromos, promo]),
          };
        });
      },

      updatePromo: (vendorId: string, promoId: string, updates: Partial<Promotion>) => {
        set((state) => {
          const vendorPromos = state.promos.get(vendorId) || [];
          const updated = vendorPromos.map((p) => (p.promoId === promoId ? { ...p, ...updates } : p));
          return {
            promos: new Map(state.promos).set(vendorId, updated),
          };
        });
      },

      deactivatePromo: (vendorId: string, promoId: string) => {
        get().updatePromo(vendorId, promoId, { isActive: false });
      },

      getVendorPromos: (vendorId: string) => {
        return get().promos.get(vendorId) || [];
      },

      getActivePromos: (vendorId: string) => {
        const now = Date.now();
        return (get().promos.get(vendorId) || []).filter(
          (p) => p.isActive && p.startDate <= now && now <= p.endDate && (p.maxRedemptions === undefined || p.currentRedemptions < p.maxRedemptions)
        );
      },

      recordPromoUsage: (usage: PromoUsage) => {
        set((state) => ({
          usageHistory: [...state.usageHistory, usage],
        }));

        // Increment redemption count
        get().updatePromo(usage.vendorId, usage.promoId, {
          currentRedemptions: (get().promos.get(usage.vendorId)?.find((p) => p.promoId === usage.promoId)?.currentRedemptions || 0) + 1,
        });
      },

      getPromoStats: (vendorId: string) => {
        const vendorUsage = get().usageHistory.filter((u) => u.vendorId === vendorId);
        const vendorPromos = get().getVendorPromos(vendorId);

        const totalRedemptions = vendorUsage.length;
        const totalDiscountGiven = vendorUsage.reduce((sum, u) => sum + u.discountApplied, 0);
        const uniqueCustomers = new Set(vendorUsage.map((u) => u.customerId)).size;

        // Calculate conversion rate (% of created promos that have redemptions)
        const promosWithRedemptions = new Set(vendorUsage.map((u) => u.promoId)).size;
        const conversionRate = vendorPromos.length > 0 ? (promosWithRedemptions / vendorPromos.length) * 100 : 0;

        // Calculate 7-day performance
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentUsage = vendorUsage.filter((u) => u.usedAt >= sevenDaysAgo);
        const recentRedemptions = recentUsage.length;
        const recentDiscountGiven = recentUsage.reduce((sum, u) => sum + u.discountApplied, 0);

        // Estimate revenue lift (assume average order value ~5000 NGN, promo reduces margin by discount)
        const estimatedRevenueLift = recentRedemptions * 5000 * 0.15; // 15% estimated margin

        // Find top performing promo
        const promoPerformance = new Map<string, number>();
        vendorUsage.forEach((u) => {
          promoPerformance.set(u.promoId, (promoPerformance.get(u.promoId) || 0) + 1);
        });
        let topPerformingPromo: string | undefined;
        let maxRedemptions = 0;
        promoPerformance.forEach((count, promoId) => {
          if (count > maxRedemptions) {
            maxRedemptions = count;
            topPerformingPromo = promoId;
          }
        });

        return {
          vendorId,
          totalPromos: vendorPromos.length,
          totalRedemptions,
          totalDiscountGiven,
          averageDiscountPerRedemption: totalRedemptions > 0 ? totalDiscountGiven / totalRedemptions : 0,
          conversionRate: Math.round(conversionRate * 10) / 10,
          uniqueCustomersReached: uniqueCustomers,
          topPerformingPromo,
          recentPerformance: {
            period: '7d',
            redemptions: recentRedemptions,
            discountGiven: recentDiscountGiven,
            estimatedRevenueLift: Math.round(estimatedRevenueLift),
          },
        };
      },

      getPromoUsageByCustomer: (customerId: string, vendorId: string) => {
        return get().usageHistory.filter((u) => u.customerId === customerId && u.vendorId === vendorId);
      },

      canCustomerUsePromo: (customerId: string, promoId: string, vendorId: string) => {
        const promo = get()
          .getVendorPromos(vendorId)
          .find((p) => p.promoId === promoId);

        if (!promo || !promo.isActive) return false;

        const now = Date.now();
        if (now < promo.startDate || now > promo.endDate) return false;

        // Check max per customer
        if (promo.maxPerCustomer) {
          const customerUsage = get().getPromoUsageByCustomer(customerId, vendorId);
          const promoUsageCount = customerUsage.filter((u) => u.promoId === promoId).length;
          if (promoUsageCount >= promo.maxPerCustomer) return false;
        }

        // Check max redemptions
        if (promo.maxRedemptions && promo.currentRedemptions >= promo.maxRedemptions) return false;

        return true;
      },

      getEligiblePromos: (vendorId: string, customerType: 'all' | 'returning' | 'new') => {
        return get()
          .getActivePromos(vendorId)
          .filter((p) => p.targetAudience === 'all' || p.targetAudience === customerType);
      },

      calculateDiscountAmount: (promoId: string, vendorId: string, purchaseAmount: number) => {
        const vendorPromos = get().getVendorPromos(vendorId);
        const promo = vendorPromos.find((p) => p.promoId === promoId);

        if (!promo) return 0;

        // Check minimum purchase amount
        if (promo.minPurchaseAmount && purchaseAmount < promo.minPurchaseAmount) return 0;

        if (promo.discountType === 'percentage') {
          return Math.round((purchaseAmount * promo.discountValue) / 100);
        } else if (promo.discountType === 'fixed') {
          return Math.min(promo.discountValue, purchaseAmount); // Don't discount more than purchase amount
        } else if (promo.discountType === 'bogo') {
          // BOGO: Free item up to 50% of purchase (simplified)
          return Math.round(purchaseAmount * 0.5);
        }

        return 0;
      },
    }),
    {
      name: 'promo-store',
      storage: asyncStorageSupport,
    }
  )
);
