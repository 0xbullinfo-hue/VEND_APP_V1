import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Modal, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface QRScannerScreenProps {
  vendorId: string;
  onCancel: () => void;
  onScanSuccess: () => void;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ vendorId, onCancel, onScanSuccess }) => {
  const { vendors, addPoints } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animation value for the handshake/success icon
  const scaleAnim = useState(new Animated.Value(0))[0];

  const vendor = vendors.find(v => v.id === vendorId);

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

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.primary} />
          <VText variant="h2" style={{ marginTop: 20 }}>Camera Access Required</VText>
          <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginVertical: 20, paddingHorizontal: 40 }}>
            VEND needs camera access to scan the vendor's QR code and verify your arrival.
          </VText>
          <VButton title="Grant Permission" onPress={requestPermission} />
          <TouchableOpacity onPress={onCancel} style={{ marginTop: 20 }}>
            <VText variant="subtext" color={theme.colors.textMuted}>Cancel</VText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // In a real app, verify that 'data' matches the vendor's cryptographic QR signature.
    // For this mock, any QR code will trigger success.
    
    // Reward points logic
    addPoints(100); // 100 points for a verified physical visit
    
    setShowSuccess(true);
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

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        
        {/* Scanner Overlay UI */}
        <View style={styles.overlay}>
          <View style={styles.scanTarget}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <VText variant="h3" color="#FFFFFF" style={styles.scanInstruction}>
            Scan {vendor?.business_name}'s QR Code
          </VText>
        </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: normalize(250),
    height: normalize(250),
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanInstruction: {
    marginTop: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  
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
