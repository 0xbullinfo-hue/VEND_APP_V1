import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_LOCALITIES, MOCK_VENDORS } from '../lib/supabase';

export interface UserProfile {
  id: string;
  phone: string;
  role: 'customer' | 'vendor';
  name: string;
  localityId?: number;
  referralCode?: string;
}

export interface DirectionRequest {
  vendorId: string;
  timestamp: number;
  status: 'pending' | 'verified' | 'completed';
  code: string; // Verification code
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface AppContextType {
  user: UserProfile | null;
  role: 'customer' | 'vendor' | null;
  points: number;
  locality: typeof MOCK_LOCALITIES[0] | null;
  vendors: typeof MOCK_VENDORS;
  savedVendors: string[];
  directionRequests: DirectionRequest[];
  emergencyContacts: EmergencyContact[];
  activeTrip: { vendorId: string; status: 'en_route' | 'arrived' | 'completed'; startTime: number } | null;
  notification: string | null;
  
  // Actions
  login: (phone: string, role: 'customer' | 'vendor', name: string) => Promise<void>;
  logout: () => void;
  setLocalityById: (id: number) => void;
  addPoints: (amount: number) => void;
  toggleSaveVendor: (vendorId: string) => void;
  requestDirections: (vendorId: string) => Promise<DirectionRequest>;
  verifyDirectionCode: (vendorId: string, code: string) => boolean;
  completeTrip: () => void;
  cancelTrip: () => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (id: string) => void;
  triggerSOS: () => void;
  registerVendor: (businessName: string, bio: string, category: string, subCategory: string, address: string, isHomeBased: boolean, latitude: number, longitude: number) => void;
  addVendorService: (vendorId: string, title: string, description: string, category: string, price: number, stock: number, stockStatus: string, image: string) => void;
  updateVendorSubscription: (vendorId: string, tier: number) => void;
  dismissNotification: () => void;
  setPoints: (points: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'customer' | 'vendor' | null>(null);
  const [points, setPointsState] = useState<number>(0);
  const [locality, setLocality] = useState<typeof MOCK_LOCALITIES[0] | null>(null);
  const [vendors, setVendors] = useState<typeof MOCK_VENDORS>(MOCK_VENDORS);
  const [savedVendors, setSavedVendors] = useState<string[]>([]);
  const [directionRequests, setDirectionRequests] = useState<DirectionRequest[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'NEMA Nigeria Emergency', phone: '0800-2255-6362', relationship: 'Official Support' },
  ]);
  const [activeTrip, setActiveTrip] = useState<AppContextType['activeTrip']>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Authenticate user
  const login = async (phone: string, selectedRole: 'customer' | 'vendor', name: string) => {
    // Generate a simple mock user
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      phone,
      role: selectedRole,
      name: name || (selectedRole === 'vendor' ? 'Premium Vendor' : 'Valued Customer'),
    };
    setUser(mockUser);
    setRole(selectedRole);
    if (selectedRole === 'customer') {
      setPointsState(0); // Onboarding referral code can boost this to 50
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setLocality(null);
    setSavedVendors([]);
    setDirectionRequests([]);
    setActiveTrip(null);
  };

  const setLocalityById = (id: number) => {
    const found = MOCK_LOCALITIES.find(loc => loc.id === id);
    if (found) {
      setLocality(found);
    }
  };

  const addPoints = (amount: number) => {
    setPointsState(prev => {
      const newPoints = prev + amount;
      setNotification(`Points Earned! +${amount} VEND pts (Total: ${newPoints})`);
      return newPoints;
    });
  };

  const setPoints = (amt: number) => {
    setPointsState(amt);
  };

