import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface LeaveReviewScreenProps {
  vendorId: string;
  onBack: () => void;
}

export const LeaveReviewScreen: React.FC<LeaveReviewScreenProps> = ({
  vendorId,
  onBack
}) => {
  const { vendors, addPoints } = useApp();
  const vendor = vendors.find(v => v.id === vendorId);

  if (!vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar showBack={true} onBack={onBack} title="Write a Review" />
        <View style={styles.successBox}>
          <Ionicons name="alert-circle-outline" size={normalize(42)} color={theme.colors.warning} style={{ marginBottom: theme.spacing.sm }} />
          <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.xs }}>
            Vendor Not Found
          </VText>
          <VText variant="body" align="center" color={theme.colors.textMuted}>
            We could not load this vendor in your current locality feed.
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

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmitReview = () => {
    setErrorMsg('');
    if (!comment.trim()) {
      setErrorMsg('Please write a brief feedback comment');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addPoints(30); // Reward customer with 30 pts for review contribution!
      setSuccess(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar showBack={true} onBack={onBack} title="Write a Review" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.vendorHeader}>
            <VText variant="h2" align="center" style={{ marginBottom: 4 }}>
              Rate your experience
            </VText>
            <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginBottom: theme.spacing.lg }}>
              How was your connection with {vendor.business_name}?
            </VText>
          </View>

          {!success ? (
            <View style={styles.formContainer}>
              {/* Star Rating selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setRating(star)}
                    style={styles.starBtn}
                  >
                    <Ionicons 
                      name={star <= rating ? "star" : "star-outline"} 
                      size={normalize(36)} 
                      color={theme.colors.warning} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <VText variant="caption" align="center" color={theme.colors.primary} style={styles.ratingHelp}>
                {rating === 5 && 'Excellent! Fully Satisfied'}
                {rating === 4 && 'Good Service'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Disappointed'}
                {rating === 1 && 'Poor Experience'}
              </VText>

              {/* Comment Input */}
              <VText variant="h3" style={styles.label}>Review Feedback</VText>
              <VInput
                placeholder="Share details of your visit: punctuality, service quality, friendliness..."
                value={comment}
                onChangeText={setComment}
                style={styles.textareaSpacing}
              />

              {errorMsg ? (
                <VText variant="subtext" color={theme.colors.danger} style={styles.errorText}>
                  {errorMsg}
                </VText>
              ) : null}

              {/* Submit CTA */}
              <VButton
                title="Submit Verified Review"
                onPress={handleSubmitReview}
                loading={loading}
                icon="checkmark-done"
                style={[styles.submitBtn, theme.shadows.soft]}
              />
            </View>
          ) : (
            // Success review submission banner
            <View style={styles.successBox}>
              <View style={styles.checkCircle}>
                <Ionicons name="sparkles" size={normalize(32)} color={theme.colors.background} />
              </View>
              <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
                Review Published!
              </VText>
              <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.lg }}>
                Thank you! Your feedback helps other customers discover verified shops.
              </VText>
              
              <View style={styles.pointsPill}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <VText variant="h3" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                  +30 PTS
                </VText>
              </View>

              <VButton
                title="Return to Profile"
                onPress={onBack}
                style={{ width: '100%' }}
              />
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
    paddingVertical: theme.spacing.xl,
  },
  vendorHeader: {
    alignItems: 'center',
  },
  formContainer: {},
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  starBtn: {
    padding: 4,
  },
  ratingHelp: {
    fontWeight: '800',
    marginBottom: theme.spacing.xl,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  textareaSpacing: {
    height: normalize(100),
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  submitBtn: {},
  
  // Success states
  successBox: {
    alignItems: 'center',
    paddingVertical: normalize(40),
  },
  checkCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: theme.colors.primary,
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
