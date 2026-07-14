import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_VENDORS } from '../lib/mockData';
import { getPlanForTier, clampTier } from '../lib/subscriptionPlans';
import { useUIStore } from './useUIStore';
import { UserProfile, VendorProfile, VendorSnapshot, VendorServiceItem } from '../types';
import { useLocationStore } from './useLocationStore';
import { fetchVendorsByLocality, subscribeToVendorRealtime } from '../lib/vendorDataProvider';
import { rankVendorsForCustomer } from '../lib/vendorRanking';

interface VendorState {
  vendors: VendorProfile[];
  savedVendors: string[];
  savedHistory: string[]; // Track vendors ever saved to prevent point-farming
  chatHistory: string[]; // Track vendors ever chatted with to prevent point-farming
  snapshots: VendorSnapshot[];
  dataSource: 'mock' | 'supabase';
  isRealtimeConnected: boolean;
  isLoadingVendors: boolean;
  refreshVendorsForLocality: (localityId?: number) => Promise<void>;
  connectVendorRealtime: (localityId?: number) => () => void;
  
  ensureVendorProfile: (user: UserProfile) => void;
  toggleSaveVendor: (vendorId: string) => void;
  addSnapshot: (vendorId: string, image: string, caption: string) => void;
  registerVendor: (
    user: UserProfile | null,
    businessName: string,
    bio: string,
    category: string,
    subCategory: string,
    address: string,
    isHomeBased: boolean,
    latitude: number,
    longitude: number
  ) => void;
  addVendorService: (
    vendorId: string, 
    title: string, 
    description: string, 
    category: string, 
    price: number, 
    stock: number, 
    stockStatus: string, 
    image: string
  ) => boolean;
  updateVendorSubscription: (vendorId: string, tier: number) => boolean;
  updateVendorProfile: (vendorId: string, updates: Partial<VendorProfile>) => void;
  updateVendorService: (vendorId: string, serviceId: string, updates: Partial<VendorServiceItem>) => void;
  deleteVendorService: (vendorId: string, serviceId: string) => void;
  redeemPointBoost: (vendorId: string, boostType: 'flash' | 'search' | 'map', pointsCost: number) => boolean;
  receivePointsFromCustomer: (vendorId: string, amount: number) => void;
  convertCurrencyToPoints: (vendorId: string, amountNGN: number) => void;
  recordChatInquiry: (vendorId: string) => void;
  resetSavedVendors: () => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: MOCK_VENDORS,
      savedVendors: [],
      savedHistory: [],
      chatHistory: [],
      snapshots: [
        {
          id: 'sn1',
          vendor_id: 'v1',
          vendor_name: "Mama Titi's Kitchen",
          vendor_image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80',
          image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&q=80',
          caption: 'Fresh batch of Egusi soup ready for pickup! 🥘',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'sn2',
          vendor_id: 'v3',
          vendor_name: 'GlowUp Braids & Beauty',
          vendor_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
          image: 'https://images.unsplash.com/photo-1519762822-dea94f2a5a4e?w=500&q=80',
          caption: 'New slot available for box braids tomorrow at 10 AM. DM to book! ✨',
          timestamp: new Date().toISOString(),
        }
      ],
      dataSource: 'mock',
      isRealtimeConnected: false,
      isLoadingVendors: false,

      refreshVendorsForLocality: async (localityId) => {
        set({ isLoadingVendors: true });
        const rows = await fetchVendorsByLocality(localityId);
        set({
          vendors: rows,
          dataSource: rows.some((v) => v.realtime_source === 'supabase') ? 'supabase' : 'mock',
          isLoadingVendors: false,
        });
      },

  connectVendorRealtime: (localityId) => {
    if (!localityId) {
      set({ isRealtimeConnected: false });
      return () => {};
    }

    const cleanup = subscribeToVendorRealtime(
      localityId,
      async () => {
        await get().refreshVendorsForLocality(localityId);
      },
      (onlineIds) => {
        set((state) => ({
          vendors: state.vendors.map(v => ({
            ...v,
            is_online: onlineIds.includes(v.id)
          }))
        }));
      }
    );

    set({ isRealtimeConnected: true });

        return () => {
          cleanup();
          set({ isRealtimeConnected: false });
        };
      },

