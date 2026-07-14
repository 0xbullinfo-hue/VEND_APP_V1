/**
 * VEND V2+ Paystack Revenue Engine
 *
 * Secure logic for NGN-to-Points conversion and Boost activation.
 */

import { theme } from '../theme/designSystem';

export interface BoostPlan {
  id: string;
  label: string;
  priceNGN: number;
  durationHours: number;
  description: string;
  color: string;
}

export const BOOST_PLANS: BoostPlan[] = [
  {
    id: 'flash_boost',
    label: 'Quick Job',
    priceNGN: 500,
    durationHours: 2,
    description: 'Instant 2-hour rank injection for immediate work.',
    color: '#8B5CF6' // Purple
  },
  {
    id: 'day_boost',
    label: 'Daily Presence',
    priceNGN: 1500,
    durationHours: 24,
    description: 'Maintain top-tier visibility for a full 24 hours.',
    color: theme.colors.primary
  },
  {
    id: 'weekly_boost',
    label: 'Weekly Dominance',
    priceNGN: 10000,
    durationHours: 168,
    description: '7 days of guaranteed high-conversion placement.',
    color: '#F59E0B' // Amber/Gold
  }
];

/**
 * Simulates Paystack Transaction Initialization.
 * In production, this calls the Paystack API via a Supabase Edge Function.
 */
export const initiatePaystackBoost = async (
  vendorId: string,
  planId: string
): Promise<{ success: boolean; checkoutUrl?: string; reference?: string; error?: string }> => {
  const plan = BOOST_PLANS.find(p => p.id === planId);
  if (!plan) return { success: false, error: 'Invalid plan selected' };

  console.log(`[Paystack] Initializing ₦${plan.priceNGN} boost for vendor ${vendorId}`);

  // MOCK: In real life, we fetch a payment URL from Paystack
  const mockRef = `VEND_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  return {
    success: true,
    checkoutUrl: `https://checkout.paystack.com/${mockRef}`,
    reference: mockRef
  };
};

/**
 * Handles Webhook Payment Fulfillment (MOCKED for Client-Side testing)
 * REAL logic happens in Supabase Edge Function: POST /paystack/webhook
 */
export const simulateWebhookFulfillment = (
  reference: string,
  amountNGN: number
): { boost_expiry: number; is_boosted: boolean } => {
  const plan = BOOST_PLANS.find(p => p.priceNGN === amountNGN);
  const durationMs = (plan?.durationHours || 2) * 60 * 60 * 1000;

  return {
    is_boosted: true,
    boost_expiry: Date.now() + durationMs
  };
};
