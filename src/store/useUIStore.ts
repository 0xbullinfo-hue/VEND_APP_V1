import { create } from 'zustand';

interface UIState {
  notification: string | null;
  triggerNotification: (message: string) => void;
  dismissNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  notification: null,
  triggerNotification: (message) => set({ notification: message }),
  dismissNotification: () => set({ notification: null }),
}));
