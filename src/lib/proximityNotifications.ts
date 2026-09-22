export {
  calculateDistance,
  isInVicinity,
  isInSameLocality,
  generateVendorProximityNotification,
  generateCustomerProximityNotification,
  getVendorsInLocality,
  getPreviousCustomersForVendor,
  computeNotificationUrgency,
} from '../core/safety/protocol/proximityNotifications';
export type { ProximityNotification, ProximityContext } from '../core/safety/protocol/proximityNotifications';
