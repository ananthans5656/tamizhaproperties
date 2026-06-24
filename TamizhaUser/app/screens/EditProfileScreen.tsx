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
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { getUserSession, getUserProfile, saveUserProfile } from '../services/api';

const EditProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [nativePlace, setNativePlace] = useState('');
  const [avatarUri, setAvatarUri] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const load = async () => {
      const session = await getUserSession();
      const profile = await getUserProfile();
      const data = { ...session, ...profile };
      setName(data?.name || '');
      setEmail(data?.email || '');
      setPhone(data?.phoneNumber || '');
      setCurrentCity(data?.currentCity || '');
      setNativePlace(data?.nativePlace || '');
      if (data?.avatarUri) setAvatarUri(data.avatarUri);
    };
    load().catch(() => {});
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong');
        return;
      }
      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          setAvatarUri(uri);
        }
      }
    } catch (error) {
      console.log('Image picker error: ', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveUserProfile({ name, email, phoneNumber: phone, currentCity, nativePlace, avatarUri });
      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F9" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveTopBtn} onPress={handleSave}>
          <Text style={styles.saveTopText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
            />
          </View>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage}>
            <Text style={styles.changePhotoIcon}>📷</Text>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#AAA"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email"
                placeholderTextColor="#AAA"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#AAA"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current City (Residence)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏠</Text>
              <TextInput
                style={styles.input}
                value={currentCity}
                onChangeText={setCurrentCity}
                placeholder="e.g. Singapore / Chennai"
                placeholderTextColor="#AAA"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Native Place</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.input}
                value={nativePlace}
                onChangeText={setNativePlace}
                placeholder="e.g. Madurai / Trichy"
                placeholderTextColor="#AAA"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnIcon}>✓</Text>
          <Text style={styles.saveBtnText}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</Text>
        </TouchableOpacity>

        <View style={{ height: 50 + insets.bottom }} />
      </ScrollView>

      {/* LUXURY SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <View style={styles.successIconCircle}>
                 <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.modalTitle}>Profile Updated!</Text>
              <Text style={styles.modalSub}>Your credentials and preferences have been securely synchronized across the network.</Text>
              
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => { setShowSuccess(false); navigation.goBack(); }}>
                 <Text style={styles.modalBtnText}>DONE</Text>
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
  saveTopBtn: {
    backgroundColor: '#0B132B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  saveTopText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0B132B',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#0B132B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  changePhotoIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  formSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B132B',
    paddingVertical: 18,
    borderRadius: 25,
    shadowColor: '#0B132B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  saveBtnIcon: {
    fontSize: 16,
    color: '#D4AF37',
    marginRight: 10,
    fontWeight: '900',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 35,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0B132B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  successIcon: {
    fontSize: 42,
    color: '#D4AF37',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111',
    marginBottom: 15,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 35,
  },
  modalDoneBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default EditProfileScreen;
