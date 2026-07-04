/**
 * GDPR Settings Screen
 *
 * Allows users to:
 * - Export their personal data (right to portability)
 * - Delete their account (right to be forgotten)
 * - Manage data privacy preferences
 * - Access compliance information
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VButton, VText } from '../../components/SharedComponents';
import { theme } from '../../theme/designSystem';
import { useErrorTracking } from '../../hooks/useErrorTracking';
import { exportUserData, shareExportedData } from '../../lib/gdprDataExport';
import {
  createDeletionRequest,
  confirmDeletion,
  executeAccountDeletion,
  cancelDeletion,
} from '../../lib/gdprAccountDeletion';
import { useAuthStore } from '../../store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────

interface GDPRSettingsScreenProps {
  navigation: any;
}

type ExportFormat = 'json' | 'csv';
type ScreenState = 'menu' | 'exporting' | 'deleting' | 'confirming_deletion';

// ─── Component ────────────────────────────────────────────────────────────

export const GDPRSettingsScreen: React.FC<GDPRSettingsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { trackError, trackAction } = useErrorTracking({
    componentName: 'GDPRSettingsScreen',
  });

  // User info
  const userId = useAuthStore((state: any) => state.user?.id);

  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('menu');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletionRequestId, setDeletionRequestId] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<string>('pending');

  // ─── Data Export Handlers ──────────────────────────────────────────────

  const handleExportData = async (format: ExportFormat) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsProcessing(true);
      setScreenState('exporting');
      trackAction('data_export_started', { format });

      // Export user data
      const filePath = await exportUserData(userId, {
        format,
        includeMetadata: true,
        includeSensitiveData: false,
      });

      trackAction('data_export_completed', { format, filePath });

      // Ask user if they want to share
      Alert.alert(
        'Export Successful',
        'Your data has been exported. Would you like to share it?',
        [
          {
            text: 'Cancel',
            onPress: () => setScreenState('menu'),
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await shareExportedData(filePath);
                trackAction('data_export_shared');
              } catch (error) {
                trackError(error as Error, 'share_export');
              } finally {
                setScreenState('menu');
              }
            },
          },
        ]
      );
    } catch (error) {
      trackError(error as Error, 'export_data');
      Alert.alert('Export Failed', (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Account Deletion Handlers ─────────────────────────────────────────

  const handleStartDeletion = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.alert(
      'Delete Account?',
      'This action cannot be undone. You will lose all your data and cannot recover your account.\n\nPlease confirm you want to proceed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              trackAction('account_deletion_started');

              // Create deletion request
              const request = await createDeletionRequest(userId, 'user_request');
              setDeletionRequestId(request.id);
              setScreenState('confirming_deletion');

              // Notify user to check for confirmation code
              Alert.alert(
                'Verification Required',
                'A verification code has been sent to your registered phone number. Please enter it to confirm account deletion.'
              );

              trackAction('deletion_confirmation_code_sent');
            } catch (error) {
              trackError(error as Error, 'start_deletion');
              Alert.alert('Error', (error as Error).message);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmDeletion = async () => {
    if (!userId || !deletionRequestId || !confirmationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setIsProcessing(true);

      // Confirm deletion
      await confirmDeletion(deletionRequestId, confirmationCode, userId);
      trackAction('deletion_confirmed');

      // Execute deletion
      setDeletionStatus('processing');
      await executeAccountDeletion(userId, deletionRequestId);

      trackAction('account_deletion_completed');

      // Logout and navigate
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Logout and navigate to login
              useAuthStore.getState().logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      trackError(error as Error, 'confirm_deletion');
      Alert.alert('Verification Failed', (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!userId || !deletionRequestId) {
      return;
    }

    try {
      await cancelDeletion(deletionRequestId, userId);
      trackAction('deletion_cancelled');
      setScreenState('menu');
      setDeletionRequestId(null);
      setConfirmationCode('');
      Alert.alert('Cancelled', 'Account deletion has been cancelled.');
    } catch (error) {
      trackError(error as Error, 'cancel_deletion');
      Alert.alert('Error', (error as Error).message);
    }
  };

  // ─── Render: Menu State ────────────────────────────────────────────────

  if (screenState === 'menu') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <VText style={styles.title}>Privacy & Data</VText>
          <VText style={styles.subtitle}>
            Manage your personal data and privacy preferences
          </VText>

          {/* Data Export Section */}
          <View style={styles.section}>
            <VText style={styles.sectionTitle}>Export Your Data</VText>
            <VText style={styles.sectionDescription}>
              Download a copy of your personal data in machine-readable format
            </VText>

            <VButton
              title="Export as JSON"
              onPress={() => handleExportData('json')}
              style={styles.button}
            />

            <VButton
              title="Export as CSV"
              onPress={() => handleExportData('csv')}
              style={styles.button}
            />
          </View>

          {/* Privacy Information */}
          <View style={styles.section}>
            <VText style={styles.sectionTitle}>Your Privacy Rights</VText>

            <View style={styles.infoBox}>
              <VText style={styles.infoTitle}>📋 Right to Access</VText>
              <VText style={styles.infoText}>
                You can request and download all your personal data.
              </VText>
            </View>

            <View style={styles.infoBox}>
              <VText style={styles.infoTitle}>📦 Right to Portability</VText>
              <VText style={styles.infoText}>
                You can export your data in a structured, machine-readable format.
              </VText>
            </View>

            <View style={styles.infoBox}>
              <VText style={styles.infoTitle}>🗑️ Right to Deletion</VText>
              <VText style={styles.infoText}>
                You can request permanent deletion of your account and data.
              </VText>
            </View>
          </View>

          {/* Account Deletion Section */}
          <View style={[styles.section, styles.dangerSection]}>
            <VText style={styles.sectionTitle}>Delete Account</VText>
            <VText style={styles.sectionDescription}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </VText>

            <VButton
              title="Delete My Account"
              onPress={handleStartDeletion}
              style={styles.dangerButton}
            />
          </View>

          {/* GDPR Information */}
          <View style={styles.section}>
            <VText style={styles.sectionTitle}>GDPR Compliance</VText>
            <VText style={styles.gdprText}>
              This app complies with the EU General Data Protection Regulation (GDPR). For more
              information, please review our Privacy Policy.
            </VText>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Render: Confirmation State ────────────────────────────────────────

  if (screenState === 'confirming_deletion') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <VText style={styles.title}>Confirm Account Deletion</VText>

          <View style={styles.confirmationBox}>
            <VText style={styles.confirmationText}>
              A verification code has been sent to your registered phone number. Enter the code
              below to confirm account deletion.
            </VText>

            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.colors.textMuted}
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isProcessing}
              accessibilityLabel="Confirmation code input"
            />

            {isProcessing && (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <VText style={styles.processingText}>Deleting account...</VText>
              </View>
            )}

            <VButton
              title="Confirm Deletion"
              onPress={handleConfirmDeletion}
              style={[styles.dangerButton, { opacity: isProcessing ? 0.5 : 1 }]}
            />

            <VButton
              title="Cancel"
              onPress={handleCancelDeletion}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Render: Loading State ────────────────────────────────────────────

  return (
    <View style={[styles.container, styles.loadingContainer]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <VText style={styles.loadingText}>Processing...</VText>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMain,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },

  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerSection: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },

  button: {
    marginVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  dangerButton: {
    marginVertical: 8,
    backgroundColor: theme.colors.danger,
    borderRadius: 8,
  },

  infoBox: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },

  gdprText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  confirmationBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.danger,
  },
  confirmationText: {
    fontSize: 14,
    color: theme.colors.textMain,
    lineHeight: 20,
    marginBottom: 16,
  },

  codeInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    padding: 12,
    marginVertical: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 8,
    color: theme.colors.textMain,
  },

  processingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  processingText: {
    marginTop: 12,
    color: theme.colors.textMain,
  },
});

export default GDPRSettingsScreen;
