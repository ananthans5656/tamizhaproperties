import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { api, getUserSession, clearToken, clearUserSession, getSavedProperties, toggleSavedProperty, normalizeImageUrl } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DrawerMenu from '../components/DrawerMenu';
import { CommonActions } from '@react-navigation/native';
import RangeSlider from '../components/RangeSlider';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37'; // Added to fix the color crash




const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Saved', label: 'SAVED', icon: '❤️', route: 'SavedProperties' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

const pricePoints = ['₹50L', '₹5Cr', '₹15Cr', '₹25Cr', '₹35Cr', '₹50Cr'];

const DashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [properties, setProperties] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [drawerFilters, setDrawerFilters] = useState<{
    landTypes?: string[];
    district?: string;
    approvals?: string[];
  } | null>(null);

  const [dbUserName, setDbUserName] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearToken();
            await clearUserSession();
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
            );
          },
        },
      ]
    );
  };
  
  const DISTRICTS = ['ALL', 'TIRUNELVELI', 'TENKASI', 'NAGERCOIL', 'THOOTHUKUDI', 'COIMBATORE', 'CHENNAI'];
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  useEffect(() => {
    getUserSession().then(session => {
      if (session?.name) setDbUserName(session.name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getSavedProperties().then(saved => setFavorites(saved)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getProperties().then(items => {
      const mapped = items.map((data: any) => {
        const rawPrice = parseFloat(String(data.price || '0'));
        const priceLakhs = rawPrice >= 100000 ? rawPrice / 100000 : rawPrice;
        const priceLabel = priceLakhs >= 100
          ? `₹${(priceLakhs / 100).toFixed(2)}Cr`
          : `₹${priceLakhs % 1 === 0 ? priceLakhs : priceLakhs.toFixed(1)}L`;
        return {
          id: data.id,
          title: data.title || '',
          price: priceLabel,
          priceLakhs,
          priceLabel: 'TOTAL',
          location: data.location || '',
          size: data.grounds || data.ground ? `${data.ground} Ground` : '—',
          amenity: data.type || 'Standard',
          tag: '',
          image: (Array.isArray(data.images) && data.images[0])
            ? normalizeImageUrl(data.images[0])
            : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
          district: data.district || '',
          isSoldOut: (data.status || '').toUpperCase() === 'SOLD',
          pill1: data.ground ? `${data.ground} Ground` : (data.sqft ? `${data.sqft} sqft` : '—'),
          pill2: data.sqft ? `${data.sqft} sqft` : null,
          ...data,
        };
      });
      setProperties(mapped);
    }).catch(err => console.error('Properties fetch error:', err));
  }, []);

  const parsePriceToNumber = (item: any): number => {
    if (item.priceLakhs) return item.priceLakhs;
    const raw = parseFloat(String(item.price || '0').replace(/[^0-9.]/g, ''));
    if (isNaN(raw)) return 0;
    if (String(item.price || '').toUpperCase().includes('CR')) return raw * 100;
    return raw >= 1000 ? raw / 100000 : raw;
  };

  // Perform dynamic filtering in real-time
  const filteredProperties = React.useMemo(() => {
    return properties.filter((item: any) => {
      // 1. Top District Filter Tab
      if (selectedDistrict !== 'ALL') {
        const matchesDistrict = 
          (item.location && String(item.location).toUpperCase().includes(selectedDistrict)) ||
          (item.district && String(item.district).toUpperCase() === selectedDistrict);
        if (!matchesDistrict) return false;
      }

      // 2. Search box query
      if (searchText.trim().length > 0) {
        const query = searchText.toLowerCase().trim();
        const title = String(item.title || item.name || '').toLowerCase();
        const location = String(item.location || '').toLowerCase();
        if (!title.includes(query) && !location.includes(query)) return false;
      }

      // 3. Price Range Filter
      const priceNum = parsePriceToNumber(item);
      if (priceNum > 0) {
        const minLakhs = minPrice && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : 0;
        const maxLakhs = maxPrice && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) : Infinity;
        if (priceNum < minLakhs || priceNum > maxLakhs) return false;
      }

      // 4. Advanced Drawer Filters
      if (drawerFilters) {
        // Land type checks
        if (drawerFilters.landTypes && drawerFilters.landTypes.length > 0) {
          const matchesType = drawerFilters.landTypes.some(type => {
            const amenity = (item.amenity || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const typeLower = type.toLowerCase();
            return amenity.includes(typeLower) || desc.includes(typeLower) || title.includes(typeLower);
          });
          if (!matchesType) return false;
        }

        // District check inside drawer
        if (drawerFilters.district && String(drawerFilters.district).toUpperCase() !== 'ALL') {
          const d = String(drawerFilters.district).toUpperCase();
          const matchesDrawerDistrict = 
            (item.location && String(item.location).toUpperCase().includes(d)) ||
            (item.district && String(item.district).toUpperCase() === d);
          if (!matchesDrawerDistrict) return false;
        }

        // Approval checks
        if (drawerFilters.approvals && drawerFilters.approvals.length > 0) {
          const matchesApproval = drawerFilters.approvals.some(appr => {
            const title = (item.title || '').toUpperCase();
            const desc = (item.description || '').toUpperCase();
            const apprUpper = appr.toUpperCase();
            if (apprUpper === 'RERA' && item.isReraVerified) return true;
            return title.includes(apprUpper) || desc.includes(apprUpper);
          });
          if (!matchesApproval) return false;
        }
      }

      return true;
    });
  }, [properties, selectedDistrict, searchText, minPrice, maxPrice, drawerFilters]);

  // Partition properties into Featured and Exclusive lists
  const featuredProperties = React.useMemo(() => {
    return filteredProperties.filter((item: any) => item.tag === 'FEATURED' || item.isPrimeAsset);
  }, [filteredProperties]);

  const exclusiveListings = React.useMemo(() => {
    return filteredProperties.filter((item: any) => item.tag !== 'FEATURED' && !item.isPrimeAsset);
  }, [filteredProperties]);



  const toggleFavorite = async (item: any) => {
    try {
      const nowSaved = await toggleSavedProperty(item.id);
      if (nowSaved) {
        setFavorites(prev => [...prev, item.id]);
      } else {
        setFavorites(prev => prev.filter(id => id !== item.id));
      }
    } catch (e) {
      console.log('Error toggling favorite:', e);
    }
  };

  const renderFeatured = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.featuredCard} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PropertyDetails', {
        propertyId: item.id,
        title: item.title,
        price: item.price,
        priceLabel: item.priceLabel,
        location: item.location,
        size: item.size,
        image: item.image,
        tag: item.tag,
        offerCode: (item as any).offerCode,
        offerValue: (item as any).offerValue,
        bankOffer: (item as any).bankOffer,
        partnerOffer: (item as any).partnerOffer,
      })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.featuredImage} resizeMode="cover" />
        <View style={styles.featuredTag}>
          <Text style={styles.featuredTagText}>{item.tag}</Text>
        </View>
        <TouchableOpacity style={styles.heartButton} onPress={() => toggleFavorite(item)}>
          <Text style={styles.heartIcon}>{favorites.includes(item.id) ? '❤️' : '♡'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.featuredInfo}>
        <View style={styles.featuredHeaderRow}>
          <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.featuredPrice}>{item.price}</Text>
            <Text style={styles.priceLabel}>{item.priceLabel}</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        
        <View style={styles.pillsRow}>
          <View style={styles.pill}><Text style={styles.pillIcon}>▦</Text><Text style={styles.pillText}>{item.size}</Text></View>
          <View style={styles.pill}><Text style={styles.pillIcon}>💧</Text><Text style={styles.pillText}>{item.amenity}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TAMIZHA PROPERTIES</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.bellIcon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Premium Welcome Greeting */}
        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.welcomeName}>{dbUserName || 'Respected Investor'}</Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipText}>PLATINUM</Text>
              </View>
            </View>
            <Text style={styles.welcomeQuote}>Ready for your next big investment?</Text>
          </View>
          <View style={styles.welcomeIconBg}>
            <Text style={{fontSize: 24}}>💎</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchPin}>📍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search land, plots, location"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')} style={{ marginRight: 8 }}>
              <Text style={{ fontSize: 16, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchBtnIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* District Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.districtScroll}
          contentContainerStyle={{ paddingHorizontal: 25, gap: 10 }}
        >
          {DISTRICTS.map(d => (
            <TouchableOpacity 
              key={d} 
              style={[styles.districtPill, selectedDistrict === d && styles.districtPillActive]}
              onPress={() => setSelectedDistrict(d)}
            >
              <Text style={[styles.districtPillT, selectedDistrict === d && styles.districtPillActiveT]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Investment Range Filter */}
        <View style={styles.investmentContainer}>
          <Text style={styles.investmentLabel}>INVESTMENT RANGE (In Lakhs)</Text>
          <RangeSlider
            onValuesChange={(min, max) => {
              setMinPrice(min === 0 ? '' : min.toString());
              setMaxPrice(max === 500 ? '' : max.toString());
            }}
          />
        </View>

        {/* Featured Collections */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Collections</Text>
              <Text style={styles.sectionSubtitle}>Handpicked premium properties</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AllListings')}>
              <Text style={styles.viewAllText}>View All {'>'}</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList 
            horizontal
            data={featuredProperties}
            renderItem={renderFeatured}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredListContainer}
            snapToInterval={width * 0.85 + 15}
            decelerationRate="fast"
          />
        </View>

        {/* Exclusive Listings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exclusive Listings</Text>
            <TouchableOpacity style={styles.resultsPill} onPress={() => navigation.navigate('AllListings')}>
              <Text style={styles.resultsText}>{filteredProperties.length} Results →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            {exclusiveListings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                activeOpacity={0.9}
                  onPress={() => navigation.navigate('PropertyDetails', {
                    propertyId: item.id,
                    title: item.title,
                    price: item.price,
                    priceLabel: item.priceLabel,
                    location: item.location,
                    size: item.size || item.pill1,
                    image: item.image,
                    tag: item.tag,
                    offerCode: item.offerCode,
                    offerValue: item.offerValue,
                    bankOffer: item.bankOffer,
                    partnerOffer: item.partnerOffer,
                  })}
              >
                <View style={styles.gridImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.gridImage} />
                  {item.tag ? (
                    <View style={[styles.gridTag, { backgroundColor: item.tagColor || '#FFF' }]}>
                      <Text style={[styles.gridTagText, { color: item.tagColor ? '#FFF' : '#333' }]}>{item.tag}</Text>
                    </View>
                  ) : (item.offerCode || item.title.includes('Srirangam') || item.title.includes('Pollachi')) ? (
                    <View style={[styles.gridTag, { backgroundColor: '#FFD700', borderRadius: 4 }]}>
                      <Text style={[styles.gridTagText, { color: '#000', fontSize: 7, fontWeight: '900' }]}>🎁 SPECIAL OFFER</Text>
                    </View>
                  ) : null}
                  {item.isSoldOut && (
                    <View style={styles.soldOutOverlay}>
                      <View style={styles.soldOutBanner}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
                      </View>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={styles.smallHeartButton}
                    onPress={(e) => { e.stopPropagation?.(); toggleFavorite(item); }}
                  >
                    <Text style={styles.smallHeartIcon}>{favorites.includes(item.id) ? '❤️' : '♡'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.gridInfo}>
                  <View style={styles.gridHeaderRow}>
                    <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.gridPrice}>{item.price}</Text>
                  </View>
                  
                  <View style={styles.locationRowSmall}>
                    <Text style={styles.locationPinSmall}>📍</Text>
                    <Text style={styles.locationTextSmall} numberOfLines={1}>{item.location}</Text>
                  </View>
                  
                  <View style={styles.pillsRowSmall}>
                    <View style={styles.pillSmall}><Text style={styles.pillIconSmall}>▦</Text><Text style={styles.pillTextSmall}>{item.pill1}</Text></View>
                    {item.pill2 && <View style={styles.pillSmall}><Text style={styles.pillIconSmall}>💧</Text><Text style={styles.pillTextSmall}>{item.pill2}</Text></View>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom padding for tabs */}
        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
        {BottomTabIcons.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tabItem}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.route !== 'Dashboard') {
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

      {/* Drawer */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        onApplyFilters={(filters) => setDrawerFilters(filters)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Very light grey bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 0.5,
  },
  bellIcon: {
    fontSize: 18,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 16,
    color: '#DC2626',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D6EFD', // Primary blue dot
    borderWidth: 1,
    borderColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
    marginHorizontal: 20,
    marginTop: 10,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 2,
    marginBottom: 5,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0A1128',
    letterSpacing: -0.5,
  },
  vipBadge: {
    backgroundColor: '#0A1128',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
  },
  vipText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  welcomeQuote: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    fontWeight: '500',
  },
  welcomeIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchPin: {
    fontSize: 16,
    color: '#0D6EFD',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  searchBtn: {
    backgroundColor: '#0D6EFD',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchBtnIcon: {
    color: '#FFF',
    fontSize: 16,
  },
  investmentContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 25,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  investmentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  investmentManualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceInput: {
    flex: 0.45,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#0A1128',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  investmentValueDash: {
    fontSize: 18,
    color: '#CCC',
  },
  sectionContainer: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    fontWeight: '500',
  },
  viewAllText: {
    color: '#0D6EFD',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredListContainer: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  featuredCard: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  imageContainer: {
    height: 185,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E8EDF2',
  },
  featuredImage: {
    width: '100%',
    height: 185,
    backgroundColor: '#DDE3EC',
  },
  featuredTag: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#357AE8', // Brand blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heartIcon: {
    color: '#333',
    fontSize: 18,
    marginTop: -2,
  },
  featuredInfo: {
    padding: 18,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    flex: 1,
    marginRight: 10,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  priceLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 15,
  },
  locationPin: {
    fontSize: 12,
    color: '#0D6EFD',
    marginRight: 4, // Added to fix location rendering layout issues in older engines
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  pillIcon: {
    fontSize: 12,
    color: '#0D6EFD',
    marginRight: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
  },
  resultsPill: {
    backgroundColor: '#EEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#555',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImageContainer: {
    height: 120,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridTagText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBanner: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 15,
    paddingVertical: 5,
    transform: [{ rotate: '-15deg' }],
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  smallHeartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallHeartIcon: {
    fontSize: 14,
    color: '#333',
    marginTop: -2,
  },
  gridInfo: {
    padding: 12,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    flex: 1,
    marginRight: 6,
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },
  locationRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationPinSmall: {
    fontSize: 10,
    color: '#0D6EFD',
    marginRight: 4,
  },
  locationTextSmall: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  pillsRowSmall: {
    flexDirection: 'row',
  },
  pillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  pillIconSmall: {
    fontSize: 10,
    color: '#0D6EFD',
    marginRight: 4,
  },
  pillTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#444',
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
  districtScroll: { marginVertical: 15 },
  districtPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 40, justifyContent: 'center' },
  districtPillActive: { backgroundColor: GOLD, borderColor: GOLD },
  districtPillT: { fontSize: 9, fontWeight: '900', color: '#666', letterSpacing: 1 },
  districtPillActiveT: { color: '#000' },
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
    backgroundColor: '#E8F1FF', // Light blue background
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
  adjustBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0A1128',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adjustBtnGold: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adjustBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen;
