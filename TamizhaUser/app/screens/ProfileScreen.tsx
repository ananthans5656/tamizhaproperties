import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, CommonActions } from '@react-navigation/native';

import { getUserSession, getUserProfile, clearToken, clearUserSession } from '../services/api';

const { width } = Dimensions.get('window');

const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Saved', label: 'SAVED', icon: '❤️', route: 'SavedProperties' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = React.useState<any>(null);
  const [customAlert, setCustomAlert] = React.useState({ visible: false, title: '', message: '', icon: '' });

  const loadProfile = React.useCallback(async () => {
    const session = await getUserSession();
    const profile = await getUserProfile();
    setUserData({ ...session, ...profile });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile().catch(() => {});
    }, [loadProfile])
  );

  const handleLogout = async () => {
    try {
      await clearToken();
      await clearUserSession();
      // Reset the entire navigation stack so no authenticated screen
      // remains reachable via swipe-back or the hardware back button.
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
    } catch (e) {
      console.log('Logout error', e);
    }
  };
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F9" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tamizha Properties</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.userIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <Image 
              source={{ uri: userData?.avatarUri || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatarImage} 
            />
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          </View>
          
          <Text style={styles.profileName}>{userData?.name || 'User Name'}</Text>
          <Text style={styles.profileEmail}>{userData?.email || 'email@example.com'}</Text>
          
          <View style={styles.locationBadges}>
            <View style={styles.locBadge}>
              <Text style={styles.locIcon}>🏠</Text>
              <Text style={styles.locText}>RESI: {userData?.currentCity || 'N/A'}</Text>
            </View>
            <View style={styles.locBadge}>
              <Text style={styles.locIcon}>📍</Text>
              <Text style={styles.locText}>NATIVE: {userData?.nativePlace || 'N/A'}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editIcon}>✏️</Text>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCircle}>
            <Text style={styles.statLabel}>INVESTMENTS</Text>
            <Text style={styles.statValue}>{userData?.investmentCount ?? 0}</Text>
          </View>

          <View style={styles.statCircle}>
            <Text style={styles.statLabel}>PLOTS</Text>
            <Text style={styles.statValue}>{userData?.plotCount ?? 0}</Text>
          </View>
          
          <View style={[styles.statCircle, styles.statCircleGold]}>
            <Text style={styles.statLabelGold}>MEMBER SINCE</Text>
            <Text style={styles.statValueGold}>
              {new Date().getFullYear()}
            </Text>
          </View>
        </View>

        {/* Preferences List */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>ACCOUNT PREFERENCES</Text>

          <View style={styles.listContainer}>
            {/* Item 1 */}
            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Dashboard')}>
              <View style={styles.listIconBg}><Text style={styles.listIcon}>📋</Text></View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>My Listings</Text>
                <Text style={styles.listSub}>Manage your active property ads</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            {/* Item 2 */}
            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('SavedProperties')}>
              <View style={styles.listIconBg}><Text style={styles.listIcon}>🖤</Text></View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>Saved Plots</Text>
                <Text style={styles.listSub}>View your bookmarked landscapes</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.divider} />

            {/* Item 4 */}
            <TouchableOpacity style={[styles.listItem, { paddingBottom: 0 }]} onPress={() => navigation.navigate('ChangePassword')}>
              <View style={styles.listIconBg}><Text style={styles.listIcon}>🛡</Text></View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>Privacy & Security</Text>
                <Text style={styles.listSub}>Manage your password and data</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>TAMIZHA PROPERTIES</Text>
          <Text style={styles.footerVersion}>V 2.4.0 • HIGH-END REAL ESTATE SOLUTIONS</Text>
        </View>

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* UNIFIED LUXURY CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>{customAlert.icon}</Text>
            </View>
            <Text style={styles.modalTitle}>{customAlert.title}</Text>
            <Text style={styles.modalSub}>{customAlert.message}</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
              <Text style={styles.modalBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
        {BottomTabIcons.map((tab) => {
          const isActive = tab.id === 'Profile';
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => {
                if (tab.route !== 'Profile') {
                  navigation.navigate(tab.route);
                }
              }}
            >
              <View style={[styles.tabIconWrapper, isActive && styles.tabIconWrapperActive]}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F9', // Very light grey bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },
  userIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0B132B',
    padding: 5, // Creates the border gap effect if image covers the rest
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#0B132B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#0B132B',
    fontWeight: '900',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    lineHeight: 24,
  },
  profileEmail: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 10,
  },
  locationBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    gap: 4,
  },
  locIcon: {
    fontSize: 10,
  },
  locText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B132B',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  editIcon: {
    fontSize: 12,
    color: '#FFF',
    marginRight: 6,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCircle: {
    backgroundColor: '#FFF',
    width: width * 0.26,
    height: width * 0.26,
    borderRadius: width * 0.13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  },
  statCircleGold: {
    borderWidth: 1,
    borderColor: '#DFB15B',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  statLabelGold: {
    fontSize: 7,
    fontWeight: '900',
    color: '#DFB15B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueGold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DFB15B',
  },
  preferencesSection: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  listIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  listIcon: {
    fontSize: 16,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  listSub: {
    fontSize: 9,
    color: '#888',
    fontWeight: '500',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E74C3C',
    marginRight: 10,
  },
  chevron: {
    fontSize: 16,
    color: '#BBB',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
    marginLeft: 50,
  },
  logoutBtn: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  logoutIcon: {
    fontSize: 16,
    color: '#E74C3C',
    marginRight: 8,
    fontWeight: '800',
    transform: [{ rotate: '180deg' }],
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    opacity: 0.5,
  },
  footerBrand: {
    fontSize: 9,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 2,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 6,
    fontWeight: '800',
    color: '#AAA',
    letterSpacing: 1,
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabIconWrapperActive: {
    backgroundColor: '#E8F1FF',
  },
  tabIcon: {
    fontSize: 18,
    color: '#888',
    opacity: 0.6,
  },
  tabIconActive: {
    color: '#0D6EFD',
    opacity: 1,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
  },
  tabLabelActive: {
    color: '#0D6EFD',
  },
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordModalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  passwordModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E0AD4D',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: '#F3E5AB',
    width: '100%',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#4B5563',
    fontWeight: '800',
    fontSize: 15,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    marginLeft: 10,
    backgroundColor: '#E0AD4D',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 15,
  },
  // Custom Alert Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0B132B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 30,
    color: '#D4AF37',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0B132B',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  modalBtn: {
    backgroundColor: '#0B132B',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default ProfileScreen;
