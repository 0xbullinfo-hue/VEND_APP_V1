import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

interface VendorProfileScreenProps {
  onLogout: () => void;
  onTestRegistration?: () => void;
  onBack: () => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({ onLogout, onTestRegistration, onBack }) => {
  return (
    <View style={styles.container}>
      <HeaderBar showPoints={false} title="Business Profile" showBack={true} onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <VText variant="h2" style={{ fontSize: normalize(22) }}>Business Profile</VText>
        </View>

        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => onTestRegistration?.()}>
            <View style={styles.menuIconBox}>
              <Ionicons name="storefront-outline" size={20} color={theme.colors.textMain} />
            </View>
            <VText variant="h3" style={{ flex: 1, marginLeft: 12 }}>Edit Store Info</VText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Settings', 'App settings menu will open here.')}>
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
            onPress={onLogout} 
            variant="secondary"
            style={{ borderColor: theme.colors.danger }}
            textStyle={{ color: theme.colors.danger }}
          />

          <VButton 
            title="Terminate Account" 
            onPress={() => Alert.alert('Delete Account', 'Are you sure you want to permanently delete your VEND account? This cannot be undone.', [{text: 'Cancel', style: 'cancel'}, {text: 'Delete Permanently', style: 'destructive', onPress: onLogout}])}
            style={{ backgroundColor: '#FFE8E8' }}
            textStyle={{ color: theme.colors.danger }}
          />
        </View>
      </ScrollView>
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
});
