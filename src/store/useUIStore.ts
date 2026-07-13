import { create } from 'zustand';

interface UIState {
  points: number;
  notification: string | null;
  addPoints: (amount: number) => void;
  setPoints: (points: number) => void;
  deductPoints: (amount: number) => void;
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
      notification: amount > 0 ? `Points Earned! +${amount} VEND pts (Total: ${newPoints})` : null
    };
  }),
  setPoints: (points) => set({ points }),
  deductPoints: (amount: number) => set((state) => {
    const newPoints = Math.max(0, state.points - amount);
    return {
      points: newPoints,
      notification: `Reward Unlocked! -${amount} VEND pts (Total: ${newPoints})`
    };
  }),
  triggerNotification: (message) => set({ notification: message }),
  dismissNotification: () => set({ notification: null }),
}));
