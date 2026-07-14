import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar, VendorProfilePendingState } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { SUBSCRIPTION_PLANS, MIN_SUBSCRIPTION_TIER } from '../../lib/subscriptionPlans';

interface SubscriptionManagerScreenProps {
  onBack: () => void;
}

export const SubscriptionManagerScreen: React.FC<SubscriptionManagerScreenProps> = ({ onBack }) => {
  const { vendors, myVendorProfile, locality, updateVendorSubscription, addPoints } = useApp();

  // Fall back defensively if a vendor profile somehow isn't linked yet.
  const vendor = myVendorProfile || vendors[0];

  const [activeModal, setActiveModal] = useState<'paystack' | null>(null);
  const [pendingTier, setPendingTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Same unresolved-profile case as ProductManagementScreen/VendorDashboardScreen —
  // without this, `vendor.id`/`vendor.services`/`vendor.subscription_tier` below
  // throw the moment myVendorProfile is null and vendors[] is empty.
  if (!vendor) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <HeaderBar showBack={true} onBack={onBack} title="Vendor Pro Hub" showPoints={false} />
        <VendorProfilePendingState
          title="Setting up your subscription"
          message="Your business profile is still syncing. Please try again in a moment."
          onBack={onBack}
        />
      </View>
    );
  }

  const userCount = locality?.registered_users_count || 942;
  const isMilestoneCleared = userCount >= 1000;

  const openCheckout = (tier: number) => {
    if (!isMilestoneCleared) return;
    setPendingTier(tier);
    setActiveModal('paystack');
  };

  const handlePaystackSubmit = () => {
    if (pendingTier === null) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const success = updateVendorSubscription(vendor.id, pendingTier);
      if (success) {
        addPoints(50); // reward points for upgrading
      }
      setActiveModal(null);
      setPendingTier(null);
    }, 2000);
  };

  const handleDowngrade = (tier: number) => {
    updateVendorSubscription(vendor.id, tier);
  };

  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.tier === pendingTier);

  return (
    <View style={styles.container}>
      <HeaderBar showBack={true} onBack={onBack} title="Vendor Pro Hub" showPoints={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Listing usage summary */}
        <View style={[styles.usageBox, theme.shadows.soft]}>
          <View style={styles.usageHeaderRow}>
            <Ionicons name="pricetags-outline" size={20} color={theme.colors.primary} />
            <VText variant="h3" style={{ marginLeft: 8 }}>Your Listings</VText>
          </View>
          <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
            {vendor.services.length} of {SUBSCRIPTION_PLANS.find(p => p.tier === vendor.subscription_tier)?.maxListings ?? '-'} used on your current plan
          </VText>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, (vendor.services.length / (SUBSCRIPTION_PLANS.find(p => p.tier === vendor.subscription_tier)?.maxListings || 1)) * 100)}%`,
                  backgroundColor: theme.colors.primary,
                }
              ]}
            />
          </View>
        </View>

        {/* Locality Milestones Status Box */}
        <View style={[styles.milestoneBox, isMilestoneCleared ? styles.milestonePassed : styles.milestoneLocked]}>
          <View style={styles.milestoneHeader}>
            <Ionicons
              name={isMilestoneCleared ? "checkmark-circle" : "lock-closed"}
              size={20}
              color={isMilestoneCleared ? theme.colors.primary : theme.colors.danger}
            />
            <VText variant="h3" color={isMilestoneCleared ? theme.colors.primary : theme.colors.danger} style={{ marginLeft: 8 }}>
              {isMilestoneCleared ? 'Milestone Active: Paid Plans Unlocked' : 'Locality Milestones Check'}
            </VText>
          </View>

          <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4, lineHeight: 14 }}>
            Paid plans unlock once your LGA/Ward registers at least 1,000 customers. This ensures advertising value for boosted listings.
          </VText>

          <View style={[styles.milestoneProgressRow, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <VText variant="h2">{locality?.name || 'Yaba'}: {userCount} / 1,000 Users</VText>
            </View>
            <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primaryLight }}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900' }}>
                {isMilestoneCleared ? '100% Unlocked' : `${Math.floor((userCount / 1000) * 100)}% there`}
              </VText>
            </View>
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
                Keep growing your community! Once {locality?.name || 'your locality'} hits 1,000 registered VEND users, paid visibility plans automatically unlock for every vendor there.
              </VText>
            </View>
          )}
        </View>

        {/* Subscription plan cards (data-driven so future tiers can be added in one place) */}
        <VText variant="h2" style={styles.sectionTitle}>Choose Your Plan</VText>

        {SUBSCRIPTION_PLANS.map((plan, index) => {
          const isCurrent = vendor.subscription_tier === plan.tier;
          const isUpgrade = plan.tier > vendor.subscription_tier;
          const isDowngrade = plan.tier < vendor.subscription_tier;
          const isPaidTier = plan.tier > MIN_SUBSCRIPTION_TIER;
          const lockedByMilestone = isPaidTier && !isMilestoneCleared && isUpgrade;

          return (
            <Animated.View
              key={plan.tier}
              entering={SlideInRight.delay(index * 150).duration(600)}
              style={[
                styles.planCard,
                isCurrent && styles.planActive,
                lockedByMilestone && styles.planLockedCard,
                theme.shadows.soft
              ]}
            >
              {lockedByMilestone && (
                <View style={styles.cardLockOverlay}>
                  <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
                  <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>LOCKED BY LGA MILESTONE</VText>
                </View>
              )}

              <View style={styles.planHeader}>
                <VText variant="h3">Tier {plan.tier}: {plan.name}</VText>
                <VText variant="caption" color={theme.colors.primary}>{plan.priceLabel}</VText>
              </View>

              {/* Data-driven feature/perks list */}
              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <VText variant="caption" color={theme.colors.textMuted} style={{ flex: 1 }}>{feature}</VText>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.activeLabel}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '800' }}>
                    CURRENT ACTIVE PLAN
                  </VText>
                </View>
              ) : isUpgrade ? (
                <VButton
                  title={isPaidTier ? `Activate ${plan.name} (Paystack)` : `Switch to ${plan.name}`}
                  onPress={() => isPaidTier ? openCheckout(plan.tier) : handleDowngrade(plan.tier)}
                  disabled={lockedByMilestone}
                  style={styles.planActionBtn}
                />
              ) : isDowngrade ? (
                <VButton
                  title={`Downgrade to ${plan.name}`}
                  onPress={() => handleDowngrade(plan.tier)}
                  variant="secondary"
                  style={styles.planActionBtn}
                />
              ) : null}
            </Animated.View>
          );
        })}

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
              <VText variant="h2" style={{ marginLeft: 8 }}>Simulated Gateway</VText>
            </View>
            <VText variant="caption" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.lg }}>
              DEMO MODE: No real payment required. Click below to simulate completing the transaction for the {targetPlan?.priceLabel} {targetPlan?.name} plan.
            </VText>

            <View style={styles.demoWarningBox}>
              <Ionicons name="information-circle" size={24} color={theme.colors.warning} />
              <VText variant="caption" style={{ marginLeft: 8, flex: 1 }}>
                In production, this will open the official Paystack secure SDK.
              </VText>
            </View>

            <View style={styles.modalBtns}>
              <VButton
                title="Cancel"
                onPress={() => { setActiveModal(null); setPendingTier(null); }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <VButton
                title={`Pay ${targetPlan?.priceLabel || ''}`}
                onPress={handlePaystackSubmit}
                loading={loading}
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
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

  // Listing usage card
  usageBox: {
    backgroundColor: theme.colors.background,
    borderRadius: normalize(16),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  usageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: theme.spacing.sm,
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
  featureList: {
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  demoWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: theme.spacing.md,
    borderRadius: normalize(8),
    marginBottom: theme.spacing.xl,
  },
  modalBtns: {
    flexDirection: 'row',
  },
});
