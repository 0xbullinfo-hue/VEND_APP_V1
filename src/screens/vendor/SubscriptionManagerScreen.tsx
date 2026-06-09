import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, Image, TextInput } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionManagerScreenProps {
  onBack: () => void;
}

export const SubscriptionManagerScreen: React.FC<SubscriptionManagerScreenProps> = ({ onBack }) => {
  const { vendors, locality, updateVendorSubscription, addPoints } = useApp();
  
  // Hardcoded for vendor v1 demo details
  const vendor = vendors.find(v => v.id === 'v1') || vendors[0];

  const [activeModal, setActiveModal] = useState<'paystack' | 'web3' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Paystack input states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Web3 state
  const [walletConnected, setWalletConnected] = useState(false);

  const userCount = locality?.registered_users_count || 942;
  const isMilestoneCleared = userCount >= 1000;

  const handlePaystackSubmit = () => {
    if (cardNumber.length < 16 || expiry.length < 4 || cvv.length < 3) {
      alert("Please fill in valid payment credentials");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateVendorSubscription(vendor.id, 2); // Update subscription to tier 2 (Boosted)
      addPoints(50); // reward points
      setActiveModal(null);
    }, 2000);
  };

  const handleConnectWallet = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setWalletConnected(true);
    }, 1500);
  };

  const handleSignTransaction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateVendorSubscription(vendor.id, 3); // Update subscription to tier 3 (Web3 Pro)
      addPoints(100); // reward points
      setActiveModal(null);
      setWalletConnected(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <HeaderBar showBack={true} onBack={onBack} title="Vendor Pro Hub" showPoints={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Locality Milestones Status Box */}
        <View style={[styles.milestoneBox, isMilestoneCleared ? styles.milestonePassed : styles.milestoneLocked]}>
          <View style={styles.milestoneHeader}>
            <Ionicons 
              name={isMilestoneCleared ? "checkmark-circle" : "lock-closed"} 
              size={20} 
              color={isMilestoneCleared ? theme.colors.primary : theme.colors.danger} 
            />
            <VText variant="h3" color={isMilestoneCleared ? theme.colors.primary : theme.colors.danger} style={{ marginLeft: 8 }}>
              {isMilestoneCleared ? 'Milestone Active: Paid Tiers Unlocked' : 'Locality Milestones Check'}
            </VText>
          </View>
          
          <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4, lineHeight: 14 }}>
            Paid advertising subscriptions are locked until your LGA/Ward registers at least 1,000 customers. This ensures advertisement value.
          </VText>

          <View style={styles.milestoneProgressRow}>
            <VText variant="h2">{locality?.name || 'Yaba'}: {userCount} / 1,000 Users</VText>
            <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '800' }}>
              {isMilestoneCleared ? '100% Unlocked' : '94% Locked'}
            </VText>
          </View>

          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, (userCount / 1000) * 100)}%`,
                  backgroundColor: isMilestoneCleared ? theme.colors.primary : theme.colors.danger 
                }
              ]} 
            />
          </View>

          {!isMilestoneCleared && (
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={14} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ flex: 1, marginLeft: 6 }}>
                Tip: You can switch your locality to "Ikeja / GRA" in settings to test the unlocked Paystack and WalletConnect interfaces!
              </VText>
            </View>
          )}
        </View>

        {/* 3-Tier subscription card options */}
        <VText variant="h2" style={styles.sectionTitle}>Choose Your Plan</VText>
        
        {/* Tier 1: Free */}
        <View style={[styles.planCard, vendor.subscription_tier === 1 && styles.planActive, theme.shadows.soft]}>
          <View style={styles.planHeader}>
            <VText variant="h3">Tier 1: Free Explorer</VText>
            <VText variant="caption" color={theme.colors.primary}>FREE (3 MONTHS)</VText>
          </View>
          <VText variant="caption" color={theme.colors.textMuted} style={styles.planDesc}>
            Standard maps pinpoint listing. Basic search placement. Includes 1 service listing capability.
          </VText>
          {vendor.subscription_tier === 1 ? (
            <View style={styles.activeLabel}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '800' }}>
                CURRENT ACTIVE PLAN
              </VText>
            </View>
          ) : (
            <VButton
              title="Downgrade to Free"
              onPress={() => updateVendorSubscription(vendor.id, 1)}
              variant="secondary"
              style={styles.planActionBtn}
            />
          )}
        </View>

        {/* Tier 2: Boosted */}
        <View style={[
          styles.planCard, 
          vendor.subscription_tier === 2 && styles.planActive, 
          !isMilestoneCleared && styles.planLockedCard,
          theme.shadows.soft
        ]}>
          {!isMilestoneCleared && (
            <View style={styles.cardLockOverlay}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>LOCKED BY LGA MILESTONE</VText>
            </View>
          )}

          <View style={styles.planHeader}>
            <VText variant="h3">Tier 2: Premium Boosted Pin</VText>
            <VText variant="caption" color={theme.colors.primary}>N5,000 / MONTH</VText>
          </View>
          <VText variant="caption" color={theme.colors.textMuted} style={styles.planDesc}>
            Pulsing golden/teal pin marker on map. Top category search placement priority. Up to 10 service listings.
          </VText>
          
          {vendor.subscription_tier === 2 ? (
            <View style={styles.activeLabel}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '800' }}>
                CURRENT ACTIVE PLAN
              </VText>
            </View>
          ) : (
            <VButton
              title="Activate Boosted (Paystack)"
              onPress={() => isMilestoneCleared && setActiveModal('paystack')}
              disabled={!isMilestoneCleared}
              style={styles.planActionBtn}
            />
          )}
        </View>

        {/* Tier 3: Web3 Pro */}
        <View style={[
          styles.planCard, 
          vendor.subscription_tier === 3 && styles.planActive, 
          !isMilestoneCleared && styles.planLockedCard,
          theme.shadows.soft
        ]}>
          {!isMilestoneCleared && (
            <View style={styles.cardLockOverlay}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>LOCKED BY LGA MILESTONE</VText>
            </View>
          )}

          <View style={styles.planHeader}>
            <VText variant="h3">Tier 3: Web3 Pro Merchant</VText>
            <VText variant="caption" color={theme.colors.primary}>5 VEND TOKENS</VText>
          </View>
          <VText variant="caption" color={theme.colors.textMuted} style={styles.planDesc}>
            Premium maps pin marker. Unlocks customer analytics tracking. Integrated Web3 client payments using VEND tokens.
          </VText>
          
          {vendor.subscription_tier === 3 ? (
            <View style={styles.activeLabel}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '800' }}>
                CURRENT ACTIVE PLAN
              </VText>
            </View>
          ) : (
            <VButton
              title="Activate Pro (Wallet Connect)"
              onPress={() => isMilestoneCleared && setActiveModal('web3')}
              disabled={!isMilestoneCleared}
              style={styles.planActionBtn}
            />
          )}
        </View>

      </ScrollView>

      {/* Paystack Checkout Gateway Modal */}
      <Modal
        visible={activeModal === 'paystack'}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <View style={styles.paystackHeader}>
              <Ionicons name="card" size={22} color={theme.colors.primary} />
              <VText variant="h2" style={{ marginLeft: 8 }}>Paystack Checkout</VText>
            </View>
            <VText variant="caption" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.lg }}>
              Complete security payment for N5,000 monthly VEND Boost plan.
            </VText>

            {/* Inputs */}
            <VInput
              placeholder="Card Number (16 Digits)"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              icon="card-outline"
              maxLength={16}
              style={{ marginBottom: theme.spacing.sm }}
            />

            <View style={styles.expiryRow}>
              <VInput
                placeholder="MM/YY"
                value={expiry}
                onChangeText={setExpiry}
                keyboardType="numeric"
                icon="calendar-outline"
                maxLength={4}
                style={{ flex: 1 }}
              />
              <VInput
                placeholder="CVV"
                value={cvv}
                onChangeText={setCvv}
                keyboardType="numeric"
                icon="lock-closed-outline"
                maxLength={3}
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>

            <View style={styles.modalBtns}>
              <VButton
                title="Cancel"
                onPress={() => setActiveModal(null)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <VButton
                title="Pay N5,000"
                onPress={handlePaystackSubmit}
                loading={loading}
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Wallet Connect Web3 Modal */}
      <Modal
        visible={activeModal === 'web3'}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium, { alignItems: 'center' }]}>
            <Ionicons name="wallet" size={32} color={theme.colors.primary} style={{ marginBottom: theme.spacing.sm }} />
            <VText variant="h2" style={{ marginBottom: theme.spacing.xs }}>WalletConnect</VText>
            <VText variant="caption" color={theme.colors.textMuted} align="center" style={{ marginBottom: theme.spacing.xl }}>
              Authorize transaction of 5 VEND Tokens on Ethereum Mainnet.
            </VText>

            {!walletConnected ? (
              // Connect wallet state
              <View style={styles.web3Center}>
                <View style={styles.qrMockBox}>
                  {/* Render simulated Web3 connection QR code */}
                  <Ionicons name="qr-code" size={normalize(120)} color={theme.colors.primary} />
                </View>
                <VText variant="caption" color={theme.colors.textMuted} align="center" style={{ marginVertical: theme.spacing.md }}>
                  Scan QR inside MetaMask, Trust Wallet, or Phantom to connect.
                </VText>

                <View style={styles.modalBtns}>
                  <VButton
                    title="Cancel"
                    onPress={() => setActiveModal(null)}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <VButton
                    title="Simulate Connect"
                    onPress={handleConnectWallet}
                    loading={loading}
                    style={{ flex: 1, marginLeft: theme.spacing.sm }}
                  />
                </View>
              </View>
            ) : (
              // Connected wallet sign transaction state
              <View style={styles.web3Center}>
                <View style={styles.walletDetailsBox}>
                  <Ionicons name="shield-checkmark" size={24} color={theme.colors.accent} />
                  <VText variant="h3" color={theme.colors.accent} style={{ marginTop: 4 }}>Wallet Connected</VText>
                  <VText variant="caption" color={theme.colors.textMuted}>Address: 0x71C...8e9A</VText>
                </View>

                <View style={styles.modalBtns}>
                  <VButton
                    title="Disconnect"
                    onPress={() => setWalletConnected(false)}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <VButton
                    title="Sign & Approve (5 VEND)"
                    onPress={handleSignTransaction}
                    loading={loading}
                    style={{ flex: 1, marginLeft: theme.spacing.sm }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  milestoneBox: {
    padding: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1.5,
    marginBottom: theme.spacing.xl,
  },
  milestonePassed: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  milestoneLocked: {
    backgroundColor: '#FFF5F5', // soft red backdrop for locked alerts
    borderColor: theme.colors.danger,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: theme.spacing.md,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  
  // Plans list
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  planCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  planActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  planDesc: {
    lineHeight: 14,
    marginBottom: theme.spacing.md,
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  planActionBtn: {
    height: normalize(38),
    borderRadius: 8,
  },
  planLockedCard: {
    opacity: 0.6,
  },
  cardLockOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 2,
  },
  
  // Checkout Modal Layout
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: theme.spacing.xl,
  },
  paystackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  modalBtns: {
    flexDirection: 'row',
  },
  
  // Web3 modal layout
  web3Center: {
    width: '100%',
    alignItems: 'center',
  },
  qrMockBox: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: normalize(12),
  },
  walletDetailsBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
});
