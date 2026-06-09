import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal,
  Text,
  Alert
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface CustomerProfileScreenProps {
  onBackToHome: () => void;
  onSwitchToVendor: () => void;
  onViewVendorProfile: (vendorId: string) => void;
  onLogout: () => void;
  onViewPointsLedger?: () => void;
}

export const CustomerProfileScreen: React.FC<CustomerProfileScreenProps> = ({
  onBackToHome,
  onSwitchToVendor,
  onViewVendorProfile,
  onLogout,
  onViewPointsLedger
}) => {
  const { 
    user, 
    savedVendors, 
    vendors, 
    emergencyContacts, 
    addEmergencyContact, 
    deleteEmergencyContact,
    triggerSOS,
    logout 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'settings' | 'favorites' | 'safety'>('settings');
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  const favoriteVendors = vendors.filter(v => savedVendors.includes(v.id));

  const handleAddEmergency = () => {
    if (contactName.trim() && contactPhone.trim()) {
      addEmergencyContact({
        name: contactName,
        phone: contactPhone,
        relationship: contactRelation || 'Family'
      });
      setContactName('');
      setContactPhone('');
      setContactRelation('');
      setShowAddContact(false);
    }
  };

  const handleTriggerSOSLocal = () => {
    triggerSOS();
  };

  const handleLogoutLocal = () => {
    logout();
    onLogout();
  };

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="Profile"
        showBack={true}
        onBack={onBackToHome}
        showPoints={true} 
        onPointsPress={onViewPointsLedger}
      />

      {/* Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={normalize(32)} color={theme.colors.primary} />
        </View>
        <VText variant="h2" style={styles.profileName}>{user?.name}</VText>
        <VText variant="caption" color={theme.colors.textMuted}>{user?.phone}</VText>
      </View>

      {/* Tab controls */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveTab('settings')}
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
        >
          <VText variant="caption" color={activeTab === 'settings' ? theme.colors.primary : theme.colors.textMuted}>
            SETTINGS
          </VText>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveTab('favorites')}
          style={[styles.tabItem, activeTab === 'favorites' && styles.tabItemActive]}
        >
          <VText variant="caption" color={activeTab === 'favorites' ? theme.colors.primary : theme.colors.textMuted}>
            SAVED SHops ({savedVendors.length})
          </VText>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveTab('safety')}
          style={[styles.tabItem, activeTab === 'safety' && styles.tabItemActive]}
        >
          <VText variant="caption" color={activeTab === 'safety' ? theme.colors.primary : theme.colors.textMuted}>
            SAFETY CENTER
          </VText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            
            {/* Account Settings Menu */}
            <View style={styles.menuGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => Alert.alert('Edit Profile', 'Profile editor will be available soon.')}>
                <View style={styles.menuLeft}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                  <VText variant="body" style={{ marginLeft: 12 }}>Edit Profile Details</VText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => Alert.alert('Notifications', 'Notification settings will be available soon.')}>
                <View style={styles.menuLeft}>
                  <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                  <VText variant="body" style={{ marginLeft: 12 }}>Notification Options</VText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => Alert.alert('Terms', 'Loading Terms & Agreements...')}>
                <View style={styles.menuLeft}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                  <VText variant="body" style={{ marginLeft: 12 }}>Terms & Agreements</VText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Switch Account Action */}
            <View style={styles.switchAccountBox}>
              <VText variant="h3" style={{ marginBottom: 4 }}>Are you a local Vendor?</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.md }}>
                Activate your vendor dashboard to register services, pin your storefront, and attract hyper-local orders.
              </VText>
              <VButton
                title="Switch to Vendor Mode"
                onPress={onSwitchToVendor}
                variant="outline"
                icon="storefront-outline"
              />
            </View>

            {/* Logout & Delete Options */}
            <View style={{ gap: theme.spacing.md }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleLogoutLocal}
                style={styles.logoutBtn}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
                <VText variant="h3" color={theme.colors.danger} style={{ marginLeft: 8 }}>
                  Logout Account
                </VText>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => Alert.alert('Delete Account', 'Are you sure you want to permanently delete your VEND account? This cannot be undone.', [{text: 'Cancel', style: 'cancel'}, {text: 'Delete Permanently', style: 'destructive', onPress: handleLogoutLocal}])}
                style={[styles.logoutBtn, { borderColor: 'transparent', backgroundColor: '#FFE8E8' }]}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                <VText variant="h3" color={theme.colors.danger} style={{ marginLeft: 8 }}>
                  Terminate Account
                </VText>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {/* SAVED VENDORS TAB */}
        {activeTab === 'favorites' && (
          <View style={styles.tabContent}>
            {favoriteVendors.length > 0 ? (
              favoriteVendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  activeOpacity={0.8}
                  onPress={() => onViewVendorProfile(vendor.id)}
                  style={[styles.vendorCard, theme.shadows.soft]}
                >
                  <Image source={{ uri: vendor.image }} style={styles.vendorImg} />
                  <View style={styles.vendorInfo}>
                    <VText variant="h3">{vendor.business_name}</VText>
                    <VText variant="caption" color={theme.colors.textMuted}>{vendor.category}</VText>
                    
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={theme.colors.warning} />
                      <VText variant="caption" style={{ marginLeft: 4 }}>{vendor.rating}</VText>
                      <Ionicons name="location-outline" size={12} color={theme.colors.primary} style={{ marginLeft: 10 }} />
                      <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 2 }}>Directions</VText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={48} color={theme.colors.textMuted} />
                <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginTop: theme.spacing.sm }}>
                  You haven't saved any local shops yet.
                </VText>
              </View>
            )}
          </View>
        )}

        {/* SAFETY CENTER TAB */}
        {activeTab === 'safety' && (
          <View style={styles.tabContent}>
            
            {/* SOS Trigger Box */}
            <View style={[styles.sosTriggerBox, theme.shadows.premium]}>
              <View style={styles.sosIconCircle}>
                <Ionicons name="alert-circle" size={42} color={theme.colors.background} />
              </View>
              <VText variant="h2" color={theme.colors.background} align="center" style={{ marginBottom: 4 }}>
                Instant SOS Beacon
              </VText>
              <VText variant="caption" color="#FFD1D1" align="center" style={{ marginBottom: theme.spacing.lg }}>
                Tap to immediately dispatch your coordinates to all emergency contacts and local community watch operators.
              </VText>
              
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={handleTriggerSOSLocal}
                style={styles.sosInnerBtn}
              >
                <Text style={styles.sosInnerText}>ACTIVATE SOS BEACON</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Contacts Management */}
            <View style={styles.contactsGroup}>
              <View style={styles.contactsHeader}>
                <VText variant="h3">Trusted Emergency Contacts</VText>
                <TouchableOpacity onPress={() => setShowAddContact(true)}>
                  <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900' }}>
                    + ADD CONTACT
                  </VText>
                </TouchableOpacity>
              </View>

              {emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactLeft}>
                    <View style={styles.contactAvatar}>
                      <Ionicons name="call" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <VText variant="h3">{contact.name}</VText>
                      <VText variant="caption" color={theme.colors.textMuted}>
                        {contact.phone} • {contact.relationship}
                      </VText>
                    </View>
                  </View>
                  
                  {contact.id !== '1' && ( // Allow deleting custom ones, keep official
                    <TouchableOpacity onPress={() => deleteEmergencyContact(contact.id)}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

          </View>
        )}

      </ScrollView>

      {/* Add emergency Contact modal */}
      <Modal
        visible={showAddContact}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme.shadows.premium]}>
            <VText variant="h2" style={{ marginBottom: theme.spacing.md }}>Add Trusted Contact</VText>
            
            <VInput
              placeholder="Full Name"
              value={contactName}
              onChangeText={setContactName}
              icon="person-outline"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <VInput
              placeholder="Phone Number"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              icon="phone-portrait-outline"
              style={{ marginBottom: theme.spacing.sm }}
            />

            <VInput
              placeholder="Relationship (e.g. Spouse, Brother)"
              value={contactRelation}
              onChangeText={setContactRelation}
              icon="heart-outline"
              style={{ marginBottom: theme.spacing.lg }}
            />

            <View style={styles.modalBtns}>
              <VButton
                title="Cancel"
                onPress={() => setShowAddContact(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <VButton
                title="Save Contact"
                onPress={handleAddEmergency}
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileName: {
    marginBottom: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: normalize(120),
  },
  tabContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  
  // Settings Tab styles
  menuGroup: {
    backgroundColor: theme.colors.background,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchAccountBox: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.1)',
    marginBottom: theme.spacing.xl,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: normalize(46),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
  },

  // Saved tab styles
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  vendorImg: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: normalize(80),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Safety Tab styles
  sosTriggerBox: {
    backgroundColor: theme.colors.danger,
    borderRadius: normalize(18),
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  sosIconCircle: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sosInnerBtn: {
    backgroundColor: theme.colors.background,
    height: normalize(48),
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  sosInnerText: {
    color: theme.colors.danger,
    fontWeight: '900',
    fontSize: normalize(13),
    letterSpacing: 0.5,
  },
  contactsGroup: {},
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styles
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
  modalBtns: {
    flexDirection: 'row',
  },
});
