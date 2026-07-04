import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';

interface PrivacyPolicyScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({
  onAccept,
  onDecline,
}) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <VText
          variant="h1"
          color={theme.colors.primary}
          style={styles.title}
        >
          Privacy Policy
        </VText>

        <VText variant="body" color={theme.colors.textMuted} style={styles.date}>
          Last updated: July 2026
        </VText>

        {/* Content */}
        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            1. Information We Collect
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            We collect personal information you provide to us, including but not limited to:
            {'\n\n'}
            • Name and phone number
            {'\n'}• Location data (when location services enabled)
            {'\n'}• Camera/photo uploads
            {'\n'}• Chat messages and communications
            {'\n'}• Transaction history
            {'\n'}• Device information and usage patterns
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            2. How We Use Your Information
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            Your information is used to:
            {'\n\n'}
            • Provide and improve our services
            {'\n'}• Send notifications about vendors and offers
            {'\n'}• Process transactions
            {'\n'}• Personalize your experience
            {'\n'}• Comply with legal obligations
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            3. Data Security
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. For your protection, do not share sensitive information over unsecured connections.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            4. Your Privacy Rights
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            You have the right to:
            {'\n\n'}
            • Access your personal data
            {'\n'}• Request correction of inaccurate data
            {'\n'}• Request deletion of your data
            {'\n'}• Export your data
            {'\n\n'}
            To exercise these rights, contact us at privacy@vend.app
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            5. Third-Party Services
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            We use third-party services (Supabase, Expo, etc.) which may collect data according to their privacy policies. We are not responsible for third-party data practices.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            6. Contact Us
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            For privacy questions or data requests:
            {'\n\n'}
            Email: privacy@vend.app
            {'\n'}
            Phone: +234 700 000 0000
          </VText>
        </View>

        {/* Acceptance Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
          accessibilityLabel="Accept privacy policy"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
        >
          <View
            style={[
              styles.checkbox,
              accepted && styles.checkboxChecked,
            ]}
          >
            {accepted && (
              <Ionicons
                name="checkmark"
                size={16}
                color="#FFFFFF"
              />
            )}
          </View>
          <VText variant="body" color={theme.colors.textMain} style={styles.checkboxLabel}>
            I have read and accept the Privacy Policy
          </VText>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <VButton
          title="Decline"
          onPress={onDecline}
          variant="secondary"
          disabled={false}
          style={styles.button}
        />
        <VButton
          title="Accept & Continue"
          onPress={onAccept}
          variant="primary"
          disabled={!accepted}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

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
  },
  title: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    marginBottom: normalize(8),
  },
  date: {
    fontSize: normalize(12),
    marginBottom: normalize(24),
  },
  section: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  sectionText: {
    fontSize: normalize(14),
    lineHeight: normalize(22),
    color: theme.colors.textMain,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(24),
    marginBottom: normalize(24),
    paddingVertical: normalize(12),
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(4),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: normalize(14),
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: normalize(16),
    gap: normalize(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  button: {
    flex: 1,
  },
});

