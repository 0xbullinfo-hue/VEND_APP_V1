/**
 * useErrorTracking Hook
 *
 * Custom hook for tracking errors and user actions within components.
 * Provides convenient error reporting and breadcrumb tracking.
 */

import { useCallback, useEffect } from 'react';
import {
  captureException,
  captureMessage,
  captureWarning,
  addErrorBreadcrumb,
  setErrorContext,
  ErrorSeverity,
} from '../lib/errorReporting';

export interface UseErrorTrackingOptions {
  componentName: string;
  userId?: string;
  feature?: string;
}

/**
 * Hook for error tracking and reporting in components
 *
 * Usage:
 * const { trackError, trackAction, trackWarning } = useErrorTracking({
 *   componentName: 'ProductListScreen',
 *   feature: 'product-browsing',
 * });
 *
 * try {
 *   // some operation
 * } catch (error) {
 *   trackError(error as Error);
 * }
 */
export function useErrorTracking(options: UseErrorTrackingOptions) {
  const { componentName, userId, feature } = options;

  // Initialize component context
  useEffect(() => {
    setErrorContext('component', {
      name: componentName,
      feature,
      userId,
      screenRenderedAt: new Date().toISOString(),
    });

    return () => {
      // Cleanup: could log component unload if needed
      addErrorBreadcrumb(`${componentName} unmounted`, 'component-lifecycle');
    };
  }, [componentName, feature, userId]);

  /**
   * Track and report an error
   */
  const trackError = useCallback(
    (error: Error, actionContext?: string) => {
      const context = {
        component: componentName,
        feature,
        userId,
        action: actionContext,
      };

      captureException(error, context);

      addErrorBreadcrumb(
        `Error in ${componentName}${actionContext ? ` during ${actionContext}` : ''}`,
        'error',
        { message: error.message }
      );
    },
    [componentName, feature, userId]
  );

  /**
   * Track user action for breadcrumb trail
   */
  const trackAction = useCallback(
    (actionName: string, data?: Record<string, any>) => {
      addErrorBreadcrumb(
        `User action: ${actionName}`,
        'user-action',
        data
      );
    },
    []
  );

  /**
   * Track a warning condition
   */
  const trackWarning = useCallback(
    (message: string, data?: Record<string, any>) => {
      captureWarning(message, {
        component: componentName,
        feature,
        userId,
        metadata: data,
      });

      addErrorBreadcrumb(
        `Warning in ${componentName}: ${message}`,
        'warning',
        data
      );
    },
    [componentName, feature, userId]
  );

  /**
   * Track an info message
   */
  const trackInfo = useCallback(
    (message: string, data?: Record<string, any>) => {
      captureMessage(message, ErrorSeverity.INFO, {
        component: componentName,
        feature,
        userId,
        metadata: data,
      });

      addErrorBreadcrumb(
        `Info in ${componentName}: ${message}`,
        'info',
        data
      );
    },
    [componentName, feature, userId]
  );

  return {
    trackError,
    trackAction,
    trackWarning,
    trackInfo,
  };
}
