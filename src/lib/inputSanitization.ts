/**
 * Input Sanitization & Validation
 *
 * Centralized input validation and sanitization utilities to prevent
 * injection attacks and ensure data integrity.
 */

// ─── Phone Number ─────────────────────────────────────────────────────────────

/**
 * Sanitize and normalize a Nigerian phone number to E.164 format (+234...).
 *
 * Accepts formats:
 *   - 08012345678  → +2348012345678
 *   - 8012345678   → +2348012345678
 *   - +2348012345678 (passthrough)
 *   - 2348012345678  → +2348012345678
 *
 * Returns null if the phone number is invalid.
 */
export function sanitizePhoneNumber(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Strip everything except digits and leading +
  const stripped = input.replace(/[^\d+]/g, '');

  // Remove all + except leading
  const cleaned = stripped.charAt(0) === '+'
    ? '+' + stripped.slice(1).replace(/\+/g, '')
    : stripped.replace(/\+/g, '');

  let digits: string;

  if (cleaned.startsWith('+234')) {
    digits = cleaned.slice(4); // Remove +234
  } else if (cleaned.startsWith('234') && cleaned.length >= 13) {
    digits = cleaned.slice(3); // Remove 234
  } else if (cleaned.startsWith('0')) {
    digits = cleaned.slice(1); // Remove leading 0
  } else {
    digits = cleaned;
  }

  // Nigerian mobile numbers are 10 digits after country code (without leading 0)
  if (digits.length !== 10) {
    return null;
  }

  // Basic validation: must start with valid Nigerian mobile prefixes
  const validPrefixes = ['70', '80', '81', '90', '91', '70', '71'];
  const prefix = digits.substring(0, 2);
  if (!validPrefixes.includes(prefix)) {
    // Allow it anyway for flexibility — Supabase will validate
    // but log a warning
    if (__DEV__) {
      console.warn(`[InputSanitization] Unusual phone prefix: ${prefix}`);
    }
  }

  return `+234${digits}`;
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
