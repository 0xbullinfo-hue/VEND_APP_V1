import { VendorProfile } from '../types';

// Deterministic ranking so boosted vendors get locality priority while still
// balancing quality and availability signals.
// V2+: Implements Refined Weighted Relevance Scoring (AI v2)
// Logic: 40% Proximity | 30% Reputation | 20% Response Speed | 10% Boost Weight
export const rankVendorsForCustomer = (
  vendors: VendorProfile[],
  userLocation?: { latitude: number; longitude: number }
): VendorProfile[] => {
  const calculateScore = (v: VendorProfile): number => {
    let score = 0;

    // 1. Proximity (40%) - Max 40 points
    if (userLocation) {
      const dist = getDistance(userLocation.latitude, userLocation.longitude, v.exact_location.latitude, v.exact_location.longitude);
      if (dist <= 0.5) score += 40;
      else if (dist <= 1.5) score += 30;
      else if (dist <= 4) score += 20;
      else if (dist <= 8) score += 10;
    } else {
      score += 20; // Default baseline
    }

    // 2. Reputation Score (30%) - Max 30 points
    // Based on Verified Visit (Handshake) count and Rating
    const completionScore = Math.min(1, v.handshake_count / 100) * 15;
    const ratingScore = (v.rating / 5) * 15;
    score += (completionScore + ratingScore);

    // 3. Response Speed (20%) - Max 20 points
    if (v.avg_response_mins > 0) {
      if (v.avg_response_mins <= 3) score += 20;
      else if (v.avg_response_mins <= 10) score += 15;
      else if (v.avg_response_mins <= 30) score += 10;
      else if (v.avg_response_mins <= 60) score += 5;
    }

    // 4. Boost Weight (10%) - Max 10 points
    // V2+: Boosted vendors get the full 10 point injection
    if (v.is_boosted) score += 10;

    // Availability Filter (Hard Multiplier)
    if (!v.is_open) score *= 0.5;

    return score;
  };

  return [...vendors].sort((a, b) => {
    const scoreA = calculateScore(a);
    const scoreB = calculateScore(b);

    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.business_name.localeCompare(b.business_name);
  });
};

/**
 * Calculates Euclidean distance between two points in km (approx).
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const latDiff = lat2 - lat1;
  const lngDiff = lon2 - lon1;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
};
