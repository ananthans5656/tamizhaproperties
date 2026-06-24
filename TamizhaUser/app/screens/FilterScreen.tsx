import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  PanResponder,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Erode', 'Tiruppur', 'Vellore', 'Thanjavur', 'Pollachi', 'Kodaikanal'];
const PRIME_AREAS: Record<string, string[]> = {
  Chennai: ['OMR (Old Mahabalipuram Road)', 'ECR Road', 'Anna Nagar', 'Velachery', 'Perungudi'],
  Coimbatore: ['Avinashi Road', 'Gandhipuram', 'RS Puram', 'Peelamedu'],
  Madurai: ['Bypass Road', 'Anna Nagar', 'Thirunagar'],
  Trichy: ['Trichy Outskirts', 'Srirangam', 'Alundur Road'],
  Pollachi: ['Pollachi Town', 'Anaimalai Road', 'Kinathukadavu'],
  Kodaikanal: ['Vilpatti', 'Attuvampatti', 'Kodai Road'],
};

const FilterScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  // Investment Range
  const [sortOrder, setSortOrder] = useState<'low-high' | 'high-low'>('low-high');
  const [sliderValue, setSliderValue] = useState(0.5); // 0 to 1
  const sliderTrackRef = useRef<View>(null);
  const [sliderTrackX, setSliderTrackX] = useState(0);
  const [sliderTrackWidth, setSliderTrackWidth] = useState(width - 90);

  // Location
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const [selectedArea, setSelectedArea] = useState('OMR (Old Mahabalipuram Road)');
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Approval Status
  const [approvals, setApprovals] = useState<string[]>(['DTCP']);

  // Facing Direction
  const [facing, setFacing] = useState('NORTH');

  // Connectivity switches
  const [nearHighway, setNearHighway] = useState(true);
  const [nearSchool, setNearSchool] = useState(false);
  const [nearHospital, setNearHospital] = useState(false);

  // Resources checkboxes
  const [waterFacility, setWaterFacility] = useState(true);
  const [soilReport, setSoilReport] = useState(false);
  const [electricityReady, setElectricityReady] = useState(false);

  const minPrice = 50; // in Lakhs
  const maxPrice = 5000; // 50 Crores in Lakhs
  const currentPrice = Math.round(minPrice + (maxPrice - minPrice) * sliderValue);

  const formatPrice = (lakhs: number) => {
    if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)} Cr`;
    return `₹${lakhs} L`;
  };

  const toggleApproval = (type: string) => {
    setApprovals(prev =>
      prev.includes(type) ? prev.filter(a => a !== type) : [...prev, type]
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newVal = Math.max(0, Math.min(1, (gestureState.moveX - sliderTrackX) / sliderTrackWidth));
        setSliderValue(newVal);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const handleReset = () => {
    setSortOrder('low-high');
    setSliderValue(0.5);
    setSelectedDistrict('Chennai');
    setSelectedArea('OMR (Old Mahabalipuram Road)');
    setApprovals(['DTCP']);
    setFacing('NORTH');
    setNearHighway(true);
    setNearSchool(false);
    setNearHospital(false);
    setWaterFacility(true);
    setSoilReport(false);
    setElectricityReady(false);
  };

  const handleApply = () => {
    const filters = {
      district: selectedDistrict,
      area: selectedArea,
      maxBudget: currentPrice,
      sortOrder,
      approvals,
      facing,
      nearHighway,
      nearSchool,
      nearHospital,
      waterFacility,
      soilReport,
      electricityReady,
    };
    if (route?.params?.onApply) {
      route.params.onApply(filters);
    }
    navigation.goBack();
  };

  const areas = PRIME_AREAS[selectedDistrict] || ['Main Area', 'Town Center'];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADVANCED FILTERS</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetAllText}>RESET ALL</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Financial Portfolio ── */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>FINANCIAL PORTFOLIO</Text>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Investment{'\n'}Range</Text>
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleBtn, sortOrder === 'low-high' && styles.toggleBtnActive]}
                onPress={() => setSortOrder('low-high')}
              >
                <Text style={sortOrder === 'low-high' ? styles.toggleTextActive : styles.toggleText}>₹ Low - High</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, sortOrder === 'high-low' && styles.toggleBtnActive]}
                onPress={() => setSortOrder('high-low')}
              >
                <Text style={sortOrder === 'high-low' ? styles.toggleTextActive : styles.toggleText}>₹ High - Low</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sliderCard}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelDark}>₹50 Lakhs</Text>
              <Text style={styles.sliderLabelGold}>{formatPrice(currentPrice)}</Text>
            </View>
            {/* Interactive Slider */}
            <View
              style={styles.sliderTrackBg}
              ref={sliderTrackRef}
              onLayout={(e) => {
                setSliderTrackX(e.nativeEvent.layout.x + 25); // 25 = scrollContent padding
                setSliderTrackWidth(e.nativeEvent.layout.width);
              }}
              {...panResponder.panHandlers}
            >
              <View style={[styles.sliderTrackActive, { width: `${sliderValue * 100}%` }]} />
              <View style={[styles.sliderThumb, { left: `${sliderValue * 100}%` }]} />
            </View>
            <Text style={styles.sliderHelper}>Slide to adjust your investment capacity</Text>
          </View>
        </View>

        {/* ── Asset Location ── */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>ASSET LOCATION</Text>
          <Text style={styles.sectionTitle}>Strategic Districts</Text>

          {/* State - static */}
          <View style={styles.inputPillGrey}>
            <View>
              <Text style={styles.inputLabel}>STATE</Text>
              <Text style={styles.inputText}>Tamil Nadu</Text>
            </View>
            <Text style={styles.inputIconGold}>🗺</Text>
          </View>

          {/* District Picker */}
          <TouchableOpacity style={styles.inputPillWhite} onPress={() => setShowDistrictPicker(true)} activeOpacity={0.8}>
            <View>
              <Text style={styles.inputLabel}>SELECT DISTRICT</Text>
              <Text style={styles.inputText}>{selectedDistrict}</Text>
            </View>
            <Text style={styles.inputIcon}>▽</Text>
          </TouchableOpacity>

          {/* Area Picker */}
          <TouchableOpacity style={styles.inputPillWhite} onPress={() => setShowAreaPicker(true)} activeOpacity={0.8}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.inputLabel}>SELECT PRIME AREA</Text>
              <Text style={styles.inputText} numberOfLines={1}>{selectedArea}</Text>
            </View>
            <Text style={styles.inputIcon}>▽</Text>
          </TouchableOpacity>
        </View>

        {/* ── Legal Compliance ── */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>LEGAL COMPLIANCE</Text>
          <Text style={styles.sectionTitle}>Approval Status</Text>

          <View style={styles.pillsRow}>
            <TouchableOpacity
              style={[styles.statusPill, approvals.includes('DTCP') && styles.statusPillActive]}
              onPress={() => toggleApproval('DTCP')}
              activeOpacity={0.8}
            >
              {approvals.includes('DTCP') && <Text style={styles.statusPillIconActive}>🛡</Text>}
              <Text style={approvals.includes('DTCP') ? styles.statusPillTextActive : styles.statusPillText}>DTCP APPROVED</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusPill, approvals.includes('CMDA') && styles.statusPillActive]}
              onPress={() => toggleApproval('CMDA')}
              activeOpacity={0.8}
            >
              {approvals.includes('CMDA') && <Text style={styles.statusPillIconActive}>🛡</Text>}
              <Text style={approvals.includes('CMDA') ? styles.statusPillTextActive : styles.statusPillText}>CMDA APPROVED</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.statusPill, { alignSelf: 'flex-start', marginTop: 10 }, approvals.includes('PATTA') && styles.statusPillActive]}
            onPress={() => toggleApproval('PATTA')}
            activeOpacity={0.8}
          >
            {approvals.includes('PATTA') && <Text style={styles.statusPillIconActive}>🛡</Text>}
            <Text style={approvals.includes('PATTA') ? styles.statusPillTextActive : styles.statusPillText}>PATTA LAND</Text>
          </TouchableOpacity>
        </View>

        {/* ── Vastu & Orientation ── */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>VASTU & ORIENTATION</Text>
          <Text style={styles.sectionTitle}>Facing Direction</Text>

          <View style={styles.facingRow}>
            {[
              { label: 'NORTH', icon: '↑' },
              { label: 'EAST', icon: '→' },
              { label: 'WEST', icon: '←' },
              { label: 'SOUTH', icon: '↓' },
            ].map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={facing === label ? styles.facingCircleActive : styles.facingCircle}
                onPress={() => setFacing(label)}
                activeOpacity={0.8}
              >
                <Text style={facing === label ? styles.facingIcon : styles.facingIconGrey}>{icon}</Text>
                <Text style={facing === label ? styles.facingTextActive : styles.facingText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Connectivity ── */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>CONNECTIVITY</Text>
          <Text style={styles.sectionTitle}>Nearby Amenities</Text>

          {[
            { label: 'Near Highway', icon: '🛣', value: nearHighway, toggle: () => setNearHighway(p => !p) },
            { label: 'Near School', icon: '🎓', value: nearSchool, toggle: () => setNearSchool(p => !p) },
            { label: 'Near Hospital', icon: '🏥', value: nearHospital, toggle: () => setNearHospital(p => !p) },
          ].map(({ label, icon, value, toggle }) => (
            <TouchableOpacity key={label} style={styles.toggleRowCard} onPress={toggle} activeOpacity={0.8}>
              <View style={styles.toggleRowInner}>
                <Text style={styles.toggleIcon}>{icon}</Text>
                <Text style={styles.toggleRowText}>{label}</Text>
              </View>
              <View style={value ? styles.switchActive : styles.switchInactive}>
                <View style={value ? styles.switchKnobRight : styles.switchKnobLeft} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Resources ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionSubtitle}>RESOURCES</Text>
          <Text style={styles.sectionTitle}>Soil & Utilities</Text>

          {[
            { label: 'Water Facility', sub: 'UNDERGROUND SUPPLY', icon: '💧', value: waterFacility, toggle: () => setWaterFacility(p => !p) },
            { label: 'Soil Report', sub: 'AVAILABLE FOR REVIEW', icon: '〽️', value: soilReport, toggle: () => setSoilReport(p => !p) },
            { label: 'Electricity Ready', sub: 'EB CONNECTION', icon: '⚡', value: electricityReady, toggle: () => setElectricityReady(p => !p) },
          ].map(({ label, sub, icon, value, toggle }) => (
            <TouchableOpacity key={label} style={styles.resourceCard} onPress={toggle} activeOpacity={0.8}>
              <View style={styles.resourceIconBg}><Text style={styles.resourceIconTxt}>{icon}</Text></View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{label}</Text>
                <Text style={styles.resourceSub}>{sub}</Text>
              </View>
              <View style={value ? styles.checkboxActive : styles.checkboxInactive}>
                {value && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 20 }]}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>RESET</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>APPLY FILTERS ▼</Text>
        </TouchableOpacity>
      </View>

      {/* District Picker Modal */}
      <Modal visible={showDistrictPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDistrictPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>SELECT DISTRICT</Text>
            <ScrollView>
              {DISTRICTS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.modalItem, selectedDistrict === d && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedDistrict(d);
                    setSelectedArea((PRIME_AREAS[d] || ['Main Area'])[0]);
                    setShowDistrictPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedDistrict === d && styles.modalItemTextActive]}>{d}</Text>
                  {selectedDistrict === d && <Text style={styles.modalCheckmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Area Picker Modal */}
      <Modal visible={showAreaPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAreaPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>SELECT PRIME AREA</Text>
            <ScrollView>
              {areas.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.modalItem, selectedArea === a && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedArea(a);
                    setShowAreaPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedArea === a && styles.modalItemTextActive]}>{a}</Text>
                  {selectedArea === a && <Text style={styles.modalCheckmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40 },
  backIcon: { fontSize: 24, color: '#000' },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, color: '#111' },
  resetAllText: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },
  section: { marginBottom: 35 },
  sectionSubtitle: { fontSize: 8, fontWeight: '900', color: '#888', letterSpacing: 1.5, marginBottom: 5 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#111', lineHeight: 24, marginBottom: 15 },

  // Investment Sort Toggle
  togglePill: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 20, padding: 3 },
  toggleBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  toggleBtnActive: { backgroundColor: '#0B132B' },
  toggleText: { fontSize: 9, fontWeight: '800', color: '#888' },
  toggleTextActive: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  // Slider
  sliderCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sliderLabelDark: { fontSize: 12, fontWeight: '900', color: '#000' },
  sliderLabelGold: { fontSize: 12, fontWeight: '900', color: '#D4AF37' },
  sliderTrackBg: { height: 4, backgroundColor: '#EEE', borderRadius: 2, position: 'relative', marginVertical: 10 },
  sliderTrackActive: { position: 'absolute', left: 0, top: 0, height: '100%', backgroundColor: '#0B132B', borderRadius: 2 },
  sliderThumb: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 3, borderColor: '#D4AF37', marginLeft: -8 },
  sliderHelper: { fontSize: 9, color: '#AAA', fontStyle: 'italic', textAlign: 'center', marginTop: 15 },

  // Location inputs
  inputPillGrey: { backgroundColor: '#F3F4F6', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputPillWhite: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  inputLabel: { fontSize: 8, fontWeight: '900', color: '#888', letterSpacing: 1, marginBottom: 4 },
  inputText: { fontSize: 13, fontWeight: '800', color: '#111' },
  inputIconGold: { color: '#D4AF37', fontSize: 16 },
  inputIcon: { color: '#AAA', fontSize: 12 },

  // Approval pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  statusPill: { backgroundColor: '#F0F0F0', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, marginRight: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusPillActive: { backgroundColor: '#0B132B' },
  statusPillText: { fontSize: 9, fontWeight: '900', color: '#666', letterSpacing: 0.5 },
  statusPillTextActive: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  statusPillIconActive: { color: '#FFF', marginRight: 6, fontSize: 12 },

  // Facing
  facingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  facingCircle: { width: width * 0.18, height: width * 0.18, borderRadius: width * 0.09, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  facingCircleActive: { width: width * 0.18, height: width * 0.18, borderRadius: width * 0.09, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#0B132B' },
  facingIcon: { fontSize: 18, color: '#0B132B', marginBottom: 2 },
  facingIconGrey: { fontSize: 18, color: '#999', marginBottom: 2 },
  facingText: { fontSize: 8, fontWeight: '800', color: '#999' },
  facingTextActive: { fontSize: 8, fontWeight: '800', color: '#0B132B' },

  // Connectivity toggles
  toggleRowCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggleRowInner: { flexDirection: 'row', alignItems: 'center' },
  toggleIcon: { fontSize: 16, marginRight: 15 },
  toggleRowText: { fontSize: 13, fontWeight: '800', color: '#111' },
  switchActive: { width: 45, height: 24, borderRadius: 12, backgroundColor: '#E0AD4D', justifyContent: 'center', paddingHorizontal: 2 },
  switchKnobRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignSelf: 'flex-end' },
  switchInactive: { width: 45, height: 24, borderRadius: 12, backgroundColor: '#E0E0E0', justifyContent: 'center', paddingHorizontal: 2 },
  switchKnobLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignSelf: 'flex-start' },

  // Resources
  resourceCard: { backgroundColor: '#F3F4F6', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resourceIconBg: { backgroundColor: '#FFF', width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  resourceIconTxt: { fontSize: 16 },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 12, fontWeight: '900', color: '#111', marginBottom: 2 },
  resourceSub: { fontSize: 8, fontWeight: '800', color: '#888', letterSpacing: 0.5 },
  checkboxActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0AD4D', alignItems: 'center', justifyContent: 'center' },
  checkboxTick: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  checkboxInactive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#DDD', backgroundColor: '#FFF' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F8F9FA', flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20, borderTopWidth: 1, borderTopColor: '#EEE' },
  resetBtn: { flex: 0.4, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 30, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  resetBtnText: { fontSize: 10, fontWeight: '900', color: '#111', letterSpacing: 1 },
  applyBtn: { flex: 0.6, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B132B', borderRadius: 30 },
  applyBtnText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 11, fontWeight: '900', color: '#888', letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalItemActive: { backgroundColor: '#F8F4E6' },
  modalItemText: { fontSize: 14, fontWeight: '700', color: '#333' },
  modalItemTextActive: { color: '#0B132B', fontWeight: '900' },
  modalCheckmark: { color: '#D4AF37', fontSize: 16, fontWeight: '900' },
});

export default FilterScreen;
