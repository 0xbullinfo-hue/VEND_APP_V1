import { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { getDistance } from '../lib/vendorRanking';

const DWELL_TIME_MS = 3 * 60 * 1000; // 3 minutes
const PROXIMITY_RADIUS_M = 100;

export const useProximityEngine = () => {
  const { vendors, currentLocation, activeTrip } = useApp();
  const dwellTimers = useRef<Record<string, number>>({});
  const notifiedVendors = useRef<Set<string>>(new Set());
  const arrivalNotified = useRef<string | null>(null);

  const getNotificationsModule = () => {
    try {
      return require('expo-notifications') as typeof import('expo-notifications');
    } catch (error) {
      console.warn('[ProximityEngine] Notifications module unavailable. Skipping local notification.', error);
      return null;
    }
  };

  useEffect(() => {
    if (!currentLocation) return;

    // ─── 1. Trip Arrival Logic ────────────────────────────────────────────────
    if (activeTrip && activeTrip.status === 'en_route') {
      const tripVendor = vendors.find(v => v.id === activeTrip.vendorId);
      if (tripVendor && arrivalNotified.current !== activeTrip.vendorId) {
        const distance = getDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          tripVendor.exact_location.latitude,
          tripVendor.exact_location.longitude
        ) * 1000;

        if (distance <= 50) { // Within 50m
          triggerArrivalNotification(tripVendor.business_name, tripVendor.id);
          arrivalNotified.current = activeTrip.vendorId;
        }
      }
    } else if (!activeTrip) {
      arrivalNotified.current = null;
    }

    // ─── 2. Discovery Logic (Boosted Vendors) ──────────────────────────────────
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
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "VEND Discovery! 💎",
          body: `You've been near ${vendorName} for a while. Tap to see their local specialties!`,
          data: { vendorId },
        },
        trigger: null, // send immediately
      });
    } catch (error) {
      console.warn('[ProximityEngine] Failed to schedule local notification. Continuing without notification.', error);
    }
  };

  const triggerArrivalNotification = async (vendorName: string, vendorId: string) => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You've Arrived! 📍",
          body: `You are at ${vendorName}. Verify your visit to earn 100 VEND points!`,
          data: { vendorId },
        },
        trigger: null,
      });
    } catch (error) {
      // Fail silently
    }
  };
};
