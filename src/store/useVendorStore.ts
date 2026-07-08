import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_VENDORS } from '../lib/mockData';
import { getPlanForTier, clampTier } from '../lib/subscriptionPlans';
import { useUIStore } from './useUIStore';
import { UserProfile, VendorProfile } from '../types';
import { useLocationStore } from './useLocationStore';
import { fetchVendorsByLocality, subscribeToVendorRealtime } from '../lib/vendorDataProvider';
import { rankVendorsForCustomer } from '../lib/vendorRanking';

interface VendorState {
  vendors: VendorProfile[];
  savedVendors: string[];
  dataSource: 'mock' | 'supabase';
  isRealtimeConnected: boolean;
  isLoadingVendors: boolean;
  refreshVendorsForLocality: (localityId?: number) => Promise<void>;
  connectVendorRealtime: (localityId?: number) => () => void;
  
  ensureVendorProfile: (user: UserProfile) => void;
  toggleSaveVendor: (vendorId: string) => void;
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
  resetSavedVendors: () => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: MOCK_VENDORS,
      savedVendors: [],
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

        const cleanup = subscribeToVendorRealtime(localityId, async () => {
          await get().refreshVendorsForLocality(localityId);
        });

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
            useUIStore.getState().addPoints(5);
            return { savedVendors: [...state.savedVendors, vendorId] };
          }
        });
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

      resetSavedVendors: () => set({ savedVendors: [] }),
    }),
    {
      name: 'vend.vendor.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ savedVendors: state.savedVendors }), // Only persist saved vendors, fetch real profiles
    }
  )
);
