import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Modal, TouchableOpacity } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface ReferralCodeScreenProps {
  onContinue: () => void;
}

export const ReferralCodeScreen: React.FC<ReferralCodeScreenProps> = ({ onContinue }) => {
  const { addPoints } = useApp();
  const [code, setCode] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!code.trim()) {
      onContinue();
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Give points to user!
      addPoints(50);
      setShowOverlay(true);
    }, 1000);
  };

  const handleOverlayClose = () => {
    setShowOverlay(false);
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <VText variant="h1" color={theme.colors.primary} style={styles.title}>
            Have a Referral Code?
          </VText>
          <VText variant="body" color={theme.colors.textMuted}>
            Enter your referral code below to claim a 50 VEND points welcome bonus instantly.
          </VText>
        </View>

        {/* Input area */}
        <View style={styles.formContainer}>
          <VText variant="h3" style={styles.label}>Referral Code (Optional)</VText>
          <VInput
            placeholder="e.g. VEND50"
            value={code}
            onChangeText={setCode}
            icon="gift-outline"
            style={styles.inputSpacing}
          />
        </View>

        {/* Navigation & Controls */}
        <View style={styles.buttonWrapper}>
          <VButton
            title={code.trim() ? "Apply Code" : "Skip & Continue"}
            onPress={handleSubmit}
            loading={loading}
            icon={code.trim() ? "checkmark" : "chevron-forward-outline"}
            style={theme.shadows.soft}
          />
        </View>

      </View>

      {/* Success Modal Overlay */}
      <Modal
        visible={showOverlay}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={normalize(32)} color={theme.colors.primary} />
            </View>
            
            <VText variant="h2" align="center" style={styles.modalTitle}>
              Bonus Unlocked!
            </VText>
            
            <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.modalDesc}>
              You have successfully claimed your welcome bonus. +50 VEND points have been credited to your wallet balance.
            </VText>

            <View style={styles.pointsPill}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <VText variant="h3" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                50 PTS
              </VText>
            </View>

            <VButton
              title="Continue"
              onPress={handleOverlayClose}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xl,
  },
  header: {
    marginTop: normalize(20),
  },
  title: {
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  inputSpacing: {
    marginBottom: theme.spacing.lg,
  },
  buttonWrapper: {
    marginBottom: normalize(10),
  },
  
  // Overlay Styling
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: normalize(20),
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  iconCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    marginBottom: theme.spacing.sm,
  },
  modalDesc: {
    lineHeight: normalize(18),
    marginBottom: theme.spacing.lg,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 20,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.2)',
  },
});
