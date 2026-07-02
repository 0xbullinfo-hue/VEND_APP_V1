import { create } from 'zustand';
import { DirectionRequest, EmergencyContact } from '../types';
import { useUIStore } from './useUIStore';

interface TripState {
  directionRequests: DirectionRequest[];
  emergencyContacts: EmergencyContact[];
  activeTrip: { vendorId: string; status: 'en_route' | 'arrived' | 'completed'; startTime: number } | null;
  
  requestDirections: (vendorId: string) => Promise<DirectionRequest>;
  verifyDirectionCode: (vendorId: string, code: string) => boolean;
  completeTrip: () => void;
  cancelTrip: () => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (id: string) => void;
  triggerSOS: () => void;
  resetTrips: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  directionRequests: [],
  emergencyContacts: [
    { id: '1', name: 'NEMA Nigeria Emergency', phone: '0800-2255-6362', relationship: 'Official Support' },
  ],
  activeTrip: null,

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
        
        return {
          directionRequests: updatedRequests,
          activeTrip: state.activeTrip?.vendorId === vendorId 
            ? { ...state.activeTrip, status: 'arrived' } 
            : state.activeTrip
        };
      });
      
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
    useUIStore.getState().triggerNotification("🚨 SOS ACTIVATED! Emergency contacts and local security notified with your live location.");
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
