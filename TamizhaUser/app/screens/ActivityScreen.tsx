import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getUserProfile, getLeadId } from '../services/api';

const { width } = Dimensions.get('window');

const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Saved', label: 'SAVED', icon: '❤️', route: 'SavedProperties' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

const ActivityScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const activeTab = 'Activity';

  // ── Reschedule picker state ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [showRescheduler, setShowRescheduler] = useState(false);
  const [reschedulingVisitId, setReschedulingVisitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);

  const [userPhone, setUserPhone] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

  React.useEffect(() => {
    getUserProfile().then(p => {
      if (p?.avatarUri) setAvatarUri(p.avatarUri);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const leadId = await getLeadId();
        setCurrentLeadId(leadId);
        const allVisits = await api.getSiteVisits();
        const myVisits = leadId
          ? allVisits.filter((v: any) => String(v.lead_id) === String(leadId))
          : [];
        setVisits(myVisits.sort((a: any, b: any) =>
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        ));
        if (leadId) {
          const notifs = await api.getUserNotifications(leadId);
          setNotifications(notifs);
        }
      } catch (e) {
        console.error('ActivityScreen fetch error:', e);
      }
    };
    fetchData();
  }, []);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Format initial slot to match current date
  const [confirmedSlot, setConfirmedSlot] = useState(
    `${monthNames[today.getMonth()].slice(0, 3)} ${today.getDate()}  •  10:30 AM`
  );

  const MONTH_LABEL = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Current month rendering calculations
  const MONTH_OFFSET = viewDate.getDay();
  const MONTH_DAYS = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array(MONTH_OFFSET).fill(null),
    ...Array.from({ length: MONTH_DAYS }, (_, i) => i + 1),
  ];

  const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM - 6 PM
  const MINUTES = [0, 15, 30, 45];

  const fmt2 = (n: number) => String(n).padStart(2, '0');
  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${fmt2(selectedMinute)} ${ampm}`;
  };

  const handleConfirmReschedule = async () => {
    const ampm = selectedHour >= 12 ? 'PM' : 'AM';
    const h12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
    const shortMonth = monthNames[selectedDate.getMonth()].slice(0, 3);
    const slot = `${shortMonth} ${selectedDate.getDate()}  •  ${h12}:${fmt2(selectedMinute)} ${ampm}`;

    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const newDate = `${yyyy}-${mm}-${dd}`;
    const newTime = `${String(selectedHour).padStart(2, '0')}:${fmt2(selectedMinute)}`;

    setConfirmedSlot(slot);
    setShowRescheduler(false);

    if (reschedulingVisitId) {
      try {
        await api.updateSiteVisit(reschedulingVisitId, {
          visit_date: `${newDate}T${newTime}`,
          status: 'Tentative',
          notes: `Rescheduled by user to ${newDate} ${newTime}`,
          rescheduled_by_user: true,
        });
        setVisits(prev => prev.map(v =>
          String(v.id) === String(reschedulingVisitId)
            ? { ...v, visit_date: `${newDate}T${newTime}:00`, status: 'Tentative', notes: `Rescheduled by user to ${newDate} ${newTime}` }
            : v
        ));
        Alert.alert('Confirmed ✅', `Visit rescheduled to\n${slot}\n\nAdmin will confirm shortly.`);
      } catch (e) {
        Alert.alert('Error', 'Could not reschedule. Please try again.');
      }
    } else {
      Alert.alert('Confirmed ✅', `Visit rescheduled to\n${slot}`);
    }
    setReschedulingVisitId(null);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar translucent={false} backgroundColor="#FFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Filter')}>
          <Text style={styles.headerIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR ACTIVITY</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={{ position: 'relative' }} onPress={() => setShowNotifs(true)}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{notifications.filter(n => !n.is_read).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={showNotifs} animationType="slide" transparent onRequestClose={() => setShowNotifs(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowNotifs(false)} />
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#111' }}>🔔 Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}>
                <Text style={{ fontSize: 18, color: '#AAA' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {notifications.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>🔔</Text>
                  <Text style={{ color: '#888' }}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    style={{ backgroundColor: notif.is_read ? '#F8F8F8' : '#FFF9EC', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: notif.is_read ? '#EEE' : '#E2C36D' }}
                    onPress={async () => {
                      if (!notif.is_read) {
                        await api.markNotificationRead(notif.id);
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                      }
                      if (notif.type === 'visit_confirmed' || notif.type === 'visit_denied') {
                        setShowNotifs(false);
                        try {
                          const allVisits = await api.getSiteVisits();
                          const myVisits = currentLeadId
                            ? allVisits.filter((v: any) => String(v.lead_id) === String(currentLeadId))
                            : [];
                          setVisits(myVisits.sort((a: any, b: any) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()));
                        } catch (_) {}
                      }
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 4 }}>{notif.title}</Text>
                    <Text style={{ fontSize: 12, color: '#555', lineHeight: 18 }}>{notif.message}</Text>
                    {notif.property_title && (
                      <Text style={{ fontSize: 11, color: '#888', marginTop: 6 }}>🏠 {notif.property_title} {notif.property_location ? `• ${notif.property_location}` : ''}</Text>
                    )}
                    {notif.visit_date && (
                      <Text style={{ fontSize: 11, color: '#888' }}>📅 {new Date(notif.visit_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                    )}
                    {!notif.is_read && <View style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2C36D' }} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <Text style={styles.sectionTitle}>Scheduled Viewings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {visits.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📅</Text>
                <Text style={{ color: '#888', fontWeight: 'bold' }}>No upcoming visits scheduled.</Text>
              </View>
            ) : (
              visits.map(visit => {
                const dateObj = new Date(visit.visit_date);
                const statusUpper = String(visit.status || '').toUpperCase();
                const isConfirmed = statusUpper === 'CONFIRMED';
                return (
                  <View key={visit.id} style={styles.visitCard}>
                    <View style={styles.visitHeader}>
                      <View style={styles.dateBox}>
                        <Text style={styles.dateMonth}>{monthNames[dateObj.getMonth() || 0]?.slice(0, 3)?.toUpperCase() || 'MON'}</Text>
                        <Text style={styles.dateNum}>{dateObj.getDate() || '1'}</Text>
                      </View>
                      <View style={styles.visitInfo}>
                        <Text style={styles.visitTime}>
                          {new Date(visit.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' • '}{isConfirmed ? 'CONFIRMED' : statusUpper || 'PENDING'}
                        </Text>
                        <Text style={styles.visitTitle}>{visit.property_title || 'Property Name'}</Text>
                        <Text style={styles.visitLocation}>📍 {visit.property_location || 'Unknown Location'}</Text>
                        {visit.notes ? (
                          <Text style={{ fontSize: 11, color: '#555', marginTop: 4, fontStyle: 'italic' }}>
                            📝 {visit.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ paddingTop: 15 }}>
                      <View style={styles.agentRow}>
                        <View style={styles.agentInfoRow}>
                          <Text style={styles.agentIcon}>👨‍💼</Text>
                          <Text style={styles.agentTxt}>Admin / Owner</Text>
                        </View>
                        <View style={styles.visitActionRow}>
                          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => { setReschedulingVisitId(visit.id); setShowRescheduler(true); }}>
                            <Text style={styles.actionTxtOutline}>RESCHEDULE</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionBtnSolid} onPress={() => Linking.openURL('tel:+917010296572')}>
                            <Text style={styles.actionTxtSolid}>CALL</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

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

      {/* ── Reschedule Date-Time Picker Modal ── */}
      <Modal
        visible={showRescheduler}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRescheduler(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRescheduler(false)}
        />
        <View style={styles.pickerSheet}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>📅  Reschedule Visit</Text>
            <TouchableOpacity onPress={() => setShowRescheduler(false)}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pickerSub}>Pollachi Coconut Grove • Owner: Ramesh</Text>

          {/* ── Calendar ── */}
          <View style={styles.calSection}>
            <View style={styles.calMonthRow}>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                <Text style={styles.calMonthArrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calMonth}>{MONTH_LABEL}</Text>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                <Text style={styles.calMonthArrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={styles.calDaysRow}>
              {DAYS_OF_WEEK.map(d => (
                <Text key={d} style={styles.calDayLabel}>{d}</Text>
              ))}
            </View>
            {/* Date grid */}
            <View style={styles.calGrid}>
              {calendarCells.map((day, idx) => {
                const isNull = day === null;
                const cellDate = isNull ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isPast = cellDate ? cellDate < today : false;
                const isSelected = cellDate ? cellDate.getTime() === selectedDate.getTime() : false;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.calCell,
                      isNull && styles.calCellEmpty,
                      isSelected && styles.calCellActive,
                      isPast && styles.calCellPast,
                    ]}
                    onPress={() => !isPast && cellDate && setSelectedDate(cellDate)}
                    disabled={isPast || isNull}
                  >
                    {!isNull && (
                      <Text style={[
                        styles.calCellText,
                        isSelected && styles.calCellTextActive,
                        isPast && styles.calCellTextPast,
                      ]}>{day}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Time Picker ── */}
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionLabel}>SELECT TIME</Text>
            <View style={styles.timeRow}>
              {/* Hours */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeItem, selectedHour === h && styles.timeItemActive]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.timeItemText, selectedHour === h && styles.timeItemTextActive]}>
                        {h % 12 === 0 ? 12 : h % 12} {h >= 12 ? 'PM' : 'AM'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.timeItem, selectedMinute === m && styles.timeItemActive]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.timeItemText, selectedMinute === m && styles.timeItemTextActive]}>
                        :{fmt2(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Preview */}
              <View style={styles.timePreview}>
                <Text style={styles.timePreviewLabel}>Selected</Text>
                <Text style={styles.timePreviewDay}>
                  {`${monthNames[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getDate()}`}
                </Text>
                <Text style={styles.timePreviewTime}>
                  {fmtHour(selectedHour)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.pickerActions}>
            <TouchableOpacity
              style={styles.pickerCancelBtn}
              onPress={() => setShowRescheduler(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerConfirmBtn}
              onPress={handleConfirmReschedule}
            >
              <Text style={styles.pickerConfirmText}>✓ Confirm Visit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1.5,
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  segmentBtnActive: {
    borderBottomColor: '#0B132B',
  },
  segmentTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
  },
  segmentTxtActive: {
    color: '#0B132B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 20,
  },
  visitCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateBox: {
    backgroundColor: '#F8F4E6',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginRight: 15,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B8860B',
  },
  dateNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  visitInfo: {
    flex: 1,
  },
  visitTime: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    marginBottom: 4,
  },
  visitTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000',
    marginBottom: 6,
  },
  visitLocation: {
    fontSize: 10,
    color: '#888',
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  agentTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  visitActionRow: {
    flexDirection: 'row',
  },
  actionBtnOutline: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    marginRight: 10,
  },
  actionTxtOutline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#555',
  },
  actionBtnSolid: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#0B132B',
  },
  actionTxtSolid: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  progressTitleRow: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
    lineHeight: 18,
  },
  progressPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    marginTop: 4,
  },
  timelineBox: {
    marginLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 25,
    position: 'relative',
  },
  timelineDotDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#27AE60',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    borderWidth: 2,
    borderColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  innerDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B132B',
  },
  timelineDotPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    zIndex: 1,
  },
  timelineLineDone: {
    position: 'absolute',
    left: 11,
    top: 24,
    width: 2,
    height: 35,
    backgroundColor: '#27AE60',
  },
  timelineLinePending: {
    position: 'absolute',
    left: 11,
    top: 24,
    width: 2,
    height: 35,
    backgroundColor: '#F0F0F0',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 20,
  },
  timelineTitleDark: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111',
    marginBottom: 4,
  },
  timelineTitleLight: {
    fontSize: 12,
    fontWeight: '900',
    color: '#999',
    marginBottom: 4,
  },
  timelineSub: {
    fontSize: 10,
    color: '#666',
  },
  timelinePendingSub: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '700',
  },
  fullWidthBtn: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  fullWidthBtnTxt: {
    fontSize: 9,
    fontWeight: '900',
    color: '#111',
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

  // ── Reschedule Modal ──
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  pickerTitle: { fontSize: 16, fontWeight: '900', color: '#0B132B' },
  pickerClose: { fontSize: 18, color: '#BBB', padding: 4 },
  pickerSub: { fontSize: 11, color: '#888', paddingHorizontal: 20, marginBottom: 12, fontWeight: '600' },

  // Calendar
  calSection: { paddingHorizontal: 16, marginBottom: 12 },
  calMonthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 10 },
  calMonth: { fontSize: 13, fontWeight: '900', color: '#0B132B' },
  calMonthArrow: { fontSize: 16, fontWeight: '900', color: '#888', paddingHorizontal: 10 },
  calDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  calDayLabel: { width: 34, textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#999' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  calCellEmpty: {},
  calCellActive: { backgroundColor: '#0B132B', borderRadius: 20 },
  calCellPast: { opacity: 0.3 },
  calCellText: { fontSize: 12, fontWeight: '700', color: '#111' },
  calCellTextActive: { color: '#FFF' },
  calCellTextPast: { color: '#BBB' },

  // Time picker
  timeSection: { paddingHorizontal: 16, marginBottom: 10 },
  timeSectionLabel: { fontSize: 8, fontWeight: '900', color: '#AAA', letterSpacing: 1.5, marginBottom: 8 },
  timeRow: { flexDirection: 'row' },
  timeColumn: { flex: 1, marginRight: 8 },
  timeColumnLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', marginBottom: 4, textAlign: 'center' },
  timeScroll: { height: 110 },
  timeItem: {
    paddingVertical: 8, alignItems: 'center',
    borderRadius: 10, marginBottom: 4, backgroundColor: '#F5F5F5',
  },
  timeItemActive: { backgroundColor: '#0B132B' },
  timeItemText: { fontSize: 11, fontWeight: '800', color: '#555' },
  timeItemTextActive: { color: '#FFF' },
  timePreview: {
    flex: 1.2, backgroundColor: '#0B132B', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', padding: 10,
  },
  timePreviewLabel: { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginBottom: 4 },
  timePreviewDay: { fontSize: 13, fontWeight: '900', color: '#D4AF37', marginBottom: 4 },
  timePreviewTime: { fontSize: 16, fontWeight: '900', color: '#FFF' },

  // Action buttons
  pickerActions: {
    flexDirection: 'row', paddingHorizontal: 16, marginTop: 4,
  },
  pickerCancelBtn: {
    flex: 1, paddingVertical: 14, marginRight: 10,
    borderRadius: 25, borderWidth: 1.5, borderColor: '#DDD',
    alignItems: 'center',
  },
  pickerCancelText: { fontSize: 13, fontWeight: '800', color: '#888' },
  pickerConfirmBtn: {
    flex: 2, paddingVertical: 14, backgroundColor: '#0B132B',
    borderRadius: 25, alignItems: 'center',
  },
  pickerConfirmText: { fontSize: 13, fontWeight: '900', color: '#FFF' },
});

export default ActivityScreen;
