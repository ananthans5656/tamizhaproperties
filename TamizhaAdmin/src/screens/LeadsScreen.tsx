import React, { useState, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   TextInput,
   Dimensions,
   SafeAreaView,
   StatusBar,
   Image,
   Modal,
   Linking,
   ActivityIndicator,
} from 'react-native';

import { api } from '../services/api';

const { width, height } = Dimensions.get('window');
const GOLD = '#C9A84C';

const NOTIFS = [
   { id: '1', title: '🔥 New HOT Lead', body: 'Someone inquiry for KTC Nagar plots just now!', time: '2m ago' },
   { id: '2', title: '✅ Property Sold', body: 'Hub #102 in Suthamalli has been marked SOLD.', time: '1h ago' },
   { id: '3', title: '👤 Team Update', body: 'Muruga Valii added a new site visit report.', time: '3h ago' },
];

type LeadStatus = 'HOT' | 'WARM' | 'NEW' | 'CLOSED';
type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  source: string;
  interest: string;
  timestamp: string;
  propertyName?: string;
  price?: string;
  clientCity?: string;
  clientNative?: string;
  timeSpent?: number;
  userId?: string;
};

interface LeadsScreenProps {
   navigation: any;
   activeNotifs?: any[];
   clearAllNotifs?: () => void;
   isDark?: boolean;
}

