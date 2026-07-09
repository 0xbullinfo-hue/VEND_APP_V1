import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { isSupabaseConfigured } from '../../lib/supabase';

interface PhoneAuthScreenProps {
  onAuthSuccess: (role: 'customer' | 'vendor') => void;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ onAuthSuccess }) => {
  const { sendOtp, verifyOtp } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');

  // Country code support for global expansion
  const [countryCode, setCountryCode] = useState('+234');

  // OTP Flow States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isConfigured = isSupabaseConfigured();
  const expectedOtpLength = isConfigured ? 6 : 4;

  const handleSendOtp = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!phone || phone.length < 8) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }

    const fullPhone = `${countryCode}${phone.startsWith('0') ? phone.slice(1) : phone}`;

    setLoading(true);
    try {
      const res = await sendOtp(fullPhone);
      setLoading(false);
      if (res.success) {
        setIsOtpSent(true);
      } else {
        setErrorMsg(res.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (otpCode.length !== expectedOtpLength) {
      setErrorMsg(`Please enter the ${expectedOtpLength}-digit verification code`);
      return;
    }

    const fullPhone = `${countryCode}${phone.startsWith('0') ? phone.slice(1) : phone}`;

    setLoading(true);
    try {
      const res = await verifyOtp(fullPhone, otpCode, role, name);
      setLoading(false);
      if (res.success) {
        onAuthSuccess(role);
      } else {
        setErrorMsg(res.error || 'Authentication failed, please try again.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Authentication failed, please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header Title */}
          <View style={styles.header}>
            <VText variant="h1" color={theme.colors.primary} style={styles.title}>
              Join the VEND Global Network
            </VText>
            <VText variant="body" color={theme.colors.textMuted}>
              {isOtpSent 
                ? 'We sent a verification code to ' + countryCode + phone
                : 'Sign in to access hyper-local vendors across Africa & the world'}
            </VText>
          </View>

          {/* Form Content */}
          {!isOtpSent ? (
            <View style={styles.form}>
              
              {/* Role Toggle Selector */}
              <VText variant="h3" style={styles.label}>Select Your Account Type</VText>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setRole('customer')}
                  style={[
                    styles.roleOption,
                    role === 'customer' ? styles.roleOptionActive : styles.roleOptionInactive
                  ]}
                >
                  <Ionicons 
                    name="people" 
                    size={20} 
                    color={role === 'customer' ? theme.colors.background : theme.colors.primary} 
                  />
                  <VText 
                    variant="subtext" 
                    color={role === 'customer' ? theme.colors.background : theme.colors.primary}
                    style={{ marginLeft: 8 }}
                  >
                    Customer (Find & Support Locals)
                  </VText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setRole('vendor')}
                  style={[
                    styles.roleOption,
                    role === 'vendor' ? styles.roleOptionActive : styles.roleOptionInactive
                  ]}
                >
                  <Ionicons 
                    name="rocket"
                    size={20} 
                    color={role === 'vendor' ? theme.colors.background : theme.colors.primary} 
                  />
                  <VText 
                    variant="subtext" 
                    color={role === 'vendor' ? theme.colors.background : theme.colors.primary}
                    style={{ marginLeft: 8 }}
                  >
                    Vendor (Scale Your Business)
                  </VText>
                </TouchableOpacity>
              </View>

              {/* Name Input */}
              <VText variant="h3" style={styles.label}>Full Name</VText>
              <VInput
                placeholder="e.g. Chinelo Okoro"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                style={styles.inputSpacing}
              />

              {/* Phone Input with Country Code */}
              <VText variant="h3" style={styles.label}>Phone Number</VText>
              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryCodeBtn}
                  onPress={() => {
                    // Simple toggle for demo: Nigeria -> Ghana -> Kenya -> SA
                    const codes = ['+234', '+233', '+254', '+27'];
                    const nextIndex = (codes.indexOf(countryCode) + 1) % codes.length;
                    setCountryCode(codes[nextIndex]);
                  }}
                >
                  <VText variant="body" style={{ fontWeight: 'bold' }}>{countryCode}</VText>
                  <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <VInput
                    placeholder="801 234 5678"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    icon="phone-portrait-outline"
                    maxLength={10}
                  />
                </View>
              </View>

              {errorMsg ? (
                <VText variant="subtext" color={theme.colors.danger} style={styles.errorText}>
                  {errorMsg}
                </VText>
              ) : null}

              <View style={{ marginTop: theme.spacing.lg }}>
                <VButton
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  loading={loading}
                  icon="mail-unread-outline"
                  style={[styles.actionBtn, theme.shadows.soft]}
                />
              </View>

            </View>
          ) : (
            <View style={styles.form}>
              
              {/* OTP Code Entry */}
              <VText variant="h3" style={styles.label}>{`Enter ${expectedOtpLength}-Digit OTP Code`}</VText>
              <VInput
                placeholder={isConfigured ? "XXXXXX" : "XXXX"}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                icon="key-outline"
                maxLength={expectedOtpLength}
                style={styles.inputSpacing}
              />

              {!isConfigured && (
                <VText variant="caption" align="center" style={styles.otpHelper}>
                  Demo Mode: You can enter any 4-digit code (e.g. 1234) to authorize.
                </VText>
              )}

              {errorMsg ? (
                <VText variant="subtext" color={theme.colors.danger} style={styles.errorText}>
                  {errorMsg}
                </VText>
              ) : null}

              {/* Verify Button */}
              <VButton
                title="Verify & Authenticate"
                onPress={handleVerifyOtp}
                loading={loading}
                icon="shield-checkmark-outline"
                style={[styles.actionBtn, theme.shadows.soft]}
              />


              {/* Reset to Phone screen */}
              <TouchableOpacity 
                onPress={() => setIsOtpSent(false)} 
                style={styles.editPhoneContainer}
              >
                <VText variant="subtext" color={theme.colors.primary} align="center">
                  Edit phone number or change account type
                </VText>
              </TouchableOpacity>

            </View>
          )}

          {/* Verification terms helper */}
          <View style={styles.footerTerms}>
            <VText variant="caption" color={theme.colors.textMuted} align="center">
              By proceeding, you agree to VEND's Terms of Service and Privacy Policy. Standard carrier messaging rates may apply.
            </VText>
          </View>

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
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xl,
  },
  header: {
    marginTop: normalize(20),
    marginBottom: normalize(30),
  },
  title: {
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  form: {
    flex: 1,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  roleContainer: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(48),
    borderRadius: normalize(12),
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1.5,
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleOptionInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primary,
  },
  inputSpacing: {
    marginBottom: theme.spacing.lg,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  countryCodeBtn: {
    height: normalize(48),
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    marginTop: theme.spacing.md,
  },
  otpHelper: {
    marginBottom: theme.spacing.lg,
  },
  editPhoneContainer: {
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  footerTerms: {
    marginTop: normalize(40),
    paddingHorizontal: theme.spacing.md,
  },
});
