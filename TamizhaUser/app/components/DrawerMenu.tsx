import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  PanResponder,
} from 'react-native';
import { getUserSession, getUserProfile, clearToken, clearUserSession } from '../services/api';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

const LAND_TYPES = [
  { id: 'farm', label: '🌾 Farm Land' },
  { id: 'plot', label: '📐 Plot / Layout' },
  { id: 'hill', label: '🏔️ Hill Land' },
  { id: 'waterfront', label: '🌊 Waterfront' },
  { id: 'forest', label: '🌳 Forest Land' },
  { id: 'commercial', label: '🏗️ Commercial Land' },
];

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Pollachi', 'Kodaikanal', 'Thanjavur', 'Salem'];

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  onApplyFilters?: (filters: { landTypes: string[]; district: string; approvals: string[] }) => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ visible, onClose, navigation, onApplyFilters }) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Filter states
  const [selectedLandTypes, setSelectedLandTypes] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [approvals, setApprovals] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const session = await getUserSession();
      const profile = await getUserProfile();
      setUserData({ ...session, ...profile });
    };
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const toggleLandType = (id: string) => {
    setSelectedLandTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleApproval = (type: string) => {
    setApprovals(prev =>
      prev.includes(type) ? prev.filter(a => a !== type) : [...prev, type]
    );
  };

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => navigation.navigate(route), 50);
  };

  const handleLogout = async () => {
    onClose();
    await clearToken();
    await clearUserSession();
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
    }, 300);
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters({
        landTypes: selectedLandTypes,
        district: selectedDistrict,
        approvals: approvals,
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Dimmed overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── PROFILE SECTION ── */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userData?.name || 'User Name'}</Text>
          <Text style={styles.profileEmail}>{userData?.email || 'email@example.com'}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => handleNavigate('EditProfile')}>
            <Text style={styles.editProfileBtnText}>✏️  Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goldDivider} />

        {/* ── FILTERS SECTION ── */}
        <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.filtersSectionTitle}>ADVANCED FILTERS</Text>

          {/* Land Type */}
          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>LAND TYPE</Text>
            <View style={styles.chipsWrap}>
              {LAND_TYPES.map(lt => (
                <TouchableOpacity
                  key={lt.id}
                  style={[styles.chip, selectedLandTypes.includes(lt.id) && styles.chipActive]}
                  onPress={() => toggleLandType(lt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selectedLandTypes.includes(lt.id) && styles.chipTextActive]}>
                    {lt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* District */}
          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>DISTRICT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DISTRICTS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.districtChip, selectedDistrict === d && styles.chipActive]}
                  onPress={() => setSelectedDistrict(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selectedDistrict === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Approval Status */}
          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>APPROVAL STATUS</Text>
            <View style={styles.chipsWrap}>
              {['DTCP', 'CMDA', 'PATTA'].map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, approvals.includes(a) && styles.chipActive]}
                  onPress={() => toggleApproval(a)}
                  activeOpacity={0.8}
                >
                  {approvals.includes(a) && <Text style={styles.chipCheckmark}>🛡 </Text>}
                  <Text style={[styles.chipText, approvals.includes(a) && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apply */}
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>APPLY FILTERS ▼</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.goldDivider} />

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayTouchable: { flex: 1 },
  drawer: {
    position: 'absolute', top: 0, left: 0,
    width: DRAWER_WIDTH, height: '100%',
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 15, elevation: 20,
  },
  profileSection: {
    backgroundColor: '#0B132B',
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingHorizontal: 20, paddingBottom: 20,
  },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#D4AF37' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#D4AF37', width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedIcon: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  closeBtn: { padding: 5 },
  closeBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  profileName: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 3 },
  profileEmail: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  editProfileBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
  },
  editProfileBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  goldDivider: { height: 2, backgroundColor: '#D4AF37', marginHorizontal: 20, opacity: 0.5 },
  filtersScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  filtersSectionTitle: { fontSize: 9, fontWeight: '900', color: '#888', letterSpacing: 1.5, marginBottom: 18 },
  filterBlock: { marginBottom: 20 },
  filterLabel: { fontSize: 8, fontWeight: '900', color: '#AAA', letterSpacing: 1.5, marginBottom: 10 },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: '#0B132B' },
  chipText: { fontSize: 10, fontWeight: '800', color: '#666' },
  chipTextActive: { color: '#FFF' },
  chipCheckmark: { fontSize: 10 },
  districtChip: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8,
  },
  applyBtn: {
    backgroundColor: '#0B132B', borderRadius: 25,
    paddingVertical: 14, alignItems: 'center', marginTop: 5,
  },
  applyBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#FFF5F5',
  },
  logoutIcon: { fontSize: 16, color: '#E74C3C', marginRight: 8, transform: [{ rotate: '180deg' }] },
  logoutText: { fontSize: 13, fontWeight: '900', color: '#E74C3C', letterSpacing: 0.5 },
});

export default DrawerMenu;
