import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, HeaderBar, VCard } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

const { width } = Dimensions.get('window');

interface RewardsScreenProps {
  onBackToHome: () => void;
  onNavigateToExplore: () => void;
  onNavigateToProfile: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  onBackToHome,
  onNavigateToExplore,
  onNavigateToProfile
}) => {
  const { user, deductPoints, addPoints, quests } = useApp();
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const points = user?.points || 0;

  const milestones = [
    { name: 'Bronze Explorer', threshold: 0, icon: 'shield-outline', color: '#CD7F32' },
    { name: 'Silver Navigator', threshold: 250, icon: 'shield-half-outline', color: '#C0C0C0' },
    { name: 'Gold Connector', threshold: 500, icon: 'shield-sharp', color: '#FFD700' },
    { name: 'Teal Champion', threshold: 1000, icon: 'trophy', color: theme.colors.primary },
  ];

  const earnTasks = [
    { title: 'Verify a Vendor Visit', pts: 100, icon: 'checkmark-circle-outline', desc: 'Scan QR / Enter visit code at physical locations.', action: onBackToHome },
    { title: 'Save 3 Local Shops', pts: 15, icon: 'heart-outline', desc: 'Bookmark shops you like to check updates later.', action: onNavigateToExplore },
    { title: 'Submit a Review', pts: 30, icon: 'star-outline', desc: 'Write honest review feedback on visited vendors.', action: onNavigateToExplore },
    { title: 'Refer a Friend', pts: 50, icon: 'gift-outline', desc: 'Friends get 50 pts, you get 50 pts upon validation.', action: onNavigateToProfile },
  ];

  const rewardCoupons = [
    { id: 'c1', title: 'Mama Titi - N1,500 Off', cost: 150, desc: 'Get discount on standard Amala or Jollof party packs.', code: 'MAMA15-TITI' },
    { id: 'c2', title: 'Master Tailor - Free Measure', cost: 100, desc: 'Bespoke fit consult & style profile sketching.', code: 'TAILOR-FIT' },
    { id: 'c3', title: 'FlowFix - N2,000 Diagnosis', cost: 200, desc: 'Redeem for diagnostic visit during repairs.', code: 'FIX-DIAGNOSE' },
    { id: 'c4', title: 'Keziah Hair - Hair Washing', cost: 120, desc: 'Complimentary herbal washing during braid styling.', code: 'KEZIAH-WASH' },
  ];

  // Determine user milestone
  const activeMilestone = [...milestones].reverse().find(m => points >= m.threshold) || milestones[0];
  const nextMilestone = milestones[milestones.indexOf(activeMilestone) + 1] || null;
  const progressPercent = nextMilestone 
    ? ((points - activeMilestone.threshold) / (nextMilestone.threshold - activeMilestone.threshold)) * 100 
    : 100;

  const handleRedeem = (reward: any) => {
    if (points >= reward.cost) {
      setSelectedReward(reward);
    }
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      deductPoints(selectedReward.cost);
      setSuccessCode(selectedReward.code);
    }, 1500);
  };

  const handleCloseSuccess = () => {
    setSuccessCode(null);
    setSelectedReward(null);
  };

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="My Rewards"
        showBack={true}
        onBack={onBackToHome}
        showPoints={false} 
        rightComponent={
          <View style={styles.headerRightBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
              {points} PTS
            </VText>
          </View>
        } 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Points Summary Header Panel */}
        <View style={[styles.dashboardCard, theme.shadows.premium]}>
          <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900', letterSpacing: 1.5 }}>
            MY REWARDS BALANCE
          </VText>
          <View style={styles.pointsDisplay}>
            <VText variant="h1" color={theme.colors.primary} style={styles.pointsNum}>
              {points}
            </VText>
            <VText variant="body" color={theme.colors.primary} style={styles.pointsSuffix}>
              VEND Points
            </VText>
          </View>

          {/* Milestone Badge info */}
          <View style={styles.milestoneLabelRow}>
            <View style={styles.milestoneBadge}>
              <Ionicons name={activeMilestone.icon as any} size={14} color={activeMilestone.color} />
              <VText variant="caption" color={activeMilestone.color} style={{ marginLeft: 4 }}>
                {activeMilestone.name}
              </VText>
            </View>
            
            {nextMilestone && (
              <VText variant="caption" color={theme.colors.textMuted}>
                Next: {nextMilestone.name} ({nextMilestone.threshold} pts)
              </VText>
            )}
          </View>

          {/* Progress bar - Stay visible at 100% when maxed */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progressPercent))}%` }]} />
          </View>
        </View>

        {/* Locality Quests Section */}
        <View style={styles.section}>
          <VText variant="h2" style={styles.sectionTitle}>Active Locality Quests</VText>
          {quests.length > 0 ? (
            quests.map((quest) => {
              const progress = quest.targetCount > 0 ? Math.round((quest.currentCount / quest.targetCount) * 100) : 0;
              return (
                <VCard
                  key={quest.id}
                  variant="outline"
                  style={[styles.questCard, quest.isCompleted && styles.questCompleted]}
                >
                  <View style={styles.questHeader}>
                    <View style={{ flex: 1 }}>
                      <VText variant="h3" color={quest.isCompleted ? theme.colors.accent : theme.colors.textMain}>
                        {quest.title} {quest.isCompleted && '✓'}
                      </VText>
                      <VText variant="caption" color={theme.colors.textMuted}>{quest.description}</VText>
                    </View>
                    <View style={styles.questReward}>
                      <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900' }}>
                        +{quest.pointsReward} PTS
                      </VText>
                    </View>
                  </View>

                  <View style={styles.questProgressBox}>
                    <View style={styles.questProgressRow}>
                      <VText variant="caption" color={theme.colors.textMuted}>
                        Progress: {quest.currentCount}/{quest.targetCount}
                      </VText>
                      <VText variant="caption" color={theme.colors.textMuted}>
                        {progress}%
                      </VText>
                    </View>
                    <View style={styles.questBarBg}>
                      <View
                        style={[
                          styles.questBarFill,
                          {
                            width: `${Math.min(100, progress)}%`,
                            backgroundColor: quest.isCompleted ? theme.colors.accent : theme.colors.primary
                          }
                        ]}
                      />
                    </View>
                  </View>
                </VCard>
              );
            })
          ) : (
            <View style={styles.emptyQuestBox}>
              <Ionicons name="map-outline" size={32} color={theme.colors.border} />
              <VText variant="caption" color={theme.colors.textMuted} align="center" style={{ marginTop: 8 }}>
                Check back later for new locality quests in your area.
              </VText>
            </View>
          )}
        </View>

        {/* Earning Opportunities */}
        <View style={styles.section}>
          <VText variant="h2" style={styles.sectionTitle}>Earn More Points</VText>
          {earnTasks.map((task, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={task.action}
              style={styles.taskCard}
            >
              <View style={styles.taskLeft}>
                <View style={styles.taskIconCircle}>
                  <Ionicons name={task.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <VText variant="h3">{task.title}</VText>
                  <VText variant="caption" color={theme.colors.textMuted}>{task.desc}</VText>
                </View>
              </View>
              <View style={styles.taskRewardBadge}>
                <VText variant="caption" color={theme.colors.primary}>+{task.pts} PTS</VText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Redeemable Rewards list */}
        <View style={styles.section}>
          <VText variant="h2" style={styles.sectionTitle}>Claim Active Rewards</VText>
          <View style={styles.rewardsGrid}>
            {rewardCoupons.map((reward) => {
              const canAfford = points >= reward.cost;
              return (
                <View 
                  key={reward.id} 
                  style={[
                    styles.rewardCard,
                    canAfford ? styles.cardAffordable : styles.cardLocked,
                    theme.shadows.soft
                  ]}
                >
                  <View style={styles.rewardCardTop}>
                    <Ionicons 
                      name={canAfford ? "gift" : "lock-closed"} 
                      size={20} 
                      color={canAfford ? theme.colors.primary : theme.colors.textMuted} 
                    />
                    <VText variant="caption" color={canAfford ? theme.colors.primary : theme.colors.textMuted}>
                      {reward.cost} PTS
                    </VText>
                  </View>
                  
                  <VText variant="h3" style={styles.rewardTitle}>{reward.title}</VText>
                  <VText variant="caption" color={theme.colors.textMuted} numberOfLines={3} style={styles.rewardDesc}>
                    {reward.desc}
                  </VText>

                  <VButton
                    title={canAfford ? "Redeem" : "Locked"}
                    onPress={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    variant={canAfford ? "primary" : "secondary"}
                    style={styles.redeemBtn}
                    textStyle={{ fontSize: normalize(11) }}
                  />
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Redemption Confirmation & Success Overlay */}
      <Modal
        visible={selectedReward !== null}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            {successCode === null ? (
              // Confirm redemption State
              <View style={styles.confirmState}>
                <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
                  Redeem Reward?
                </VText>
                <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.lg }}>
                  Are you sure you want to spend {selectedReward?.cost} PTS to unlock "{selectedReward?.title}"?
                </VText>

                <View style={styles.modalBtnsRow}>
                  <VButton
                    title="Cancel"
                    onPress={() => setSelectedReward(null)}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <VButton
                    title="Unlock Now"
                    onPress={handleConfirmRedeem}
                    loading={loading}
                    disabled={loading}
                    style={{ flex: 1, marginLeft: theme.spacing.sm }}
                  />
                </View>
              </View>
            ) : (
              // Success coupon code screen
              <View style={styles.successState}>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.colors.accent} />
                </View>
                <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
                  Reward Unlocked!
                </VText>
                <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.md }}>
                  Present this coupon code to the vendor when claiming your service details.
                </VText>

                <View style={styles.codeContainer}>
                  <VText variant="h1" align="center" color={theme.colors.primary} style={styles.codeText}>
                    {successCode}
                  </VText>
                </View>

                <VButton
                  title="Done"
                  onPress={handleCloseSuccess}
                  style={{ width: '100%', marginTop: theme.spacing.lg }}
                />
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
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: normalize(120),
  },
  dashboardCard: {
    backgroundColor: theme.colors.background,
    borderRadius: normalize(18),
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: theme.spacing.xs,
  },
  pointsNum: {
    fontSize: normalize(44),
    fontWeight: '900',
  },
  pointsSuffix: {
    marginLeft: 6,
    fontWeight: '700',
  },
  milestoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.md,
    marginBottom: 6,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  
  // Section layout
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: normalize(12),
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskRewardBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  
  // Rewards grid
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  rewardCard: {
    width: (width - normalize(52)) / 2, // dynamic grid sizing
    backgroundColor: theme.colors.background,
    borderRadius: normalize(12),
    borderWidth: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardAffordable: {
    borderColor: theme.colors.primaryLight,
  },
  cardLocked: {
    borderColor: theme.colors.border,
    opacity: 0.8,
  },
  rewardCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rewardTitle: {
    marginBottom: 4,
  },
  rewardDesc: {
    fontSize: normalize(11),
    lineHeight: 14,
    marginBottom: theme.spacing.md,
    height: 42,
  },
  redeemBtn: {
    height: normalize(32),
    borderRadius: 8,
  },

  // Modal styling
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
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  confirmState: {},
  modalBtnsRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  successState: {
    alignItems: 'center',
  },
  successBadge: {
    marginBottom: theme.spacing.md,
  },
  codeContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: normalize(10),
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  codeText: {
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Quest styles
  questCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  questCompleted: {
    borderColor: theme.colors.accent + '30',
    backgroundColor: theme.colors.accent + '05',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questReward: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questProgressBox: {
    marginTop: 4,
  },
  questProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  questBarBg: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  questBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyQuestBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
