import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Modal,
  Platform,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#C9A84C';

interface HomeScreenProps {
  navigation: any;
  activeNotifs: any[];
  clearAllNotifs: () => void;
  isDark?: boolean;
  newVisitsBadge?: number;
  clearVisitsBadge?: () => void;
}

const HomeScreen = ({ navigation, activeNotifs, clearAllNotifs, isDark = false, newVisitsBadge = 0, clearVisitsBadge }: HomeScreenProps) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [apiNotifs, setApiNotifs] = useState<any[]>([]);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [denyingVisitId, setDenyingVisitId] = useState<string | null>(null);
  const [respondedMap, setRespondedMap] = useState<Record<string, 'accepted' | 'denied'>>({});
  const [denyingVisitDate, setDenyingVisitDate] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotifIds, setSelectedNotifIds] = useState<Set<string>>(new Set());
  const [leadsCount, setLeadsCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [landBankAcres, setLandBankAcres] = useState(9.5);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<number[]>([20, 35, 30, 50, 80, 70]);
  const [adminName, setAdminName] = useState('Tamizha Admin');
  const [adminImage, setAdminImage] = useState<string | null>(null);

  // Dynamic colors based on isDark
  const theme = {
    background: isDark ? '#0B0F19' : '#F9F9F9',
    cardBg: isDark ? '#111827' : '#FFF',
    headerBg: isDark ? '#0B0F19' : '#FFF',
    text: isDark ? '#F9FAFB' : '#111',
    subText: isDark ? '#9CA3AF' : '#666',
    border: isDark ? '#1F2937' : '#E2E8F0',
    greyBg: isDark ? '#1F2937' : '#F3F4F6',
    agendaItemBg: isDark ? '#1F2937' : '#F8FAFC',
    agendaItemBorder: isDark ? '#374151' : '#F1F5F9',
    statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
    statusBarBg: isDark ? '#0B0F19' : '#F9F9F9',
    notifCardBg: isDark ? '#1F2937' : '#F9FAFB',
    bottomNavBg: isDark ? '#111827' : '#FFF',
    bottomNavBorder: isDark ? '#1F2937' : '#EEE',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Leads
        const leads = await api.getLeads();
        const crmLeads = leads
          .filter((data: any) => data.source !== 'User App Chat')
          .map((data: any) => ({
            id: data.id,
            name: data.name || 'Anonymous',
            phone: data.phone || '',
            interest: data.property_interest || data.notes || 'Property Inquiry',
            status: String(data.status || 'NEW').toUpperCase(),
            time: data.created_at
              ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            _ts: data.created_at ? new Date(data.created_at).getTime() / 1000 : 0,
          }))
          .sort((a: any, b: any) => b._ts - a._ts);
        setLeadsCount(crmLeads.length);
        setRecentLeads(crmLeads.slice(0, 3));

        // 2. Properties
        const props = await api.getProperties();
        setPropertyCount(props.length);
        let avail = 0, sold = 0, totalGrounds = 0;
        props.forEach((data: any) => {
          const status = String(data.status || 'ACTIVE').toUpperCase();
          if (['ACTIVE', 'AVAILABLE', 'FOR SALE', 'FOR_SALE', 'FOR SALE', 'PREMIUM', 'NEW LAUNCH', 'FOR_SALE'].includes(status)) avail++;
          else if (status === 'SOLD') sold++;
          const gr = parseFloat(data.ground) || 0;
          const sq = parseFloat(data.sqft) || 0;
          if (gr > 0) totalGrounds += gr;
          else if (sq > 0) totalGrounds += sq / 2400;
        });
        setAvailableCount(avail);
        setSoldCount(sold);
        const computedAcres = totalGrounds / 18;
        setLandBankAcres(computedAcres > 0 ? parseFloat(computedAcres.toFixed(1)) : 9.5);

        // 3. Today's site visits
        const todayKey = (() => {
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })();
        const visits = await api.getSiteVisits();
        const todayVs = visits
          .filter((d: any) => d.visit_date === todayKey)
          .slice(0, 2)
          .map((d: any) => ({
            id: d.id,
            propertyName: d.property_title || 'Property',
            clientName: d.lead_name || 'Client',
            visitTime: d.visit_date || '',
            type: 'Showing',
            status: d.status || 'Confirmed',
          }));
        setTodayVisits(todayVs);

        // 4. API Notifications
        try {
          const notifs = await api.getAdminNotifications();
          setApiNotifs(notifs);
        } catch (_) {}

        // 5. Admin profile from AsyncStorage
        const storedProfile = await AsyncStorage.getItem('admin_profile');
        if (storedProfile) {
          const data = JSON.parse(storedProfile);
          if (data.name) setAdminName(data.name);
          if (data.avatar) setAdminImage(data.avatar);
        }
      } catch (err) {
        console.error('HomeScreen fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Error', 'Unable to initiate call.');
      });
    } else {
      Alert.alert('No Number', 'No phone number provided for this lead.');
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`).catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed on this device.');
      });
    } else {
      Alert.alert('No Number', 'No phone number provided for this lead.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatarContainer}>
             {adminImage ? (
               <Image source={{ uri: adminImage }} style={{ width: 40, height: 40, borderRadius: 12 }} />
             ) : (
               <Text style={styles.avatarText}>
                 {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
               </Text>
             )}
          </View>
          <Text style={[styles.brandTitle, { color: theme.text }]} numberOfLines={1}>
            {adminName}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: theme.border }]} onPress={async () => {
          setShowNotifs(true);
          try {
            await api.markAllAdminRead();
            setApiNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
          } catch (_) {}
        }}>
          <Text style={styles.bellIcon}>🔔</Text>
          {apiNotifs.filter(n => !n.is_read).length > 0 && (
            <View style={[styles.redDot, { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{apiNotifs.filter(n => !n.is_read).length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.overViewTxt}>REAL ESTATE INSIGHTS</Text>
          <Text style={[styles.pulseTitle, { color: theme.text }]}>Master Dashboard</Text>

          <View style={styles.statusRow}>
            <View style={[styles.lastUpdated, { backgroundColor: theme.greyBg }]}>
               <Text style={styles.updatedLabel}>LAST UPDATED</Text>
               <Text style={[styles.updatedTime, { color: theme.text }]}>Live sync active</Text>
            </View>
            <View style={[styles.liveIndicator, { 
               backgroundColor: isDark ? '#172554' : '#F0F9FF', 
               borderColor: isDark ? '#1E3A8A' : '#BAE6FD' 
            }]}>
               <Text style={styles.liveDots}>☁️</Text>
               <Text style={[styles.liveTxt, { color: isDark ? '#93C5FD' : '#0369A1' }]}>Live Sync</Text>
            </View>
          </View>
        </View>

        {/* Land Bank Card (Black) */}
        <View style={styles.blackCard}>
           <Image
              source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80' }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24, opacity: 0.3 }]}
           />
           <View style={styles.cardHeader}>
              <Text style={styles.mountainIcon}>⛰️</Text>
              <View style={styles.trendBadge}>
                 <Text style={styles.trendText}>Calculated Live</Text>
              </View>
           </View>
           <Text style={styles.cardLabel}>TOTAL LAND BANK</Text>
           <View style={styles.valueRow}>
              <Text style={styles.bigValue}>{landBankAcres}</Text>
              <Text style={styles.unitText}>Acres</Text>
           </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGridRow}>
            <TouchableOpacity style={[styles.miniCard, { flex: 1, backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => navigation.navigate('Properties')}>
               <View style={styles.miniCardTop}>
                 <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(201, 168, 76, 0.1)' }]}>
                   <Text style={styles.statIconMini}>🏢</Text>
                 </View>
                 <View style={styles.statusDot} />
               </View>
               <Text style={[styles.miniLabel, { color: theme.subText }]}>ASSETS</Text>
               <Text style={[styles.miniValue, { color: theme.text }]}>{propertyCount}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.miniCard, { flex: 1, backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => navigation.navigate('Properties')}>
               <View style={styles.miniCardTop}>
                 <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                   <Text style={styles.statIconMini}>✅</Text>
                 </View>
                 <Text style={styles.trendUp}>+2.4%</Text>
               </View>
               <Text style={[styles.miniLabel, { color: theme.subText }]}>AVAILABLE</Text>
               <Text style={[styles.miniValue, { color: theme.text }]}>{availableCount}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.statsGridRow}>
            <TouchableOpacity style={[styles.miniCard, { flex: 1, backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => navigation.navigate('Properties')}>
               <View style={styles.miniCardTop}>
                 <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                   <Text style={styles.statIconMini}>🏷️</Text>
                 </View>
               </View>
               <Text style={[styles.miniLabel, { color: theme.subText }]}>SOLD</Text>
               <Text style={[styles.miniValue, { color: theme.text }]}>{soldCount}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.miniCard, { 
                  flex: 1, 
                  backgroundColor: isDark ? '#451A1A' : '#FFF5F5', 
                  borderColor: isDark ? '#7F1D1D' : 'rgba(239, 68, 68, 0.15)' 
               }]} 
               onPress={() => navigation.navigate('Leads')}
            >
               <View style={styles.miniCardTop}>
                 <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                   <Text style={styles.statIconMini}>📋</Text>
                 </View>
                 <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
               </View>
               <Text style={[styles.miniLabel, { color: isDark ? '#FCA5A5' : '#B71C1C' }]}>NEW LEADS</Text>
               <Text style={[styles.miniValue, { color: isDark ? '#FCA5A5' : '#B71C1C' }]}>{leadsCount}</Text>
            </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
           <TouchableOpacity style={[styles.qaCard, { backgroundColor: isDark ? '#3F2C0B' : '#FEF3C7', borderColor: isDark ? '#B45309' : '#FDE68A' }]} onPress={() => navigation.navigate('AddProperty')}>
              <Text style={styles.qaIcon}>🏘️</Text>
              <Text style={[styles.qaText, { color: isDark ? '#FFF' : '#111' }]}>Add Property</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.qaCard, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: isDark ? '#374151' : '#E5E7EB' }]} onPress={() => navigation.navigate('Properties')}>
              <Text style={styles.qaIcon}>🏢</Text>
              <Text style={[styles.qaText, { color: isDark ? '#FFF' : '#111' }]}>Properties</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.qaCard, { backgroundColor: isDark ? '#172554' : '#EFF6FF', borderColor: isDark ? '#1E3A8A' : '#BFDBFE' }]} onPress={() => navigation.navigate('SiteVisits')}>
              <Text style={styles.qaIcon}>📅</Text>
              <Text style={[styles.qaText, { color: isDark ? '#FFF' : '#111' }]}>Site Visits</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.qaCard, { backgroundColor: isDark ? '#14532D' : '#F0FDF4', borderColor: isDark ? '#166534' : '#BBF7D0' }]} onPress={() => navigation.navigate('Leads')}>
              <Text style={styles.qaIcon}>🤝</Text>
              <Text style={[styles.qaText, { color: isDark ? '#FFF' : '#111' }]}>CRM Leads</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.qaCard, { backgroundColor: isDark ? '#111827' : '#1E293B', borderColor: isDark ? '#1F2937' : '#334155', width: '100%' }]} onPress={() => navigation.navigate('Reports')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>📊</Text>
                <View>
                  <Text style={[styles.qaText, { color: '#FFF', textAlign: 'left', fontSize: 14 }]}>Sales Analytics</Text>
                  <Text style={{ fontSize: 10, color: GOLD, fontWeight: '700', marginTop: 2 }}>Revenue · Leads · Conversion</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFF' }}>LIVE</Text>
                </View>
              </View>
           </TouchableOpacity>
        </View>

        {/* Today's Agenda Widget */}
        <View style={[styles.agendaCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
           <View style={styles.agendaHeader}>
              <View>
                <Text style={styles.agendaLabel}>TODAY'S AGENDA</Text>
                <Text style={[styles.agendaTitle, { color: theme.text }]}>📅 Scheduled Visits</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('SiteVisits')}>
                 <Text style={[styles.agendaViewAll, { color: theme.subText }]}>View Visits →</Text>
              </TouchableOpacity>
           </View>
           {todayVisits.length === 0 ? (
             <View style={styles.agendaEmpty}>
                <Text style={[styles.agendaEmptyText, { color: theme.subText }]}>No visits scheduled for today.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SiteVisits')}>
                   <Text style={styles.agendaScheduleBtn}>+ Schedule Now</Text>
                </TouchableOpacity>
             </View>
           ) : (
             todayVisits.map(v => (
               <TouchableOpacity key={v.id} style={[styles.agendaItem, { backgroundColor: theme.agendaItemBg, borderColor: theme.agendaItemBorder }]} onPress={() => navigation.navigate('SiteVisits')}>
                  <View style={[styles.agendaTimeBadge, { 
                     backgroundColor: v.type === 'Showing' 
                        ? (isDark ? '#452A1A' : '#FEF3C7') 
                        : v.type === 'Walk-through' 
                           ? (isDark ? '#14352D' : '#F0FDF4') 
                           : (isDark ? '#172A45' : '#EFF6FF') 
                  }]}>
                     <Text style={[styles.agendaTimeText, { color: theme.text }]}>{v.visitTime}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                     <Text style={[styles.agendaPropName, { color: theme.text }]} numberOfLines={1}>{v.propertyName}</Text>
                     <Text style={[styles.agendaClientName, { color: theme.subText }]} numberOfLines={1}>👤 {v.clientName}</Text>
                  </View>
                  <View style={[styles.agendaStatusDot, { backgroundColor: v.status === 'Confirmed' ? '#22C55E' : GOLD }]} />
               </TouchableOpacity>
             ))
           )}
        </View>

        {/* LATEST CRM INQUIRIES FEED */}
        <View style={[styles.prospectsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
           <View style={styles.prospectsHeader}>
              <Text style={styles.prospectsTitle}>🔥 LATEST CRM INQUIRIES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
                 <Text style={[styles.viewAllText, { color: theme.subText }]}>View All →</Text>
              </TouchableOpacity>
           </View>
           
           {recentLeads.length > 0 ? (
             recentLeads.map(lead => (
               <View key={lead.id} style={[styles.leadCardRow, { backgroundColor: theme.agendaItemBg, borderColor: theme.border }]}>
                  <View style={[styles.leadStatusLine, { backgroundColor: lead.status === 'HOT' ? '#EF4444' : lead.status === 'WARM' ? GOLD : '#60A5FA' }]} />
                  <View style={styles.leadInfoCol}>
                     <View style={styles.leadCardTop}>
                        <Text style={[styles.leadNameText, { color: theme.text }]} numberOfLines={1}>{lead.name}</Text>
                        <Text style={[styles.leadTimeText, { color: theme.subText }]}>{lead.time}</Text>
                     </View>
                     <Text style={[styles.leadInterestText, { color: theme.subText }]} numberOfLines={1}>🏷️ {lead.interest}</Text>
                  </View>
                  <View style={styles.leadActionRow}>
                     <TouchableOpacity style={[styles.actionCommBtn, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border }]} onPress={() => handleCall(lead.phone)}>
                        <Text style={styles.commBtnEmoji}>📞</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.actionCommBtn, { backgroundColor: isDark ? '#1F2937' : '#22C55E', borderColor: '#22C55E' }]} onPress={() => navigation.navigate('LeadChat', { lead: { id: lead.id, name: lead.name, phone: lead.phone, status: lead.status, source: 'User App Chat', interest: lead.interest, timestamp: lead.time } })}>
                        <Text style={styles.commBtnEmoji}>💬</Text>
                     </TouchableOpacity>
                  </View>
               </View>
             ))
           ) : (
             <View style={[styles.emptyLeadsBox, { backgroundColor: theme.agendaItemBg }]}>
                <Text style={[styles.emptyLeadsText, { color: theme.subText }]}>No active leads found.</Text>
             </View>
           )}
        </View>

        {/* Revenue Section */}
        <View style={[styles.revenueCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
           <View style={styles.revenueTop}>
              <View>
                <Text style={styles.revLabel}>ANNUAL REVENUE</Text>
                <Text style={[styles.revValue, { color: theme.text }]}>
                  {annualRevenue > 0 ? (
                    annualRevenue >= 10000000 
                      ? `₹${(annualRevenue / 10000000).toFixed(2)} Cr` 
                      : annualRevenue >= 100000 
                        ? `₹${(annualRevenue / 100000).toFixed(2)} L` 
                        : `₹${annualRevenue.toLocaleString('en-IN')}`
                  ) : '₹0.00'}
                </Text>
              </View>
              <View style={styles.projectionBox}><Text style={styles.projLabel}>PROJECTION</Text><Text style={styles.projValue}>+18.5%</Text></View>
           </View>
           <View style={styles.chartRow}>
              {monthlyRevenueData.map((h, i) => (
                <View key={i} style={[styles.bar, { height: h, backgroundColor: i === 5 ? GOLD : (isDark ? '#1F2937' : '#E5E7EB') }]} />
              ))}
           </View>
        </View>

         <TouchableOpacity style={[styles.fullListingsBtn, { backgroundColor: isDark ? GOLD : '#111' }]} onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.listIcon}>📓</Text>
            <Text style={styles.fullListingsTxt}>VIEW FULL LISTINGS</Text>
         </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* NOTIFICATION CENTER */}
      <Modal visible={showNotifs} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
            <TouchableOpacity style={styles.drawerBlur} onPress={() => { setShowNotifs(false); setSelectMode(false); setSelectedNotifIds(new Set()); }} />
            <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                <View style={styles.handle} />

                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={[styles.drawerTitle, { color: theme.text, marginBottom: 0 }]}>🔔 Admin Alerts</Text>
                  {apiNotifs.length > 0 && (
                    <TouchableOpacity
                      style={{ backgroundColor: selectMode ? '#EF4444' : (isDark ? '#374151' : '#F3F4F6'), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                      onPress={() => { setSelectMode(s => !s); setSelectedNotifIds(new Set()); }}
                    >
                      <Text style={{ color: selectMode ? '#FFF' : theme.subText, fontWeight: '900', fontSize: 12 }}>{selectMode ? '✕ Cancel' : '☑ Select'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Select-mode actions */}
                {selectMode && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: isDark ? '#374151' : '#F3F4F6', padding: 10, borderRadius: 10, alignItems: 'center' }}
                      onPress={() => {
                        if (selectedNotifIds.size === apiNotifs.length) {
                          setSelectedNotifIds(new Set());
                        } else {
                          setSelectedNotifIds(new Set(apiNotifs.map((n: any) => n.id)));
                        }
                      }}
                    >
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 12 }}>
                        {selectedNotifIds.size === apiNotifs.length ? '☐ Deselect All' : '☑ Select All'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: selectedNotifIds.size > 0 ? '#EF4444' : (isDark ? '#374151' : '#EEE'), padding: 10, borderRadius: 10, alignItems: 'center' }}
                      onPress={async () => {
                        if (selectedNotifIds.size === 0) return;
                        try {
                          await api.deleteNotifications(Array.from(selectedNotifIds));
                          setApiNotifs(prev => prev.filter(n => !selectedNotifIds.has(n.id)));
                          setSelectedNotifIds(new Set());
                          setSelectMode(false);
                        } catch (e: any) { Alert.alert('Error', e.message); }
                      }}
                    >
                      <Text style={{ color: selectedNotifIds.size > 0 ? '#FFF' : theme.subText, fontWeight: '900', fontSize: 12 }}>🗑 Delete ({selectedNotifIds.size})</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView style={{ maxHeight: 380 }}>
                {apiNotifs.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                     <Text style={{ color: theme.subText, fontWeight: 'bold' }}>No new alerts.</Text>
                  </View>
                ) : (
                  apiNotifs.map(n => {
                    const isSelected = selectedNotifIds.has(n.id);
                    return (
                    <TouchableOpacity
                      key={n.id}
                      activeOpacity={0.75}
                      style={[styles.notifCard, { flexDirection: 'column', backgroundColor: isSelected ? (isDark ? '#1E3A5F' : '#EFF6FF') : (n.is_read ? theme.notifCardBg : (isDark ? '#2D2510' : '#FFFBEB')), borderColor: isSelected ? '#3B82F6' : (n.is_read ? theme.border : GOLD), marginBottom: 10 }]}
                      onPress={() => {
                        if (selectMode) {
                          setSelectedNotifIds(prev => {
                            const s = new Set(prev);
                            s.has(n.id) ? s.delete(n.id) : s.add(n.id);
                            return s;
                          });
                          return;
                        }
                        setShowNotifs(false);
                        if (n.type === 'new_enquiry' && n.lead_id) {
                          navigation.navigate('LeadChat', {
                            lead: {
                              id: n.lead_id,
                              name: n.lead_name || 'Client',
                              phone: n.lead_phone || '',
                              status: 'NEW',
                              source: 'User App Chat',
                              interest: n.lead_property_interest || '',
                              timestamp: n.created_at || '',
                            }
                          });
                        } else {
                          navigation.navigate('SiteVisits', n.visit_date ? { navigateToDate: n.visit_date } : {});
                        }
                      }}
                    >
                      {selectMode ? (
                        <View style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: isSelected ? '#3B82F6' : theme.border, backgroundColor: isSelected ? '#3B82F6' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                        </View>
                      ) : (
                        !n.is_read && <View style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
                      )}
                      <Text style={[styles.notifT, { color: theme.text }]}>{n.title}</Text>
                      <Text style={[styles.notifB, { color: theme.subText }]}>{n.message}</Text>
                      {n.lead_name && <Text style={{ fontSize: 11, color: theme.subText, marginTop: 4 }}>👤 {n.lead_name} {n.lead_phone ? `• ${n.lead_phone}` : ''}</Text>}
                      {n.property_title && <Text style={{ fontSize: 11, color: theme.subText }}>🏠 {n.property_title}</Text>}
                      {n.visit_date && <Text style={{ fontSize: 11, color: theme.subText }}>📅 {new Date(n.visit_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>}
                      {n.type === 'new_enquiry' && (
                        <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '700', marginTop: 6 }}>💬 Tap to open chat →</Text>
                      )}

                      {n.type === 'reschedule_request' && !selectMode && (() => {
                        const inSession = respondedMap[n.visit_id];
                        const dbAccepted = n.visit_status === 'Confirmed';
                        const dbDenied = n.visit_notes && String(n.visit_notes).startsWith('Denied by admin');
                        if (inSession === 'accepted' || dbAccepted) {
                          return <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 12, marginTop: 10 }}>✅ You accepted this</Text>;
                        }
                        if (inSession === 'denied' || dbDenied) {
                          return <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12, marginTop: 10 }}>❌ You denied this</Text>;
                        }
                        return (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: '#22C55E', padding: 10, borderRadius: 10, alignItems: 'center' }}
                              onPress={async (e) => {
                                e.stopPropagation?.();
                                try {
                                  await api.acceptVisitReschedule(n.visit_id);
                                  setRespondedMap(prev => ({ ...prev, [n.visit_id]: 'accepted' }));
                                  setApiNotifs(prev => prev.filter(x => x.id !== n.id));
                                  setShowNotifs(false);
                                  navigation.navigate('SiteVisits', n.visit_date ? { navigateToDate: n.visit_date } : {});
                                } catch (e: any) {
                                  Alert.alert('Error', e.message);
                                }
                              }}
                            >
                              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>✅ ACCEPT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 10, alignItems: 'center' }}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                setDenyingVisitId(n.visit_id);
                                setDenyingVisitDate(n.visit_date || null);
                                setDenyReason('');
                                setDenyModalVisible(true);
                              }}
                            >
                              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>❌ DENY</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}
                    </TouchableOpacity>
                    );
                  })
                )}
                </ScrollView>

                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#374151' : '#111', marginTop: 12 }]} onPress={() => { setShowNotifs(false); setSelectMode(false); setSelectedNotifIds(new Set()); }}>
                    <Text style={styles.closeBtnT}>CLOSE</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* DENY REASON MODAL */}
      <Modal visible={denyModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, marginBottom: 6 }}>❌ Deny Reschedule</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginBottom: 16 }}>Give a reason — user will be notified.</Text>
            <TextInput
              style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderRadius: 10, padding: 12, color: theme.text, minHeight: 80, textAlignVertical: 'top', fontSize: 13 }}
              placeholder="Reason for denial..."
              placeholderTextColor={theme.subText}
              multiline
              value={denyReason}
              onChangeText={setDenyReason}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: isDark ? '#374151' : '#EEE', alignItems: 'center' }} onPress={() => setDenyModalVisible(false)}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
                onPress={async () => {
                  if (!denyReason.trim()) { Alert.alert('Required', 'Please give a reason.'); return; }
                  try {
                    await api.denyVisitReschedule(denyingVisitId!, denyReason.trim());
                    setRespondedMap(prev => ({ ...prev, [denyingVisitId!]: 'denied' }));
                    setApiNotifs(prev => prev.filter(n => !(n.visit_id === denyingVisitId && n.type === 'reschedule_request')));
                    setDenyModalVisible(false);
                    setShowNotifs(false);
                    navigation.navigate('SiteVisits', denyingVisitDate ? { navigateToDate: denyingVisitDate } : {});
                  } catch (e: any) {
                    Alert.alert('Error', e.message);
                  }
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '900' }}>SEND DENIAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Text style={[styles.navIcon, { color: GOLD }]}>🏠</Text><Text style={[styles.navText, { color: GOLD }]}>DASHBOARD</Text></TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => { clearVisitsBadge?.(); navigation.navigate('SiteVisits'); }}>
           <View style={{ position: 'relative' }}>
             <Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>📅</Text>
             {newVisitsBadge > 0 && (
               <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: isDark ? '#111827' : '#FFF' }}>
                 <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{newVisitsBadge > 9 ? '9+' : newVisitsBadge}</Text>
               </View>
             )}
           </View>
           <Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>VISITS</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🏢</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>PROPERTIES</Text></TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🤝</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>LEADS</Text></TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>👤</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>PROFILE</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  notificationBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1, borderColor: '#EEE' },
  redDot: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
  bellIcon: { fontSize: 22 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 24 },
  titleSection: { marginBottom: 25 },
  overViewTxt: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 2, marginBottom: 5 },
  pulseTitle: { fontSize: 32, fontWeight: '900', color: '#111', marginBottom: 15 },
  statusRow: { flexDirection: 'row', gap: 12 },
  lastUpdated: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  updatedLabel: { fontSize: 8, fontWeight: '900', color: '#888' },
  updatedTime: { fontSize: 11, fontWeight: '700', color: '#333' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' },
  liveDots: { fontSize: 12, marginRight: 5 },
  liveTxt: { fontSize: 10, fontWeight: '900', color: '#0369A1' },
  blackCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, zIndex: 1 },
  mountainIcon: { fontSize: 24 },
  trendBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  trendText: { color: GOLD, fontSize: 10, fontWeight: '900' },
  cardLabel: { color: '#C9A84C', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5, zIndex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, zIndex: 1 },
  bigValue: { color: '#FFF', fontSize: 52, fontWeight: '900' },
  unitText: { color: '#94A3B8', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  statsGridRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  miniCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  miniCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconMini: { fontSize: 18 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  trendUp: { fontSize: 11, fontWeight: '700', color: '#22C55E' },
  miniLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1, marginBottom: 5 },
  miniValue: { fontSize: 28, fontWeight: '900', color: '#111' },
  actionRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  addPropertyBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  manageLocBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1.5,
  },
  actionIcon: { fontSize: 28, marginBottom: 10 },
  actionText: { fontSize: 13, fontWeight: '900', color: '#111' },
  // Quick Actions Grid
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  qaCard: { width: '47%', borderRadius: 22, padding: 20, alignItems: 'center', borderWidth: 1.5, elevation: 1 },
  qaIcon: { fontSize: 26, marginBottom: 8 },
  qaText: { fontSize: 12, fontWeight: '900', color: '#111', textAlign: 'center' },
  // Agenda widget
  agendaCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6 },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  agendaLabel: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 1.5 },
  agendaTitle: { fontSize: 15, fontWeight: '900', color: '#111', marginTop: 3 },
  agendaViewAll: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  agendaEmpty: { alignItems: 'center', paddingVertical: 15 },
  agendaEmptyText: { color: '#94A3B8', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  agendaScheduleBtn: { color: GOLD, fontWeight: '900', fontSize: 13 },
  agendaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  agendaTimeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  agendaTimeText: { fontSize: 12, fontWeight: '900', color: '#1E293B' },
  agendaPropName: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
  agendaClientName: { fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 },
  agendaStatusDot: { width: 8, height: 8, borderRadius: 4 },
  prospectsSection: {
    marginBottom: 25,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  prospectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  prospectsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  leadCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadStatusLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  leadInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  leadCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  leadTimeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  leadInterestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  leadActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCommBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commBtnEmoji: {
    fontSize: 16,
  },
  emptyLeadsBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyLeadsText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  fullListingsBtn: { backgroundColor: '#111', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12, marginBottom: 40 },
  listIcon: { fontSize: 18 },
  fullListingsTxt: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  revenueCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 28, marginBottom: 25, borderWidth: 1, borderColor: '#F3F4F6' },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  revLabel: { fontSize: 9, fontWeight: '900', color: '#AAA', marginBottom: 5 },
  revValue: { fontSize: 26, fontWeight: '900', color: '#111' },
  projectionBox: { alignItems: 'flex-end' },
  projLabel: { fontSize: 8, fontWeight: '900', color: '#BBB', marginBottom: 4 },
  projValue: { fontSize: 16, fontWeight: '900', color: '#22C55E' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, gap: 12 },
  bar: { flex: 1, borderRadius: 6 },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  drawerBlur: { flex: 1 },
  drawerPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 45, borderTopRightRadius: 45, padding: 30, paddingBottom: 60 },
  handle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
  drawerTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 25 },
  notifCard: { backgroundColor: '#F9FAFB', borderRadius: 25, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  notifLead: { width: 8, height: 45, backgroundColor: GOLD, borderRadius: 4, marginRight: 18 },
  notifT: { fontSize: 15, fontWeight: '900', color: '#111' },
  notifB: { fontSize: 12, color: '#666', marginTop: 3 },
  notifTime: { fontSize: 10, fontWeight: '800', color: '#BBB' },
  closeBtn: { backgroundColor: '#111', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  closeBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%', zIndex: 99, elevation: 10 },
  navItem: { alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 28, color: '#AAA' },
  navText: { fontSize: 8, fontWeight: '900', color: '#AAA' },
});

export default HomeScreen;
