import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { getUserSession, saveUserProfile, api, saveLeadId } from '../services/api';

const { width, height } = Dimensions.get('window');

const Colors = {
  white: '#FFFFFF',
  primary: '#1A56DB',
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
};

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [nativePlace, setNativePlace] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    getUserSession().then(session => {
      if (session?.name) setName(session.name);
      if (session?.email) setPhoneNumber('');
    }).catch(() => {});
  }, []);

  const handleContinue = async () => {
    if (!name.trim() || !nativePlace.trim() || !currentCity.trim()) {
      Alert.alert('Required Fields', 'Please fill in your Name, Native Place, and select your Current Country');
      return;
    }
    if (!isTermsAgreed) {
      Alert.alert('Terms Agreement', 'You must agree to the Terms & Conditions to proceed');
      return;
    }
    if (!isPrivacyAgreed) {
      Alert.alert('Privacy Agreement', 'You must agree to the Privacy Policy to proceed');
      return;
    }

    setIsLoading(true);
    try {
      const session = await getUserSession();
      const userEmail = session?.email || '';

      // Save profile locally
      await saveUserProfile({
        name: name.trim(),
        nativePlace: nativePlace.trim(),
        currentCity: currentCity.trim(),
        phoneNumber: phoneNumber || '',
        email: userEmail,
        isProfileCompleted: true,
      });

      // Create lead for this user in PostgreSQL
      try {
        const existingLeads = await api.getLeads();
        const myLead = existingLeads.find((l: any) =>
          l.email?.toLowerCase() === userEmail.toLowerCase()
        );
        if (myLead) {
          await saveLeadId(myLead.id);
        } else {
          const newLead = await api.createLead({
            name: name.trim(),
            email: userEmail,
            phone: phoneNumber || '',
            source: 'User App',
            status: 'new',
            notes: `Native: ${nativePlace.trim()}, Residence: ${currentCity.trim()}`,
          });
          await saveLeadId(newLead.id);
        }
      } catch (leadErr) {
        console.warn('Lead create/link error (non-fatal):', leadErr);
      }

      setIsLoading(false);
      Alert.alert('Profile Complete! 🎉', 'Welcome to Tamizha Properties!', [
        { text: 'Explore Now', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] }) },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Save Failed', error.message || 'Error occurred while saving your profile');
    }
  };

  const handleBack = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Header */}
      <View style={styles.headerArea}>
        <View style={styles.headerBgDark} />
        <View style={styles.headerBgBlue} />
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerIconWrapper}>
              <Text style={styles.headerIcon}>👤</Text>
            </View>
            <Text style={styles.headerTitle}>Complete Profile</Text>
            <Text style={styles.headerSubtitle}>
              One last step to unlock your personalized investment dashboard
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Text style={styles.stepDotText}>✓</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Text style={styles.stepDotText}>✓</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]}>
            <Text style={styles.stepDotText}>3</Text>
          </View>
        </View>
        <View style={styles.stepLabelRow}>
          <Text style={styles.stepLabel}>Signed In</Text>
          <Text style={[styles.stepLabel, { textAlign: 'center' }]}>Verified</Text>
          <Text style={[styles.stepLabel, { textAlign: 'right', color: Colors.primary, fontWeight: '800' }]}>
            Profile
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Saving your profile...</Text>
              </View>
            ) : (
              <View style={styles.form}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>FULL NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Native Place */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NATIVE PLACE *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Madurai / Trichy / Coimbatore"
                    placeholderTextColor="#94A3B8"
                    value={nativePlace}
                    onChangeText={setNativePlace}
                    autoCapitalize="words"
                  />
                </View>

                {/* Current City — chip selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CURRENT COUNTRY (RESIDENCE) *</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    {[
                      { label: '🇸🇬 Singapore', value: 'Singapore' },
                      { label: '🇦🇪 UAE', value: 'UAE' },
                      { label: '🇦🇪 Dubai', value: 'Dubai' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setCurrentCity(opt.value)}
                        style={[
                          styles.cityChip,
                          currentCity === opt.value && styles.cityChipActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.cityChipText,
                          currentCity === opt.value && styles.cityChipTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Info tag */}
                <View style={styles.infoTag}>
                  <Text style={styles.infoIcon}>🌏</Text>
                  <Text style={styles.infoText}>
                    We serve the Tamil diaspora across{'\n'}Singapore 🇸🇬 · UAE 🇦🇪 · Dubai 🇦🇪
                  </Text>
                </View>

                {/* Checkboxes */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setIsTermsAgreed(!isTermsAgreed)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, isTermsAgreed && styles.checkboxChecked]}>
                      {isTermsAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I agree to the{' '}
                      <Text style={styles.checkboxLink}>Terms &amp; Conditions</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setIsPrivacyAgreed(!isPrivacyAgreed)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, isPrivacyAgreed && styles.checkboxChecked]}>
                      {isPrivacyAgreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I agree to the{' '}
                      <Text style={styles.checkboxLink}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueButtonText}>Complete &amp; Explore →</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backText}>Cancel &amp; Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </View>
            )}
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  headerArea: {
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerBgDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1628',
  },
  headerBgBlue: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#1A56DB',
    opacity: 0.55,
    borderTopLeftRadius: 70,
  },
  decorCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(96,165,250,0.1)',
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -35,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  headerIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -18,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotDone: {
    backgroundColor: Colors.primary,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    maxWidth: 60,
  },
  stepLineDone: {
    backgroundColor: Colors.primary,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  form: {
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slateMuted,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.slateDark,
    fontWeight: '600',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,86,219,0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,86,219,0.12)',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
  checkboxContainer: {
    marginBottom: 22,
    gap: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  checkboxLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    fontSize: 13,
    color: Colors.slateMuted,
    fontWeight: '700',
  },
  cityChip: {
    flex: 1, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  cityChipActive: {
    backgroundColor: '#1A56DB', borderColor: '#1A56DB',
  },
  cityChipText: {
    fontSize: 11, fontWeight: '800', color: '#64748B',
  },
  cityChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
