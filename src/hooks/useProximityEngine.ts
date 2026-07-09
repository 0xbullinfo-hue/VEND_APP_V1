import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useApp } from '../contexts/AppContext';
import { getDistance } from '../lib/vendorRanking';

const DWELL_TIME_MS = 3 * 60 * 1000; // 3 minutes
const PROXIMITY_RADIUS_M = 100;

export const useProximityEngine = () => {
  const { vendors, currentLocation } = useApp();
  const dwellTimers = useRef<Record<string, number>>({});
  const notifiedVendors = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentLocation) return;

    const boostedVendors = vendors.filter(v => v.subscription_tier > 1);

    boostedVendors.forEach(vendor => {
      const distance = getDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        vendor.exact_location.latitude,
        vendor.exact_location.longitude
      ) * 1000; // Convert km to meters

      if (distance <= PROXIMITY_RADIUS_M) {
        if (!notifiedVendors.current.has(vendor.id)) {
          if (!dwellTimers.current[vendor.id]) {
            dwellTimers.current[vendor.id] = Date.now();
          } else {
            const timeElapsed = Date.now() - dwellTimers.current[vendor.id];
            if (timeElapsed >= DWELL_TIME_MS) {
              triggerDiscoveryNotification(vendor.business_name, vendor.id);
              notifiedVendors.current.add(vendor.id);
              delete dwellTimers.current[vendor.id];
            }
          }
        }
      } else {
        // User moved out of range, reset timer
        delete dwellTimers.current[vendor.id];
        // Allow re-notification if they leave and come back much later?
        // For now, once per session to avoid spam.
      }
    });
  }, [currentLocation, vendors]);

  const triggerDiscoveryNotification = async (vendorName: string, vendorId: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "VEND Discovery! 💎",
        body: `You've been near ${vendorName} for a while. Tap to see their local specialties!`,
        data: { vendorId },
      },
      trigger: null, // send immediately
    });
  };
};
