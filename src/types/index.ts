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

export interface VendorServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  stockStatus: string;
  image: string;
}

export interface VendorProfile {
  id: string;
  business_name: string;
  bio: string;
  category: string;
  sub_category: string;
  rating: number;
  is_open: boolean;
  is_home_based: boolean;
  locality_id: number;
  subscription_tier: number;
  image: string;
  street_address: string;
  exact_location: { latitude: number; longitude: number };
  services: VendorServiceItem[];
  last_seen_at?: string;
  realtime_source?: 'mock' | 'supabase';
}
