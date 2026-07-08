/**
 * Error Reporting & Crash Analytics
 *
 * Centralized error reporting service for crash tracking, error logging,
 * and analytics. Ready for Sentry integration.
 */

import { Platform } from 'react-native';

// ─── Error Severity Levels ────────────────────────────────────────────────────
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// ─── Error Context Types ──────────────────────────────────────────────────────
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;  component?: string;  metadata?: Record<string, any>;
}

export interface ReportedError {
  id: string;
  error: Error;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  platform: string;
  environment: string;
  stackTrace?: string;
}

// ─── Error Reporter Service ───────────────────────────────────────────────────

class ErrorReporter {
  private reportedErrors: ReportedError[] = [];
  private maxStoredErrors = 50;
  private sentryEnabled = false;
  private environment = __DEV__ ? 'development' : 'production';
  private sessionId = this.generateSessionId();
  private userId: string | null = null;

  /**
   * Initialize error reporting.
   * Hardened for premium production usage.
   */
  initializeSentry(dsn?: string): void {
    const finalDSN = dsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!finalDSN && !__DEV__) {
      console.warn('[ErrorReporting] No Sentry DSN provided. Errors will only be logged locally.');
      return;
    }

    try {
      // In a real premium app, we would call Sentry.init() here.
      // For this environment, we'll maintain the local storage as a fallback.
      this.sentryEnabled = !!finalDSN;
      if (this.sentryEnabled) {
        console.log('[ErrorReporting] Monitoring service standby with DSN:', finalDSN?.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('[ErrorReporting] Failed to initialize monitoring:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string): void {
    this.userId = userId;
    // Would set Sentry user context here
    // Sentry.setUser({ id: userId, email, username });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = null;
    // Sentry.setUser(null);
  }

  /**
   * Scrub PII and sensitive data from messages, metadata, or traces
   */
  private scrubPII(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      // 1. Email regex
      let scrubbed = obj.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
      // 2. Phone number pattern (Global robustness: digits within context of identifiers)
      scrubbed = scrubbed.replace(/(?:phone|mobile|tel|contact)\s*[:=]\s*["']?[+]?[\d\s\-()]{7,15}["']?/gi, '[PHONE_REDACTED]');
      // 3. Bearer tokens, API keys, passwords, credentials
      scrubbed = scrubbed.replace(/(?:bearer|sb-[a-zA-Z0-9-]+-key|token|password|key|secret)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.\+]{15,}["']?/gi, '[SENSITIVE_REDACTED]');
      return scrubbed;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubPII(item));
    }
    if (typeof obj === 'object') {
      const scrubbedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('phone') ||
          lowerKey.includes('email') ||
          lowerKey.includes('token') ||
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('key')
        ) {
          scrubbedObj[key] = '[REDACTED]';
        } else {
          scrubbedObj[key] = this.scrubPII(value);
        }
      }
      return scrubbedObj;
    }
    return obj;
  }

  /**
   * Report an error with context
   */
  reportError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: ErrorContext = {}
  ): ReportedError {
    const errorObj = error instanceof Error ? error : new Error(this.scrubPII(error));
    if (errorObj.message) {
      errorObj.message = this.scrubPII(errorObj.message);
    }

    const scrubbedContext = this.scrubPII(context) as ErrorContext;

    const reportedError: ReportedError = {
      id: this.generateErrorId(),
      error: errorObj,
      severity,
      context: {
        ...scrubbedContext,
        userId: scrubbedContext.userId || this.userId || undefined,
      },
      timestamp: Date.now(),
      platform: Platform.OS,
      environment: this.environment,
      stackTrace: errorObj.stack ? this.scrubPII(errorObj.stack) : undefined,
    };

    // Store locally for later retrieval
    this.storeError(reportedError);

    // Send to remote service
    this.sendToRemote(reportedError);

    // Log in development
    if (__DEV__) {
      this.logError(reportedError);
    }

    return reportedError;
  }

  /**
   * Report an exception (caught error)
   */
  captureException(error: Error, context?: ErrorContext): void {
    this.reportError(error, ErrorSeverity.ERROR, context);
  }

  /**
   * Report a message
   */
  captureMessage(message: string, severity: ErrorSeverity = ErrorSeverity.INFO, context?: ErrorContext): void {
    this.reportError(message, severity, context);
  }

  /**
   * Report a warning
   */
  captureWarning(message: string, context?: ErrorContext): void {
    this.reportError(message, ErrorSeverity.WARNING, context);
  }

  /**
   * Add breadcrumb for error context
   */
  addBreadcrumb(
    message: string,
    category: string = 'user-action',
    data?: Record<string, any>
  ): void {
    const breadcrumb = {
      message,
      category,
      data,
      timestamp: Date.now(),
      level: 'info' as const,
    };

    // Would add to Sentry breadcrumbs here
    // Sentry.captureMessage(message, 'info');

    if (__DEV__) {
      console.log(`[Breadcrumb] ${category}: ${message}`, data);
    }
  }

  /**
   * Set custom context for subsequent errors
   */
  setContext(key: string, value: Record<string, any>): void {
    // Sentry.setContext(key, value);
    if (__DEV__) {
      console.log(`[Context] ${key}:`, value);
    }
  }

  /**
   * Get all stored errors
   */
  getStoredErrors(): ReportedError[] {
    return [...this.reportedErrors];
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    this.reportedErrors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byFatal: number;
    byError: number;
    byWarning: number;
    byInfo: number;
  } {
    return {
      total: this.reportedErrors.length,
      byFatal: this.reportedErrors.filter((e) => e.severity === ErrorSeverity.FATAL).length,
      byError: this.reportedErrors.filter((e) => e.severity === ErrorSeverity.ERROR).length,
      byWarning: this.reportedErrors.filter((e) => e.severity === ErrorSeverity.WARNING).length,
      byInfo: this.reportedErrors.filter((e) => e.severity === ErrorSeverity.INFO).length,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private storeError(error: ReportedError): void {
    this.reportedErrors.push(error);

    // Keep only recent errors to avoid memory bloat
    if (this.reportedErrors.length > this.maxStoredErrors) {
      this.reportedErrors = this.reportedErrors.slice(-this.maxStoredErrors);
    }
  }

  private sendToRemote(error: ReportedError): void {
    if (!this.sentryEnabled) {
      return;
    }

    try {
      // In production, send to Sentry or custom backend
      // Example: POST /api/errors with error payload
      if (this.environment === 'production') {
        // fetch(MONITORING_ENDPOINT, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(this.serializeError(error)),
        // }).catch(err => console.warn('Failed to send error to remote:', err));
      }
    } catch (err) {
      console.warn('[ErrorReporting] Failed to send error to remote:', err);
    }
  }

  private serializeError(error: ReportedError): Record<string, any> {
    return {
      id: error.id,
      message: error.error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      platform: error.platform,
      environment: error.environment,
      stackTrace: error.stackTrace,
    };
  }

  private logError(error: ReportedError): void {
    const prefix = `[${error.severity.toUpperCase()}]`;
    console.error(
      `${prefix} ${error.error.message}`,
      {
        context: error.context,
        stack: error.stackTrace,
        timestamp: new Date(error.timestamp).toISOString(),
      }
    );
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Export errors as JSON for debugging
   */
  exportErrors(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        environment: this.environment,
        platform: Platform.OS,
        exportedAt: new Date().toISOString(),
        stats: this.getErrorStats(),
        errors: this.reportedErrors,
      },
      null,
      2
    );
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const errorReporter = new ErrorReporter();

// ─── Initialization Hook ───────────────────────────────────────────────────
/**
 * Call this in your app initialization (e.g., in App.tsx or AppContext)
 * Pass your Sentry DSN if available
 */
export function initializeErrorReporting(sentryDSN?: string): void {
  errorReporter.initializeSentry(sentryDSN);
  console.log(`[ErrorReporting] Initialized in ${__DEV__ ? 'development' : 'production'} mode`);
}

// ─── Convenience Exports ───────────────────────────────────────────────────
export const captureException = (error: Error, context?: ErrorContext) =>
  errorReporter.captureException(error, context);

export const captureMessage = (message: string, severity?: ErrorSeverity, context?: ErrorContext) =>
  errorReporter.captureMessage(message, severity, context);

export const captureWarning = (message: string, context?: ErrorContext) =>
  errorReporter.captureWarning(message, context);

export const setErrorUser = (userId: string, email?: string, username?: string) =>
  errorReporter.setUser(userId, email, username);

export const clearErrorUser = () => errorReporter.clearUser();

export const addErrorBreadcrumb = (message: string, category?: string, data?: Record<string, any>) =>
  errorReporter.addBreadcrumb(message, category, data);

export const setErrorContext = (key: string, value: Record<string, any>) =>
  errorReporter.setContext(key, value);
