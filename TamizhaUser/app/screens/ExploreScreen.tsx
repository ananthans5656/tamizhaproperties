import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  TextInput,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DrawerMenu from '../components/DrawerMenu';
import { getUserProfile } from '../services/api';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

const { width, height } = Dimensions.get('window');

const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Explore', label: 'EXPLORE', icon: '🗺️', route: 'Explore' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

const MAP_IMAGES = {
  satellite: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
  terrain: 'https://images.unsplash.com/photo-1568154691060-f748bccf3d58?auto=format&fit=crop&w=800&q=80',
};

const TAGS = ['RED SOIL', 'RIVER FRONT', 'VIP SECTOR', 'FARM LAND', 'HILL SIDE'];

const ExploreScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const activeTab = 'Explore';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'terrain'>('satellite');
  const [activeTags, setActiveTags] = useState<string[]>(['RIVER FRONT']);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    getUserProfile().then(p => {
      if (p?.avatarUri) setAvatarUri(p.avatarUri);
    }).catch(() => {});
  }, []);

  // Pulse animation for pins
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Investment range slider state
  const [rangeMin, setRangeMin] = useState(0.15);
  const [rangeMax, setRangeMax] = useState(0.55);
  const MIN_L = 25, MAX_L = 500;
  const priceMin = Math.round(MIN_L + (MAX_L - MIN_L) * rangeMin);
  const priceMax = Math.round(MIN_L + (MAX_L - MIN_L) * rangeMax);
  const fmtL = (l: number) => l >= 100 ? `₹${(l / 100).toFixed(1)}Cr` : `₹${l}L`;
  const plotCount = Math.round(240 - (rangeMin + (1 - rangeMax)) * 120);

  const MAP_PINS = [
    { id: 'p1', type: 'premium', label: '₹1.2Cr', icon: '💎', top: 0.32, left: 0.50,
      title: 'Kaveri Delta Premium Plot', price: '₹1.2 Cr', location: 'Thanjavur, Tamil Nadu',
      size: '5 Acres', tag: 'HOT DEAL',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
    { id: 'p2', type: 'heritage', label: '₹84.5L', icon: '🏛️', top: 0.35, left: 0.10,
      title: 'Heritage Farm Land', price: '₹84.5 L', location: 'Pollachi, Coimbatore',
      size: '12 Acres', tag: 'HERITAGE',
      image: 'https://images.unsplash.com/photo-1592595896616-c37162298647?auto=format&fit=crop&w=800&q=80' },
    { id: 'p3', type: 'hill', label: '₹68L', icon: '🏔️', top: 0.25, left: 0.30,
      title: 'Mist Valley Hill Plot', price: '₹68 L', location: 'Kodaikanal, Tamil Nadu',
      size: '2 Acres', tag: 'FOR SALE',
      image: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce66b?auto=format&fit=crop&w=800&q=80' },
    { id: 'p4', type: 'farm', label: '₹42L', icon: '🌾', top: 0.5, left: 0.65,
      title: 'Srirangam Farm Land', price: '₹42 L', location: 'Trichy Outskirts',
      size: '8 Acres', tag: 'DTCP',
      image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80' },
    { id: 'p5', type: 'beach', label: '₹3.5Cr', icon: '🌊', top: 0.44, left: 0.22,
      title: 'ECR Beachfront Land', price: '₹3.5 Cr', location: 'ECR Road, Chennai',
      size: '3 Acres', tag: 'PREMIUM',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80' },
  ];

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} navigation={navigation} />

      {/* Map Background Mock */}
      <ImageBackground 
        source={{ uri: MAP_IMAGES[mapType] }} 
        style={styles.mapBackground}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay} />

        {/* Top Header & Search Overlay */}
        <View style={[styles.topOverlay, { top: insets.top > 0 ? insets.top + 10 : 20 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
              <Text style={styles.headerIcon}>≡</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tamizha Properties</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchPill}>
            <Text style={styles.searchPin}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by soil type, district..."
              placeholderTextColor="#AAA"
            />
            <TouchableOpacity
              style={[styles.filterBtn, appliedFilters && { backgroundColor: '#D4AF37' }]}
              onPress={() => navigation.navigate('Filter', { onApply: setAppliedFilters })}
            >
              <Text style={styles.filterIcon}>≡̂</Text>
              {appliedFilters && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
          </View>
          
          {appliedFilters && (
            <View style={styles.activeFilterBar}>
              <Text style={styles.activeFilterTxt}>
                📍 {appliedFilters.district} · {appliedFilters.area?.split(' ')[0]}
                {appliedFilters.approvals?.length > 0 ? `  ·  ${appliedFilters.approvals.join('/')}` : ''}
                {'  ·  '}Up to ₹{appliedFilters.maxBudget >= 100 ? `${(appliedFilters.maxBudget / 100).toFixed(1)}Cr` : `${appliedFilters.maxBudget}L`}
              </Text>
              <TouchableOpacity onPress={() => setAppliedFilters(null)}>
                <Text style={styles.activeFilterClear}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={activeTags.includes(tag) ? styles.blackTag : styles.whiteTag}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}
              >
                <Text style={activeTags.includes(tag) ? styles.blackTagTxt : styles.whiteTagTxt}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Map Elements (Polygons & Pins) */}
        {/* Mock Polygon 1 */}
        <View style={[styles.polygon, { top: height * 0.4, left: width * 0.2, width: width * 0.3, height: width * 0.35, transform: [{ skewY: '-15deg' }] }]} />
        {/* Mock Polygon 2 */}
        <View style={[styles.polygon, { top: height * 0.38, left: width * 0.52, width: width * 0.28, height: width * 0.25, transform: [{ skewY: '-10deg' }] }]} />
        {/* Mock Polygon 3 */}
        <View style={[styles.polygon, { top: height * 0.58, left: width * 0.3, width: width * 0.3, height: width * 0.25, transform: [{ skewY: '-5deg' }] }]} />

        {/* ── Animated Property Pins ── */}
        {MAP_PINS.map(pin => (
          <TouchableOpacity
            key={pin.id}
            style={[styles.pinWrapper, { top: height * pin.top, left: width * pin.left }]}
            onPress={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
            activeOpacity={0.9}
          >
            {/* Pulse ring */}
            <Animated.View style={[
              styles.pinPulse,
              pin.type === 'premium' ? styles.pinPulseGold : styles.pinPulseBlue,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            {/* Pin bubble */}
            <View style={pin.type === 'premium' ? styles.mapPinBlack : styles.mapPinWhite}>
              <Text style={styles.pinEmoji}>{pin.icon}</Text>
              <Text style={pin.type === 'premium' ? styles.pinBlackTxt : styles.pinWhiteTxt}>{pin.label}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Property Popup Card ── */}
        {selectedPin && (
          <View style={[styles.popupCard, { top: height * selectedPin.top - 120, left: Math.min(width * selectedPin.left - 20, width - 200) }]}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupEmoji}>{selectedPin.icon}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.popupTitle} numberOfLines={2}>{selectedPin.title}</Text>
                <Text style={styles.popupLocation} numberOfLines={1}>📍 {selectedPin.location}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPin(null)}>
                <Text style={styles.popupClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.popupRow}>
              <View style={styles.popupTagChip}><Text style={styles.popupTagText}>{selectedPin.tag}</Text></View>
              <Text style={styles.popupSize}>📌 {selectedPin.size}</Text>
            </View>
            <View style={styles.popupFooter}>
              <Text style={styles.popupPrice}>{selectedPin.price}</Text>
              <TouchableOpacity
                style={styles.popupBtn}
                onPress={() => {
                  setSelectedPin(null);
                  navigation.navigate('PropertyDetails', {
                    propertyId: selectedPin.id,
                    title: selectedPin.title,
                    price: selectedPin.price,
                    location: selectedPin.location,
                    image: selectedPin.image,
                    tag: selectedPin.tag,
                  });
                }}
              >
                <Text style={styles.popupBtnText}>View →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Satellite / Terrain Toggle */}
        <View style={styles.satelliteToggle}>
          <TouchableOpacity
            style={mapType === 'satellite' ? styles.satBtnActive : styles.satBtnInactive}
            onPress={() => setMapType('satellite')}
          >
            <Text style={mapType === 'satellite' ? styles.satTxtActive : styles.satTxtInactive}>SATELLITE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={mapType === 'terrain' ? styles.satBtnActive : styles.satBtnInactive}
            onPress={() => setMapType('terrain')}
          >
            <Text style={mapType === 'terrain' ? styles.satTxtActive : styles.satTxtInactive}>TERRAIN</Text>
          </TouchableOpacity>
        </View>

        {/* ── Investment Range Card (bottom) ── */}
        <View style={[styles.investmentCard, { bottom: (56 + (insets.bottom > 0 ? insets.bottom + 8 : 10)) + 15 }]}>
          <View style={styles.invHeader}>
            <View>
              <Text style={styles.invTitle}>INVESTMENT RANGE</Text>
              <Text style={styles.invPrice}>{fmtL(priceMin)} – {fmtL(priceMax)}</Text>
            </View>
            <View style={styles.invTag}>
              <Text style={styles.invTagTxt}>{plotCount} Plots Found</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.crosshairBtn} onPress={() => setSelectedPin(null)}>
            <Text style={styles.crosshairIcon}>⊕</Text>
          </TouchableOpacity>

          {/* Range slider with two draggable knobs */}
          <View style={styles.sliderTrackBg}>
            <View style={[styles.sliderTrackLine, { left: `${rangeMin * 100}%`, width: `${(rangeMax - rangeMin) * 100}%` }]} />
            <TouchableOpacity
              style={[styles.sliderKnob, { left: `${rangeMin * 100}%` }]}
              onPress={() => setRangeMin(prev => Math.max(0, prev - 0.1))}
              hitSlop={{ top: 15, bottom: 15, left: 20, right: 10 }}
            />
            <TouchableOpacity
              style={[styles.sliderKnob, styles.sliderKnobGold, { left: `${rangeMax * 100}%` }]}
              onPress={() => setRangeMax(prev => Math.min(1, prev + 0.1))}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 20 }}
            />
          </View>
        </View>

        {/* Tab padding inside background */}
        <View style={{ height: (56 + (insets.bottom > 0 ? insets.bottom + 8 : 10)) + 15 }} />
      </ImageBackground>

      {/* Shared Bottom Tab Bar */}
      <View style={[styles.bottomTabContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
        {BottomTabIcons.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tabItem}
              onPress={() => {
                if (tab.route !== activeTab) {
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
    backgroundColor: '#FFF',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)', // light tint to map
  },
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  iconBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#0B132B',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B132B',
    letterSpacing: 0.5,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  searchPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 25,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  searchPin: {
    fontSize: 16,
    color: '#AAA',
    marginRight: 10,
    transform: [{ rotate: '45deg' }], // magnifying glass
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  filterBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#0B132B',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  filterIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  tagsContainer: {
    paddingHorizontal: 25,
  },
  whiteTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  whiteTagTxt: {
    color: '#0B132B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  blackTag: {
    backgroundColor: '#0B132B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  blackTagTxt: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  
  polygon: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)', // Gold lines
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  
  mapPinBlack: {
    position: 'absolute',
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  pinGoldIcon: {
    fontSize: 10,
    marginRight: 6,
  },
  pinBlackTxt: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapPinWhite: {
    position: 'absolute',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  pinGoldTxt: {
    color: '#888', // using grey to not clash, but design says heritage
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 8,
  },
  pinWhiteTxt: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  satelliteToggle: {
    position: 'absolute',
    bottom: height * 0.28,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  satBtnActive: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  satTxtActive: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  satBtnInactive: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  satTxtInactive: {
    color: '#888',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  investmentCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 85,
    left: 15,
    right: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 35,
    padding: 25,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  invHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  invTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  invPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  invTag: {
    backgroundColor: '#1C294A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10,
    marginTop: 15,
  },
  invTagTxt: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  crosshairBtn: {
    position: 'absolute',
    right: -10,
    top: 15,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  crosshairIcon: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '300',
  },
  sliderTrackBg: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    height: 4,
    backgroundColor: '#EAEAEA',
    borderRadius: 2,
  },
  sliderTrackLine: {
    position: 'absolute',
    left: '25%',
    width: '35%',
    height: 4,
    backgroundColor: '#D4AF37', // Gold track
    borderRadius: 2,
  },
  sliderKnob: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    marginLeft: -8,
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

  // ── Pin styles ──
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.3,
  },
  pinPulseGold: { backgroundColor: '#D4AF37' },
  pinPulseBlue: { backgroundColor: '#0D6EFD' },
  pinEmoji: { fontSize: 11 },

  // ── Popup card ──
  popupCard: {
    position: 'absolute',
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  popupHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  popupEmoji: { fontSize: 22 },
  popupTitle: { fontSize: 11, fontWeight: '900', color: '#111', lineHeight: 15 },
  popupLocation: { fontSize: 9, color: '#888', marginTop: 2 },
  popupClose: { fontSize: 14, color: '#BBB', paddingLeft: 6 },
  popupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  popupTagChip: { backgroundColor: '#0B132B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  popupTagText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  popupSize: { fontSize: 9, color: '#666', fontWeight: '700' },
  popupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popupPrice: { fontSize: 14, fontWeight: '900', color: '#0B132B' },
  popupBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  popupBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  filterBadge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFF' },
  activeFilterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', marginHorizontal: 25, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10 },
  activeFilterTxt: { fontSize: 10, fontWeight: '700', color: '#D4AF37', flex: 1 },
  activeFilterClear: { fontSize: 13, color: 'rgba(255,255,255,0.6)', paddingLeft: 8 },

  // Gold slider knob for explore card
  sliderKnobGold: { borderColor: '#D4AF37' },
});

export default ExploreScreen;
