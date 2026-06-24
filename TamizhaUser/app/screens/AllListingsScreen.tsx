import React, { useState, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, getSavedProperties, toggleSavedProperty, normalizeImageUrl } from '../services/api';

const { width } = Dimensions.get('window');

const TYPE_FILTERS = ['All', 'Farm Land', 'Hill Land', 'Waterfront', 'Commercial Land'];

const AllListingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);

  useEffect(() => {
    getSavedProperties().then(setFavorites).catch(() => {});
    api.getProperties().then((props: any[]) => {
      setAllProperties(props.map(p => {
        const rawPrice = parseFloat(String(p.price || '0'));
        const priceLakhs = rawPrice >= 100000 ? rawPrice / 100000 : rawPrice;
        const priceLabel = priceLakhs >= 100
          ? `₹${(priceLakhs / 100).toFixed(2)}Cr`
          : `₹${priceLakhs % 1 === 0 ? priceLakhs : priceLakhs.toFixed(1)}L`;
        return {
          ...p,
          price: priceLabel,
          image: normalizeImageUrl((Array.isArray(p.images) && p.images[0]) ? p.images[0] : p.image || '')
            || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
          size: p.ground ? `${p.ground} Ground` : (p.sqft ? `${p.sqft} sqft` : '—'),
          type: p.plot_type || p.type || 'Farm Land',
        };
      }));
    }).catch(err => console.error('AllListings fetch error:', err));
  }, []);

  const toggleFav = async (id: string) => {
    await toggleSavedProperty(id);
    setFavorites(await getSavedProperties());
  };

  const filtered = allProperties.filter(p => {
    const matchType = activeType === 'All' || p.type === activeType;
    const matchSearch = (p.title || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>All Properties</Text>
          <Text style={styles.headerSub}>{filtered.length} listings found</Text>
        </View>
        <View style={styles.sortBtn}>
          <Text style={styles.sortIcon}>⇅</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchPin}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor="#AAA"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {TYPE_FILTERS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, activeType === t && styles.filterChipActive]}
            onPress={() => setActiveType(t)}
          >
            <Text style={[styles.filterChipText, activeType === t && styles.filterChipTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Property List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySub}>Try changing filters or search term</Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, item.tag === 'SOLD OUT' && styles.cardSoldOut]}
              activeOpacity={0.9}
              onPress={() => {
                if (item.tag !== 'SOLD OUT') {
                  navigation.navigate('PropertyDetails', {
                    propertyId: item.id,
                    title: item.title,
                    price: item.price,
                    priceLabel: item.priceLabel,
                    location: item.location,
                    size: item.size,
                    image: item.image,
                    tag: item.tag,
                  });
                }
              }}
            >
              <View style={styles.cardImageWrap}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {/* Tag */}
                <View style={[
                  styles.cardTag,
                  item.tag === 'SOLD OUT' && styles.cardTagSoldOut,
                  item.tag === 'PREMIUM' && styles.cardTagPremium,
                  item.tag === 'HOT DEAL' && styles.cardTagHot,
                ]}>
                  <Text style={styles.cardTagText}>{item.tag}</Text>
                </View>
                {/* Heart */}
                <TouchableOpacity style={styles.cardHeart} onPress={() => toggleFav(item.id)}>
                  <Text style={{ fontSize: 16 }}>{favorites.includes(item.id) ? '❤️' : '♡'}</Text>
                </TouchableOpacity>
                {/* Type badge */}
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.priceWrap}>
                    <Text style={styles.cardPrice}>{item.price}</Text>
                    <Text style={styles.cardPriceLabel}>{item.priceLabel}</Text>
                  </View>
                </View>

                <View style={styles.cardLocRow}>
                  <Text style={styles.locPin}>📍</Text>
                  <Text style={styles.cardLoc}>{item.location}</Text>
                </View>

                <View style={styles.cardPills}>
                  <View style={styles.pill}>
                    <Text style={styles.pillIcon}>▦</Text>
                    <Text style={styles.pillText}>{item.size}</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillIcon}>💧</Text>
                    <Text style={styles.pillText}>{item.amenity}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 30 + insets.bottom }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 22, color: '#111' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  headerSub: { fontSize: 10, color: '#888', marginTop: 1, fontWeight: '600' },
  sortBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  sortIcon: { fontSize: 16, color: '#555' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#EEE',
  },
  searchPin: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: '#111' },
  clearBtn: { color: '#AAA', fontSize: 14, padding: 4 },

  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#0B132B' },
  filterChipText: { fontSize: 11, fontWeight: '800', color: '#555' },
  filterChipTextActive: { color: '#FFF' },

  list: { paddingHorizontal: 16, paddingTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 12, color: '#999' },

  card: {
    backgroundColor: '#FFF', borderRadius: 18,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardSoldOut: { opacity: 0.75 },
  cardImageWrap: { height: 185, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardTag: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#0B132B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  cardTagSoldOut: { backgroundColor: '#888' },
  cardTagPremium: { backgroundColor: '#D4AF37' },
  cardTagHot: { backgroundColor: '#E74C3C' },
  cardTagText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  cardHeart: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#FFF', width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2,
  },
  typeBadge: {
    position: 'absolute', bottom: 10, left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  typeBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  cardBody: { padding: 16 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111', flex: 1, marginRight: 10 },
  priceWrap: { alignItems: 'flex-end' },
  cardPrice: { fontSize: 15, fontWeight: '900', color: '#0B132B' },
  cardPriceLabel: { fontSize: 8, color: '#999', fontWeight: '700', marginTop: 1 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locPin: { fontSize: 11, marginRight: 4 },
  cardLoc: { fontSize: 11, color: '#777', fontWeight: '600' },
  cardPills: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginRight: 8,
  },
  pillIcon: { fontSize: 10, marginRight: 4 },
  pillText: { fontSize: 10, fontWeight: '700', color: '#555' },
});

export default AllListingsScreen;
