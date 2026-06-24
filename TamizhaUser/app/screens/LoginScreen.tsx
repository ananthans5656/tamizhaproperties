import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { api, saveToken, saveUserSession, getLeadId, saveLeadId } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const Colors = {
  white: '#FFFFFF',
  primary: '#1A56DB',
  primaryDark: '#0A1628',
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customDialog, setCustomDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    options?: { text: string; onPress: () => void; style?: 'cancel' | 'default' }[];
  }>({ visible: false, title: '', message: '' });

  const cardSlideAnim = useRef(new Animated.Value(80)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(cardSlideAnim, {
          toValue: 0,
          friction: 7,
          tension: 35,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const showCustomAlert = (
    title: string,
    message: string,
    options?: { text: string; onPress: () => void; style?: 'cancel' | 'default' }[]
  ) => {
    setCustomDialog({
      visible: true,
      title,
      message,
      options: options || [{ text: 'OK', onPress: () => {} }],
    });
  };

  const handleSignUp = () => {
    if (!email.trim()) {
      showCustomAlert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      showCustomAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showCustomAlert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    // Go to OTP verification first — account created only after phone is verified
    navigation.navigate('OTPVerify', {
      email: email.trim().toLowerCase(),
      password,
    });
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      showCustomAlert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (!password) {
      showCustomAlert('Missing Password', 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.login(email.trim().toLowerCase(), password);
      await saveToken(result.token);
      await saveUserSession(result.user);

      // Find lead linked to this user for chat
      try {
        const userId = result.user?.id;
        let foundLeadId: string | null = null;
        if (userId) {
          const lead = await api.getLeadByUser(userId).catch(() => null);
          if (lead?.id) foundLeadId = lead.id;
        }
        if (!foundLeadId) {
          const leads = await api.getLeads();
          const myLead = leads.find((l: any) => l.email?.toLowerCase() === email.trim().toLowerCase());
          if (myLead) foundLeadId = myLead.id;
        }
        if (foundLeadId) await saveLeadId(foundLeadId);
      } catch (_) {}

      // Check if opened via deep link — go to that property
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
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      }
    } catch (error: any) {
      showCustomAlert('Login Failed', error.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Top blue header area */}
      <View style={styles.headerArea}>
        <View style={styles.headerBgDark} />
        <View style={styles.headerBgBlue} />
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <Animated.View style={[styles.headerContent, { opacity: headerFadeAnim }]}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>TAMIZHA PROPERTIES</Text>
          <Text style={styles.headerTagline}>Premium Real Estate Portal</Text>
        </Animated.View>
      </View>

      {/* White Bottom Card */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.card, { opacity: cardFadeAnim, transform: [{ translateY: cardSlideAnim }] }]}
          >
            <Text style={styles.welcomeTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.welcomeSubtitle}>
              {isSignUp
                ? 'Join Tamizha Properties and explore premium land investment opportunities across Tamil Nadu.'
                : 'Sign in to explore premium agricultural & residential land investment opportunities across Tamil Nadu.'}
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#AAB4C1"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                      placeholderTextColor="#AAB4C1"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password — only for Sign Up */}
                {isSignUp && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                    <View style={styles.inputBox}>
                      <Text style={styles.inputIcon}>🔑</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#AAB4C1"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                )}

                {/* Sign In / Sign Up Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={isSignUp ? handleSignUp : handleLogin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.loginButtonText}>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
                </TouchableOpacity>

                {/* Toggle Sign In / Sign Up */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => { setIsSignUp(!isSignUp); setConfirmPassword(''); setPassword(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleText}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security badge */}
            <View style={styles.secureBadge}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <Text style={styles.secureText}>
                Secured by Tamizha Properties • End-to-end encrypted
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Custom Dialog Modal */}
      <Modal visible={customDialog.visible} transparent animationType="fade">
        <View style={styles.mOverlay}>
          <View style={styles.mCard}>
            <Text style={styles.mIcon}>⚠️</Text>
            <Text style={styles.mTitle}>{customDialog.title}</Text>
            {customDialog.message ? (
              <Text style={styles.mMsg}>{customDialog.message}</Text>
            ) : null}
            <View style={{ width: '100%', gap: 10 }}>
              {customDialog.options?.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dialogBtn,
                    opt.style === 'cancel' ? styles.dialogBtnCancel : styles.dialogBtnPrimary,
                  ]}
                  onPress={() => {
                    setCustomDialog(prev => ({ ...prev, visible: false }));
                    opt.onPress();
                  }}
                >
                  <Text style={[
                    styles.dialogBtnT,
                    opt.style === 'cancel' ? styles.dialogBtnCancelT : styles.dialogBtnPrimaryT,
                  ]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FD' },
  headerArea: {
    height: height * 0.38,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    overflow: 'hidden',
  },
  headerBgDark: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1628' },
  headerBgBlue: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%', backgroundColor: '#1A56DB', opacity: 0.6, borderTopLeftRadius: 80,
  },
  decorCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(96,165,250,0.12)', top: -80, right: -60,
  },
  decorCircle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: 20, left: -50,
  },
  headerContent: { alignItems: 'center', paddingHorizontal: 24 },
  logoWrapper: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 14,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.95)',
  },
  logo: { width: 58, height: 58 },
  brandName: {
    fontSize: 17, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 2, marginBottom: 6,
  },
  headerTagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    fontWeight: '500', letterSpacing: 0.5,
  },
  safeArea: { flex: 1, marginTop: -28 },
  scrollContent: { flexGrow: 1 },
  card: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 28, paddingTop: 35, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
  },
  welcomeTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.slateDark,
    marginBottom: 10, textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13.5, color: Colors.slateMuted, textAlign: 'center',
    lineHeight: 20, marginBottom: 30, paddingHorizontal: 8,
  },
  formContainer: { gap: 18, marginBottom: 28 },
  inputWrapper: { gap: 6 },
  inputLabel: {
    fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 2,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1, fontSize: 15, color: Colors.slateDark,
    fontWeight: '500', paddingVertical: 14,
  },
  eyeBtn: { padding: 6 },
  eyeIcon: { fontSize: 16 },
  loginButton: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    marginTop: 4,
  },
  loginButtonText: {
    fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2,
  },
  loadingContainer: { paddingVertical: 30, alignItems: 'center', marginBottom: 28 },
  loadingText: { marginTop: 16, fontSize: 13, color: Colors.primary, fontWeight: '600' },
  secureBadge: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(26,86,219,0.06)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  shieldIcon: { fontSize: 14, marginRight: 8, marginTop: 1 },
  secureText: { flex: 1, fontSize: 11.5, color: '#64748B', lineHeight: 17, fontWeight: '500' },
  mOverlay: {
    flex: 1, backgroundColor: 'rgba(10, 22, 40, 0.75)',
    justifyContent: 'center', padding: 30,
  },
  mCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1,
    shadowRadius: 20, elevation: 10,
  },
  mIcon: { fontSize: 40, marginBottom: 15 },
  mTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
  mMsg: {
    fontSize: 13, color: '#64748B', textAlign: 'center',
    marginTop: 10, marginBottom: 25, lineHeight: 20,
  },
  dialogBtn: { width: '100%', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dialogBtnPrimary: { backgroundColor: '#1A56DB' },
  dialogBtnCancel: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  dialogBtnT: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  dialogBtnPrimaryT: { color: '#FFFFFF' },
  dialogBtnCancelT: { color: '#64748B' },
  toggleRow: { alignItems: 'center', paddingVertical: 10 },
  toggleText: { fontSize: 13.5, color: Colors.slateMuted, fontWeight: '500' },
  toggleLink: { color: Colors.primary, fontWeight: '800' },
});

export default LoginScreen;
