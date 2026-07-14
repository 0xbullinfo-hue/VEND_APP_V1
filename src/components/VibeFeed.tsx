import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { theme, normalize } from '../theme/designSystem';
import { VText, VImage, VCard } from './SharedComponents';
import { Ionicons } from './VIcons';
import { VendorSnapshot } from '../types';

const { width, height } = Dimensions.get('window');

interface VibeFeedProps {
  snapshots: VendorSnapshot[];
  onViewVendor: (vendorId: string) => void;
}

export const VibeFeed: React.FC<VibeFeedProps> = ({ snapshots, onViewVendor }) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<VendorSnapshot | null>(null);

  if (snapshots.length === 0) return null;

  return (
    <View style={styles.container}>
      <VText variant="caption" color={theme.colors.textMuted} style={styles.sectionTitle}>
        LOCAL VIBES • DAILY SNAPSHOTS
      </VText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {snapshots.map((sn) => (
          <TouchableOpacity
            key={sn.id}
            style={styles.storyItem}
            onPress={() => setSelectedSnapshot(sn)}
          >
            <View style={styles.avatarRing}>
              <VImage source={sn.vendor_image} style={styles.avatar} />
            </View>
            <VText variant="caption" numberOfLines={1} style={styles.vendorName}>
              {sn.vendor_name.split(' ')[0]}
            </VText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Snapshot Modal */}
      <Modal
        visible={!!selectedSnapshot}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedSnapshot(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.closeOverlay}
            onPress={() => setSelectedSnapshot(null)}
          />

          {selectedSnapshot && (
            <VCard style={styles.snapshotCard}>
              <View style={styles.snapshotHeader}>
                <VImage source={selectedSnapshot.vendor_image} style={styles.smallAvatar} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <VText variant="h3">{selectedSnapshot.vendor_name}</VText>
                  <VText variant="caption" color={theme.colors.textMuted}>
                    Posted today
                  </VText>
                </View>
                <TouchableOpacity onPress={() => setSelectedSnapshot(null)}>
                  <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <VImage source={selectedSnapshot.image} style={styles.snapshotImage} />

              <View style={styles.snapshotFooter}>
                <VText variant="body" style={styles.captionText}>
                  {selectedSnapshot.caption}
                </VText>

                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => {
                    setSelectedSnapshot(null);
                    onViewVendor(selectedSnapshot.vendor_id);
                  }}
                >
                  <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900' }}>
                    VIEW SHOP →
                  </VText>
                </TouchableOpacity>
              </View>
            </VCard>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: normalize(56),
  },
  avatarRing: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(22),
  },
  vendorName: {
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  closeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  snapshotCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    padding: 0,
    overflow: 'hidden',
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  snapshotImage: {
    width: '100%',
    aspectRatio: 1,
  },
  snapshotFooter: {
    padding: theme.spacing.lg,
  },
  captionText: {
    lineHeight: normalize(20),
    marginBottom: theme.spacing.md,
  },
  viewProfileBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});
