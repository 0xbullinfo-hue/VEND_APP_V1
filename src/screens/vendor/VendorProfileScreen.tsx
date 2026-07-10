import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton, VInput, VImage } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';

interface VendorProfileScreenProps {
  onBack?: () => void;
  onTestRegistration?: () => void;
  onLogout?: () => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({ onBack, onTestRegistration, onLogout }) => {
  const { logout, user, vendors, myVendorProfile, updateVendorProfile } = useApp();
  const vendor = myVendorProfile || vendors.find(v => v.id === user?.id);

  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState(vendor?.business_name || '');
  const [editBio, setEditBio] = useState(vendor?.bio || '');
  const [editCategory, setEditCategory] = useState(vendor?.category || '');
  const [editHours, setEditHours] = useState(vendor?.business_hours || '');
  const [editAddress, setEditAddress] = useState(vendor?.street_address || '');
  const [editImage, setEditImage] = useState(vendor?.image || '');

  const handleSaveProfile = () => {
    if (!vendor) return;
    updateVendorProfile(vendor.id, {
      business_name: editName,
      bio: editBio,
      category: editCategory,
      business_hours: editHours,
      street_address: editAddress,
      image: editImage,
    });
    setShowEdit(false);
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
  };
  return (
    <View style={styles.container}>
      <HeaderBar showPoints={false} title="Business Profile" showBack={true} onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Summary */}
        <View style={styles.profileHeader}>
          <VImage source={vendor?.image || ''} style={styles.profileAvatar} />
          <View style={styles.profileHeaderInfo}>
            <VText variant="h2">{vendor?.business_name}</VText>
            <VText variant="caption" color={theme.colors.textMuted}>{vendor?.category}</VText>
          </View>
        </View>

        <View style={styles.menuList}>
          {[
            { icon: 'storefront-outline', label: 'Edit Store Info', onPress: () => setShowEdit(true) },
            { icon: 'eye-outline', label: 'Preview Public Profile', onPress: () => {
              if (vendor) {
                // In production, we'd navigate to the actual Customer-facing VendorProfile screen
                Alert.alert('Public Preview', `Viewing as Customer: ${vendor.business_name}\nCategory: ${vendor.category}\nHours: ${vendor.business_hours || 'Not set'}`);
              }
            }},
            { icon: 'settings-outline', label: 'Settings', onPress: () => setShowSettings(true) },
            { icon: 'help-circle-outline', label: 'Help Center', onPress: () => Alert.alert('Help Center', 'Opening support and FAQs...') },
          ].map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(index * 100).duration(500)}
            >
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.textMain} />
                </View>
                <VText variant="h3" style={{ flex: 1, marginLeft: 12 }}>{item.label}</VText>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
          <VButton 
            title="Log Out" 
            onPress={handleLogout} 
            variant="secondary"
            style={{ borderColor: theme.colors.danger }}
            textStyle={{ color: theme.colors.danger }}
          />

          <VButton 
            title="Terminate Account" 
            onPress={() => Alert.alert('Delete Account', 'Are you sure you want to permanently delete your VEND account? This cannot be undone.', [{text: 'Cancel', style: 'cancel'}, {text: 'Delete Permanently', style: 'destructive', onPress: handleLogout}])}
            style={{ backgroundColor: '#FFE8E8' }}
            textStyle={{ color: theme.colors.danger }}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" transparent={true} onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <VText variant="h2" style={{ marginBottom: theme.spacing.md }}>Edit Store Info</VText>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: normalize(450) }}>
              <VText variant="h3" style={styles.inputLabel}>Business Name</VText>
              <VInput
                placeholder="Business Name"
                value={editName}
                onChangeText={setEditName}
                icon="storefront-outline"
                style={{ marginBottom: theme.spacing.sm }}
              />

              <VText variant="h3" style={styles.inputLabel}>Profile Image URL</VText>
              <VInput
                placeholder="https://..."
                value={editImage}
                onChangeText={setEditImage}
                icon="image-outline"
                style={{ marginBottom: theme.spacing.sm }}
              />

              <VText variant="h3" style={styles.inputLabel}>Category</VText>
              <VInput
                placeholder="e.g. Food, Fashion, Tech"
                value={editCategory}
                onChangeText={setEditCategory}
                icon="grid-outline"
                style={{ marginBottom: theme.spacing.sm }}
              />

              <VText variant="h3" style={styles.inputLabel}>Business Bio</VText>
              <VInput
                placeholder="Tell customers about your business..."
                value={editBio}
                onChangeText={setEditBio}
                style={[styles.textArea, { marginBottom: theme.spacing.sm }]}
              />

              <VText variant="h3" style={styles.inputLabel}>Business Hours</VText>
              <VInput
                placeholder="e.g. Mon-Fri: 9am-6pm"
                value={editHours}
                onChangeText={setEditHours}
                icon="time-outline"
                style={{ marginBottom: theme.spacing.sm }}
              />

              <VText variant="h3" style={styles.inputLabel}>Street Address</VText>
              <VInput
                placeholder="Physical address"
                value={editAddress}
                onChangeText={setEditAddress}
                icon="location-outline"
                style={{ marginBottom: theme.spacing.lg }}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <VButton title="Cancel" variant="outline" onPress={() => setShowEdit(false)} style={{ flex: 1 }} />
              <VButton title="Save Changes" onPress={handleSaveProfile} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent={true} onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <VText variant="h2" style={{ marginBottom: theme.spacing.md }}>Settings</VText>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications', 'Notification preferences saved')}>
              <VText variant="body">Push Notifications</VText>
              <Ionicons name="toggle" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Privacy', 'Privacy settings opened')}>
              <VText variant="body">Privacy & Safety</VText>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={{ marginTop: theme.spacing.xl }}>
              <VButton title="Close" variant="outline" onPress={() => setShowSettings(false)} />
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
    paddingBottom: normalize(140),
  },
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  menuList: {
    paddingHorizontal: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: theme.spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  profileAvatar: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: theme.colors.border,
  },
  profileHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  inputLabel: {
    fontSize: normalize(13),
    marginBottom: 4,
    color: theme.colors.textMuted,
  },
  textArea: {
    height: normalize(80),
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
});
