import React, { useState, useMemo, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   TextInput,
   SafeAreaView,
   StatusBar,
   Image,
   Alert,
   Modal,
   Share,
} from 'react-native';
import { api, normalizeImageUrl } from '../services/api';

const GOLD = '#C9A84C';

type PropertyItem = {
    id: string;
    name: string;
    location: string;
    price: string;
    priceNum: number;
    image: string;
    status: 'ACTIVE' | 'PENDING' | 'SOLD';
    sqft: number;
    grounds: string;
    tag: string;
    verified: boolean;
    district?: string;
};

const BUDGET_OPTIONS = [
    { label: 'ALL BUDGETS', value: 0 },
    { label: 'UP TO ₹10L', value: 10 },
    { label: 'UP TO ₹20L', value: 20 },
    { label: 'UP TO ₹30L', value: 30 },
    { label: 'UP TO ₹40L', value: 40 },
    { label: 'UP TO ₹50L', value: 50 },
    { label: 'ABOVE ₹50L', value: 51 },
];

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'SOLD'];

const ALL_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai',
  'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupattur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar', 'Nagercoil', 'Malaysia',
];

const SIZE_OPTIONS = [
    { label: 'ANY SIZE', value: 0 },
    { label: '1/4 GROUND (600 sqft)', value: 600 },
    { label: '1/2 GROUND (1200 sqft)', value: 1200 },
    { label: '1 GROUND (2400 sqft)', value: 2400 },
    { label: '2 GROUND (4356 sqft)', value: 4356 },
    { label: '5 GROUND (11000 sqft)', value: 11000 },
    { label: '10 GROUND (22000 sqft)', value: 22000 },
];

