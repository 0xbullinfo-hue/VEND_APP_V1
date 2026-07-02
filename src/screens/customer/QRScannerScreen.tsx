import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Modal, Animated, TextInput } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface QRScannerScreenProps {
  vendorId: string;
  onCancel: () => void;
  onScanSuccess: () => void;
}

/**
 * QRScannerScreen — Simulated Verification Flow
 *
 * The camera-based QR scanner (expo-camera) has been replaced with a
 * simulated presence-verification flow. In production, this will use the
 * device camera via react-native-vision-camera or similar. For the MVP,
 * the vendor shows their 4-digit code on screen and the customer types it in.
 */
export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ vendorId, onCancel, onScanSuccess }) => {
  const { vendors, directionRequests, verifyDirectionCode } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation value for the handshake/success icon
  const scaleAnim = useState(new Animated.Value(0))[0];

  const vendor = vendors.find(v => v.id === vendorId);

  // Find the pending direction request for this vendor to get the code
  const pendingRequest = directionRequests.find(
    r => r.vendorId === vendorId && (r.status === 'pending' || r.status === 'verified')
  );

  useEffect(() => {
    if (showSuccess) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuccess]);

  const handleVerify = () => {
    if (code.length < 4) {
      setError('Please enter the 4-digit code shown by the vendor.');
      return;
    }

    const success = verifyDirectionCode(vendorId, code);
    if (success) {
      setError('');
      setShowSuccess(true);
    } else {
      setError('Incorrect code. Ask the vendor to confirm the 4 digits on their screen.');
    }
  };

  const handleFinish = () => {
    setShowSuccess(false);
    onScanSuccess();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.colors.textMain} />
        </TouchableOpacity>
        <VText variant="h2">Verify Presence</VText>
        <View style={{ width: 40 }} />
      </View>

      {/* Demo mode banner */}
      <View style={styles.demoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
        <VText variant="caption" color={theme.colors.primary}>
          DEMO MODE — Camera scanner coming in production build
        </VText>
      </View>

      {/* Code entry area */}
      <View style={styles.body}>
        {/* Simulated QR viewfinder graphic */}
        <View style={styles.viewfinderBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Ionicons name="qr-code-outline" size={normalize(80)} color={theme.colors.primary} style={{ opacity: 0.25 }} />
        </View>

        <VText variant="h3" align="center" style={{ marginTop: 24, marginBottom: 8 }}>
          Enter Vendor's Code
        </VText>
        <VText variant="body" color={theme.colors.textMuted} align="center" style={{ paddingHorizontal: 32, marginBottom: 24 }}>
          Ask <VText variant="body" color={theme.colors.primary}>{vendor?.business_name || 'the vendor'}</VText> to show
          the 4-digit code on their dashboard, then type it below.
        </VText>

        {/* Show the pending code hint in demo mode */}
        {pendingRequest && (
          <View style={styles.hintBox}>
            <Ionicons name="eye-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
            <VText variant="caption" color={theme.colors.textMuted}>
              Demo hint — code is: <VText variant="caption" color={theme.colors.primary}>{pendingRequest.code}</VText>
            </VText>
          </View>
        )}

        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="_ _ _ _"
          placeholderTextColor={theme.colors.border}
          style={styles.codeInput}
        />

        {error !== '' && (
          <VText variant="caption" color={theme.colors.danger} align="center" style={{ marginTop: 8 }}>
            {error}
          </VText>
        )}

        <VButton
          title="Confirm Visit ✓"
          onPress={handleVerify}
          style={{ marginTop: 24, width: '100%' }}
          disabled={code.length < 4}
        />
      </View>

      {/* Handshake Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.successCard, theme.shadows.premium]}>
            <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
              <Ionicons name="shield-checkmark" size={48} color={theme.colors.background} />
            </Animated.View>

            <VText variant="h1" color={theme.colors.primary} style={{ marginVertical: 10 }}>
              Visit Verified!
            </VText>
            <VText variant="body" align="center" color={theme.colors.textMuted} style={{ paddingHorizontal: 20 }}>
              The secure handshake is complete. You have earned +100 VEND points for supporting a local business!
            </VText>

            <VButton
              title="Leave a Review"
              onPress={handleFinish}
              style={{ width: '100%', marginTop: 30 }}
              icon="star"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    padding: 8,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.15)',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  viewfinderBox: {
    width: normalize(200),
    height: normalize(200),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: theme.colors.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  codeInput: {
    width: '60%',
    height: normalize(64),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: normalize(16),
    textAlign: 'center',
    fontSize: normalize(28),
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: normalize(24),
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: normalize(96),
    height: normalize(96),
    borderRadius: normalize(48),
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
});
