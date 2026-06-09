import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton, VInput } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';

interface VendorProfileScreenProps {
  onBack?: () => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({ onBack }) => {
  const { logout, user } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  return (
    <View style={styles.container}>
      <HeaderBar showPoints={false} title="Business Profile" showBack={true} onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <VText variant="h2" style={{ fontSize: normalize(22) }}>Business Profile</VText>
        </View>

        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowEdit(true)}>
            <View style={styles.menuIconBox}>
              <Ionicons name="storefront-outline" size={20} color={theme.colors.textMain} />
            </View>
            <VText variant="h3" style={{ flex: 1, marginLeft: 12 }}>Edit Store Info</VText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
            <View style={styles.menuIconBox}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.textMain} />
            </View>
            <VText variant="h3" style={{ flex: 1, marginLeft: 12 }}>Settings</VText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Help Center', 'Opening support and FAQs...')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.textMain} />
            </View>
            <VText variant="h3" style={{ flex: 1, marginLeft: 12 }}>Help Center</VText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
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
      <Modal visible={showEdit} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <VText variant="h2" style={{ marginBottom: theme.spacing.md }}>Edit Store Info</VText>
            <VInput placeholder="Business Name" defaultValue={user?.name} icon="storefront-outline" style={{ marginBottom: theme.spacing.sm }} />
            <VInput placeholder="Phone Number" defaultValue={user?.phone} icon="call-outline" keyboardType="phone-pad" style={{ marginBottom: theme.spacing.lg }} />
            
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <VButton title="Cancel" variant="outline" onPress={() => setShowEdit(false)} style={{ flex: 1 }} />
              <VButton title="Save" onPress={() => { Alert.alert('Success', 'Profile updated'); setShowEdit(false); }} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent={true}>
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
});
