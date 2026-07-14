import { VendorProfile } from '../types';

// Deterministic ranking so boosted vendors get locality priority while still
// balancing quality and availability signals.
// V2: Implements Weighted Relevance Scoring (AI v1)
export const rankVendorsForCustomer = (
  vendors: VendorProfile[],
  userLocation?: { latitude: number; longitude: number }
): VendorProfile[] => {
  const calculateScore = (v: VendorProfile): number => {
    let score = 0;

    // 1. Proximity (25%)
    if (userLocation) {
      const dist = getDistance(userLocation.latitude, userLocation.longitude, v.exact_location.latitude, v.exact_location.longitude);
      if (dist <= 1) score += 25;
      else if (dist <= 3) score += 15;
      else if (dist <= 7) score += 5;
    } else {
      score += 15;
    }

    // 2. Rating Quality (20%)
    score += (v.rating / 5) * 20;

    // 3. Job Completion / Handshakes (25%)
    if (v.handshake_count >= 100) score += 25;
    else if (v.handshake_count >= 50) score += 15;
    else if (v.handshake_count >= 10) score += 5;

    // 4. Response Speed (15%)
    if (v.avg_response_mins > 0) {
      if (v.avg_response_mins <= 5) score += 15;
      else if (v.avg_response_mins <= 15) score += 10;
      else if (v.avg_response_mins <= 60) score += 5;
    }

    // 5. Boost Intensity (15%)
    if (v.subscription_tier > 1) score += 15;

    // Availability Bonus (Multiplier)
    if (v.is_open) score += 10;

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
