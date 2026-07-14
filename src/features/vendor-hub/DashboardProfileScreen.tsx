import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton, VInput, VImage } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';

interface VendorProfileScreenProps {
  onBack?: () => void;
  onTestRegistration?: () => void;
  onLogout?: () => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({ onBack, onTestRegistration, onLogout }) => {
  const { logout, user, vendors, myVendorProfile, updateVendorProfile } = useApp();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const navigation = useNavigation<any>();
  const vendor = myVendorProfile || vendors.find(v => v.id === user?.id);

  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  // Edit Form State
  const [editName, setEditName] = useState(vendor?.business_name || '');
  const [editBio, setEditBio] = useState(vendor?.bio || '');
  const [editCategory, setEditCategory] = useState(vendor?.category || '');
  const [editHours, setEditHours] = useState(vendor?.business_hours || '');
  const [editAddress, setEditAddress] = useState(vendor?.street_address || '');
  const [editImage, setEditImage] = useState(vendor?.image || '');

  // V2 Portfolio States
  const [p1, setP1] = useState(vendor?.portfolio_urls?.[0] || '');
  const [p2, setP2] = useState(vendor?.portfolio_urls?.[1] || '');
  const [p3, setP3] = useState(vendor?.portfolio_urls?.[2] || '');
  const [p4, setP4] = useState(vendor?.portfolio_urls?.[3] || '');

  const handleSaveProfile = () => {
    if (!vendor) return;
    const portfolio = [p1, p2, p3, p4].filter(url => !!url.trim());
    updateVendorProfile(vendor.id, {
      business_name: editName,
      bio: editBio,
      category: editCategory,
      business_hours: editHours,
      street_address: editAddress,
      image: editImage,
      portfolio_urls: portfolio
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
            { icon: isDarkMode ? 'sunny-outline' : 'moon-outline', label: isDarkMode ? 'Light Mode' : 'Dark Mode', onPress: toggleDarkMode },
            { icon: 'storefront-outline', label: 'Edit Store Info', onPress: () => setShowEdit(true) },
            { icon: 'eye-outline', label: 'Preview Public Profile', onPress: () => {
              if (vendor) {
                // BUG FIX: Navigate to the actual Customer-facing profile for authentic preview
                navigation.navigate('VendorProfile', { vendorId: vendor.id });
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

              <VText variant="h2" style={{ marginBottom: theme.spacing.sm }}>Service Portfolio (Gallery)</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.md }}>
                Add up to 4 image URLs to showcase your works or services.
              </VText>

              <VInput placeholder="Work Image 1 URL" value={p1} onChangeText={setP1} style={{ marginBottom: 8 }} />
              <VInput placeholder="Work Image 2 URL" value={p2} onChangeText={setP2} style={{ marginBottom: 8 }} />
              <VInput placeholder="Work Image 3 URL" value={p3} onChangeText={setP3} style={{ marginBottom: 8 }} />
              <VInput placeholder="Work Image 4 URL" value={p4} onChangeText={setP4} style={{ marginBottom: theme.spacing.lg }} />
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

      {/* Full-Screen Image Popup */}
      <Modal visible={!!selectedGalleryImg} transparent={true} animationType="fade" onRequestClose={() => setSelectedGalleryImg(null)}>
        <TouchableOpacity style={styles.imgPopupBackdrop} activeOpacity={1} onPress={() => setSelectedGalleryImg(null)}>
          <View style={styles.imgPopupContent}>
            <VImage source={selectedGalleryImg || ''} style={styles.popupImg} />
            <TouchableOpacity style={styles.popupCloseBtn} onPress={() => setSelectedGalleryImg(null)}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  imgPopupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgPopupContent: {
    width: '90%',
    height: '70%',
    position: 'relative',
  },
  popupImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  popupCloseBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 8,
  },
});
