import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface DirectionRequestScreenProps {
  vendorId: string;
  onBack: () => void;
  onStartTrip: () => void;
}

export const DirectionRequestScreen: React.FC<DirectionRequestScreenProps> = ({
  vendorId,
  onBack,
  onStartTrip
}) => {
  const { vendors, requestDirections, verifyDirectionCode, addPoints } = useApp();
  const vendor = vendors.find(v => v.id === vendorId);

  if (!vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar showBack={true} onBack={onBack} title="Direction Center" />
        <View style={styles.actionBox}>
          <Ionicons name="alert-circle-outline" size={normalize(42)} color={theme.colors.warning} style={{ marginBottom: theme.spacing.sm }} />
          <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.xs }}>
            Vendor Not Found
          </VText>
          <VText variant="body" align="center" color={theme.colors.textMuted}>
            This vendor is no longer available in your current locality feed.
          </VText>
          <VButton
            title="Back"
            onPress={onBack}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const [handshakeCode, setHandshakeCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isRequested, setIsRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize request sequence
  const handleInitiateRequest = async () => {
    setLoading(true);
    setTimeout(async () => {
      const requestObj = await requestDirections(vendor.id);
      setGeneratedCode(requestObj.code);
      setIsRequested(true);
      setLoading(false);
      addPoints(10); // Reward for initiating a route!
    }, 1200);
  };

  const handleVerifyCodeLocal = () => {
    setErrorMsg('');
    if (!handshakeCode.trim()) {
      setErrorMsg('Please enter the 4-digit code');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const isOk = verifyDirectionCode(vendor.id, handshakeCode.trim());
      if (isOk) {
        setSuccess(true);
      } else {
        setErrorMsg('Invalid verification handshake code. Try again.');
      }
    }, 1200);
  };

  const handleOpenGoogleMaps = () => {
    const lat = vendor.exact_location.latitude;
    const lng = vendor.exact_location.longitude;
    const label = encodeURIComponent(vendor.business_name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });
    
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open external mapping applications.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar showBack={true} onBack={onBack} title="Direction Center" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Vendor mini banner info */}
          <View style={styles.vendorCard}>
            <View style={styles.vendorLeft}>
              <Ionicons name="navigate-circle" size={32} color={theme.colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <VText variant="h3">{vendor.business_name}</VText>
                <VText variant="caption" color={theme.colors.textMuted}>{vendor.category}</VText>
              </View>
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="sparkles" size={10} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>+100 PTS</VText>
            </View>
          </View>

          {!isRequested ? (
            // Initiate route permission confirmation
            <View style={styles.actionBox}>
              <Ionicons name="shield-checkmark-outline" size={normalize(48)} color={theme.colors.primary} style={{ marginBottom: theme.spacing.md }} />
              <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
                Unlock Shop Directions
              </VText>
              <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.xl, lineHeight: 18 }}>
                By initiating this direction request, VEND will create a temporary visit log to ensure safety. This action grants access to driving routing and unlocks the visit code.
              </VText>

              <VButton
                title="Confirm & Unlock Route"
                onPress={handleInitiateRequest}
                loading={loading}
                icon="location-outline"
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            // Verification Code Flow
            <View style={styles.verifyContainer}>
              {success ? (
                // Verified success banner
                <View style={styles.successBox}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={normalize(32)} color={theme.colors.background} />
                  </View>
                  <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
                    Visit Verified!
                  </VText>
                  <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.lg }}>
                    Awesome! Your proximity has been validated and you have earned your visit bonus.
                  </VText>
                  
                  <View style={styles.pointsPill}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <VText variant="h3" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                      +100 PTS
                    </VText>
                  </View>

                  <VButton
                    title="Done"
                    onPress={onBack}
                    style={{ width: '100%' }}
                  />
                </View>
              ) : (
                <View style={styles.handshakeBox}>
                  
                  {/* Outer Map launch utility */}
                  <View style={styles.launchMapCard}>
                    <VText variant="h3">External Google Maps</VText>
                    <VText variant="caption" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.md }}>
                      Launch exact GPS coordinate routing inside Google Maps.
                    </VText>
                    
                    <View style={styles.btnRow}>
                      <VButton
                        title="Google Maps"
                        onPress={handleOpenGoogleMaps}
                        variant="outline"
                        icon="logo-google"
                        style={{ flex: 1 }}
                      />
                      <VButton
                        title="Live Trip Mode"
                        onPress={onStartTrip}
                        icon="navigate"
                        style={{ flex: 1, marginLeft: theme.spacing.sm }}
                      />
                    </View>
                  </View>

                  <View style={styles.codeDivider} />

                  {/* Visit Verification Code Panel */}
                  <VText variant="h2" align="center" style={styles.verifyTitle}>
                    Physical Visit Handshake
                  </VText>
                  <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.verifyDesc}>
                    When you arrive at {vendor.business_name}, verify your visit by entering their confirmation code.
                  </VText>

                  <View style={styles.demoCodeBox}>
                    <VText variant="caption" color={theme.colors.textMuted}>VISIT HANDSHAKE CODE</VText>
                    <VText variant="h1" color={theme.colors.primary} style={styles.codeLarge}>
                      {generatedCode}
                    </VText>
                    <VText variant="caption" color={theme.colors.primary}>Show this to vendor or input their code below</VText>
                  </View>

                  <VInput
                    placeholder="Enter 4-Digit Handshake Code"
                    value={handshakeCode}
                    onChangeText={setHandshakeCode}
                    keyboardType="numeric"
                    icon="key-outline"
                    maxLength={4}
                    style={{ marginBottom: theme.spacing.sm }}
                  />

                  {errorMsg ? (
                    <VText variant="subtext" color={theme.colors.danger} style={styles.errorText}>
                      {errorMsg}
                    </VText>
                  ) : null}

                  <VButton
                    title="Verify Visit Handshake"
                    onPress={handleVerifyCodeLocal}
                    loading={loading}
                    icon="shield-checkmark"
                    style={{ width: '100%', marginTop: theme.spacing.sm }}
                  />

                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  vendorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(40),
  },
  verifyContainer: {
    flex: 1,
  },
  handshakeBox: {},
  launchMapCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    borderRadius: normalize(16),
  },
  btnRow: {
    flexDirection: 'row',
  },
  codeDivider: {
    height: 1.5,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xl,
  },
  verifyTitle: {
    marginBottom: theme.spacing.xs,
  },
  verifyDesc: {
    lineHeight: normalize(18),
    marginBottom: theme.spacing.lg,
  },
  demoCodeBox: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  codeLarge: {
    fontWeight: '900',
    fontSize: normalize(32),
    letterSpacing: 4,
    marginVertical: 4,
  },
  errorText: {
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  
  // Success state styling
  successBox: {
    alignItems: 'center',
    paddingVertical: normalize(40),
  },
  checkCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
