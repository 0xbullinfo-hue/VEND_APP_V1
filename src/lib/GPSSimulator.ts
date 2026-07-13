/**
 * VEND GPS Stress Test Utility
 *
 * This utility simulates a physical user moving towards a vendor destination.
 * It is used to verify the Proximity Engine and Push Notification logic.
 */

import { useLocationStore } from '../store/useLocationStore';

interface SimulationStep {
  latitude: number;
  longitude: number;
  description: string;
}

export const runGPSArrivalSimulation = (destLat: number, destLng: number) => {
  console.log(`[GPS_STRESS_TEST] Starting simulation towards: ${destLat}, ${destLng}`);

  const steps: SimulationStep[] = [
    { latitude: destLat + 0.005, longitude: destLng + 0.005, description: "500m away (Discovery zone)" },
    { latitude: destLat + 0.002, longitude: destLng + 0.002, description: "200m away (Approaching)" },
    { latitude: destLat + 0.0004, longitude: destLng + 0.0004, description: "40m away (Arrival Zone - Expected Notification)" },
    { latitude: destLat, longitude: destLng, description: "At Destination (Handshake ready)" }
  ];

  let currentStep = 0;

  const interval = setInterval(() => {
    if (currentStep >= steps.length) {
      clearInterval(interval);
      console.log(`[GPS_STRESS_TEST] Simulation Complete.`);
      return;
    }

    const step = steps[currentStep];
    console.log(`[GPS_STRESS_TEST] Step ${currentStep + 1}: ${step.description} -> ${step.latitude}, ${step.longitude}`);

    // Inject coordinate into store
    useLocationStore.getState().setCurrentLocation(step.latitude, step.longitude);

    currentStep++;
  }, 4000); // Move every 4 seconds for observation
};
