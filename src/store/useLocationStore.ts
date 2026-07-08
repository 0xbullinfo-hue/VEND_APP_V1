import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_LOCALITIES } from '../lib/mockData';

interface LocationState {
  locality: typeof MOCK_LOCALITIES[0] | null;
  setLocalityById: (id: number) => void;
  resetLocality: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locality: null,

      setLocalityById: (id) => {
        const found = MOCK_LOCALITIES.find(loc => loc.id === id);
        if (found) {
          set({ locality: found });
        }
      },

      resetLocality: () => set({ locality: null }),
    }),
    {
      name: 'vend.location.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
