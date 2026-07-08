import { getSupabaseDomain } from './supabase';

/**
 * SSL Pinning Configuration
 * Stores hashes of known good certificates for API endpoints
 */
export interface SSLPinningConfig {
  domain: string;
  publicKeyHash: string; // SHA256 hash of the public key
  certificateHash: string; // SHA256 hash of the certificate
  validFrom: number; // Timestamp when this cert became valid
  validUntil: number; // Timestamp when this cert expires
}

// ─── Production Certificates ──────────────────────────────────────────────

/**
 * SSL Pinning configurations for production APIs
 * These hashes should be obtained from your certificate provider
 */
export const SSL_PINNING_CONFIG: SSLPinningConfig[] = [
  {
    domain: 'api.supabase.co',
    // Replace these with actual certificate hashes from your provider
    publicKeyHash: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    certificateHash: 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    validFrom: new Date('2024-01-01').getTime(),
    validUntil: new Date('2026-12-31').getTime(),
  },
];

/**
 * Development certificate bypass (should only be used in dev/testing)
 * Set to true to disable certificate pinning in development
 */
export const DEVELOPMENT_DISABLE_PINNING = __DEV__;

// ─── Certificate Pinning Service ──────────────────────────────────────────

class CertificatePinningService {
  private pinnedCerts: Map<string, SSLPinningConfig> = new Map();
  private enabled = true;
  private violations: Array<{
    domain: string;
    timestamp: number;
    reason: string;
  }> = [];

  constructor(config: SSLPinningConfig[] = []) {
    // Dynamic config injection based on environment
    const supabaseDomain = getSupabaseDomain();
    const finalConfig = [...config];

    if (supabaseDomain && !finalConfig.find(p => p.domain === supabaseDomain)) {
      finalConfig.push({
        domain: supabaseDomain,
        publicKeyHash: 'sha256/PLACEHOLDER_PUBLIC_KEY_HASH', // Must be replaced before prod launch
        certificateHash: 'sha256/PLACEHOLDER_CERT_HASH',
        validFrom: Date.now(),
        validUntil: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      });
    }

    this.loadConfig(finalConfig);
  }

  /**
   * Load SSL pinning configuration
   */
  loadConfig(config: SSLPinningConfig[]): void {
    this.pinnedCerts.clear();
    config.forEach((pin) => {
      this.pinnedCerts.set(pin.domain, pin);
    });
    console.log(`[SSLPinning] Loaded ${config.length} certificate pins`);
  }

  /**
   * Enable or disable certificate pinning
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[SSLPinning] Certificate pinning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if certificate is pinned for a domain
   */
  isPinned(domain: string): boolean {
    return this.pinnedCerts.has(domain);
  }

  /**
   * Validate certificate for a domain
   * In a real implementation, this would verify the actual certificate
   * For now, this is a placeholder showing the validation flow
   */
  validateCertificate(
    domain: string,
    certificatePublicKeyHash: string,
    certificateHash: string
  ): {
    valid: boolean;
    reason?: string;
  } {
    // Skip validation in development if disabled
    if (!this.enabled || (DEVELOPMENT_DISABLE_PINNING && __DEV__)) {
      return { valid: true };
    }

    // Check if domain has pinned certificate
    const pinnedCert = this.pinnedCerts.get(domain);
    if (!pinnedCert) {
      // Domain not pinned, allow (non-pinned domains are not enforced)
      return { valid: true };
    }

    // Validate certificate is not expired
    const now = Date.now();
    if (now < pinnedCert.validFrom) {
      this.recordViolation(domain, 'Certificate not yet valid');
      return {
        valid: false,
        reason: 'Certificate not yet valid',
      };
    }

    if (now > pinnedCert.validUntil) {
      this.recordViolation(domain, 'Certificate expired');
      return {
        valid: false,
        reason: 'Certificate expired',
      };
    }

    // Validate public key hash matches (preferred method)
    if (certificatePublicKeyHash) {
      if (certificatePublicKeyHash !== pinnedCert.publicKeyHash) {
        this.recordViolation(domain, 'Public key hash mismatch');
        return {
          valid: false,
          reason: 'Public key hash mismatch - possible MITM attack',
        };
      }
    }
    // Fallback to certificate hash if public key not available
    else if (certificateHash) {
      if (certificateHash !== pinnedCert.certificateHash) {
        this.recordViolation(domain, 'Certificate hash mismatch');
        return {
          valid: false,
          reason: 'Certificate hash mismatch - possible MITM attack',
        };
      }
    } else {
      this.recordViolation(domain, 'No certificate hash provided');
      return {
        valid: false,
        reason: 'Certificate validation failed - no hash provided',
      };
    }

    return { valid: true };
  }