const LeadsScreen = ({ navigation, activeNotifs = [], clearAllNotifs = () => {}, isDark = false }: LeadsScreenProps) => {
   const [searchQuery, setSearchQuery] = useState('');
   const [leads, setLeads] = useState<Lead[]>([]);
   const [activeMembers, setActiveMembers] = useState<any[]>([]);
   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
   const [showAddLead, setShowAddLead] = useState(false);
   const [showNotifs, setShowNotifs] = useState(false);

   // Dynamic colors based on isDark
   const theme = {
      background: isDark ? '#0B0F19' : '#FFF',
      cardBg: isDark ? '#111827' : '#FFF',
      headerBg: isDark ? '#0B0F19' : '#FFF',
      text: isDark ? '#F9FAFB' : '#111',
      subText: isDark ? '#9CA3AF' : '#666',
      border: isDark ? '#1F2937' : '#E2E8F0',
      greyBg: isDark ? '#1F2937' : '#F3F4F6',
      tableHeaderBg: isDark ? '#1F2937' : '#FFF',
      tableRowEvenBg: isDark ? '#1F2937' : '#F9FAFB',
      tableRowOddBg: isDark ? '#111827' : '#FFF',
      inputText: isDark ? '#FFF' : '#1E293B',
      inputBg: isDark ? '#1F2937' : '#F8FAFC',
      inputBorder: isDark ? '#374151' : '#E2E8F0',
      statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
      statusBarBg: isDark ? '#0B0F19' : '#FFF',
      bottomNavBg: isDark ? '#111827' : '#FFF',
      bottomNavBorder: isDark ? '#1F2937' : '#EEE',
   };

   const [newLeadName, setNewLeadName] = useState('');
   const [newLeadCountryCode, setNewLeadCountryCode] = useState('+65');
   const [newLeadPhone, setNewLeadPhone] = useState('');
   const [newLeadEmail, setNewLeadEmail] = useState('');
   const [newLeadPassword, setNewLeadPassword] = useState('');
   const [newLeadInterest, setNewLeadInterest] = useState('');
   const [newLeadCity, setNewLeadCity] = useState('');
   const [newLeadNative, setNewLeadNative] = useState('');
   const [newLeadStatus, setNewLeadStatus] = useState<'HOT' | 'WARM' | 'NEW'>('NEW');
   const [isSaving, setIsSaving] = useState(false);
   const [customAlert, setCustomAlert] = useState({
      visible: false,
      title: '',
      message: '',
      icon: '✅',
   });
   const [showCreateLogin, setShowCreateLogin] = useState(false);
   const [loginEmail, setLoginEmail] = useState('');
   const [loginPassword, setLoginPassword] = useState('');
   const [isCreatingLogin, setIsCreatingLogin] = useState(false);
   const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

   const createUserAccount = async (email: string, password: string, name: string, phone: string): Promise<{ uid: string; note: string }> => {
      try {
         const result = await api.createUser({ name, email, phone, password, role: 'user' });
         return { uid: result.id, note: '✅ Login account created successfully.' };
      } catch (err: any) {
         if (err.message === 'EMAIL_EXISTS') {
            return { uid: '', note: '✅ Account already exists with this email.' };
         }
         throw err;
      }
   };

   const handleAddLead = async () => {
      if (!newLeadName.trim() || !newLeadPhone.trim() || !newLeadInterest.trim()) {
         setCustomAlert({
            visible: true,
            title: 'Missing Details',
            message: 'Please fill in Name, Phone, and Property Interested.',
            icon: '⚠️'
         });
         return;
      }

      const creatingAccount = newLeadEmail.trim() && newLeadPassword.trim();

      if (creatingAccount && newLeadPassword.trim().length < 6) {
         setCustomAlert({
            visible: true,
            title: 'Weak Password',
            message: 'Password must be at least 6 characters.',
            icon: '⚠️'
         });
         return;
      }

      if (creatingAccount && !newLeadCity.trim()) {
         setCustomAlert({
            visible: true,
            title: 'Missing City',
            message: 'Please enter Resident City — required for user app login.',
            icon: '⚠️'
         });
         return;
      }

      if (creatingAccount && !newLeadNative.trim()) {
         setCustomAlert({
            visible: true,
            title: 'Missing Native Place',
            message: 'Please enter Native Place — required for user app login.',
            icon: '⚠️'
         });
         return;
      }

      setIsSaving(true);
      try {
         let userId: string | null = null;
         let accountNote = '';

         if (newLeadEmail.trim() && newLeadPassword.trim()) {
            try {
               const { uid, note } = await createUserAccount(
                  newLeadEmail.trim().toLowerCase(),
                  newLeadPassword.trim(),
                  newLeadName.trim(),
                  newLeadPhone.trim(),
               );
               userId = uid;
               accountNote = note;
            } catch (authErr: any) {
               accountNote = `❌ Account creation failed: ${authErr.message || 'Unknown error'}`;
            }
         }

         const dialCode = newLeadCountryCode.replace('-dubai', '');
         const fullPhone = newLeadPhone.trim() ? `${dialCode}${newLeadPhone.trim().replace(/^0+/, '')}` : '';
         await api.createLead({
            name: newLeadName.trim(),
            phone: fullPhone,
            email: newLeadEmail.trim().toLowerCase() || '',
            property_interest: newLeadInterest.trim(),
            city: newLeadCity.trim() || 'Unknown',
            native_place: newLeadNative.trim() || 'Unknown',
            status: newLeadStatus,
            source: 'Admin App',
            login_user_id: userId || null,
         });

         setNewLeadName('');
         setNewLeadCountryCode('+65');
         setNewLeadPhone('');
         setNewLeadEmail('');
         setNewLeadPassword('');
         setNewLeadInterest('');
         setNewLeadCity('');
         setNewLeadNative('');
         setNewLeadStatus('NEW');
         setShowAddLead(false);

         // Refresh leads + intelligence log after add
         try { await refreshLeads(); } catch (e) { /* ignore */ }
         setCustomAlert({
            visible: true,
            title: 'Lead Captured ✅',
            message: accountNote || 'Lead details saved successfully.',
            icon: '✅'
         });
      } catch (error: any) {
         console.error('Error saving lead:', error);
         setCustomAlert({
            visible: true,
            title: 'Save Failed',
            message: error.message || 'Unable to save lead. Check your connection.',
            icon: '❌'
         });
      } finally {
         setIsSaving(false);
      }
   };

   const handleCreateLogin = async () => {
      if (!selectedLead) return;
      const email = loginEmail.trim().toLowerCase();
      const password = loginPassword.trim();
      if (!email || !password) {
         setCustomAlert({ visible: true, title: 'Missing Fields', message: 'Enter both email and password.', icon: '⚠️' });
         return;
      }
      if (password.length < 6) {
         setCustomAlert({ visible: true, title: 'Weak Password', message: 'Password must be at least 6 characters.', icon: '⚠️' });
         return;
      }
      setIsCreatingLogin(true);
      try {
         const { uid, note } = await createUserAccount(email, password, selectedLead.name, selectedLead.phone);
         await api.updateLead(selectedLead.id, { email, login_user_id: uid });
         setShowCreateLogin(false);
         setLoginEmail('');
         setLoginPassword('');
         setSelectedLead(null);
         setCustomAlert({ visible: true, title: 'Login Created ✅', message: `${note}\n\nEmail: ${email}\nThey can now login to the User App.`, icon: '✅' });
      } catch (err: any) {
         if (err.message?.startsWith('EMAIL_EXISTS_RESET_SENT:')) {
            setCustomAlert({ visible: true, title: 'Password Reset Sent', message: `📧 Password reset email sent to ${email}.\nUser must check email and set a new password.`, icon: '📧' });
         } else {
            setCustomAlert({ visible: true, title: 'Failed', message: err.message || 'Account creation failed.', icon: '❌' });
         }
      } finally {
         setIsCreatingLogin(false);
      }
   };

   const mapLead = (d: any): Lead => ({
     id: d.id,
     name: d.name || 'Anonymous',
     phone: d.phone || '',
     email: d.email || '',
     status: String(d.status || 'NEW').toUpperCase() as LeadStatus,
     source: d.source || 'Admin App',
     interest: d.property_interest || d.propertyInterest || d.interest || 'Interested in Plot',
     timestamp: d.created_at ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
     clientCity: d.city || d.clientCity || 'Unknown',
     clientNative: d.native_place || d.nativePlace || d.clientNative || 'Unknown',
     timeSpent: 0,
     userId: d.login_user_id || d.loginUserId || d.userId || '',
   });

   const refreshLeads = async () => {
     const leadsData = await api.getLeads();
     const leadsArray: Lead[] = leadsData.map(mapLead);
     setLeads(leadsArray);
     // Intelligence log = actual leads (not users)
     setActiveMembers(leadsArray.map((l) => ({
       id: l.id,
       name: l.name,
       city: l.clientCity || 'N/A',
       native: l.clientNative || 'N/A',
       status: l.status,
       engagement: 0,
     })));
   };

   useEffect(() => {
    refreshLeads().catch(err => console.error('Failed to load leads:', err));
   }, []);

   const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
   const handleWhatsApp = (phone: string) => Linking.openURL(`whatsapp://send?phone=${phone}`);

   const filteredLeads = leads.filter(l =>
      (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.interest || '').toLowerCase().includes(searchQuery.toLowerCase())
   );

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
         <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

         {/* HEADER */}
         <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
            <View>
               <Text style={styles.headerSubtitle}>ADMIN CRM CONSOLE</Text>
               <Text style={[styles.headerTitle, { color: theme.text }]}>Lead Intelligence</Text>
            </View>
            <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                <TouchableOpacity style={[styles.bellBtn, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]} onPress={() => setShowNotifs(true)}>
                    <Text style={{fontSize: 22}}>🔔</Text>
                    {activeNotifs.length > 0 && <View style={styles.redDot} />}
                </TouchableOpacity>
                <View style={styles.avatarMini}><Text style={styles.avTxt}>KR</Text></View>
            </View>
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <View style={[styles.searchBar, { backgroundColor: theme.greyBg }]}>
               <Text style={styles.searchIcon}>🔍</Text>
               <TextInput
                  placeholder="Search prospects or properties..."
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
               />
            </View>

            <View style={styles.statsRow}>
               <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}><Text style={[styles.stVal, { color: theme.text }]}>{leads.filter(l => l.status === 'HOT').length}</Text><Text style={styles.stLbl}>HOT</Text></View>
               <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}><Text style={[styles.stVal, { color: theme.text }]}>{leads.filter(l => l.status === 'WARM').length}</Text><Text style={styles.stLbl}>WARM</Text></View>
               <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}><Text style={[styles.stVal, { color: theme.text }]}>{leads.filter(l => l.status === 'NEW').length}</Text><Text style={styles.stLbl}>NEW</Text></View>
            </View>

            {/* NEW INTELLIGENCE TABLE */}
            <View style={[styles.tableContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
               <View style={styles.tableHead}>
                  <Text style={styles.tableTitle}>LEAD INTELLIGENCE LOG</Text>
                  <View style={styles.liveDot} />
               </View>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                     <View style={[styles.row, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.cell, styles.headerCell, {width: 120, color: theme.subText}]}>NAME</Text>
                        <Text style={[styles.cell, styles.headerCell, {width: 100, color: theme.subText}]}>RESIDENCE</Text>
                        <Text style={[styles.cell, styles.headerCell, {width: 100, color: theme.subText}]}>NATIVE</Text>
                        <Text style={[styles.cell, styles.headerCell, {width: 80, color: theme.subText}]}>ENGAGE</Text>
                     </View>
                     {activeMembers.map((item, idx) => (
                        <View key={item.id} style={[styles.row, { backgroundColor: idx % 2 === 0 ? theme.tableRowEvenBg : theme.tableRowOddBg, borderBottomColor: theme.border }]}>
                           <Text style={[styles.cell, { width: 120, fontWeight: '900', color: theme.text }]}>{item.name}</Text>
                           <Text style={[styles.cell, { width: 100, color: theme.subText }]}>{item.city}</Text>
                           <Text style={[styles.cell, { width: 100, color: theme.subText }]}>{item.native}</Text>
                           <Text style={[styles.cell, { width: 80, color: GOLD, fontWeight: '900' }]}>
                              {item.engagement ? (item.engagement < 60 ? `${item.engagement}s` : `${Math.floor(item.engagement / 60)}m`) : '0s'}
                           </Text>
                        </View>
                     ))}
                  </View>
               </ScrollView>
            </View>

            {filteredLeads.map((item) => (
               <TouchableOpacity key={item.id} style={[styles.leadCard, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]} onPress={() => navigation.navigate('LeadChat', { lead: item })}>
                  <View style={[styles.statusLine, { backgroundColor: item.status === 'HOT' ? '#EF4444' : item.status === 'WARM' ? GOLD : '#60A5FA' }]} />
                  <View style={styles.leadBody}>
                     <View style={styles.cardTop}>
                        <Text style={[styles.leadName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.timeText, { color: theme.subText }]}>{item.timestamp}</Text>
                     </View>
                     <Text style={[styles.interestText, { color: theme.subText }]}>{item.interest}</Text>

                     <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                        <View style={[styles.miniTag, { backgroundColor: theme.greyBg, borderLeftColor: GOLD }]}><Text style={[styles.miniTagT, { color: theme.text }]}>📍 {item.clientCity}</Text></View>
                        <View style={[styles.miniTag, { backgroundColor: theme.greyBg, borderLeftColor: GOLD }]}><Text style={[styles.miniTagT, { color: theme.text }]}>⏱️ {item.timeSpent ? (item.timeSpent < 60 ? `${item.timeSpent}s` : `${Math.floor(item.timeSpent / 60)}m`) : '0s'}</Text></View>
                     </View>

                     <View style={[styles.sourceBadge, { backgroundColor: theme.greyBg }]}><Text style={styles.sourceText}>via {item.source}</Text></View>
                  </View>
                  <View style={styles.commStrip}>
                     <TouchableOpacity onPress={() => handleCall(item.phone)} style={[styles.commBtn, { backgroundColor: theme.greyBg }]}><Text>📞</Text></TouchableOpacity>
                     <TouchableOpacity onPress={() => navigation.navigate('LeadChat', { lead: item })} style={[styles.commBtn, { backgroundColor: '#22C55E' }]}><Text>💬</Text></TouchableOpacity>
                     <TouchableOpacity
                        onPress={() => {
                           setCustomAlert({
                              visible: true,
                              title: 'Delete Lead?',
                              message: `Remove "${item.name}" from leads? This cannot be undone.`,
                              icon: '🗑',
                           });
                           setLeadToDelete(item.id);
                        }}
                        style={[styles.commBtn, { backgroundColor: '#FEE2E2' }]}
                     >
                        <Text>🗑</Text>
                     </TouchableOpacity>
                  </View>
               </TouchableOpacity>
            ))}
            <View style={{ height: 120 }} />
         </ScrollView>

         {/* ADD LEAD FAB */}
         <TouchableOpacity style={styles.fab} onPress={() => setShowAddLead(true)}>
            <Text style={styles.fabIcon}>+</Text>
         </TouchableOpacity>

         {/* NOTIFICATION CENTER */}
         <Modal visible={showNotifs} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => setShowNotifs(false)} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerTitle, { color: theme.text }]}>Admin Alerts</Text>
                  
                  {activeNotifs.length > 0 ? (
                     activeNotifs.map(n => (
                        <View key={n.id} style={[styles.notifCard, { backgroundColor: theme.tableRowEvenBg }]}>
                           <View style={styles.notifLead} />
                           <View style={{flex:1}}>
                              <Text style={[styles.notifT, { color: theme.text }]}>{n.title}</Text>
                              <Text style={[styles.notifB, { color: theme.subText }]}>{n.body}</Text>
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
                     <TouchableOpacity style={[styles.closeBtn, { flex: 1, backgroundColor: '#EF4444' }]} onPress={() => { clearAllNotifs(); setShowNotifs(false); }}>
                        <Text style={styles.closeBtnT}>CLEAR ALL</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.closeBtn, { flex: 1, backgroundColor: isDark ? '#374151' : '#111' }]} onPress={() => setShowNotifs(false)}>
                        <Text style={styles.closeBtnT}>CLOSE</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </Modal>

         {/* LEAD DETAIL DRAWER */}
         <Modal visible={!!selectedLead} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => setSelectedLead(null)} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  {selectedLead && (
                     <View>
                        <Text style={[styles.drawerTitle, { color: theme.text }]}>{selectedLead.name}</Text>
                        <Text style={styles.drSubtitle}>{selectedLead.interest}</Text>

                        <View style={styles.detailBox}>
                           <Text style={styles.detLbl}>PHONE CONTACT</Text>
                           <Text style={[styles.detVal, { color: theme.text }]}>{selectedLead.phone}</Text>
                        </View>

                        <View style={styles.detailBox}>
                           <Text style={styles.detLbl}>RESIDENT OF</Text>
                           <Text style={[styles.detVal, { color: theme.text }]}>{selectedLead.clientCity}</Text>
                        </View>

                        <View style={styles.detailBox}>
                           <Text style={styles.detLbl}>NATIVE OF</Text>
                           <Text style={[styles.detVal, { color: theme.text }]}>{selectedLead.clientNative}</Text>
                        </View>

                        <View style={styles.detailBox}>
                           <Text style={styles.detLbl}>ENGAGEMENT TIME</Text>
                           <Text style={[styles.detVal, { color: theme.text }]}>
                              {selectedLead.timeSpent ? (
                                selectedLead.timeSpent < 60
                                  ? `${selectedLead.timeSpent}s`
                                  : `${Math.floor(selectedLead.timeSpent / 60)}m ${selectedLead.timeSpent % 60}s`
                              ) : 'N/A'}
                           </Text>
                        </View>

                        <View style={styles.detailBox}>
                           <Text style={styles.detLbl}>APP LOGIN STATUS</Text>
                           {selectedLead.userId ? (
                              <Text style={[styles.detVal, { color: '#22C55E' }]}>✅ Login Active{selectedLead.email ? `\n${selectedLead.email}` : ''}</Text>
                           ) : (
                              <Text style={[styles.detVal, { color: '#EF4444' }]}>❌ No Login Account{selectedLead.email ? `\n(Email: ${selectedLead.email})` : ''}</Text>
                           )}
                        </View>

                        {!selectedLead.userId && (
                           <TouchableOpacity
                              style={[styles.drActionBtn, { backgroundColor: '#3B82F6', marginHorizontal: 0, marginTop: 8, marginBottom: 4 }]}
                              onPress={() => {
                                 setLoginEmail(selectedLead.email || '');
                                 setLoginPassword('');
                                 setShowCreateLogin(true);
                              }}
                           >
                              <Text style={styles.drActionT}>CREATE LOGIN ACCOUNT</Text>
                           </TouchableOpacity>
                        )}

                        <View style={styles.drActions}>
                           <TouchableOpacity style={[styles.drActionBtn, {backgroundColor: GOLD}]} onPress={() => handleCall(selectedLead.phone)}><Text style={styles.drActionT}>CALL NOW</Text></TouchableOpacity>
                           <TouchableOpacity style={[styles.drActionBtn, {backgroundColor: '#22C55E'}]} onPress={() => handleWhatsApp(selectedLead.phone)}><Text style={styles.drActionT}>WHATSAPP</Text></TouchableOpacity>
                        </View>
                     </View>
                  )}
               </View>
            </View>
         </Modal>

         {/* CREATE LOGIN MODAL */}
         <Modal visible={showCreateLogin} transparent animationType="fade">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => { if (!isCreatingLogin) setShowCreateLogin(false); }} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerTitle, { color: theme.text }]}>CREATE LOGIN ACCOUNT</Text>
                  <Text style={{ color: theme.subText, fontSize: 13, marginBottom: 16 }}>
                     {selectedLead?.name} — User App la login panna credentials set pannunga
                  </Text>

                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                     style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                     placeholder="e.g. krish@gmail.com"
                     placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     value={loginEmail}
                     onChangeText={setLoginEmail}
                     editable={!isCreatingLogin}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>PASSWORD</Text>
                  <TextInput
                     style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                     placeholder="Min 6 characters"
                     placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                     secureTextEntry
                     value={loginPassword}
                     onChangeText={setLoginPassword}
                     editable={!isCreatingLogin}
                  />

                  <TouchableOpacity
                     style={[styles.drActionBtn, { backgroundColor: isCreatingLogin ? '#9CA3AF' : '#3B82F6', marginHorizontal: 0, marginTop: 18 }]}
                     onPress={handleCreateLogin}
                     disabled={isCreatingLogin}
                  >
                     {isCreatingLogin
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={styles.drActionT}>CREATE ACCOUNT</Text>
                     }
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[styles.drActionBtn, { backgroundColor: theme.greyBg, marginHorizontal: 0, marginTop: 10 }]}
                     onPress={() => setShowCreateLogin(false)}
                     disabled={isCreatingLogin}
                  >
                     <Text style={[styles.drActionT, { color: theme.text }]}>CANCEL</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* ADD LEAD MODAL */}
         <Modal visible={showAddLead} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => {
                  if (!isSaving) setShowAddLead(false);
               }} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg, maxHeight: '90%' }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerTitle, { color: theme.text }]}>NEW PROSPECT</Text>
                  
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                     <Text style={styles.inputLabel}>LEAD NAME</Text>
                     <TextInput 
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                        placeholder="Enter prospect name" 
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        value={newLeadName}
                        onChangeText={setNewLeadName}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>PHONE CONTACT</Text>
                     <View style={{ flexDirection: 'row', gap: 8, marginBottom: 5 }}>
                        {[
                           { label: '🇸🇬 +65', code: '+65' },
                           { label: '🇦🇪 UAE', code: '+971' },
                           { label: '🇦🇪 Dubai', code: '+971-dubai' },
                        ].map(c => (
                           <TouchableOpacity
                              key={c.code}
                              onPress={() => setNewLeadCountryCode(c.code)}
                              style={{
                                 flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
                                 backgroundColor: newLeadCountryCode === c.code ? GOLD : theme.inputBg,
                                 borderWidth: 1.5,
                                 borderColor: newLeadCountryCode === c.code ? GOLD : theme.inputBorder,
                              }}
                           >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: newLeadCountryCode === c.code ? '#FFF' : theme.inputText }}>
                                 {c.label}
                              </Text>
                           </TouchableOpacity>
                        ))}
                     </View>
                     <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                        placeholder="e.g. 98765 43210"
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        keyboardType="phone-pad"
                        value={newLeadPhone}
                        onChangeText={setNewLeadPhone}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>EMAIL (FOR APP LOGIN)</Text>
                     <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                        placeholder="e.g. suresh@gmail.com"
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={newLeadEmail}
                        onChangeText={setNewLeadEmail}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>PASSWORD (FOR APP LOGIN)</Text>
                     <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                        placeholder="Min 6 characters"
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        secureTextEntry
                        value={newLeadPassword}
                        onChangeText={setNewLeadPassword}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>PROPERTY / INTEREST</Text>
                     <TextInput 
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                        placeholder="e.g. KTC Nagar Plot #45" 
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        value={newLeadInterest}
                        onChangeText={setNewLeadInterest}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>RESIDENT COUNTRY</Text>
                     <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                        {['🇸🇬 Singapore', '🇦🇪 UAE', '🇦🇪 Dubai'].map((country) => (
                           <TouchableOpacity
                              key={country}
                              style={[
                                 styles.statusBtn,
                                 { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                                 newLeadCity === country && { backgroundColor: GOLD, borderColor: GOLD }
                              ]}
                              onPress={() => setNewLeadCity(newLeadCity === country ? '' : country)}
                           >
                              <Text style={[styles.statusBtnText, { fontSize: 12 }, newLeadCity === country && { color: '#FFF' }]}>
                                 {country}
                              </Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>NATIVE PLACE</Text>
                     <TextInput 
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                        placeholder="e.g. Tenkasi" 
                        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                        value={newLeadNative}
                        onChangeText={setNewLeadNative}
                     />

                     <Text style={[styles.inputLabel, { marginTop: 15 }]}>LEAD STATUS</Text>
                     <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                        {['NEW', 'WARM', 'HOT'].map((status) => (
                           <TouchableOpacity 
                              key={status} 
                              style={[
                                 styles.statusBtn, 
                                 { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                                 newLeadStatus === status && { 
                                    backgroundColor: status === 'HOT' ? '#EF4444' : status === 'WARM' ? GOLD : '#60A5FA',
                                    borderColor: status === 'HOT' ? '#EF4444' : status === 'WARM' ? GOLD : '#60A5FA'
                                 }
                              ]}
                              onPress={() => setNewLeadStatus(status as any)}
                           >
                              <Text style={[styles.statusBtnText, newLeadStatus === status && { color: '#FFF' }]}>
                                 {status}
                              </Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <TouchableOpacity 
                        style={[styles.saveBtn, { marginTop: 30 }]} 
                        onPress={handleAddLead}
                        disabled={isSaving}
                     >
                        {isSaving ? (
                           <ActivityIndicator color="#FFF" />
                        ) : (
                           <Text style={styles.saveBtnT}>CAPTURE LEAD</Text>
                        )}
                     </TouchableOpacity>
                  </ScrollView>
               </View>
            </View>
         </Modal>

         {/* CUSTOM ALERT MODAL */}
         <Modal visible={customAlert.visible} transparent animationType="fade">
            <View style={styles.mOverlay}>
               <View style={[styles.mCard, { backgroundColor: theme.cardBg }]}>
                  <Text style={styles.mIcon}>{customAlert.icon}</Text>
                  <Text style={[styles.mTitle, { color: theme.text }]}>{customAlert.title}</Text>
                  <Text style={[styles.mMsg, { color: theme.subText }]}>{customAlert.message}</Text>
                  {leadToDelete && customAlert.icon === '🗑' ? (
                     <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                           style={[styles.mBtn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                           onPress={() => { setLeadToDelete(null); setCustomAlert({ ...customAlert, visible: false }); }}
                        >
                           <Text style={[styles.mBtnT, { color: '#64748B' }]}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                           style={[styles.mBtn, { flex: 1, backgroundColor: '#EF4444' }]}
                           onPress={async () => {
                              try { await api.deleteLead(leadToDelete!); } catch (e) { /* ignore */ }
                              setLeadToDelete(null);
                              setCustomAlert({ ...customAlert, visible: false });
                              try { await refreshLeads(); } catch (e) { /* ignore */ }
                           }}
                        >
                           <Text style={styles.mBtnT}>DELETE</Text>
                        </TouchableOpacity>
                     </View>
                  ) : (
                     <TouchableOpacity style={styles.mBtn} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                        <Text style={styles.mBtnT}>OKAY</Text>
                     </TouchableOpacity>
                  )}
               </View>
            </View>
         </Modal>

         {/* Bottom Nav */}
         <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🏠</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>HOME</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SiteVisits')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>📅</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>VISITS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🏢</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>PROPERTIES</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}><Text style={[styles.navIcon, { color: GOLD }]}>🤝</Text><Text style={[styles.navText, { color: GOLD }]}>LEADS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>👤</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>PROFILE</Text></TouchableOpacity>
         </View>
      </SafeAreaView>
   );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#FFF' },
   header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   headerSubtitle: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 2 },
   headerTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginTop: 5 },
   bellBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
   redDot: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
   avatarMini: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
   avTxt: { color: '#FFF', fontWeight: '900' },
   scrollContent: { paddingHorizontal: 20 },
   searchBar: { height: 60, backgroundColor: '#F3F4F6', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
   searchIcon: { fontSize: 16, marginRight: 15 },
   searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
   statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
   statCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, alignItems: 'center' },
   stVal: { fontSize: 22, fontWeight: '900', color: '#111' },
   stLbl: { fontSize: 8, fontWeight: '900', color: '#AAA', marginTop: 5 },
   tableContainer: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 25, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
   tableHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
   tableTitle: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 1 },
   liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
   row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
   cell: { fontSize: 11, color: '#444', paddingHorizontal: 5 },
   headerCell: { color: '#999', fontWeight: '900', fontSize: 9 },
   leadCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 18, flexDirection: 'row', marginBottom: 15, elevation: 1 },
   statusLine: { width: 4, height: '100%', borderRadius: 2, marginRight: 15 },
   leadBody: { flex: 1 },
   cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
   leadName: { fontSize: 18, fontWeight: '900', color: '#111' },
   timeText: { fontSize: 10, color: '#AAA', fontWeight: '700' },
   interestText: { fontSize: 13, color: '#555', fontWeight: '700', marginBottom: 10 },
   sourceBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
   sourceText: { fontSize: 8, fontWeight: '900', color: '#999' },
   miniTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: GOLD, marginTop: 5 },
   miniTagT: { fontSize: 9, fontWeight: '900', color: '#555' },
   commStrip: { gap: 10, justifyContent: 'center' },
   commBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
   fab: { position: 'absolute', bottom: 100, right: 30, width: 65, height: 65, borderRadius: 32.5, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', elevation: 10 },
   fabIcon: { fontSize: 35, color: '#FFF' },
   // Notifs
   notifCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
   notifLead: { width: 8, height: 40, backgroundColor: GOLD, borderRadius: 4, marginRight: 15 },
   notifT: { fontSize: 14, fontWeight: '900', color: '#111' },
   notifB: { fontSize: 11, color: '#666', marginTop: 2 },
   notifTime: { fontSize: 9, fontWeight: '700', color: '#BBB' },
   // Drawers
   drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
   drawerBlur: { flex: 1 },
   drawerPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 60 },
   handle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
   drawerTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 10 },
   drSubtitle: { fontSize: 14, color: '#999', fontWeight: '700', marginBottom: 30 },
   detailBox: { marginBottom: 20 },
   detLbl: { fontSize: 8, fontWeight: '900', color: GOLD, letterSpacing: 1.5, marginBottom: 8 },
   detVal: { fontSize: 16, fontWeight: '900', color: '#111' },
   drActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
   drActionBtn: { flex: 1, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
   drActionT: { color: '#FFF', fontSize: 12, fontWeight: '900' },
   closeBtn: { backgroundColor: '#111', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
   closeBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900' },
   input: { height: 60, backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },
   inputLabel: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 1, marginBottom: 8 },
   statusBtn: { flex: 1, height: 45, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
   statusBtnText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
   saveBtn: { backgroundColor: GOLD, height: 65, borderRadius: 20, marginTop: 40, justifyContent: 'center', alignItems: 'center' },
   saveBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900' },
   bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
   navItem: { alignItems: 'center', gap: 4 },
   navIcon: { fontSize: 28, color: '#AAA' },
   navText: { fontSize: 8, fontWeight: '900', color: '#AAA' },
   
   // Custom Alert Popups
   mOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
   mCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 35, alignItems: 'center', width: '85%' },
   mIcon: { fontSize: 50, marginBottom: 15 },
   mTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
   mMsg: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 18 },
   mBtn: { backgroundColor: GOLD, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
   mBtnT: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});

export default LeadsScreen;
