import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Linking,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { api } from '../services/api';

const { width } = Dimensions.get('window');
const GOLD = '#C9A84C';

type VisitType = 'Showing' | 'Walk-through' | 'Call';
type VisitStatus = 'Confirmed' | 'Tentative';

interface Visit {
  id: string;
  propertyName: string;
  propertyId?: string;
  clientName: string;
  clientPhone: string;
  visitDate: string; // 'YYYY-MM-DD'
  visitTime: string; // 'HH:MM'
  duration: string;
  type: VisitType;
  status: VisitStatus;
  notes?: string;
}

interface SiteVisitsScreenProps {
  navigation: any;
  route: {
    params?: {
      preselectProperty?: any;
      navigateToDate?: string;
    };
  };
  isDark?: boolean;
}

const VISIT_TYPES: VisitType[] = ['Showing', 'Walk-through', 'Call'];
const VISIT_STATUSES: VisitStatus[] = ['Confirmed', 'Tentative'];

// Generate week dates (Mon-Sun) with offset (0=current, 1=next, -1=prev)
const getWeekDates = (weekOffset: number = 0) => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      label: days[i],
      date: dd,
      month: String(d.getMonth() + 1).padStart(2, '0'),
      fullDate: `${yyyy}-${mm}-${dd}`,
      isToday: d.toDateString() === today.toDateString(),
    };
  });
};

const toDateKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getWeekOffsetForDate = (dateStr: string): number => {
  const target = new Date(dateStr);
  const now = new Date();
  const nowDay = now.getDay();
  const nowMonday = new Date(now);
  nowMonday.setDate(now.getDate() - (nowDay === 0 ? 6 : nowDay - 1));
  nowMonday.setHours(0, 0, 0, 0);
  const tDay = target.getDay();
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - (tDay === 0 ? 6 : tDay - 1));
  targetMonday.setHours(0, 0, 0, 0);
  return Math.round((targetMonday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

const SiteVisitsScreen = ({ navigation, route, isDark = false }: SiteVisitsScreenProps) => {
  const preselectProperty = route?.params?.preselectProperty;
  const navigateToDate = route?.params?.navigateToDate;

  const todayKey = toDateKey(new Date());
  const initWeekOffset = navigateToDate ? getWeekOffsetForDate(navigateToDate) : 0;
  const initSelectedDate = navigateToDate ? navigateToDate.split('T')[0] : todayKey;

  const [weekOffset, setWeekOffset] = useState(initWeekOffset);
  const weekDates = getWeekDates(weekOffset);

  const [selectedDate, setSelectedDate] = useState(initSelectedDate);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showAddModal, setShowAddModal] = useState(!!preselectProperty);

  // Edit visit state
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<VisitStatus>('Confirmed');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dynamic theme colors
  const theme = {
    background: isDark ? '#0B0F19' : '#FFF',
    cardBg: isDark ? '#111827' : '#FFF',
    headerBg: isDark ? '#0B0F19' : '#FFF',
    text: isDark ? '#F9FAFB' : '#1E293B',
    subText: isDark ? '#9CA3AF' : '#64748B',
    border: isDark ? '#1F2937' : '#F1F5F9',
    greyBg: isDark ? '#1F2937' : '#F8FAFC',
    inputBg: isDark ? '#1F2937' : '#F8FAFC',
    inputBorder: isDark ? '#374151' : '#E2E8F0',
    inputText: isDark ? '#FFF' : '#1E293B',
    weekStripBg: isDark ? '#111827' : '#FAFAFA',
    dayNumText: isDark ? '#F9FAFB' : '#1E293B',
    statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
    statusBarBg: isDark ? '#0B0F19' : '#FFF',
    bottomNavBg: isDark ? '#111827' : '#FFF',
    bottomNavBorder: isDark ? '#1F2937' : '#EEE',
    navText: isDark ? '#9CA3AF' : '#AAA',
    navIcon: isDark ? '#9CA3AF' : '#AAA',
    timelineLine: isDark ? '#1F2937' : '#F1F5F9',
    emptyText: isDark ? '#9CA3AF' : '#94A3B8',
    emptyTitle: isDark ? '#F9FAFB' : '#475569',
    modalBg: isDark ? '#111827' : '#FFF',
    modalHandle: isDark ? '#374151' : '#DDD',
    pickerItemBorder: isDark ? '#1F2937' : '#F1F5F9',
    chipText: isDark ? '#9CA3AF' : '#64748B',
    chipActiveBg: isDark ? '#FFF' : '#111',
    chipActiveText: isDark ? '#111' : '#FFF',
  };

  // Properties & Leads for selectors
  const [propertyOptions, setPropertyOptions] = useState<any[]>([]);
  const [leadOptions, setLeadOptions] = useState<any[]>([]);

  // Form state
  const [formProperty, setFormProperty] = useState(preselectProperty ? (preselectProperty.name || preselectProperty.title || '') : '');
  const [formPropertyId, setFormPropertyId] = useState(preselectProperty ? (preselectProperty.id || '') : '');
  const [formClient, setFormClient] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formDate, setFormDate] = useState(todayKey);
  const [formTime, setFormTime] = useState('10:00');
  const [formDuration, setFormDuration] = useState('45 min');
  const [formType, setFormType] = useState<VisitType>('Showing');
  const [formStatus, setFormStatus] = useState<VisitStatus>('Confirmed');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPropPicker, setShowPropPicker] = useState(false);
  const [showLeadPicker, setShowLeadPicker] = useState(false);

  const loadVisitsData = () => {
    api.getProperties().then(data => {
      setPropertyOptions(data.map((d: any) => ({ id: d.id, name: d.title || 'Property', location: d.location || '' })));
    }).catch(err => console.error('Properties fetch error:', err));
    api.getLeads().then(data => {
      setLeadOptions(data.map((d: any) => ({ id: d.id, name: d.name || 'Client', phone: d.phone || '', userId: d.login_user_id || d.loginUserId || '' })));
    }).catch(err => console.error('Leads fetch error:', err));
    api.getSiteVisits().then((data: any[]) => {
      setVisits(data.map((d: any) => ({
        id: String(d.id),
        propertyName: d.property_title || 'Property',
        propertyId: d.property_id ? String(d.property_id) : undefined,
        clientName: d.lead_name || 'Client',
        clientPhone: d.lead_phone || '',
        visitDate: d.visit_date ? new Date(d.visit_date).toISOString().split('T')[0] : '',
        visitTime: d.visit_date ? new Date(d.visit_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '10:00 AM',
        duration: '1 Hour',
        type: 'Showing' as VisitType,
        status: (d.status === 'Confirmed' || d.status === 'Tentative') ? d.status as VisitStatus : 'Confirmed' as VisitStatus,
        notes: d.notes || '',
      })));
    }).catch(err => console.error('Visits fetch error:', err));
  };

  useEffect(() => {
    loadVisitsData();
  }, []);

  const filteredVisits = visits
    .filter(v => v.visitDate === selectedDate)
    .sort((a, b) => a.visitTime.localeCompare(b.visitTime));

  const handleSaveVisit = async () => {
    if (!formProperty.trim() || !formClient.trim() || !formClientPhone.trim()) {
      Alert.alert('Missing Info', 'Please provide Property, Client Name, and Client Phone Contact.');
      return;
    }
    setIsSaving(true);
    try {
      await api.createSiteVisit({
        lead_id: formClientId || null,
        property_id: formPropertyId || null,
        visit_date: `${formDate}T${formTime}`,
        status: formStatus,
        notes: `${formProperty} - ${formClient} - ${formNotes}`.trim(),
      });
      setShowAddModal(false);
      resetForm();
      loadVisitsData();
    } catch (e: any) {
      console.error('Error saving visit:', e);
      Alert.alert('Error', `Could not schedule visit: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (visit: Visit) => {
    setEditingVisit(visit);
    setEditDate(visit.visitDate);
    setEditTime(visit.visitTime);
    setEditStatus(visit.status);
    setEditNotes(visit.notes || '');
  };

  const handleEditVisit = async () => {
    if (!editingVisit) return;
    setIsSavingEdit(true);
    try {
      await api.updateSiteVisit(editingVisit.id, {
        visit_date: `${editDate}T${editTime}`,
        status: editStatus,
        notes: editNotes.trim(),
      });

      setEditingVisit(null);
      Alert.alert('✅ Updated', 'Visit details updated and user notified.');
    } catch (e: any) {
      Alert.alert('Error', `Could not update: ${e.message || e}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const resetForm = () => {
    setFormProperty('');
    setFormPropertyId('');
    setFormClient('');
    setFormClientPhone('');
    setFormClientId('');
    setFormDate(todayKey);
    setFormTime('10:00');
    setFormDuration('45 min');
    setFormType('Showing');
    setFormStatus('Confirmed');
    setFormNotes('');
  };

  const typeColor = (t: VisitType) => {
    if (t === 'Showing') return GOLD;
    if (t === 'Walk-through') return '#22C55E';
    return '#60A5FA';
  };

  const statusColor = (s: VisitStatus) => s === 'Confirmed' ? '#22C55E' : GOLD;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>ADMIN SCHEDULER</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Site Visits</Text>
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addFabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* WEEK CALENDAR STRIP */}
      <View style={[styles.weekStrip, { backgroundColor: theme.weekStripBg, borderBottomColor: theme.border }]}>
        {/* Week navigation row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => setWeekOffset(prev => prev - 1)} style={{ padding: 6 }}>
            <Text style={{ fontSize: 18, color: GOLD, fontWeight: '900' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.subText, letterSpacing: 0.5 }}>
            {weekDates[0]?.date}/{weekDates[0]?.month} – {weekDates[6]?.date}/{weekDates[6]?.month}
            {weekOffset === 0 ? '  (This Week)' : weekOffset > 0 ? `  (+${weekOffset}w)` : `  (${weekOffset}w)`}
          </Text>
          <TouchableOpacity onPress={() => setWeekOffset(prev => prev + 1)} style={{ padding: 6 }}>
            <Text style={{ fontSize: 18, color: GOLD, fontWeight: '900' }}>›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScroll}>
          {weekDates.map(day => {
            const isSelected = day.fullDate === selectedDate;
            const hasVisits = visits.some(v => v.visitDate === day.fullDate);
            return (
              <TouchableOpacity
                key={day.fullDate}
                style={[styles.dayBtn, isSelected ? styles.dayBtnActive : { backgroundColor: isDark ? '#1F2937' : '#FAFAFA' }]}
                onPress={() => setSelectedDate(day.fullDate)}
              >
                <Text style={[styles.dayLabel, isSelected ? styles.dayLabelActive : { color: theme.subText }]}>{day.label}</Text>
                <Text style={[styles.dayNum, isSelected ? styles.dayNumActive : { color: theme.dayNumText }, day.isToday && !isSelected && { color: GOLD }]}>
                  {day.date}
                </Text>
                {hasVisits && <View style={[styles.visitDot, isSelected && { backgroundColor: '#FFF' }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* TIMELINE */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timelineContent}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayHeaderText, { color: theme.text }]}>
            {selectedDate === todayKey ? 'Today · ' : ''}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={[styles.dayHeaderCount, { color: theme.subText }]}>{filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''}</Text>
        </View>

        {filteredVisits.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: theme.emptyTitle }]}>No visits scheduled</Text>
            <Text style={[styles.emptyText, { color: theme.emptyText }]}>Tap + to log a new site visit for this day.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => { setFormDate(selectedDate); setShowAddModal(true); }}>
              <Text style={styles.emptyBtnText}>+ SCHEDULE VISIT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredVisits.map((visit, idx) => (
            <View key={visit.id} style={styles.visitRow}>
              {/* Time column */}
              <View style={styles.timeCol}>
                <Text style={[styles.timeText, { color: theme.text }]}>{visit.visitTime}</Text>
                <Text style={[styles.durText, { color: theme.subText }]}>{visit.duration}</Text>
              </View>

              {/* Timeline dot & line */}
              <View style={styles.timelineBar}>
                <View style={[styles.timelineDot, { borderColor: typeColor(visit.type), backgroundColor: theme.cardBg }]} />
                {idx < filteredVisits.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.timelineLine }]} />}
              </View>

              {/* Visit card */}
              <View style={[styles.visitCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.visitCardTop}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor(visit.type) + '20', borderColor: typeColor(visit.type) }]}>
                    <Text style={[styles.typeBadgeText, { color: typeColor(visit.type) }]}>{visit.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(visit.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor(visit.status) }]}>{visit.status}</Text>
                  </View>
                </View>
                <Text style={[styles.visitPropName, { color: theme.text }]} numberOfLines={1}>{visit.propertyName}</Text>
                <View style={styles.visitClientRow}>
                  <Text style={styles.visitClientIcon}>👤</Text>
                  <Text style={[styles.visitClientName, { color: theme.subText }]}>{visit.clientName}</Text>
                </View>
                {visit.notes ? <Text style={[styles.visitNotes, { color: theme.subText }]} numberOfLines={2}>{visit.notes}</Text> : null}
                <View style={styles.visitActions}>
                  <TouchableOpacity
                    style={[styles.visitActionBtn, { backgroundColor: theme.greyBg, borderColor: theme.border }]}
                    onPress={() => visit.clientPhone && Linking.openURL(`tel:${visit.clientPhone}`)}
                  >
                    <Text style={[styles.visitActionIcon, { color: theme.text }]}>📞</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visitActionBtn, { backgroundColor: theme.greyBg, borderColor: '#22C55E' }]}
                    onPress={() => visit.clientPhone && Linking.openURL(`whatsapp://send?phone=${visit.clientPhone}`)}
                  >
                    <Text style={[styles.visitActionIcon, { color: theme.text }]}>💬</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visitActionBtn, { backgroundColor: isDark ? '#3E3213' : '#FEFCE8', borderColor: GOLD, flex: 1 }]}
                    onPress={() => openEditModal(visit)}
                  >
                    <Text style={{ fontSize: 10, color: GOLD, fontWeight: '900' }}>✏️ EDIT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visitActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                    onPress={() => Alert.alert('Delete Visit', `Delete this visit for ${visit.clientName}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                          await api.deleteSiteVisit(visit.id);
                          loadVisitsData();
                        } catch (e: any) {
                          Alert.alert('Error', e.message || 'Could not delete visit');
                        }
                      }},
                    ])}
                  >
                    <Text style={[styles.visitActionIcon, { color: '#EF4444' }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* EDIT VISIT MODAL */}
      <Modal visible={!!editingVisit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBlur} onPress={() => setEditingVisit(null)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.modalHandle }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>✏️ EDIT VISIT</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[styles.inputLabel, { color: GOLD }]}>DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="e.g. 2026-06-20"
                placeholderTextColor={theme.subText}
              />

              <Text style={[styles.inputLabel, { color: GOLD, marginTop: 14 }]}>TIME (HH:MM)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={editTime}
                onChangeText={setEditTime}
                placeholder="e.g. 10:30"
                placeholderTextColor={theme.subText}
              />

              <Text style={[styles.inputLabel, { color: GOLD, marginTop: 14 }]}>STATUS</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                {VISIT_STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      { borderColor: theme.border, backgroundColor: theme.greyBg },
                      editStatus === s && { backgroundColor: s === 'Confirmed' ? '#22C55E' : GOLD, borderColor: 'transparent' }
                    ]}
                    onPress={() => setEditStatus(s)}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '800', color: theme.chipText }, editStatus === s && { color: '#FFF' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: GOLD, marginTop: 14 }]}>NOTES</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, height: 80, textAlignVertical: 'top' }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Any update notes..."
                placeholderTextColor={theme.subText}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 20, opacity: isSavingEdit ? 0.6 : 1 }]}
                onPress={handleEditVisit}
                disabled={isSavingEdit}
              >
                {isSavingEdit
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.saveBtnText}>✅ SAVE & NOTIFY USER</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD VISIT MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBlur} onPress={() => { if (!isSaving) { setShowAddModal(false); resetForm(); } }} />
          <View style={[styles.modalPanel, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.handle, { backgroundColor: theme.modalHandle }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>SCHEDULE SITE VISIT</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* PROPERTY INPUT / SELECTOR */}
              <Text style={styles.inputLabel}>PROPERTY *</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, marginBottom: 0 }]}
                  value={formProperty}
                  onChangeText={(text) => {
                    setFormProperty(text);
                    const matched = propertyOptions.find(p => p.name.toLowerCase() === text.trim().toLowerCase());
                    if (matched) {
                      setFormPropertyId(matched.id);
                    } else {
                      setFormPropertyId('');
                    }
                  }}
                  placeholder="Type or select property..."
                  placeholderTextColor={theme.subText}
                />
                <TouchableOpacity 
                  style={[styles.selectorBtn, { width: 52, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', marginBottom: 0, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} 
                  onPress={() => setShowPropPicker(!showPropPicker)}
                >
                  <Text style={{ fontSize: 16, color: GOLD }}>▾</Text>
                </TouchableOpacity>
              </View>

              {/* PROPERTY PICKER INLINE */}
              {showPropPicker && (
                <View style={[styles.pickerList, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  {propertyOptions.length === 0 ? (
                    <Text style={[styles.pickerEmpty, { color: theme.subText }]}>No properties found in database.</Text>
                  ) : (
                    propertyOptions.map(p => (
                      <TouchableOpacity key={p.id} style={[styles.pickerItem, { borderBottomColor: theme.pickerItemBorder }]} onPress={() => {
                        setFormProperty(p.name);
                        setFormPropertyId(p.id);
                        setShowPropPicker(false);
                      }}>
                        <Text style={[styles.pickerItemText, { color: theme.text }]}>{p.name}</Text>
                        {p.location ? <Text style={[styles.pickerItemSub, { color: theme.subText }]}>{p.location}</Text> : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* CLIENT INPUT / SELECTOR */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>CLIENT (LEAD) *</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, marginBottom: 0 }]}
                  value={formClient}
                  onChangeText={(text) => {
                    setFormClient(text);
                    const matched = leadOptions.find(l => l.name.toLowerCase() === text.trim().toLowerCase());
                    if (matched) {
                      setFormClientPhone(matched.phone);
                      setFormClientId(matched.id || '');
                    }
                  }}
                  placeholder="Type client name or choose..."
                  placeholderTextColor={theme.subText}
                />
                <TouchableOpacity 
                  style={[styles.selectorBtn, { width: 52, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', marginBottom: 0, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} 
                  onPress={() => setShowLeadPicker(!showLeadPicker)}
                >
                  <Text style={{ fontSize: 16, color: GOLD }}>▾</Text>
                </TouchableOpacity>
              </View>

              {showLeadPicker && (
                <View style={[styles.pickerList, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  {leadOptions.length === 0 ? (
                    <Text style={[styles.pickerEmpty, { color: theme.subText }]}>No leads found in database.</Text>
                  ) : (
                    leadOptions.map(l => (
                      <TouchableOpacity key={l.id} style={[styles.pickerItem, { borderBottomColor: theme.pickerItemBorder }]} onPress={() => {
                        setFormClient(l.name);
                        setFormClientPhone(l.phone);
                        setFormClientId(l.id || '');
                        setShowLeadPicker(false);
                      }}>
                        <Text style={[styles.pickerItemText, { color: theme.text }]}>{l.name}</Text>
                        {l.phone ? <Text style={[styles.pickerItemSub, { color: theme.subText }]}>{l.phone}</Text> : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* CLIENT PHONE CONTACT */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>CLIENT PHONE CONTACT *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formClientPhone}
                onChangeText={setFormClientPhone}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={theme.subText}
                keyboardType="phone-pad"
              />

              {/* DATE */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formDate}
                onChangeText={setFormDate}
                placeholder="e.g. 2026-06-10"
                placeholderTextColor={theme.subText}
              />

              {/* TIME */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>TIME (HH:MM)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formTime}
                onChangeText={setFormTime}
                placeholder="e.g. 10:30"
                placeholderTextColor={theme.subText}
              />

              {/* DURATION */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>DURATION</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 5 }}>
                {['30 min', '45 min', '60 min', '90 min'].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chipBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }, formDuration === d && { backgroundColor: theme.chipActiveBg, borderColor: theme.chipActiveBg }]}
                    onPress={() => setFormDuration(d)}
                  >
                    <Text style={[styles.chipBtnText, { color: theme.chipText }, formDuration === d && { color: theme.chipActiveText }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* VISIT TYPE */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>VISIT TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {VISIT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chipBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }, formType === t && { backgroundColor: typeColor(t), borderColor: typeColor(t) }]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.chipBtnText, { color: theme.chipText }, formType === t && { color: '#FFF' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* STATUS */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>STATUS</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {VISIT_STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chipBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }, formStatus === s && { backgroundColor: statusColor(s), borderColor: statusColor(s) }]}
                    onPress={() => setFormStatus(s)}
                  >
                    <Text style={[styles.chipBtnText, { color: theme.chipText }, formStatus === s && { color: '#FFF' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NOTES */}
              <Text style={[styles.inputLabel, { marginTop: 15 }]}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Any special instructions..."
                placeholderTextColor={theme.subText}
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVisit} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>CONFIRM SCHEDULE</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🏠</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SiteVisits')}>
          <Text style={[styles.navIcon, { color: GOLD }]}>📅</Text>
          <Text style={[styles.navText, { color: GOLD }]}>VISITS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🏢</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>PROPERTIES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>🤝</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>LEADS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={[styles.navIcon, { color: theme.navIcon }]}>👤</Text>
          <Text style={[styles.navText, { color: theme.navText }]}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, fontWeight: '900', color: GOLD },
  headerSub: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
  addFab: { width: 44, height: 44, borderRadius: 14, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  addFabIcon: { fontSize: 24, color: '#FFF', fontWeight: '900' },

  weekStrip: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
  weekScroll: { paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  dayBtn: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, minWidth: 52 },
  dayBtnActive: { backgroundColor: GOLD, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  dayLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  dayLabelActive: { color: '#FFF' },
  dayNum: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  dayNumActive: { color: '#FFF' },
  visitDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD, marginTop: 4 },

  timelineContent: { paddingHorizontal: 20, paddingTop: 15 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  dayHeaderText: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
  dayHeaderCount: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  emptyBox: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#475569', marginBottom: 6 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: GOLD, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  visitRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  timeCol: { width: 52, alignItems: 'flex-end', paddingTop: 6, marginRight: 10 },
  timeText: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
  durText: { fontSize: 9, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
  timelineBar: { width: 20, alignItems: 'center', marginRight: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 2.5, marginTop: 8, zIndex: 1 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#F1F5F9', marginTop: 4, minHeight: 30 },
  visitCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  visitCardTop: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },
  visitPropName: { fontSize: 14, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  visitClientRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  visitClientIcon: { fontSize: 11 },
  visitClientName: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  visitNotes: { fontSize: 11, color: '#94A3B8', marginBottom: 10, fontStyle: 'italic' },
  visitActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  visitActionBtn: { height: 32, minWidth: 32, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  visitActionIcon: { fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBlur: { flex: 1 },
  modalPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 28, paddingBottom: 40, maxHeight: '92%' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 28, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 20, letterSpacing: 0.5 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  handle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 20, letterSpacing: 0.5 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 1.5, marginBottom: 8 },
  input: { height: 52, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '700', color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 5 },
  selectorBtn: { height: 52, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  selectorText: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  selectorArrow: { fontSize: 14, color: '#94A3B8' },
  pickerList: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: 180, marginBottom: 10, overflow: 'hidden' },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  pickerItemSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  pickerEmpty: { padding: 16, color: '#94A3B8', fontSize: 12, textAlign: 'center' },
  chipBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  chipBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  chipBtnText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  chipBtnTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: GOLD, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

  bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  navItem: { alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 24, color: '#AAA' },
  navText: { fontSize: 8, fontWeight: '900', color: '#AAA' },
});

export default SiteVisitsScreen;
