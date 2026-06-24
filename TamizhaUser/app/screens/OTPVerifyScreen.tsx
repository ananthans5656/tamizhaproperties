import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, Dimensions, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { getUserSession, saveUserProfile, api, saveToken, saveUserSession } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

const { width } = Dimensions.get('window');

const Colors = {
  white: '#FFFFFF',
  primary: '#1A56DB',
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
};

const COUNTRIES = [
  { label: 'India', code: '+91', flag: '🇮🇳' },
  { label: 'Singapore', code: '+65', flag: '🇸🇬' },
  { label: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { label: 'UAE', code: '+971', flag: '🇦🇪' },
];

const OTPVerifyScreen = ({ navigation, route }: any) => {
  const { email: regEmail, password: regPassword } = route?.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<TextInput>(null);
  const timerRef = useRef<any>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const fullPhone = `${countryCode}${phoneNumber.trim()}`;

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      startResendTimer();

      Alert.alert('OTP Sent', `Verification code sent to ${fullPhone}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send OTP. Check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 5);
    setOtpValue(cleaned);
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length < 5) {
      Alert.alert('Incomplete OTP', 'Please enter all 5 digits');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (regEmail && regPassword) {
        // Registration flow — create account now that phone is verified
        const result = await api.register({
          name: regEmail.split('@')[0],
          email: regEmail,
          password: regPassword,
          phone: fullPhone,
          role: 'user',
        });
        await saveToken(result.token || '');
        await saveUserSession(result);
        await saveUserProfile({ email: regEmail, phoneNumber: fullPhone });
        // Check pending deep link property after registration
        const pendingId = await AsyncStorage.getItem('pending_property_id');
        if (pendingId) {
          await AsyncStorage.removeItem('pending_property_id');
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Dashboard' },
              { name: 'PropertyDetails', params: { propertyId: pendingId } },
            ],
          });
          return;
        }
      } else {
        // Standalone verify (existing user adding phone)
        const session = await getUserSession();
        await saveUserProfile({ email: session?.email || '', phoneNumber: fullPhone });
      }

      navigation.replace('Register');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
        Alert.alert('Account Already Exists', 'This email is already registered. Please sign in instead.', [
          { text: 'Sign In', onPress: () => navigation.replace('Login') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else if (msg.includes('Invalid OTP') || msg.includes('expired') || msg.includes('No OTP')) {
        Alert.alert('Wrong OTP', msg);
      } else {
        Alert.alert('Verification Failed', msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
              <Text style={styles.headerIcon}>📱</Text>
            </View>
            <Text style={styles.headerTitle}>
              {otpSent ? 'Enter OTP Code' : 'Phone Verification'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {otpSent
                ? `Code sent to ${selectedCountry.flag} ${fullPhone}`
                : 'Verify your phone number to continue'}
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
            <Text style={styles.stepDotText}>2</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}>
            <Text style={styles.stepDotTextGray}>3</Text>
          </View>
        </View>
        <View style={styles.stepLabelRow}>
          <Text style={styles.stepLabel}>Signed In</Text>
          <Text style={[styles.stepLabel, { color: Colors.primary, fontWeight: '800' }]}>Verify Phone</Text>
          <Text style={[styles.stepLabel, { textAlign: 'right' }]}>Profile</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {otpSent ? 'Verifying...' : 'Sending OTP...'}
              </Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {!otpSent ? (
                /* ── Phone entry ── */
                <>
                  <Text style={styles.label}>SELECT COUNTRY</Text>
                  <View style={styles.countryPillRow}>
                    {COUNTRIES.map(c => (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.countryPill, countryCode === c.code && styles.countryPillSelected]}
                        onPress={() => setCountryCode(c.code)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.countryPillFlag}>{c.flag}</Text>
                        <Text style={[styles.countryPillLabel, countryCode === c.code && styles.countryPillLabelSelected]}>
                          {c.label}
                        </Text>
                        <Text style={[styles.countryPillCode, countryCode === c.code && styles.countryPillCodeSelected]}>
                          {c.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>MOBILE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeBoxText}>{selectedCountry.flag} {countryCode}</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter phone number"
                      placeholderTextColor="#94A3B8"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={12}
                    />
                  </View>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleSendOTP} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Send OTP →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ── OTP entry ── */
                <>
                  <Text style={styles.label}>VERIFICATION CODE</Text>
                  <Text style={styles.otpHint}>
                    Enter the 5-digit code sent to {fullPhone}
                  </Text>
                  <Text style={styles.otpBetaHint}>
                    Beta: Enter 1 2 3 4 5 to verify
                  </Text>

                  <TouchableOpacity
                    style={styles.otpBoxRow}
                    activeOpacity={1}
                    onPress={() => otpInputRef.current?.focus()}
                  >
                    {Array(5).fill(0).map((_, i) => (
                      <View
                        key={i}
                        style={[styles.otpBox, otpValue[i] ? styles.otpBoxFilled : null]}
                      >
                        <Text style={styles.otpBoxText}>{otpValue[i] || ''}</Text>
                      </View>
                    ))}
                  </TouchableOpacity>
                  <TextInput
                    ref={otpInputRef}
                    value={otpValue}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    maxLength={5}
                    autoFocus
                    style={styles.otpHiddenInput}
                  />

                  {/* Resend */}
                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOTP}>
                        <Text style={styles.resendLink}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Verify & Continue →</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setOtpSent(false)}>
                    <Text style={styles.secondaryButtonText}>← Edit Phone Number</Text>
                  </TouchableOpacity>
                </>
              )}

              {!regEmail && (
                <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Register')}>
                  <Text style={styles.skipText}>Skip for now →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.replace('Login')}>
                <Text style={styles.cancelText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FD' },
  headerArea: { paddingBottom: 28, overflow: 'hidden' },
  headerBgDark: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1628' },
  headerBgBlue: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: '#1A56DB', opacity: 0.55, borderTopLeftRadius: 70 },
  decorCircle1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(96,165,250,0.1)', top: -60, right: -50 },
  decorCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: 0, left: -35 },
  headerContent: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 24 },
  headerIconWrapper: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  headerIcon: { fontSize: 32 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 18, paddingBottom: 4 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -18, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  stepDotDone: { backgroundColor: Colors.primary },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  stepDotTextGray: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4, maxWidth: 60 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 2 },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  formContainer: { flex: 1 },
  label: { fontSize: 10, fontWeight: '800', color: Colors.slateMuted, marginBottom: 12, letterSpacing: 1 },
  countryPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  countryPill: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  countryPillSelected: { backgroundColor: 'rgba(26,86,219,0.07)', borderColor: Colors.primary },
  countryPillFlag: { fontSize: 22, marginBottom: 4 },
  countryPillLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  countryPillLabelSelected: { color: Colors.primary },
  countryPillCode: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  countryPillCodeSelected: { color: Colors.primary },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  codeBox: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  codeBoxText: { fontSize: 14, fontWeight: '700', color: Colors.slateDark },
  phoneInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, fontSize: 16, color: Colors.slateDark, fontWeight: '600' },
  otpHint: { fontSize: 13, color: Colors.slateMuted, marginBottom: 20 },
  otpBetaHint: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  otpBoxRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 16 },
  otpHiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  otpBox: { width: (width - 48 - 40) / 5, height: 56, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: 'rgba(26,86,219,0.05)' },
  otpBoxText: { fontSize: 22, fontWeight: '800', color: Colors.slateDark },
  resendRow: { alignItems: 'center', marginBottom: 20 },
  resendTimer: { fontSize: 13, color: Colors.slateMuted },
  resendLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginBottom: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  secondaryButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  secondaryButtonText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  skipButton: { alignItems: 'center', paddingVertical: 10, marginTop: 'auto' },
  skipText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 13, color: Colors.slateMuted, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 13, color: Colors.primary, fontWeight: '600' },
});

export default OTPVerifyScreen;