      ensureVendorProfile: (user) => {
        set((state) => {
          if (state.vendors.some(v => v.id === user.id)) return state;
          const locality = useLocationStore.getState().locality;
          const newVendorProfile = {
            id: user.id,
            business_name: user.name,
            bio: 'Tell customers about your business by completing your profile setup.',
            category: 'Professional Services',
            sub_category: 'General Services',
            rating: 5.0,
            is_open: true,
            is_home_based: true,
            locality_id: locality ? locality.id : 1,
            subscription_tier: 1,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
            services: [],
            street_address: '',
            point_wallet: 50, // Welcome points for vendors
            handshake_count: 0,
            avg_response_mins: 0,
            portfolio_urls: [],
            exact_location: locality?.center_location || { latitude: 6.5165, longitude: 3.3792 }
          };
          return { vendors: rankVendorsForCustomer([newVendorProfile, ...state.vendors]) };
        });
      },

      toggleSaveVendor: (vendorId) => {
        set((state) => {
          if (state.savedVendors.includes(vendorId)) {
            return { savedVendors: state.savedVendors.filter(id => id !== vendorId) };
          } else {
            const hasSavedBefore = state.savedHistory.includes(vendorId);
            if (!hasSavedBefore) {
              useUIStore.getState().addPoints(5);
            }
            return {
              savedVendors: [...state.savedVendors, vendorId],
              savedHistory: hasSavedBefore ? state.savedHistory : [...state.savedHistory, vendorId]
            };
          }
        });
      },

