import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getSavedProperties, toggleSavedProperty } from '../services/api';

const { width } = Dimensions.get('window');

const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Saved', label: 'SAVED', icon: '❤️', route: 'SavedProperties' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

// Shared favorites state - import from context in real app
// For now, we show the globally saved favourites via navigation params
const DEFAULT_SAVED = [
  {
    id: '1',
    title: 'Pollachi Coconut Grove',
    price: '₹4.2 Cr',
    priceLabel: 'PER ACRE',
    location: 'Pollachi, Coimbatore',
    size: '12 Acres',
    image: 'https://images.unsplash.com/photo-1592595896616-c37162298647?auto=format&fit=crop&w=600&q=80',
    tag: 'FOR SALE',
  },
  {
    id: '3',
    title: 'Mist Valley Estates & Holiday Resort',
    price: '₹68 L',
    priceLabel: 'Starting',
    location: 'Vilpatti, Kodaikanal',
    size: 'Hill Side',
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=400&q=80',
    tag: 'PREMIUM',
  },
];

const SavedPropertiesScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const activeTab = 'Saved';
  const [savedList, setSavedList] = useState<any[]>([]);

  const loadSaved = async () => {
    try {
      const savedIds = await getSavedProperties();
      if (savedIds.length === 0) { setSavedList([]); return; }
      const allProps = await api.getProperties();
      setSavedList(allProps.filter((p: any) => savedIds.includes(String(p.id))));
    } catch (e) {
      console.error('SavedProperties load error:', e);
    }
  };

  React.useEffect(() => { loadSaved(); }, []);

  const handleRemove = (id: string, title: string) => {
    Alert.alert(
      'Remove from Saved?',
      `"${title}" - saved plots la irundhu remove panrathaa?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await toggleSavedProperty(String(id));
            loadSaved();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F9" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <View style={{ width: 36 }} />
        <Text style={styles.headerTitle}>Saved Plots</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{savedList.length}</Text>
        </View>
      </View>

      {savedList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏚️</Text>
          <Text style={styles.emptyTitle}>No Saved Plots</Text>
          <Text style={styles.emptySub}>Dashboard la property card la ♡ press panni save pannu!</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.exploreBtnText}>BROWSE PROPERTIES</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {savedList.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
            >
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => handleRemove(item.id, item.title)}
                >
                  <Text style={styles.heartIcon}>❤️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.locationPin}>📍</Text>
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <View style={styles.sizePill}>
                    <Text style={styles.sizeText}>{item.size}</Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={styles.price}>{item.price}</Text>
                    <Text style={styles.priceLabel}> {item.priceLabel}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 + insets.bottom }} />
        </ScrollView>
      )}

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
        {BottomTabIcons.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tabItem}
              onPress={() => {
                if (tab.route !== 'SavedProperties') {
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
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#111',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  countBadge: {
    backgroundColor: '#0B132B',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 180,
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#357AE8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heartBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIcon: {
    fontSize: 18,
  },
  cardInfo: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizePill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  priceLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  exploreBtn: {
    backgroundColor: '#0B132B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
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
});

export default SavedPropertiesScreen;
