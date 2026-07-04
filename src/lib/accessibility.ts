/**
 * Accessibility Utilities
 *
 * Helper functions for implementing accessibility features across the app:
 * - Screen reader support (VoiceOver, TalkBack)
 * - Semantic labels and roles
 * - Touch target sizing
 * - Color contrast
 */

import { AccessibilityRole, AccessibilityActionEvent } from 'react-native';

// ─── Accessibility Labels ────────────────────────────────────────────────────

export const a11yLabels = {
  // Navigation
  navHome: 'Home tab. Shows nearby vendors and services.',
  navExplore: 'Explore tab. Browse vendors by category.',
  navRewards: 'Rewards tab. View points and redeem rewards.',
  navProfile: 'Profile tab. Manage your account.',

  // Actions
  btnBack: 'Back button. Returns to previous screen.',
  btnClose: 'Close button. Closes this modal or menu.',
  btnMenu: 'Menu button. Opens additional options.',
  btnSearch: 'Search button. Find vendors and services.',
  btnFilter: 'Filter button. Refine search results.',
  btnSort: 'Sort button. Change result sorting order.',

  // Common
  btnSubmit: 'Submit button. Sends the form.',
  btnCancel: 'Cancel button. Discards changes.',
  btnSave: 'Save button. Saves changes.',
  btnDelete: 'Delete button. Permanently removes this item.',
  btnEdit: 'Edit button. Modify this item.',

  // Location & Directions
  btnLocation: 'Location button. Share your location.',
  btnDirections: 'Directions button. Get route to vendor.',
  btnMap: 'Map button. View vendor location on map.',

  // Payment & Cards
  btnPay: 'Pay button. Proceed to payment.',
  btnAddCard: 'Add payment card button.',
  btnRemoveCard: 'Remove payment card button.',

  // Chat & Messages
  btnSendMessage: 'Send message button.',
  inputMessage: 'Message input field. Type your message here.',

  // Rating & Review
  inputReview: 'Review text field. Write your review here.',
  btnSubmitReview: 'Submit review button.',
  btnRate: 'Rate vendor button.',
  starsRating: 'Star rating. Tap to rate.',

  // Notifications
  btnNotifications: 'Notifications button. View alerts.',
  badge: 'Badge indicating new notifications.',
};

// ─── Semantic Label Helpers ────────────────────────────────────────────────

/**
 * Generate accessible label for a button with count
 * Example: "5 new messages" for message button
 */
export function getCountLabel(label: string, count: number): string {
  if (count === 0) return label;
  if (count === 1) return `${label}, 1 new`;
  return `${label}, ${count} new`;
}

/**
 * Generate accessible label for rating
 * Example: "4.5 stars out of 5"
 */
export function getRatingLabel(rating: number, maxRating: number = 5): string {
  return `${rating} stars out of ${maxRating}`;
}

/**
 * Generate accessible label for price
 * Example: "Price: 5000 Naira"
 */
export function getPriceLabel(price: number, currency: string = 'Naira'): string {
  return `Price: ${price.toLocaleString()} ${currency}`;
}

/**
 * Generate accessible label for distance
 * Example: "2.5 kilometers away"
 */
export function getDistanceLabel(distance: number): string {
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} meters away`;
  }
  return `${distance.toFixed(1)} kilometers away`;
}

/**
 * Generate accessible label for time
 * Example: "Open until 10 PM"
 */
export function getHoursLabel(closingTime: string, isOpen: boolean): string {
  return isOpen ? `Open until ${closingTime}` : `Closed until ${closingTime}`;
}

/**
 * Generate accessible label for list item count
 * Example: "3 items in list"
 */
export function getListCountLabel(count: number, itemType: string = 'items'): string {
  if (count === 1) return `1 ${itemType} in list`;
  return `${count} ${itemType} in list`;
}

// ─── Accessibility Roles ──────────────────────────────────────────────────

export const a11yRoles: Record<string, AccessibilityRole> = {
  button: 'button',
  link: 'link',
  text: 'text',
  image: 'image',
  header: 'header',
  tab: 'tab',
  menuitem: 'menuitem',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  search: 'search',
};

// ─── Touch Target Sizing ──────────────────────────────────────────────────

/**
 * Minimum touch target size: 48x48 dp (as per WCAG 2.1 Level AAA)
 * Verify button/interactive component sizes meet this minimum
 */
export const MIN_TOUCH_TARGET = 48;

/**
 * Get minimum style for accessible touch target
 */
export function getAccessibleTouchTargetStyle() {
  return {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
  };
}

// ─── Color Contrast Validation ────────────────────────────────────────────

/**
 * Calculate luminance of a color (WCAG formula)
 * Color should be in hex format: #RRGGBB
 */
export function getLuminance(hexColor: string): number {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  // sRGB formula
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return luminance <= 0.03928
    ? luminance / 12.92
    : Math.pow((luminance + 0.055) / 1.055, 2.4);
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * Returns ratio like 4.5 (needed for Level AA)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verify color contrast meets WCAG Level AA (4.5:1 for normal text)
 */
export function isContrastSufficient(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minimumRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minimumRatio;
}

// ─── Accessibility Hints ──────────────────────────────────────────────────

/**
 * Generate accessible hint for form inputs
 * Helps screen reader users understand expected input
 */
export function getInputHint(inputType: string): string {
  const hints: Record<string, string> = {
    phone: 'Enter a 10-digit phone number starting with 0',
    email: 'Enter a valid email address',
    password: 'Enter a password with at least 8 characters',
    search: 'Search for vendors or services',
    number: 'Enter a number',
    date: 'Enter a date',
    zipcode: 'Enter a zip or postal code',
  };
  return hints[inputType] || 'Enter text';
}

// ─── Screen Reader Announcements ─────────────────────────────────────────

/**
 * Create announcement for screen readers (e.g., "Added to favorites")
 * Should be short and action-oriented
 */
export function createAnnouncement(action: string, subject: string, result?: string): string {
  if (result) {
    return `${subject} ${action}. ${result}`;
  }
  return `${subject} ${action}`;
}

// ─── Status & Availability Labels ────────────────────────────────────────

export const a11yStatusLabels = {
  open: 'Open now',
  closed: 'Closed',
  closingSoon: 'Closing soon',
  comingSoon: 'Coming soon',
  offline: 'Temporarily offline',
  verified: 'Verified vendor',
  newVendor: 'New vendor on VEND',
  trending: 'Trending vendor',
  popular: 'Popular vendor',
};

// ─── Accessibility Testing Helpers ──────────────────────────────────────

/**
 * Check if component has essential accessibility attributes
 * Returns object with missing attributes
 */
export function validateComponentAccessibility(
  hasLabel: boolean,
  hasRole: boolean,
  hasHint?: boolean
): Record<string, boolean> {
  return {
    hasAccessibleLabel: hasLabel,
    hasAccessibleRole: hasRole,
    hasAccessibleHint: hasHint ?? true,
    isAccessible: hasLabel && hasRole,
  };
}

/**
 * Validate that all interactive elements have proper accessibility
 */
export function validateInteractiveElement(
  accessible: Record<string, boolean>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!accessible.hasAccessibleLabel) {
    errors.push('Missing accessible label');
  }
  if (!accessible.hasAccessibleRole) {
    errors.push('Missing accessible role');
  }
  if (accessible.hasAccessibleHint === false) {
    errors.push('Missing helpful hint for input');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