      addSnapshot: (vendorId, image, caption) => {
        const vendor = get().vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        const newSnapshot: VendorSnapshot = {
          id: 'sn_' + Math.random().toString(36).substring(2, 11),
          vendor_id: vendorId,
          vendor_name: vendor.business_name,
          vendor_image: vendor.image || '',
          image: image || '',
          caption,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          snapshots: [newSnapshot, ...state.snapshots].slice(0, 20) // Keep latest 20
        }));

        useUIStore.getState().addPoints(50);
        useUIStore.getState().triggerNotification("Daily Snapshot posted! +50 VEND points earned.");
      },

      registerVendor: (user, businessName, bio, category, subCategory, address, isHomeBased, latitude, longitude) => {
        const profileFields = {
          business_name: businessName,
          bio,
          category,
          sub_category: subCategory,
          is_home_based: isHomeBased,
          locality_id: useLocationStore.getState().locality?.id || 1,
          street_address: address,
          exact_location: { latitude, longitude }
        };

        set((state) => {
          const vendorId = user?.id;
          const existingIndex = vendorId ? state.vendors.findIndex(v => v.id === vendorId) : -1;

          if (existingIndex > -1) {
            const updated = [...state.vendors];
            updated[existingIndex] = { ...updated[existingIndex], ...profileFields };
            return { vendors: rankVendorsForCustomer(updated) };
          }

          const newVendor = {
            id: vendorId || ('v_' + Math.random().toString(36).substring(2, 11)),
            ...profileFields,
            rating: 5.0,
            is_open: true,
            subscription_tier: 1,
            point_wallet: 50,
            handshake_count: 0,
            avg_response_mins: 0,
            portfolio_urls: [],
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
            services: [],
          };
          return { vendors: rankVendorsForCustomer([newVendor, ...state.vendors]) };
        });
      },

      addVendorService: (vendorId, title, description, category, price, stock, stockStatus, image) => {
        const state = get();
        const vendor = state.vendors.find(v => v.id === vendorId);
        if (!vendor) return false;

        const plan = getPlanForTier(vendor.subscription_tier);
        if (vendor.services.length >= plan.maxListings) {
          useUIStore.getState().triggerNotification(`Listing limit reached (${plan.maxListings} on the ${plan.name} plan). Upgrade your plan to add more services.`);
          return false;
        }

        set((state) => ({
          vendors: state.vendors.map(v => {
            if (v.id === vendorId) {
              return {
                ...v,
                services: [
                  ...v.services,
                  { id: 's_' + Math.random().toString(36).substring(2, 11), title, description, category, price, stock, stockStatus, image }
                ]
              };
            }
            return v;
          })
        }));
        return true;
      },

      updateVendorSubscription: (vendorId, tier) => {
        const state = get();
        const vendor = state.vendors.find(v => v.id === vendorId);
        if (!vendor) return false;

        const targetTier = clampTier(tier);
        const targetPlan = getPlanForTier(targetTier);

        if (targetTier < vendor.subscription_tier && vendor.services.length > targetPlan.maxListings) {
          const excess = vendor.services.length - targetPlan.maxListings;
          useUIStore.getState().triggerNotification(`Can't switch to ${targetPlan.name}: remove ${excess} listing${excess > 1 ? 's' : ''} first (limit is ${targetPlan.maxListings}).`);
          return false;
        }

        set((state) => ({
          vendors: rankVendorsForCustomer(
            state.vendors.map(v => v.id === vendorId ? { ...v, subscription_tier: targetTier } : v)
          )
        }));
        useUIStore.getState().triggerNotification(`Subscription activated! ${targetPlan.name} is now active.`);
        return true;
      },

      updateVendorProfile: (vendorId, updates) => {
        set((state) => ({
          vendors: state.vendors.map((v) => (v.id === vendorId ? { ...v, ...updates } : v)),
        }));
        useUIStore.getState().triggerNotification('Business profile updated successfully.');
      },

      updateVendorService: (vendorId, serviceId, updates) => {
        set((state) => ({
          vendors: state.vendors.map((v) => {
            if (v.id !== vendorId) return v;
            return {
              ...v,
              services: v.services.map((s) => (s.id === serviceId ? { ...s, ...updates } : s)),
            };
          }),
        }));
        useUIStore.getState().triggerNotification('Service item updated.');
      },

      deleteVendorService: (vendorId, serviceId) => {
        set((state) => ({
          vendors: state.vendors.map((v) => {
            if (v.id !== vendorId) return v;
            return {
              ...v,
              services: v.services.filter((s) => s.id !== serviceId),
            };
          }),
        }));
        useUIStore.getState().triggerNotification('Service item deleted.');
      },

      redeemPointBoost: (vendorId, boostType, pointsCost) => {
        const vendor = get().vendors.find(v => v.id === vendorId);
        if (!vendor || vendor.point_wallet < pointsCost) {
          useUIStore.getState().triggerNotification(`Insufficient points. You need ${pointsCost} PTS.`);
          return false;
        }

        const durationMs = boostType === 'flash' ? 3600000 : boostType === 'search' ? 86400000 : 172800000;
        const expiry = Date.now() + durationMs;

        set((state) => ({
          vendors: state.vendors.map((v) => (v.id === vendorId ? { ...v, boost_expiry: expiry, point_wallet: v.point_wallet - pointsCost } : v)),
        }));

        useUIStore.getState().triggerNotification(`${boostType.toUpperCase()} boost activated! -${pointsCost} PTS.`);
        return true;
      },

      receivePointsFromCustomer: (vendorId, amount) => {
        set((state) => ({
          vendors: state.vendors.map(v => v.id === vendorId ? { ...v, point_wallet: v.point_wallet + amount } : v)
        }));
      },

      convertCurrencyToPoints: (vendorId, amountNGN) => {
        const pointsToAdd = Math.floor(amountNGN / 10); // Example: 1000 NGN = 100 PTS
        set((state) => ({
          vendors: state.vendors.map(v => v.id === vendorId ? { ...v, point_wallet: v.point_wallet + pointsToAdd } : v)
        }));
        useUIStore.getState().triggerNotification(`Payment successful! +${pointsToAdd} PTS added to your wallet.`);
      },

      recordChatInquiry: (vendorId) => {
        set((state) => {
          if (state.chatHistory.includes(vendorId)) return state;

          useUIStore.getState().addPoints(5);
          return { chatHistory: [...state.chatHistory, vendorId] };
        });
      },

      resetSavedVendors: () => set({ savedVendors: [] }),
    }),
    {
      name: 'vend.vendor.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedVendors: state.savedVendors,
        savedHistory: state.savedHistory,
        chatHistory: state.chatHistory
      }), // Persist current saves, save history, and chat history
    }
  )
);
