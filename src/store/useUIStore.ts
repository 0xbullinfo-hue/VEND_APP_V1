import { create } from 'zustand';

interface UIState {
  points: number;
  notification: string | null;
  addPoints: (amount: number) => void;
  setPoints: (points: number) => void;
  triggerNotification: (message: string) => void;
  dismissNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  points: 0,
  notification: null,
  addPoints: (amount) => set((state) => {
    const newPoints = state.points + amount;
    return { 
      points: newPoints,
      notification: `Points Earned! +${amount} VEND pts (Total: ${newPoints})`
    };
  }),
  setPoints: (points) => set({ points }),
  triggerNotification: (message) => set({ notification: message }),
  dismissNotification: () => set({ notification: null }),
}));