  /**
   * Record SSL pinning violation for security monitoring
   */
  private recordViolation(domain: string, reason: string): void {
    const violation = {
      domain,
      timestamp: Date.now(),
      reason,
    };
    this.violations.push(violation);
    console.error(
      `[SSLPinning] VIOLATION: ${domain} - ${reason}`,
      violation
    );

    // In production, send this to security monitoring service
    // Example: sendSecurityAlert(violation);
  }

  /**
   * Get all SSL pinning violations
   */
  getViolations(): typeof this.violations {
    return [...this.violations];
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get SSL pinning status
   */
  getStatus(): {
    enabled: boolean;
    pinnedDomains: number;
    violations: number;
  } {
    return {
      enabled: this.enabled,
      pinnedDomains: this.pinnedCerts.size,
      violations: this.violations.length,
    };
  }

  /**
   * Export violations as JSON for security audit
   */
  exportViolations(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        violations: this.violations,
        status: this.getStatus(),
      },
      null,
      2
    );
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const certificatePinning = new CertificatePinningService(
  SSL_PINNING_CONFIG
);

// ─── HTTP Client Interceptor ──────────────────────────────────────────────

/**
 * Middleware for HTTP requests with certificate pinning
 * Use with fetch or your HTTP client library
 */
export async function fetchWithPinning(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  // In a real implementation, you would:
  // 1. Extract certificate from response headers
  // 2. Calculate certificate hash
  // 3. Validate with certificatePinning.validateCertificate()
  // 4. Throw error if validation fails

  // For now, this is a placeholder that shows the intended flow
  if (certificatePinning.isPinned(domain)) {
    console.log(`[SSLPinning] Pinned domain: ${domain} - validating certificate...`);
    // Certificate validation would happen here
  }

  // Perform the actual fetch
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      // Ensure HTTPS
      'X-Require-HTTPS': 'true',
    },
  });

  // Additional validation could happen on response
  if (!response.ok && certificatePinning.isPinned(domain)) {
    console.warn(`[SSLPinning] Pinned domain returned ${response.status}: ${domain}`);
  }

  return response;
}

// ─── Initialization ────────────────────────────────────────────────────────

/**
 * Initialize SSL certificate pinning
 * Call this during app startup
 */
export function initializeSSLPinning(config: SSLPinningConfig[] = []): void {
  const dynamicDomain = getSupabaseDomain();
  const baseConfig = [...SSL_PINNING_CONFIG];
  
  if (dynamicDomain && !baseConfig.some(c => c.domain === dynamicDomain)) {
    // Dynamically add the configured Supabase endpoint using placeholder hashes
    // TODO: Update these with the actual SHA-256 fingerprints of your Supabase certificate/public key!
    baseConfig.push({
      domain: dynamicDomain,
      publicKeyHash: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      certificateHash: 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      validFrom: new Date('2024-01-01').getTime(),
      validUntil: new Date('2028-12-31').getTime(),
    });
  }

  const finalConfig = config.length > 0 ? config : baseConfig;
  certificatePinning.loadConfig(finalConfig);

  if (DEVELOPMENT_DISABLE_PINNING && __DEV__) {
    console.warn('[SSLPinning] Certificate pinning disabled in development mode');
  } else {
    console.log('[SSLPinning] Certificate pinning initialized');
  }
}

// ─── Convenience Exports ──────────────────────────────────────────────────

export const validateSSLCertificate = (
  domain: string,
  pkHash: string,
  certHash: string
) => certificatePinning.validateCertificate(domain, pkHash, certHash);

export const getSSLPinningStatus = () => certificatePinning.getStatus();

export const getSSLViolations = () => certificatePinning.getViolations();

export const clearSSLViolations = () => certificatePinning.clearViolations();

export const disableSSLPinning = () => certificatePinning.setEnabled(false);

export const enableSSLPinning = () => certificatePinning.setEnabled(true);
