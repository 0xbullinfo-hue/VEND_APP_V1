import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_LOCALITIES } from '../lib/mockData';

interface LocationState {
  locality: typeof MOCK_LOCALITIES[0] | null;
  currentLocation: { latitude: number; longitude: number } | null;
  setLocalityById: (id: number) => void;
  setCurrentLocation: (lat: number, lng: number) => void;
  resetLocality: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locality: null,
      currentLocation: null,

      setLocalityById: (id) => {
        const found = MOCK_LOCALITIES.find(loc => loc.id === id);
        if (found) {
          set({ locality: found });
        }
      },

      setCurrentLocation: (latitude, longitude) => set({ currentLocation: { latitude, longitude } }),

      resetLocality: () => set({ locality: null, currentLocation: null }),
    }),
    {
      name: 'vend.location.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
