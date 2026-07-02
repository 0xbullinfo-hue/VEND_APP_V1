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