const INITIAL_PROPERTIES: PropertyItem[] = [
    { id: '1', name: 'Paradise Valley Acres', location: 'Coimbatore', price: '₹28.5 L', priceNum: 28.5, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', status: 'ACTIVE', sqft: 2400, grounds: '1 Ground', tag: 'PREMIUM', verified: true },
    { id: '2', name: 'The Zen Retreat', location: 'Ooty Hills', price: '₹12.2 L', priceNum: 12.2, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', status: 'PENDING', sqft: 1200, grounds: '1/2 Ground', tag: 'HILLSIDE', verified: true },
    { id: '3', name: 'Emerald Heights', location: 'Chennai ECR', price: '₹55.0 L', priceNum: 55, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', status: 'ACTIVE', sqft: 4356, grounds: '2 Ground', tag: 'BEACHFRONT', verified: true },
    { id: '4', name: 'Sapphire Residency', location: 'Madurai', price: '₹18.0 L', priceNum: 18, image: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009?w=800', status: 'ACTIVE', sqft: 600, grounds: '1/4 Ground', tag: 'URBAN', verified: false },
];

interface PropertiesScreenProps {
   navigation: any;
   route: any;
   activeNotifs: any[];
   clearAllNotifs: () => void;
   isDark?: boolean;
}

const PropertiesScreen = ({ navigation, route, activeNotifs, clearAllNotifs, isDark = false }: PropertiesScreenProps) => {
   const filterHub = route?.params?.filterHub || '';
   const [properties, setProperties] = useState<PropertyItem[]>(INITIAL_PROPERTIES);
   const [search, setSearch] = useState(filterHub);
   const [budgetFilter, setBudgetFilter] = useState(0);
   const [sizeFilter, setSizeFilter] = useState(0);
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [districtFilter, setDistrictFilter] = useState('ALL');
   const [showNotifs, setShowNotifs] = useState(false);
   const [districtModalVisible, setDistrictModalVisible] = useState(false);

   const districtOptions = ['ALL', ...ALL_DISTRICTS];

   const handleDelete = (item: PropertyItem) => {
     Alert.alert(
       'Delete Property',
       `Are you sure you want to delete "${item.name}"?\n\nThis will permanently remove it from the database and the user app.`,
       [
         { text: 'Cancel', style: 'cancel' },
         {
           text: 'Delete', style: 'destructive',
           onPress: async () => {
             try {
               await api.deleteProperty(item.id);
               setProperties(prev => prev.filter(p => p.id !== item.id));
             } catch (err: any) {
               Alert.alert('Error', err?.message || 'Delete failed');
             }
           },
         },
       ]
     );
   };

   const activeFilterCount = [
     budgetFilter !== 0,
     sizeFilter !== 0,
     statusFilter !== 'ALL',
     districtFilter !== 'ALL',
   ].filter(Boolean).length;

   const filteredProps = useMemo(() => {
       return properties.filter(p => {
           const districtMatch = p.district ? p.district.toLowerCase().includes(search.toLowerCase()) : false;
           const matchSearch = !search.trim() ||
                              (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                              (p.location || '').toLowerCase().includes(search.toLowerCase()) ||
                              districtMatch;
           const matchBudget = budgetFilter === 0 || (budgetFilter === 51 ? p.priceNum > 50 : p.priceNum <= budgetFilter);
           const matchSize = sizeFilter === 0 || Number(p.sqft) === sizeFilter;
           const matchStatus = statusFilter === 'ALL' || (p.status || '').toUpperCase() === statusFilter;
           const matchDistrict = districtFilter === 'ALL' || (p.district || '').toLowerCase() === districtFilter.toLowerCase();
           return matchSearch && matchBudget && matchSize && matchStatus && matchDistrict;
       });
   }, [search, properties, budgetFilter, sizeFilter, statusFilter, districtFilter]);

   useEffect(() => {
     api.getProperties({ limit: 200 }).then(data => {
       const props = data.map((d: any) => ({
         ...d,
         id: String(d.id),
         name: d.title || d.name || 'Untitled',
         location: d.location || '',
         price: d.priceLabel || `₹${d.price}`,
         priceNum: parseFloat(String(d.price || '0')) / 100000,
         image: normalizeImageUrl((Array.isArray(d.images) ? d.images[0] : null) || d.image || ''),
         images: Array.isArray(d.images) ? d.images.map(normalizeImageUrl) : [],
         status: String(d.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'PENDING' | 'SOLD',
         sqft: d.sqft || 0,
         grounds: d.ground ? `${d.ground} Ground` : '',
         tag: d.plotType || d.plot_type || d.type || '',
         verified: d.isReraVerified || d.is_rera_verified || false,
         district: d.district || '',
       }));
       setProperties(props);
     }).catch(err => console.error('Properties load error:', err));
   }, []);

   const theme = {
      background: isDark ? '#0B0F19' : '#F9F9F9',
      cardBg: isDark ? '#111827' : '#FFF',
      headerBg: isDark ? '#0B0F19' : '#FFF',
      text: isDark ? '#F9FAFB' : '#111',
      subText: isDark ? '#9CA3AF' : '#666',
      border: isDark ? '#1F2937' : '#EEE',
      headerBorder: isDark ? '#1F2937' : '#F3F4F6',
      iconBtnBg: isDark ? '#1F2937' : '#F9FAFB',
      searchBg: isDark ? '#1F2937' : '#F3F4F6',
      searchInputText: isDark ? '#FFF' : '#111',
      filterBtnBg: isDark ? '#1F2937' : '#FFF',
      filterBtnText: isDark ? '#E5E7EB' : '#555',
      fSetIconColor: isDark ? '#FFF' : '#FFF',
      fSetIconBg: isDark ? GOLD : '#111',
      propNameColor: isDark ? '#F9FAFB' : '#111',
      specValColor: isDark ? '#F9FAFB' : '#111',
      specLblColor: isDark ? '#9CA3AF' : '#AAA',
      dividerColor: isDark ? '#1F2937' : '#F0F0F0',
      mainActionBg: isDark ? GOLD : '#111',
      mainActionText: '#FFF',
      secActionBg: isDark ? '#1F2937' : '#FFF',
      secActionBorder: isDark ? '#374151' : '#EEE',
      modalBg: isDark ? '#111827' : '#FFF',
      modalHandle: isDark ? '#374151' : '#DDD',
      modalTitle: isDark ? '#F9FAFB' : '#111',
      chipBg: isDark ? '#1F2937' : '#F9F9F9',
      chipBorder: isDark ? '#374151' : '#EEE',
      chipText: isDark ? '#9CA3AF' : '#666',
      activeChipBg: isDark ? GOLD : '#111',
      activeChipText: '#FFF',
      bottomNavBg: isDark ? '#111827' : '#FFF',
      bottomNavBorder: isDark ? '#1F2937' : '#EEE',
      navItemText: isDark ? '#6B7280' : '#AAA',
      statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
      statusBarBg: isDark ? '#0B0F19' : '#FFF',
      typeBadgeBg: isDark ? '#3E3213' : '#FEF3C7',
      typeBadgeText: isDark ? GOLD : '#B45309',
      notifCardBg: isDark ? '#1F2937' : '#F9FAFB',
      notifTColor: isDark ? '#F9FAFB' : '#111',
      notifBColor: isDark ? '#9CA3AF' : '#666',
   };

   return (
      <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
         <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

         <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
            <View>
               <Text style={styles.headerSub}>ADMIN INVENTORY</Text>
               <Text style={[styles.headerTitle, { color: theme.text }]}>Asset Registry</Text>
            </View>
            <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
               <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBtnBg }]} onPress={() => setShowNotifs(true)}>
                  <Text style={styles.headerIcon}>🔔</Text>
                  {activeNotifs.length > 0 && <View style={styles.redDot} />}
               </TouchableOpacity>
               <View style={styles.avatarMini}><Text style={styles.avatarT}>KR</Text></View>
            </View>
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <View style={[styles.searchContainer, { backgroundColor: theme.searchBg }]}>
               <Text style={styles.searchIcon}>🔍</Text>
               <TextInput
                  style={[styles.searchInput, { color: theme.searchInputText }]}
                  placeholder="Filter by project, location or district..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
               />
            </View>

            {/* REAL-TIME INLINE FILTER CHIPS */}
            <View style={styles.inlineFilterSection}>
               <View style={styles.filterHeaderRow}>
                  <Text style={[styles.filterCountTxt, { color: theme.subText }]}>{filteredProps.length} properties</Text>
                  {activeFilterCount > 0 && (
                     <TouchableOpacity style={styles.resetChip} onPress={() => { setBudgetFilter(0); setSizeFilter(0); setStatusFilter('ALL'); setDistrictFilter('ALL'); setSearch(''); }}>
                        <Text style={styles.resetChipTxt}>↻ RESET ({activeFilterCount})</Text>
                     </TouchableOpacity>
                  )}
               </View>

               <Text style={[styles.chipGroupLabel, { color: GOLD }]}>STATUS</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={{ paddingRight: 10 }}>
                  {STATUS_OPTIONS.map(s => {
                     const isActive = statusFilter === s;
                     const activeColor = s === 'ACTIVE' ? '#22C55E' : s === 'SOLD' ? '#EF4444' : s === 'PENDING' ? '#F59E0B' : GOLD;
                     return (
                        <TouchableOpacity key={s} style={[styles.inlineChip, { backgroundColor: isActive ? activeColor : theme.chipBg, borderColor: isActive ? activeColor : theme.chipBorder }]} onPress={() => setStatusFilter(s)}>
                           <Text style={[styles.inlineChipT, { color: isActive ? '#FFF' : theme.chipText }]}>{s}</Text>
                        </TouchableOpacity>
                     );
                  })}
               </ScrollView>

               <Text style={[styles.chipGroupLabel, { color: GOLD }]}>BUDGET</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={{ paddingRight: 10 }}>
                  {BUDGET_OPTIONS.map(opt => {
                     const isActive = budgetFilter === opt.value;
                     return (
                        <TouchableOpacity key={opt.value} style={[styles.inlineChip, { backgroundColor: isActive ? GOLD : theme.chipBg, borderColor: isActive ? GOLD : theme.chipBorder }]} onPress={() => setBudgetFilter(opt.value)}>
                           <Text style={[styles.inlineChipT, { color: isActive ? '#FFF' : theme.chipText }]}>{opt.label}</Text>
                        </TouchableOpacity>
                     );
                  })}
               </ScrollView>

               <Text style={[styles.chipGroupLabel, { color: GOLD }]}>GROUNDS</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={{ paddingRight: 10 }}>
                  {SIZE_OPTIONS.map(opt => {
                     const isActive = sizeFilter === opt.value;
                     return (
                        <TouchableOpacity key={opt.value} style={[styles.inlineChip, { backgroundColor: isActive ? GOLD : theme.chipBg, borderColor: isActive ? GOLD : theme.chipBorder }]} onPress={() => setSizeFilter(opt.value)}>
                           <Text style={[styles.inlineChipT, { color: isActive ? '#FFF' : theme.chipText }]}>{opt.label}</Text>
                        </TouchableOpacity>
                     );
                  })}
               </ScrollView>

               <Text style={[styles.chipGroupLabel, { color: GOLD }]}>DISTRICT</Text>
               <TouchableOpacity
                  onPress={() => setDistrictModalVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: districtFilter !== 'ALL' ? GOLD : theme.chipBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: districtFilter !== 'ALL' ? 'rgba(201,168,76,0.1)' : theme.chipBg, marginBottom: 10 }}
               >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: districtFilter !== 'ALL' ? GOLD : theme.chipText }}>
                     {districtFilter === 'ALL' ? 'All Districts' : districtFilter}
                  </Text>
                  <Text style={{ fontSize: 18, color: '#94A3B8' }}>▾</Text>
               </TouchableOpacity>
            </View>

            {filteredProps.map((item) => (
               <TouchableOpacity key={item.id} activeOpacity={0.85} style={[styles.propertyCard, { backgroundColor: theme.cardBg }]} onPress={() => navigation.navigate('PropertyDetail', { property: item })}>
                  {item.image ? <Image source={{ uri: item.image }} style={styles.cardImage} /> : <View style={[styles.cardImage, { backgroundColor: '#E5E7EB' }]} />}
                  <View style={styles.cardContent}>
                     <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.propName, { color: theme.propNameColor }]}>{item.name}</Text>
                           <Text style={[styles.locTxt, { color: theme.subText }]}>📍 {item.location} {item.district ? `| ${item.district}` : ''}</Text>
                        </View>
                        <View style={[styles.activeBadge, { backgroundColor: theme.typeBadgeBg }]}><Text style={[styles.badgeT, { color: theme.typeBadgeText }]}>{item.status || 'Active'}</Text></View>
                     </View>
                     <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />
                     <View style={styles.specsRow}>
                        <View style={styles.specBox}><Text style={[styles.specVal, { color: theme.specValColor }]}>{item.grounds || '—'}</Text><Text style={[styles.specLbl, { color: theme.specLblColor }]}>SIZE</Text></View>
                        <View style={styles.specBox}><Text style={[styles.specVal, { color: theme.specValColor }]}>{item.sqft || '—'}</Text><Text style={[styles.specLbl, { color: theme.specLblColor }]}>SQFT</Text></View>
                        <View style={styles.specBox}><Text style={[styles.specVal, { color: GOLD }]}>{item.price}</Text><Text style={[styles.specLbl, { color: theme.specLblColor }]}>VALUE</Text></View>
                     </View>
                     <View style={styles.actionRow}>
                        <View style={[styles.mainAction, { backgroundColor: theme.mainActionBg }]}>
                           <Text style={[styles.mainActionT, { color: theme.mainActionText }]}>VIEW ANALYTICS</Text>
                        </View>
                        <TouchableOpacity
                           style={[styles.secAction, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}
                           onPress={() => Share.share({
                             message: `🏠 ${item.name || 'Property'}\n📍 ${item.location || ''}\n💰 ₹${item.price || ''}\n\nView on Tamizha Properties App!\nhttps://tamizhaproperties.com/p/${item.id}`,
                           })}
                        >
                           <Text style={styles.secIcon}>🔗</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.secAction, { backgroundColor: theme.secActionBg, borderColor: theme.secActionBorder }]} onPress={() => Alert.alert('Status', 'Mark as Sold?')}>
                           <Text style={styles.secIcon}>💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.secAction, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]} onPress={() => handleDelete(item)}>
                           <Text style={styles.secIcon}>🗑️</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               </TouchableOpacity>
            ))}
            <View style={{ height: 120 }} />
         </ScrollView>

         <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddProperty')}
         >
            <Text style={styles.fabIcon}>+</Text>
         </TouchableOpacity>

         {/* NOTIFICATION CENTER */}
         <Modal visible={showNotifs} transparent animationType="slide">
            <View style={styles.modalOverlay}>
               <TouchableOpacity style={styles.modalBlur} onPress={() => setShowNotifs(false)} />
               <View style={[styles.filterSheet, { backgroundColor: theme.modalBg }]}>
                  <View style={[styles.handle, { backgroundColor: theme.modalHandle }]} />
                  <Text style={[styles.sheetTitle, { color: theme.modalTitle }]}>Admin Alerts</Text>
                  {activeNotifs.length > 0 ? (
                      activeNotifs.map(n => (
                         <View key={n.id} style={[styles.notifCard, { backgroundColor: theme.notifCardBg }]}>
                            <View style={styles.notifLead} />
                            <View style={{flex:1}}>
                               <Text style={[styles.notifT, { color: theme.notifTColor }]}>{n.title}</Text>
                               <Text style={[styles.notifB, { color: theme.notifBColor }]}>{n.body}</Text>
                            </View>
                            <Text style={styles.notifTime}>{n.time}</Text>
                         </View>
                      ))
                   ) : (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                         <Text style={{ color: theme.subText, fontWeight: 'bold' }}>No new alerts.</Text>
                      </View>
                   )}
                   
                   <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                      <TouchableOpacity style={[styles.applyBtn, { flex: 1, backgroundColor: '#EF4444', marginTop: 0 }]} onPress={() => { clearAllNotifs(); setShowNotifs(false); }}>
                         <Text style={styles.applyBtnT}>CLEAR ALL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.applyBtn, { flex: 1, marginTop: 0 }]} onPress={() => setShowNotifs(false)}>
                         <Text style={styles.applyBtnT}>CLOSE</Text>
                      </TouchableOpacity>
                   </View>
               </View>
            </View>
         </Modal>

         {/* Bottom Nav */}
         <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Text style={[styles.navIcon, { color: theme.navItemText }]}>🏠</Text><Text style={[styles.navText, { color: theme.navItemText }]}>HOME</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SiteVisits')}><Text style={[styles.navIcon, { color: theme.navItemText }]}>📅</Text><Text style={[styles.navText, { color: theme.navItemText }]}>VISITS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}><Text style={[styles.navIcon, { color: GOLD }]}>🏢</Text><Text style={[styles.navText, { color: GOLD }]}>PROPERTIES</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}><Text style={[styles.navIcon, { color: theme.navItemText }]}>🤝</Text><Text style={[styles.navText, { color: theme.navItemText }]}>LEADS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Text style={[styles.navIcon, { color: theme.navItemText }]}>👤</Text><Text style={[styles.navText, { color: theme.navItemText }]}>PROFILE</Text></TouchableOpacity>
         </View>
      </SafeAreaView>

      {/* District Picker Modal */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.modalBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.dividerColor }}>
                  <Text style={{ color: GOLD, fontWeight: '800', fontSize: 16, letterSpacing: 1 }}>SELECT DISTRICT</Text>
                  <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                     <Text style={{ fontSize: 20, color: theme.subText }}>✕</Text>
                  </TouchableOpacity>
               </View>
               <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 12, paddingTop: 8 }}>
                  {districtOptions.map(d => (
                     <TouchableOpacity
                        key={d}
                        onPress={() => { setDistrictFilter(d); setDistrictModalVisible(false); }}
                        style={{ paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, backgroundColor: districtFilter === d ? 'rgba(201,168,76,0.15)' : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                     >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: districtFilter === d ? GOLD : theme.text }}>
                           {d === 'ALL' ? 'All Districts' : d}
                        </Text>
                        {districtFilter === d && <Text style={{ color: GOLD, fontSize: 16 }}>✓</Text>}
                     </TouchableOpacity>
                  ))}
                  <View style={{ height: 30 }} />
               </ScrollView>
            </View>
         </View>
      </Modal>
      </>
   );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#FFF' },
   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
   headerSub: { fontSize: 8, fontWeight: '900', color: GOLD, letterSpacing: 2 },
   headerTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginTop: 4 },
   iconBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
   redDot: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
   headerIcon: { fontSize: 22 },
   avatarMini: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
   avatarT: { fontSize: 13, fontWeight: '900', color: '#FFF' },
   scrollContent: { paddingHorizontal: 20 },
   searchContainer: { height: 60, backgroundColor: '#F3F4F6', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
   searchIcon: { fontSize: 14, marginRight: 15 },
   searchInput: { flex: 1, fontSize: 13, fontWeight: '700' },
   inlineFilterSection: { marginTop: 16, marginBottom: 4 },
   filterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
   filterCountTxt: { fontSize: 11, fontWeight: '700' },
   resetChip: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
   resetChipTxt: { fontSize: 9, fontWeight: '900', color: '#FFF' },
   chipGroupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6, marginTop: 10 },
   hScroll: { marginBottom: 2 },
   inlineChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginRight: 8 },
   inlineChipT: { fontSize: 10, fontWeight: '700' },
   propertyCard: { backgroundColor: '#FFF', borderRadius: 30, overflow: 'hidden', marginBottom: 25, elevation: 1 },
   cardImage: { height: 200, width: '100%' },
   cardContent: { padding: 20 },
   cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
   propName: { fontSize: 20, fontWeight: '900', color: '#111' },
   locTxt: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '600' },
   activeBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
   badgeT: { fontSize: 8, fontWeight: '900', color: '#B45309' },
   divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 18 },
   specsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
   specBox: { alignItems: 'center' },
   specVal: { fontSize: 18, fontWeight: '900', color: '#111' },
   specLbl: { fontSize: 7, fontWeight: '900', color: '#AAA', marginTop: 4 },
   actionRow: { flexDirection: 'row', gap: 12 },
   mainAction: { flex: 1, backgroundColor: '#111', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
   mainActionT: { color: '#FFF', fontSize: 13, fontWeight: '900' },
   secAction: { width: 60, height: 60, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
   secIcon: { fontSize: 20 },
   // Modal
   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
   modalBlur: { flex: 1 },
   filterSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 45, borderTopRightRadius: 45, padding: 30, paddingBottom: 60 },
   handle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
   sheetTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 25 },
   applyBtn: { backgroundColor: GOLD, height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
   applyBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900' },
   // Notifs
   notifCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
   notifLead: { width: 8, height: 40, backgroundColor: GOLD, borderRadius: 4, marginRight: 15 },
   notifT: { fontSize: 14, fontWeight: '900', color: '#111' },
   notifB: { fontSize: 11, color: '#666', marginTop: 2 },
   notifTime: { fontSize: 9, fontWeight: '700', color: '#BBB' },
   bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%', zIndex: 99, elevation: 10 },
   navItem: { alignItems: 'center', gap: 4 },
   navIcon: { fontSize: 28, color: '#AAA' },
   navText: { fontSize: 8, fontWeight: '900', color: '#AAA' },
   fab: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: GOLD,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
   },
   fabIcon: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
});

export default PropertiesScreen;
