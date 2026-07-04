import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme, normalize } from '../theme/designSystem';
import { VText, VButton } from './SharedComponents';
import { Ionicons } from './VIcons';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * ErrorBoundary Component
 * Catches errors in child components and displays a user-friendly error screen
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // In production, you would send this to error reporting service
    // Example: Sentry.captureException(error);

    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback } = this.props;

    // If a custom fallback is provided, use it
    if (hasError && fallback) {
      return fallback(error || new Error('Unknown error'), this.handleReset);
    }

    // Default error UI
    if (hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle"
                size={normalize(80)}
                color={theme.colors.danger}
              />
            </View>

            {/* Error Title */}
            <VText
              variant="h1"
              color={theme.colors.danger}
              style={styles.title}
            >
              Oops! Something went wrong
            </VText>

            {/* Error Description */}
            <VText
              variant="body"
              color={theme.colors.textMuted}
              style={styles.description}
            >
              We encountered an unexpected error. Our team has been notified and is working to fix it.
            </VText>

            {/* Error Details (Dev Only) */}
            {__DEV__ && error && (
              <View style={styles.errorBox}>
                <VText
                  variant="caption"
                  color={theme.colors.danger}
                  style={styles.errorTitle}
                >
                  Error Details:
                </VText>
                <VText
                  variant="caption"
                  color={theme.colors.textMain}
                  style={styles.errorText}
                >
                  {error.message}
                </VText>
              </View>
            )}

            {/* Error Count Warning */}
            {errorCount > 2 && (
              <View style={styles.warningBox}>
                <VText
                  variant="body"
                  color={theme.colors.warning}
                  style={styles.warningText}
                >
                  Multiple errors detected. Please restart the app or contact support.
                </VText>
              </View>
            )}

            {/* Support Info */}
            <View style={styles.supportBox}>
              <VText
                variant="h3"
                color={theme.colors.textMain}
                style={styles.supportTitle}
              >
                Need help?
              </VText>
              <VText
                variant="body"
                color={theme.colors.textMuted}
                style={styles.supportText}
              >
                Email us at support@vend.app or call +234 700 000 0000
              </VText>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <VButton
              title="Try Again"
              onPress={this.handleReset}
              variant="primary"
              disabled={false}
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: normalize(20),
    paddingBottom: normalize(30),
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: normalize(40),
    marginBottom: normalize(24),
  },
  title: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: normalize(12),
  },
  description: {
    fontSize: normalize(16),
    textAlign: 'center',
    marginBottom: normalize(32),
    lineHeight: normalize(24),
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: normalize(8),
    padding: normalize(16),
    marginBottom: normalize(20),
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: normalize(8),
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: normalize(12),
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: normalize(8),
    padding: normalize(16),
    marginBottom: normalize(20),
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    lineHeight: normalize(22),
  },
  supportBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(8),
    padding: normalize(16),
    width: '100%',
    alignItems: 'center',
  },
  supportTitle: {
    fontWeight: 'bold',
    marginBottom: normalize(8),
  },
  supportText: {
    textAlign: 'center',
    lineHeight: normalize(20),
  },
  buttonContainer: {
    padding: normalize(16),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