  const toggleSaveVendor = (vendorId: string) => {
    setSavedVendors(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      } else {
        addPoints(5); // Reward user with 5 points for saving/bookmarking a vendor
        return [...prev, vendorId];
      }
    });
  };

  const requestDirections = async (vendorId: string): Promise<DirectionRequest> => {
    // Generate a random 4 digit code for the handshake
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newRequest: DirectionRequest = {
      vendorId,
      timestamp: Date.now(),
      status: 'pending',
      code
    };
    setDirectionRequests(prev => [...prev, newRequest]);
    
    // Auto-verify helper if it's a test case, but for app flow we verify via input
    // Immediately set active trip state as en_route for customer
    setActiveTrip({
      vendorId,
      status: 'en_route',
      startTime: Date.now()
    });

    return newRequest;
  };

  const verifyDirectionCode = (vendorId: string, code: string): boolean => {
    const requestIndex = directionRequests.findIndex(r => r.vendorId === vendorId && r.code === code);
    if (requestIndex > -1) {
      setDirectionRequests(prev => {
        const updated = [...prev];
        updated[requestIndex].status = 'verified';
        return updated;
      });
      if (activeTrip && activeTrip.vendorId === vendorId) {
        setActiveTrip(prev => prev ? { ...prev, status: 'arrived' } : null);
      }
      addPoints(100); // Massive 100 VEND points reward for physical visit handshake completion!
      setNotification("Visit verified successfully! +100 VEND points earned.");
      return true;
    }
    return false;
  };

  const completeTrip = () => {
    if (activeTrip) {
      setDirectionRequests(prev => 
        prev.map(r => r.vendorId === activeTrip.vendorId ? { ...r, status: 'completed' as const } : r)
      );
      setActiveTrip(null);
      setNotification("Trip completed! Remember to leave a rating.");
    }
  };

  const cancelTrip = () => {
    setActiveTrip(null);
    setNotification("Trip cancelled.");
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEmergencyContacts(prev => [...prev, newContact]);
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  const triggerSOS = () => {
    setNotification("🚨 SOS ACTIVATED! Emergency contacts and local security notified with your live location.");
  };

  const registerVendor = (
    businessName: string,
    bio: string,
    category: string,
    subCategory: string,
    address: string,
    isHomeBased: boolean,
    latitude: number,
    longitude: number
  ) => {
    const newVendor = {
      id: 'v_' + Math.random().toString(36).substr(2, 9),
      business_name: businessName,
      bio,
      category,
      sub_category: subCategory,
      rating: 5.0,
      is_open: true,
      is_home_based: isHomeBased,
      locality_id: locality ? locality.id : 1,
      subscription_tier: 1, // Start on free tier
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      services: [],
      street_address: address,
      exact_location: { latitude, longitude }
    };
    setVendors(prev => [newVendor, ...prev]);
  };

  const addVendorService = (vendorId: string, title: string, description: string, category: string, price: number, stock: number, stockStatus: string, image: string) => {
    setVendors(prev => 
      prev.map(v => {
        if (v.id === vendorId) {
          return {
            ...v,
            services: [
              ...v.services,
              { id: 's_' + Math.random().toString(36).substr(2, 9), title, description, category, price, stock, stockStatus, image }
            ]
          };
        }
        return v;
      })
    );
  };

  const updateVendorSubscription = (vendorId: string, tier: number) => {
    setVendors(prev =>
      prev.map(v => {
        if (v.id === vendorId) {
          return { ...v, subscription_tier: tier };
        }
        return v;
      })
    );
    setNotification(`Subscription activated! Tier ${tier} is now active.`);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <AppContext.Provider value={{
      user,
      role,
      points,
      locality,
      vendors,
      savedVendors,
      directionRequests,
      emergencyContacts,
      activeTrip,
      notification,
      login,
      logout,
      setLocalityById,
      addPoints,
      toggleSaveVendor,
      requestDirections,
      verifyDirectionCode,
      completeTrip,
      cancelTrip,
      addEmergencyContact,
      deleteEmergencyContact,
      triggerSOS,
      registerVendor,
      addVendorService,
      updateVendorSubscription,
      dismissNotification,
      setPoints
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
