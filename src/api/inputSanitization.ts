/**
 * Input Sanitization & Validation
 *
 * Centralized input validation and sanitization utilities to prevent
 * injection attacks and ensure data integrity.
 */

// ─── Phone Number ─────────────────────────────────────────────────────────────

/**
 * Sanitize and normalize a global phone number to E.164 format.
 *
 * Accepts various international formats, defaulting to Nigeria (+234) if no prefix is provided
 * and the length matches Nigerian standards.
 */
export function sanitizePhoneNumber(input: string, countryCode = '+234'): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Strip everything except digits and leading +
  const stripped = input.replace(/[^\d+]/g, '');

  // Remove all + except leading
  const cleaned = stripped.charAt(0) === '+'
    ? '+' + stripped.slice(1).replace(/\+/g, '')
    : stripped.replace(/\+/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned.length >= 8 ? cleaned : null;
  }

  // If it starts with 0 and no country code provided in string, assume provided countryCode
  let digits = cleaned;
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Basic length check for global robustness (most mobile numbers are 7-15 digits)
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return `${countryCode}${digits}`;
}

// ─── Text Input ───────────────────────────────────────────────────────────────

/**
 * Sanitize free-text input.
 *
 * - Trims whitespace
 * - Removes null bytes
 * - Strips HTML/script tags
 * - Limits length
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\0/g, '')                      // Remove null bytes
    .replace(/<\/?[^>]+(>|$)/g, '')          // Strip HTML tags
    .replace(/javascript:/gi, '')             // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')              // Remove event handlers
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a business name or user name.
 * More restrictive than general text — no special HTML characters.
 */
export function sanitizeName(input: string, maxLength = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\0/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[<>&"']/g, '')                 // Remove HTML-sensitive characters
    .trim()
    .slice(0, maxLength);
}

// ─── Search Query ─────────────────────────────────────────────────────────────

/**
 * Sanitize a search query for use with Supabase text search.
 *
 * Note: The Supabase JS client already parameterizes queries,
 * so SQL injection via `.eq()`, `.ilike()` etc. is not possible.
 * This sanitization is defense-in-depth.
 */
export function sanitizeSearchQuery(input: string, maxLength = 200): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\0/g, '')
    .replace(/[;'"\\]/g, '')                 // Remove SQL-sensitive characters
    .replace(/<\/?[^>]+(>|$)/g, '')          // Strip HTML tags
    .trim()
    .slice(0, maxLength);
}

// ─── OTP Code ─────────────────────────────────────────────────────────────────

/**
 * Validate and sanitize an OTP code.
 *
 * Supabase default OTP is 6 digits.
 * Mock mode uses 4 digits.
 */
export function validateOtpCode(input: string, expectedLength = 6): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const digitsOnly = input.replace(/\D/g, '');

  if (digitsOnly.length !== expectedLength) {
    return null;
  }

  return digitsOnly;
}

/**
 * Check if input looks like a valid OTP (4 or 6 digits).
 */
export function isValidOtpFormat(input: string): boolean {
  const digitsOnly = input.replace(/\D/g, '');
  return digitsOnly.length === 4 || digitsOnly.length === 6;
}

// ─── General Validators ───────────────────────────────────────────────────────

/**
 * Validate email format (basic check).
 */
export function isValidEmail(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input.trim());
}

/**
 * Check if a string contains potentially dangerous content.
 */
export function containsUnsafeContent(input: string): boolean {
  if (!input) return false;

  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}
