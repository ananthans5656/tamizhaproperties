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
   ActivityIndicator,
   Linking,
   Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearToken } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

const { width, height } = Dimensions.get('window');
const GOLD = '#C9A84C';

type Member = { id: string; name: string; role: string; meta: string; avatar: string; status: 'ACTIVE' | 'PENDING' };

const INITIAL_MEMBERS: Member[] = [
    { id: '1', name: 'Ananya Sundar', role: 'BROKER', meta: '42 Active Listings', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', status: 'ACTIVE' },
    { id: '2', name: 'Vikram Seth', role: 'INVESTOR', meta: 'Portfolio: ₹14.5 Cr', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', status: 'ACTIVE' },
    { id: '3', name: 'Muruga valii', role: 'BROKER', meta: 'Joined Today', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', status: 'ACTIVE' },
];

const GALLERY_IMAGES = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=300',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
];
interface ProfileScreenProps {
   navigation: any;
   activeNotifs: any[];
   clearAllNotifs: () => void;
   isDark?: boolean;
   toggleTheme?: (val: boolean) => void;
}

const SettingsRow = ({ icon, label, detail, onPress, trailing, danger = false, isDark = false }: {
   icon: string;
   label: string;
   detail?: string;
   onPress: () => void;
   trailing?: React.ReactNode;
   danger?: boolean;
   isDark?: boolean;
}) => {
   const theme = {
      cardBg: isDark ? '#111827' : '#FFF',
      border: isDark ? '#1F2937' : '#E2E8F0',
      text: isDark ? '#F9FAFB' : '#0F172A',
      subText: isDark ? '#9CA3AF' : '#64748B',
      actionIconBg: isDark ? '#1F2937' : '#F8FAFC',
      actionIconBorder: isDark ? '#374151' : '#E2E8F0',
   };

   return (
      <TouchableOpacity 
         style={[styles.actionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
         onPress={onPress} 
         activeOpacity={0.7}
      >
         <View style={[styles.actionIconC, { 
            backgroundColor: danger ? (isDark ? '#451A1A' : '#FFF1F1') : theme.actionIconBg, 
            borderColor: danger ? (isDark ? '#7F1D1D' : '#FEE2E2') : theme.actionIconBorder, 
            borderWidth: 1 
         }]}>
            <Text style={{ fontSize: 18, color: danger ? '#EF4444' : (isDark ? '#9CA3AF' : '#64748B') }}>{icon}</Text>
         </View>
         <View style={{ flex: 1 }}>
            <Text style={[styles.aTitle, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
            {detail && <Text style={[styles.aSub, { color: theme.subText }]}>{detail}</Text>}
         </View>
         {trailing ? trailing : <Text style={[styles.chevron, danger && { color: isDark ? '#7F1D1D' : '#FEE2E2' }]}>˃</Text>}
      </TouchableOpacity>
   );
};

const ProfileScreen = ({ navigation, activeNotifs = [], clearAllNotifs = () => {}, isDark = false, toggleTheme }: ProfileScreenProps) => {
   const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'MANAGEMENT'>('ACCOUNT');
   const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
   const [adminImage, setAdminImage] = useState(GALLERY_IMAGES[0]);
 
   // Modals
   const [showEditProfile, setShowEditProfile] = useState(false);
   const [showAddMember, setShowAddMember] = useState(false);
   const [showSecurity, setShowSecurity] = useState(false);
   const [showNotifs, setShowNotifs] = useState(false);
   const [showLicense, setShowLicense] = useState(false);
   const [showLanguage, setShowLanguage] = useState(false);
   const [showAppSettings, setShowAppSettings] = useState(false);
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   const [showOfficeProfile, setShowOfficeProfile] = useState(false);
   const [isEditingOffice, setIsEditingOffice] = useState(false);
 
   // Identity
   const [adminName, setAdminName] = useState('Karthik Raja');
   const [adminTitle, setAdminTitle] = useState('Head of Operations');
   const [isSaving, setIsSaving] = useState(false);
   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
   const [customAlert, setCustomAlert] = useState({
      visible: false,
      title: '',
      message: '',
      icon: '✅',
   });

   // Office states
   const [officeName, setOfficeName] = useState('');
   const [officePhone, setOfficePhone] = useState('');
   const [officeWhatsapp, setOfficeWhatsapp] = useState('');
   const [officeMaps, setOfficeMaps] = useState('');
   const [officeAddress, setOfficeAddress] = useState('');
   const [isSavingOffice, setIsSavingOffice] = useState(false);

   // App Settings configuration values
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
   const [selectedLanguage, setSelectedLanguage] = useState('English');
   const [appDensity, setAppDensity] = useState('Standard');
   const [licenseNumber, setLicenseNumber] = useState('TN-32-ADMIN-0218');

   // Dynamic colors based on isDark
   const theme = {
      background: isDark ? '#0B0F19' : '#FFF',
      cardBg: isDark ? '#111827' : '#FFF',
      headerBg: isDark ? '#0B0F19' : '#FFF',
      text: isDark ? '#F9FAFB' : '#111',
      subText: isDark ? '#9CA3AF' : '#666',
      border: isDark ? '#1F2937' : '#E2E8F0',
      actionIconBg: isDark ? '#1F2937' : '#F8FAFC',
      actionIconBorder: isDark ? '#374151' : '#E2E8F0',
      bottomNavBg: isDark ? '#111827' : '#FFF',
      bottomNavBorder: isDark ? '#1F2937' : '#EEE',
      inputText: isDark ? '#FFF' : '#1E293B',
      inputBg: isDark ? '#1F2937' : '#F8FAFC',
      inputBorder: isDark ? '#374151' : '#E2E8F0',
      drawerBg: isDark ? '#111827' : '#FFF',
      statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
      statusBarBg: isDark ? '#0B0F19' : '#FFF',
      greyText: isDark ? '#6B7280' : '#AAA',
      panelBg: isDark ? '#1F2937' : '#F8FAFC',
   };

   useEffect(() => {
      AsyncStorage.getItem('admin_profile').then(val => {
         if (val) {
            const data = JSON.parse(val);
            if (data.name) setAdminName(data.name);
            if (data.title) setAdminTitle(data.title);
            if (data.avatar) setAdminImage(data.avatar);
            if (data.license) setLicenseNumber(data.license);
            if (data.language) setSelectedLanguage(data.language);
            if (data.density) setAppDensity(data.density);
            if (data.notifications !== undefined) setNotificationsEnabled(data.notifications);
         }
         setIsLoadingProfile(false);
      });
      AsyncStorage.getItem('office_profile').then(val => {
         if (val) {
            const data = JSON.parse(val);
            if (data.name) setOfficeName(data.name);
            if (data.phone) setOfficePhone(data.phone);
            if (data.whatsapp) setOfficeWhatsapp(data.whatsapp);
            if (data.maps) setOfficeMaps(data.maps);
            if (data.address) setOfficeAddress(data.address);
         }
      });
   }, []);

   const updateSetting = async (key: string, val: any) => {
      try {
         const existing = await AsyncStorage.getItem('admin_profile');
         const current = existing ? JSON.parse(existing) : {};
         await AsyncStorage.setItem('admin_profile', JSON.stringify({ ...current, [key]: val }));
      } catch (error: any) {
         console.error('Error saving setting:', error);
      }
   };

   // Toggle notifications setting
   const handleToggleNotifications = () => {
      const nextVal = !notificationsEnabled;
      setNotificationsEnabled(nextVal);
      updateSetting('notifications', nextVal);
   };

   // Pick admin photo from native gallery
    const handlePickAdminImage = async () => {
       const result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.4,
          includeBase64: true,
       });

       if (result.assets && result.assets[0]) {
          const asset = result.assets[0];
          if (!asset.base64) return;
          setIsSaving(true);

          try {
             const avatarDataUrl = `data:image/jpeg;base64,${asset.base64}`;

             setAdminImage(avatarDataUrl);

             const existing = await AsyncStorage.getItem('admin_profile');
             const current = existing ? JSON.parse(existing) : {};
             await AsyncStorage.setItem('admin_profile', JSON.stringify({ ...current, name: adminName, title: adminTitle, avatar: avatarDataUrl }));

             setCustomAlert({
                visible: true,
                title: 'Photo Updated',
                message: 'Admin profile avatar updated successfully.',
                icon: '📸'
             });
          } catch (error: any) {
             console.error('Error saving avatar:', error);
             setCustomAlert({
                visible: true,
                title: 'Upload Failed',
                message: `Unable to save profile photo: ${error.message || error}`,
                icon: '❌'
             });
          } finally {
             setIsSaving(false);
          }
       }
    };

   // Save Name & Designation to Firestore
    const handleSaveIdentity = async () => {
       if (!adminName.trim() || !adminTitle.trim()) {
          setCustomAlert({
             visible: true,
             title: 'Missing Info',
             message: 'Please enter both Name and Designation.',
             icon: '⚠️'
          });
          return;
       }
       setIsSaving(true);
       try {
          // Update local state instantly for responsiveness
          setAdminName(adminName.trim());
          setAdminTitle(adminTitle.trim());

          const existing2 = await AsyncStorage.getItem('admin_profile');
          const current2 = existing2 ? JSON.parse(existing2) : {};
          await AsyncStorage.setItem('admin_profile', JSON.stringify({ ...current2, name: adminName.trim(), title: adminTitle.trim(), avatar: adminImage }));
          
          setShowEditProfile(false);
          setCustomAlert({
             visible: true,
             title: 'Identity Saved',
             message: 'Your admin name and designation have been successfully saved.',
             icon: '✅'
          });
       } catch (error: any) {
          console.error('Error saving identity:', error);
          setCustomAlert({
             visible: true,
             title: 'Update Failed',
             message: `Unable to save identity: ${error.message || error}`,
             icon: '❌'
          });
       } finally {
          setIsSaving(false);
       }
    };

   // Save Office settings to Firestore
   const handleSaveOffice = async () => {
      setIsSavingOffice(true);
      try {
         await AsyncStorage.setItem('office_profile', JSON.stringify({
            name: officeName.trim(), phone: officePhone.trim(),
            whatsapp: officeWhatsapp.trim(), maps: officeMaps.trim(), address: officeAddress.trim(),
         }));
         
         setCustomAlert({
            visible: true,
            title: 'Office Profile Saved',
            message: 'Office profile details have been successfully saved.',
            icon: '🏢'
         });
      } catch (error: any) {
         console.error('Error saving office profile:', error);
         setCustomAlert({
            visible: true,
            title: 'Update Failed',
            message: `Unable to save office profile: ${error.message || error}`,
            icon: '❌'
         });
      } finally {
         setIsSavingOffice(false);
      }
   };

   // Member Form
   const [mName, setMName] = useState('');
   const [mRole, setMRole] = useState('BROKER');

   const handleAddMember = () => {
      if (!mName) {return;}
      const newM: Member = {
          id: Date.now().toString(),
          name: mName, role: mRole, meta: 'Verified Broker',
          avatar: GALLERY_IMAGES[Math.floor(Math.random() * 8)],
          status: 'ACTIVE',
      };
      setMembers([newM, ...members]);
      setShowAddMember(false);
      setMName('');
   };

   const handleLogout = async () => {
      setShowLogoutConfirm(false);
      await clearToken();
      navigation.replace('Login');
   };

   return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
         <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

         <View style={[styles.header, { backgroundColor: theme.background }]}>
            <View>
                <Text style={styles.headerSub}>MY ACCOUNT</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Super Admin Hub</Text>
            </View>
            <TouchableOpacity style={[styles.bellBtn, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]} onPress={() => setShowNotifs(true)}>
                <Text style={{fontSize: 22}}>🔔</Text>
                {activeNotifs.length > 0 && <View style={styles.redDot} />}
            </TouchableOpacity>
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.heroCard, { backgroundColor: theme.cardBg }]}>
               <View style={styles.avContainer}>
                  <Image source={{ uri: adminImage }} style={styles.mainAvatar} />
                  <TouchableOpacity style={styles.cameraBtn} onPress={handlePickAdminImage}>
                     <Text style={styles.cameraIcon}>📸</Text>
                  </TouchableOpacity>
               </View>
               <View style={styles.badgeC}><Text style={styles.badgeT}>⚙️ MASTER CONTROL</Text></View>
               <Text style={[styles.mainName, { color: theme.text }]}>{adminName}</Text>
               <Text style={[styles.mainTitle, { color: theme.subText }]}>{adminTitle}</Text>
            </View>

            <View style={[styles.switcher, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
               <TouchableOpacity 
                  style={[styles.switchBtn, activeTab === 'ACCOUNT' && [styles.activeSwitch, isDark && { backgroundColor: GOLD }]]} 
                  onPress={() => setActiveTab('ACCOUNT')}
               >
                  <Text style={[styles.switchT, activeTab === 'ACCOUNT' && styles.activeSwitchT]}>MY ACCOUNT</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  style={[styles.switchBtn, activeTab === 'MANAGEMENT' && [styles.activeSwitch, isDark && { backgroundColor: GOLD }]]} 
                  onPress={() => setActiveTab('MANAGEMENT')}
               >
                  <Text style={[styles.switchT, activeTab === 'MANAGEMENT' && styles.activeSwitchT]}>MANAGEMENT</Text>
               </TouchableOpacity>
            </View>

            {activeTab === 'ACCOUNT' ? (
               <View style={{ paddingBottom: 20 }}>
                  
                  {/* Account settings Group */}
                  <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
                  <SettingsRow 
                     icon="👤" 
                     label="Update Identity" 
                     detail={`${adminName} · ${adminTitle}`}
                     onPress={() => setShowEditProfile(true)}
                     isDark={isDark}
                  />
                  <SettingsRow 
                     icon="🏢" 
                     label="Office Profile" 
                     detail={officeName ? `${officeName} · Contact Details` : "Office landline, WhatsApp & Map link"}
                     onPress={() => setShowOfficeProfile(true)}
                     isDark={isDark}
                  />
                  <SettingsRow 
                     icon="🔑" 
                     label="License & Verifications" 
                     detail={licenseNumber}
                     onPress={() => setShowLicense(true)}
                     isDark={isDark}
                  />
                  {/* Preferences Group */}
                  <Text style={styles.sectionTitle}>PREFERENCES</Text>
                  <SettingsRow 
                     icon="🔔" 
                     label="Push Notifications" 
                     detail={notificationsEnabled ? "Enabled" : "Disabled"}
                     onPress={handleToggleNotifications}
                     trailing={
                        <View style={[styles.toggleTrack, notificationsEnabled ? styles.toggleTrackOn : styles.toggleTrackOff]}>
                           <View style={[styles.toggleThumb, notificationsEnabled ? styles.toggleThumbOn : styles.toggleThumbOff]} />
                        </View>
                     }
                     isDark={isDark}
                  />
                  <SettingsRow 
                     icon="🎨" 
                     label="Dark Theme" 
                     detail={isDark ? "Enabled" : "Disabled"}
                     onPress={() => {
                        if (toggleTheme) {
                           toggleTheme(!isDark);
                        } else {
                           updateSetting('darkTheme', !isDark);
                        }
                     }}
                     trailing={
                        <View style={[styles.toggleTrack, isDark ? styles.toggleTrackOn : styles.toggleTrackOff]}>
                           <View style={[styles.toggleThumb, isDark ? styles.toggleThumbOn : styles.toggleThumbOff]} />
                        </View>
                     }
                     isDark={isDark}
                  />

                  {/* Support Group */}
                  <Text style={styles.sectionTitle}>SUPPORT & SESSION</Text>
                  <SettingsRow 
                     icon="🛡️" 
                     label="Security Center" 
                     detail="AES-256 Encryption Active"
                     onPress={() => setShowSecurity(true)}
                     isDark={isDark}
                  />
                  <SettingsRow 
                     icon="🚪" 
                     label="Close Admin Session" 
                     detail="Safely sign out"
                     onPress={() => setShowLogoutConfirm(true)}
                     danger
                     isDark={isDark}
                  />
               </View>
            ) : (
                <View style={{ paddingVertical: 10 }}>
                   {/* View Site Visits Button */}
                   <TouchableOpacity
                     style={[styles.visitsLinkBtn, {
                        backgroundColor: isDark ? '#1E293B' : '#FEFCE8',
                        borderColor: isDark ? '#334155' : '#FDE68A'
                     }]}
                     onPress={() => navigation.navigate('SiteVisits')}
                  >
                     <Text style={styles.visitsLinkIcon}>📅</Text>
                     <View style={{ flex: 1 }}>
                        <Text style={[styles.visitsLinkTitle, { color: theme.text }]}>View Team Site Visits</Text>
                        <Text style={[styles.visitsLinkSub, { color: theme.subText }]}>Schedule & track property viewings</Text>
                     </View>
                     <Text style={[styles.visitsLinkArrow, { color: '#CA8A04' }]}>›</Text>
                  </TouchableOpacity>
               </View>
            )}
            <View style={{ height: 120 }} />
         </ScrollView>

         {/* NOTIFICATION CENTER */}
         <Modal visible={showNotifs} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => setShowNotifs(false)} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerT, { color: theme.text }]}>Admin Alerts</Text>
                  {activeNotifs.length > 0 ? (
                      activeNotifs.map(n => (
                         <View key={n.id} style={[styles.notifCard, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
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
                      <TouchableOpacity 
                         style={[styles.submitBtn, { flex: 1, backgroundColor: '#EF4444', marginTop: 0 }]} 
                         onPress={() => { clearAllNotifs(); setShowNotifs(false); }}
                      >
                         <Text style={styles.submitBtnT}>CLEAR ALL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                         style={[styles.submitBtn, { flex: 1, backgroundColor: isDark ? '#374151' : '#111', marginTop: 0 }]} 
                         onPress={() => setShowNotifs(false)}
                      >
                         <Text style={styles.submitBtnT}>CLOSE</Text>
                      </TouchableOpacity>
                   </View>
               </View>
            </View>
         </Modal>

         {/* EDIT IDENTITY MODAL */}
         <Modal visible={showEditProfile} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => { if (!isSaving) setShowEditProfile(false); }} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerT, { color: theme.text }]}>EDIT IDENTITY</Text>
                  
                  <Text style={styles.inputLabel}>ADMIN NAME</Text>
                  <TextInput 
                     style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                     value={adminName} 
                     onChangeText={setAdminName} 
                     placeholder="Name" 
                     placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                  
                  <Text style={[styles.inputLabel, { marginTop: 15 }]}>DESIGNATION</Text>
                  <TextInput 
                     style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, marginTop: 5 }]} 
                     value={adminTitle} 
                     onChangeText={setAdminTitle} 
                     placeholder="Designation" 
                     placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                  
                  <TouchableOpacity 
                     style={[styles.submitBtn, { backgroundColor: isDark ? GOLD : '#111' }]} 
                     onPress={handleSaveIdentity} 
                     disabled={isSaving}
                  >
                     {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                     ) : (
                        <Text style={styles.submitBtnT}>SAVE CHANGES</Text>
                      )}
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* OFFICE PROFILE MODAL */}
         <Modal visible={showOfficeProfile} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => { if (!isSavingOffice) { setShowOfficeProfile(false); setIsEditingOffice(false); } }} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <Text style={[styles.drawerT, { color: theme.text, marginBottom: 0 }]}>🏢 OFFICE PROFILE</Text>
                     {!isEditingOffice && (
                        <TouchableOpacity 
                           style={{ backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                           onPress={() => setIsEditingOffice(true)}
                        >
                           <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>✏️ EDIT</Text>
                        </TouchableOpacity>
                     )}
                  </View>
                  
                  {!isEditingOffice ? (
                     <View>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
                           <View style={{ marginBottom: 15 }}>
                              <Text style={styles.inputLabel}>OFFICE / COMPANY NAME</Text>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 4 }}>
                                 {officeName || 'Not Set'}
                              </Text>
                           </View>

                           <View style={{ marginBottom: 15 }}>
                              <Text style={styles.inputLabel}>OFFICE LANDLINE / PHONE</Text>
                              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 4 }}>
                                 {officePhone || 'Not Set'}
                              </Text>
                           </View>

                           <View style={{ marginBottom: 15 }}>
                              <Text style={styles.inputLabel}>WHATSAPP BUSINESS SUPPORT</Text>
                              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 4 }}>
                                 {officeWhatsapp || 'Not Set'}
                              </Text>
                           </View>

                           <View style={{ marginBottom: 15 }}>
                              <Text style={styles.inputLabel}>GOOGLE MAPS LOCATION LINK</Text>
                              {officeMaps ? (
                                 <TouchableOpacity onPress={() => Linking.openURL(officeMaps).catch(() => Alert.alert('Invalid Link', 'Cannot open maps link.'))}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: GOLD, marginTop: 4, textDecorationLine: 'underline' }}>
                                       {officeMaps}
                                    </Text>
                                 </TouchableOpacity>
                              ) : (
                                 <Text style={{ fontSize: 13, color: theme.subText, marginTop: 4 }}>Not Set</Text>
                              )}
                           </View>

                           <View style={{ marginBottom: 15 }}>
                              <Text style={styles.inputLabel}>FULL OFFICE ADDRESS</Text>
                              <Text style={{ fontSize: 14, color: theme.text, marginTop: 4, lineHeight: 20 }}>
                                 {officeAddress || 'Not Set'}
                              </Text>
                           </View>
                        </ScrollView>

                        <TouchableOpacity 
                           style={[styles.submitBtn, { backgroundColor: isDark ? '#374151' : '#111', marginTop: 15 }]} 
                           onPress={() => setShowOfficeProfile(false)}
                        >
                           <Text style={styles.submitBtnT}>CLOSE</Text>
                        </TouchableOpacity>
                     </View>
                  ) : (
                     <View>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
                           <Text style={styles.inputLabel}>OFFICE / COMPANY NAME</Text>
                           <TextInput 
                              style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                              value={officeName} 
                              onChangeText={setOfficeName} 
                              placeholder="e.g. Tamizha Properties" 
                              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                           />
                           
                           <Text style={[styles.inputLabel, { marginTop: 15 }]}>OFFICE LANDLINE / PHONE</Text>
                           <TextInput 
                              style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                              value={officePhone} 
                              onChangeText={setOfficePhone} 
                              placeholder="e.g. +91 44 1234 5678" 
                              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                              keyboardType="phone-pad"
                           />

                           <Text style={[styles.inputLabel, { marginTop: 15 }]}>WHATSAPP BUSINESS SUPPORT NUMBER</Text>
                           <TextInput 
                              style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                              value={officeWhatsapp} 
                              onChangeText={setOfficeWhatsapp} 
                              placeholder="e.g. +91 98765 43210" 
                              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                              keyboardType="phone-pad"
                           />

                           <Text style={[styles.inputLabel, { marginTop: 15 }]}>GOOGLE MAPS LOCATION LINK</Text>
                           <TextInput 
                              style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                              value={officeMaps} 
                              onChangeText={setOfficeMaps} 
                              placeholder="e.g. https://maps.google.com/?q=..." 
                              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                              autoCapitalize="none"
                              autoCorrect={false}
                           />

                           <Text style={[styles.inputLabel, { marginTop: 15 }]}>FULL OFFICE ADDRESS</Text>
                           <TextInput 
                              style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, height: 100, textAlignVertical: 'top', paddingTop: 15 }]} 
                              value={officeAddress} 
                              onChangeText={setOfficeAddress} 
                              placeholder="Enter full office address..." 
                              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                              multiline
                           />
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
                           <TouchableOpacity 
                              style={[styles.submitBtn, { flex: 1, backgroundColor: isDark ? GOLD : '#111', marginTop: 0 }]} 
                              onPress={async () => {
                                 await handleSaveOffice();
                                 setIsEditingOffice(false);
                              }} 
                              disabled={isSavingOffice}
                           >
                              {isSavingOffice ? (
                                 <ActivityIndicator color="#FFF" />
                              ) : (
                                 <Text style={styles.submitBtnT}>SAVE CHANGES</Text>
                              )}
                           </TouchableOpacity>
                           <TouchableOpacity 
                              style={[styles.submitBtn, { flex: 1, backgroundColor: isDark ? '#374151' : '#64748B', marginTop: 0 }]} 
                              onPress={() => setIsEditingOffice(false)}
                              disabled={isSavingOffice}
                           >
                              <Text style={styles.submitBtnT}>CANCEL</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  )}
               </View>
            </View>
         </Modal>

         {/* LICENSE MODAL */}
         <Modal visible={showLicense} transparent animationType="slide">
            <View style={styles.drawerOverlay}>
               <TouchableOpacity style={styles.drawerBlur} onPress={() => setShowLicense(false)} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}>
                  <View style={styles.handle} />
                  <Text style={[styles.drawerT, { color: theme.text }]}>LICENSE VERIFICATION</Text>
                  
                  <Text style={styles.inputLabel}>LICENSE KEY</Text>
                  <TextInput 
                     style={[styles.drawerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} 
                     value={licenseNumber} 
                     onChangeText={setLicenseNumber}
                     onBlur={() => updateSetting('license', licenseNumber)}
                     placeholder="License Key" 
                     placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  />
                  
                  <View style={{ marginTop: 20, padding: 15, backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderRadius: 15, borderWidth: 1, borderColor: theme.border }}>
                     <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>✓ State Verification Approved</Text>
                     <Text style={{ fontSize: 11, color: theme.subText, marginTop: 4 }}>Registered real estate admin certification is active for portfolio registry.</Text>
                  </View>
                  
                  <TouchableOpacity 
                     style={[styles.submitBtn, { backgroundColor: isDark ? GOLD : '#111' }]} 
                     onPress={() => { updateSetting('license', licenseNumber); setShowLicense(false); }}
                  >
                     <Text style={styles.submitBtnT}>DONE</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* LOGOUT CONFIRM MODAL */}
         <Modal visible={showLogoutConfirm} transparent animationType="fade">
            <View style={styles.mOverlay}>
               <View style={[styles.mCard, { backgroundColor: theme.cardBg }]}>
                  <Text style={styles.mIcon}>🚪</Text>
                  <Text style={[styles.mTitle, { color: theme.text }]}>Close Admin Session?</Text>
                  <Text style={[styles.mMsg, { color: theme.subText }]}>Are you sure you want to end your administrative control panel session?</Text>
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                     <TouchableOpacity style={[styles.mBtn, { flex: 1, backgroundColor: '#EF4444' }]} onPress={handleLogout}>
                        <Text style={styles.mBtnT}>LOGOUT</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[styles.mBtn, { flex: 1, backgroundColor: isDark ? '#374151' : '#64748B' }]} onPress={() => setShowLogoutConfirm(false)}>
                        <Text style={styles.mBtnT}>CANCEL</Text>
                     </TouchableOpacity>
                  </View>
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
                  <TouchableOpacity style={styles.mBtn} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                     <Text style={styles.mBtnT}>OKAY</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* SECURITY MODAL */}
         <Modal visible={showSecurity} transparent animationType="fade">
            <View style={styles.drawerOverlay}><TouchableOpacity style={styles.drawerBlur} onPress={() => setShowSecurity(false)} />
               <View style={[styles.drawerPanel, { backgroundColor: theme.cardBg }]}><View style={styles.handle} />
                  <Text style={[styles.drawerT, { color: theme.text }]}>SECURITY CENTRE</Text>
                  <View style={{padding: 20, backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: theme.border}}>
                     <Text style={{fontWeight: '900', color: '#22C55E'}}>PROTECTION ACTIVE</Text>
                     <Text style={{fontSize: 12, color: theme.subText, marginTop: 5}}>System is protected by 256-bit AES encryption.</Text>
                  </View>
                  <TouchableOpacity 
                     style={[styles.submitBtn, { backgroundColor: isDark ? GOLD : '#111' }]} 
                     onPress={() => setShowSecurity(false)}
                  >
                     <Text style={styles.submitBtnT}>CLOSE</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         <View style={[styles.bottomNav, { backgroundColor: theme.bottomNavBg, borderTopColor: theme.bottomNavBorder }]}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🏠</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>HOME</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SiteVisits')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>📅</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>VISITS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Properties')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🏢</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>PROPERTIES</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Leads')}><Text style={[styles.navIcon, { color: isDark ? '#6B7280' : '#AAA' }]}>🤝</Text><Text style={[styles.navText, { color: isDark ? '#6B7280' : '#AAA' }]}>LEADS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Text style={[styles.navIcon, { color: GOLD }]}>👤</Text><Text style={[styles.navText, { color: GOLD }]}>PROFILE</Text></TouchableOpacity>
         </View>
      </SafeAreaView>
   );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#FFF' },
   header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF' },
   headerSub: { fontSize: 8, fontWeight: '900', color: GOLD, letterSpacing: 2 },
   headerTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginTop: 5 },
   bellBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative' },
   redDot: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
   scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
   heroCard: { backgroundColor: '#FFF', borderRadius: 40, padding: 30, alignItems: 'center', marginBottom: 25 },
   avContainer: { position: 'relative' },
   mainAvatar: { width: 120, height: 120, borderRadius: 35, marginBottom: 15 },
   cameraBtn: { position: 'absolute', bottom: 10, right: -5, backgroundColor: '#111', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
   cameraIcon: { fontSize: 16 },
   badgeC: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 10 },
   badgeT: { fontSize: 9, fontWeight: '900', color: '#B45309' },
   mainName: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 4 },
   mainTitle: { fontSize: 13, color: '#666', fontWeight: '700' },
   switcher: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 20, padding: 6, marginBottom: 30 },
   switchBtn: { flex: 1, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
   activeSwitch: { backgroundColor: '#111' },
   switchT: { fontSize: 9, fontWeight: '900', color: '#AAA' },
   activeSwitchT: { color: '#FFF' },
   
   actionItem: { 
      backgroundColor: '#FFF', 
      borderRadius: 20, 
      padding: 16, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 15, 
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 0.5
   },
   actionIconC: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
   aTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
   aSub: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' },
   chevron: { fontSize: 18, color: GOLD, fontWeight: 'bold' },
   sectionTitle: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 1.5, marginBottom: 12, marginTop: 15 },
   
   logoutBtn: { backgroundColor: '#111', borderRadius: 20, height: 65, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 },
   logoutIcon: { fontSize: 20 },
   logoutTxt: { color: '#FFF', fontSize: 14, fontWeight: '900' },
   networkBlackCard: { backgroundColor: '#0D0D0D', borderRadius: 30, padding: 25, marginBottom: 25 },
   netVal: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 5 },
   netSub: { fontSize: 8, color: '#555', fontWeight: '900' },
   teamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
   miniAddBtn: { backgroundColor: GOLD, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
   miniAddT: { fontSize: 10, fontWeight: '900', color: '#FFF' },
   memberCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 1 },
   memberAvatarImg: { width: 60, height: 60, borderRadius: 15, marginRight: 15 },
   memberInfo: { flex: 1 },
   memberNameText: { fontSize: 18, fontWeight: '900', color: '#111' },
   roleBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginVertical: 6 },
   roleText: { fontSize: 8, fontWeight: '900', color: '#666' },
   memberMetaText: { fontSize: 11, color: '#999', fontWeight: '600' },
   ctrlBtnM: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
   
   // Toggle switch layout
   toggleTrack: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
   toggleTrackOn: { backgroundColor: '#22C55E' },
   toggleTrackOff: { backgroundColor: '#CBD5E1' },
   toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
   toggleThumbOn: { alignSelf: 'flex-end' },
   toggleThumbOff: { alignSelf: 'flex-start' },
   
   // Language options selection
   langOption: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 16, 
      backgroundColor: '#F8FAFC', 
      borderRadius: 15, 
      borderWidth: 1, 
      borderColor: '#E2E8F0', 
      marginBottom: 10 
   },
   langOptionActive: { 
      backgroundColor: GOLD, 
      borderColor: GOLD 
   },
   langOptionText: { 
      fontSize: 14, 
      fontWeight: '800', 
      color: '#0F172A' 
   },

   notifCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
   notifLead: { width: 8, height: 40, backgroundColor: GOLD, borderRadius: 4, marginRight: 15 },
   notifT: { fontSize: 14, fontWeight: '900', color: '#111' },
   notifB: { fontSize: 11, color: '#666', marginTop: 2 },
   notifTime: { fontSize: 9, fontWeight: '700', color: '#BBB' },
   drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
   drawerBlur: { flex: 1 },
   drawerPanel: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 60 },
   handle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
   drawerT: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 25 },
   drawerInput: { height: 60, backgroundColor: '#F8FAFC', borderRadius: 15, paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },
   inputLabel: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 1, marginBottom: 8 },
   submitBtn: { backgroundColor: '#111', height: 65, borderRadius: 20, marginTop: 35, justifyContent: 'center', alignItems: 'center' },
   submitBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900' },
   roleSwitcher: { flexDirection: 'row', gap: 10, marginTop: 15 },
   roleO: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
   roleActive: { backgroundColor: '#111' },
   roleOT: { fontSize: 12, fontWeight: '700', color: '#111' },
   roleActiveT: { color: '#FFF' },
   bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEE', justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%', zIndex: 99, elevation: 10 },
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
   // Site Visits Link
   visitsLinkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEFCE8', borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1.5, borderColor: '#FDE68A', gap: 12 },
   visitsLinkIcon: { fontSize: 22 },
   visitsLinkTitle: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
   visitsLinkSub: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
   visitsLinkArrow: { fontSize: 22, color: GOLD, fontWeight: '900' },
});

export default ProfileScreen;
