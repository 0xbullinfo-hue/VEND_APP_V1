import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';

interface TermsOfServiceScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onBack?: () => void;
  hideActions?: boolean;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({
  onAccept,
  onDecline,
  onBack,
  hideActions = false
}) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {hideActions && (
        <View style={{ padding: theme.spacing.md }}>
          <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>
      )}
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
          Terms of Service
        </VText>

        <VText variant="body" color={theme.colors.textMuted} style={styles.date}>
          Last updated: July 2026
        </VText>

        {/* Content */}
        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            1. Acceptance of Terms
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            By accessing and using VEND, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            2. Use License
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            Permission is granted to temporarily download one copy of the materials (information or software) on VEND's platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            {'\n\n'}
            • Modifying or copying the materials
            {'\n'}• Using the materials for any commercial purpose or for any public display
            {'\n'}• Attempting to reverse engineer any software contained on VEND
            {'\n'}• Removing or altering proprietary notices or labels
            {'\n'}• Transferring the materials to another person
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            3. Disclaimer
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            The materials on VEND's platform are provided on an 'as is' basis. VEND makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            4. Limitations
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            In no event shall VEND or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on VEND.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            5. Accuracy of Materials
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            The materials appearing on VEND could include technical, typographical, or photographic errors. VEND does not warrant that any of the materials on its platform are accurate, complete, or current. VEND may make changes to the materials contained on its platform at any time without notice.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            6. Links
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            VEND has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by VEND of the site. Use of any such linked website is at the user's own risk.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            7. Modifications
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            VEND may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            8. Governing Law
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </VText>
        </View>

        <View style={styles.section}>
          <VText variant="h3" color={theme.colors.textMain} style={styles.sectionTitle}>
            9. User Responsibilities
          </VText>
          <VText variant="body" color={theme.colors.textMain} style={styles.sectionText}>
            You agree to:
            {'\n\n'}
            • Provide accurate and complete information
            {'\n'}• Use the platform only for lawful purposes
            {'\n'}• Not upload malicious content or code
            {'\n'}• Respect the rights and privacy of others
            {'\n'}• Not engage in fraudulent or deceptive practices
          </VText>
        </View>

        {/* Acceptance Checkbox */}
        {!hideActions && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
            accessibilityLabel="Accept terms of service"
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
              I agree to the Terms of Service
            </VText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!hideActions && (
        <View style={styles.buttonContainer}>
          <VButton
            title="Decline"
            onPress={onDecline!}
            variant="secondary"
            disabled={false}
            style={styles.button}
          />
          <VButton
            title="Accept & Continue"
            onPress={onAccept!}
            variant="primary"
            disabled={!accepted}
            style={styles.button}
          />
        </View>
      )}
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


