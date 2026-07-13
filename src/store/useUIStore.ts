import { create } from 'zustand';

interface UIState {
  notification: string | null;
  triggerNotification: (message: string) => void;
  dismissNotification: () => void;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  notification: null,
  triggerNotification: (message) => set({ notification: message }),
  dismissNotification: () => set({ notification: null }),
  addPoints: (amount) => {
    // Cross-store points logic will be handled via user state in AppContext
    // This action acts as a trigger for notifications
    set({ notification: `Points Earned! +${amount} VEND pts` });
  },
  deductPoints: (amount) => {
    set({ notification: `Reward Unlocked! -${amount} VEND pts` });
  },
}));
