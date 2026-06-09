import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface PhoneAuthScreenProps {
  onAuthSuccess: (role: 'customer' | 'vendor') => void;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ onAuthSuccess }) => {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  
  // OTP Flow States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    // Mock OTP dispatch duration
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
    }, 1200);
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (otpCode.length !== 4) {
      setErrorMsg('Please enter the 4-digit verification code');
      return;
    }
    
    setLoading(true);
    setTimeout(async () => {
      try {
        await login(phone, role, name);
        setLoading(false);
        onAuthSuccess(role);
      } catch (err) {
        setLoading(false);
        setErrorMsg('Authentication failed, please try again.');
      }
    }, 1500);
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
              Welcome to VEND
            </VText>
            <VText variant="body" color={theme.colors.textMuted}>
              {isOtpSent 
                ? 'We sent a verification code to ' + phone
                : 'Sign in to access hyper-local vendors in Nigeria'}
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
                    Customer (Find & Visit)
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
                    name="storefront" 
                    size={20} 
                    color={role === 'vendor' ? theme.colors.background : theme.colors.primary} 
                  />
                  <VText 
                    variant="subtext" 
                    color={role === 'vendor' ? theme.colors.background : theme.colors.primary}
                    style={{ marginLeft: 8 }}
                  >
                    Vendor (Grow Business)
                  </VText>
                </TouchableOpacity>
              </View>

              {/* Name Input */}
              <VText variant="h3" style={styles.label}>Your Name</VText>
              <VInput
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                style={styles.inputSpacing}
              />

              {/* Phone Input */}
              <VText variant="h3" style={styles.label}>Phone Number</VText>
              <VInput
                placeholder="0801 234 5678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="phone-portrait-outline"
                maxLength={11}
                style={styles.inputSpacing}
              />

              {errorMsg ? (
                <VText variant="subtext" color={theme.colors.danger} style={styles.errorText}>
                  {errorMsg}
                </VText>
              ) : null}

              {/* Submit Action */}
              <VButton
                title="Send Verification Code"
                onPress={handleSendOtp}
                loading={loading}
                icon="mail-unread-outline"
                style={[styles.actionBtn, theme.shadows.soft]}
              />

            </View>
          ) : (
            <View style={styles.form}>
              
              {/* OTP Code Entry */}
              <VText variant="h3" style={styles.label}>Enter 4-Digit OTP Code</VText>
              <VInput
                placeholder="XXXX"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                icon="key-outline"
                maxLength={4}
                style={styles.inputSpacing}
              />

              <VText variant="caption" align="center" style={styles.otpHelper}>
                Demo Mode: You can enter any 4-digit code (e.g. 1234) to authorize.
              </VText>

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
                icon="checkmark-shield-outline"
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
