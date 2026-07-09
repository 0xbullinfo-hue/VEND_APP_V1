import { create } from 'zustand';
import { DirectionRequest, EmergencyContact, LocalityQuest } from '../types';
import { useUIStore } from './useUIStore';
import { useVendorStore } from './useVendorStore';

interface TripState {
  directionRequests: DirectionRequest[];
  emergencyContacts: EmergencyContact[];
  activeTrip: { vendorId: string; status: 'en_route' | 'arrived' | 'completed'; startTime: number } | null;
  verifiedVisitCounts: Record<string, number>;
  quests: LocalityQuest[];

  requestDirections: (vendorId: string) => Promise<DirectionRequest>;
  verifyDirectionCode: (vendorId: string, code: string) => boolean;
  completeTrip: () => void;
  cancelTrip: () => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (id: string) => void;
  triggerSOS: () => void;
  updateQuests: (category: string) => void;
  resetTrips: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  directionRequests: [],
  emergencyContacts: [
    { id: '1', name: 'NEMA Nigeria Emergency', phone: '0800-2255-6362', relationship: 'Official Support' },
  ],
  activeTrip: null,
  verifiedVisitCounts: {},
  quests: [
    { id: 'q1', title: 'Foodie Discovery', description: 'Visit 3 different Food & Catering shops', targetCount: 3, currentCount: 0, pointsReward: 150, category: 'Food & Catering', isCompleted: false },
    { id: 'q2', title: 'Home Maintenance', description: 'Visit 2 Home Service specialists', targetCount: 2, currentCount: 0, pointsReward: 100, category: 'Home Services', isCompleted: false },
    { id: 'q3', title: 'Tech Support', description: 'Visit 1 Technology & Repairs shop', targetCount: 1, currentCount: 0, pointsReward: 50, category: 'Technology & Repairs', isCompleted: false },
  ],

  requestDirections: async (vendorId) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newRequest: DirectionRequest = {
      vendorId,
      timestamp: Date.now(),
      status: 'pending',
      code
    };
    
    set((state) => ({
      directionRequests: [...state.directionRequests, newRequest],
      activeTrip: {
        vendorId,
        status: 'en_route',
        startTime: Date.now()
      }
    }));

    return newRequest;
  },

  verifyDirectionCode: (vendorId, code) => {
    const state = get();
    const requestIndex = state.directionRequests.findIndex(r => r.vendorId === vendorId && r.code === code);
    
    if (requestIndex > -1) {
      set((state) => {
        const updatedRequests = [...state.directionRequests];
        updatedRequests[requestIndex].status = 'verified';
        
        const newCount = (state.verifiedVisitCounts[vendorId] || 0) + 1;
        const updatedCounts = { ...state.verifiedVisitCounts, [vendorId]: newCount };

        if (newCount === 5) {
          useUIStore.getState().triggerNotification(`🎖️ NEW MAYOR! You are now the Mayor of ${useVendorStore.getState().vendors.find(v => v.id === vendorId)?.business_name || 'this shop'}!`);
        }

        return {
          directionRequests: updatedRequests,
          verifiedVisitCounts: updatedCounts,
          activeTrip: state.activeTrip?.vendorId === vendorId
            ? { ...state.activeTrip, status: 'arrived' } 
            : state.activeTrip
        };
      });
      
      const vendor = useVendorStore.getState().vendors.find(v => v.id === vendorId);
      if (vendor) {
        get().updateQuests(vendor.category);
      }

      useUIStore.getState().addPoints(100);
      useUIStore.getState().triggerNotification("Visit verified successfully! +100 VEND points earned.");
      return true;
    }
    return false;
  },

  completeTrip: () => {
    const state = get();
    if (state.activeTrip) {
      set((state) => ({
        directionRequests: state.directionRequests.map(r => 
          r.vendorId === state.activeTrip?.vendorId ? { ...r, status: 'completed' as const } : r
        ),
        activeTrip: null
      }));
      useUIStore.getState().triggerNotification("Trip completed! Remember to leave a rating.");
    }
  },

  cancelTrip: () => {
    set({ activeTrip: null });
    useUIStore.getState().triggerNotification("Trip cancelled.");
  },

  addEmergencyContact: (contact) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Math.random().toString(36).substring(2, 11),
    };
    set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));
  },

  deleteEmergencyContact: (id) => {
    set((state) => ({
      emergencyContacts: state.emergencyContacts.filter(c => c.id !== id)
    }));
  },

  triggerSOS: () => {
    // Note: This is currently a simulated safety action.
    // In a production environment, this would integrate with an SMS gateway (e.g. Twilio)
    // or a backend emergency dispatch system to send live coordinates to the contacts below.
    useUIStore.getState().triggerNotification("🚨 SOS SIMULATED: Your coordinates have been logged. Please call emergency services (112/999) if you are in immediate danger.");
  },

  updateQuests: (category) => {
    set((state) => {
      const updatedQuests = state.quests.map(q => {
        if (q.category === category && !q.isCompleted) {
          const newCount = q.currentCount + 1;
          const isCompleted = newCount >= q.targetCount;
          if (isCompleted) {
            useUIStore.getState().addPoints(q.pointsReward);
            useUIStore.getState().triggerNotification(`Quest Completed! +${q.pointsReward} bonus points earned.`);
          }
          return { ...q, currentCount: newCount, isCompleted };
        }
        return q;
      });
      return { quests: updatedQuests };
    });
  },

  resetTrips: () => {
    set({
      directionRequests: [],
      activeTrip: null,
      emergencyContacts: [
        { id: '1', name: 'NEMA Nigeria Emergency', phone: '0800-2255-6362', relationship: 'Official Support' },
      ],
    });
  }
}));
