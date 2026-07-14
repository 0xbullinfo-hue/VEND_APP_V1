import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  type: string;
}

let cachedNetworkState: NetworkState = {
  isConnected: false,
  type: 'unknown',
};

let listeners: Array<(state: NetworkState) => void> = [];

/**
 * Get the current network connectivity state (cached).
 * For immediate checks during flush operations.
 */
export const getNetworkState = (): NetworkState => {
  return cachedNetworkState;
};

/**
 * Subscribe to network state changes.
 * Returns unsubscribe function.
 */
export const subscribeToNetworkChanges = (
  callback: (state: NetworkState) => void
): (() => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
};

/**
 * Initialize network monitoring on app startup.
 * Should be called once in AppProvider.
 */
export const initializeNetworkMonitoring = async (): Promise<void> => {
  try {
    // Get initial state
    const state = await NetInfo.fetch();
    cachedNetworkState = {
      isConnected: state.isConnected ?? false,
      type: state.type ?? 'unknown',
    };

    // Subscribe to ongoing changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      cachedNetworkState = {
        isConnected: state.isConnected ?? false,
        type: state.type ?? 'unknown',
      };
      listeners.forEach((listener) => listener(cachedNetworkState));
    });

    // Return unsubscribe function (app cleanup)
    return unsubscribe as unknown as Promise<void>;
  } catch (err) {
    // Network detection failed; assume offline to be conservative
    cachedNetworkState = { isConnected: false, type: 'unknown' };
  }
};
