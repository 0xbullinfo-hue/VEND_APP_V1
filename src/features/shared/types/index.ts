export interface UserProfile {
  id: string;
  phone: string;
  role: 'customer' | 'vendor';
  name: string;
  points: number; // Global point balance
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
  allowPointDiscount?: boolean;
  pointsDiscountCost?: number;
  discountValue?: string;
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
  point_wallet: number; // Vendor's points for boosting
  is_boosted: boolean; // V2+ Master visibility flag
  boost_expiry: number | null; // V2+ Automated rank-reset timer
  subscription_status: 'free' | 'pro' | 'elite' | 'business'; // V2+ MRR Tier
  handshake_count: number; // V2: Total verified completions
  avg_response_mins: number; // V2: Speed signal for AI ranking
  portfolio_urls: string[]; // V2: Social proof gallery
  business_hours?: string;
  boost_expiry?: number | null;
  exact_location: { latitude: number; longitude: number };
  services: VendorServiceItem[];
  last_seen_at?: string;
  is_online?: boolean;
  realtime_source?: 'mock' | 'supabase';
}

export interface VendorSnapshot {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_image: string;
  image: string;
  caption: string;
  timestamp: string;
}

export interface LocalityQuest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  pointsReward: number;
  category: string;
  isCompleted: boolean;
}
