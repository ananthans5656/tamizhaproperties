import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';

import { api, saveToken } from '../services/api';

const GOLD = '#C9A84C';

type Props = { navigation: any };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Focus states for input borders
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleForgotPassword = async () => {
    setForgotSuccess(true);
    setForgotLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(email.trim(), password.trim());
      if (result.user?.role !== 'admin') {
        setErrorModal({
          visible: true,
          title: 'Unauthorized Access',
          message: 'The credentials you provided do not have administrative privileges for this estate portfolio.',
        });
        return;
      }
      await saveToken(result.token);
      navigation.replace('Home');
    } catch (error: any) {
      setErrorModal({
        visible: true,
        title: 'Login Failed',
        message: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.brand}>TAMIZHA PROPERTIES</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>⚙ ADMIN PORTAL</Text>
              </View>

              <Text style={styles.title}>Admin Login</Text>
              <Text style={styles.subtitle}>
                Please enter your admin credentials to access the management portal.
              </Text>

              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="name@company.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.passHeader}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity onPress={() => { setForgotEmail('admin@tamizhaproperties.com'); setForgotSuccess(false); setForgotModal(true); }}>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, passwordFocused && styles.inputFocused, { paddingRight: 60 }]}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="........"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 16, top: 14 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: GOLD, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Log In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Modal visible={errorModal.visible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.errorCard}>
                  <View style={styles.errorIconCircle}>
                    <Text style={styles.errorIconText}>!</Text>
                  </View>
                  <Text style={styles.errorTitle}>{errorModal.title}</Text>
                  <Text style={styles.errorMsg}>{errorModal.message}</Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setErrorModal({ ...errorModal, visible: false })}
                  >
                    <Text style={styles.closeBtnText}>Return to Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* FORGOT PASSWORD MODAL */}
      <Modal visible={forgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.errorCard}>
            {forgotSuccess ? (
              <>
                <View style={[styles.errorIconCircle, { borderColor: '#22C55E' }]}>
                  <Text style={[styles.errorIconText, { color: '#22C55E' }]}>✓</Text>
                </View>
                <Text style={styles.errorTitle}>Email Sent!</Text>
                <Text style={styles.errorMsg}>
                  Password reset link sent to{'\n'}
                  <Text style={{ color: GOLD, fontWeight: '900' }}>admin@tamizhaproperties.com</Text>
                  {'\n\n'}Check your inbox and follow the link to set a new password.
                </Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setForgotModal(false)}>
                  <Text style={styles.closeBtnText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>🔑</Text>
                </View>
                <Text style={styles.errorTitle}>Reset Password</Text>
                <Text style={[styles.errorMsg, { marginBottom: 15 }]}>
                  A password reset link will be sent to your admin email address.
                </Text>
                <View style={{ width: '100%', marginBottom: 20 }}>
                  <Text style={[styles.label, { textAlign: 'left', marginBottom: 8 }]}>ADMIN EMAIL</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { opacity: forgotLoading ? 0.6 : 1 }]}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.closeBtnText}>Send Reset Link</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 14 }} onPress={() => setForgotModal(false)}>
                  <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  brand: {
    fontSize: 10,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 3,
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: '#1E3A5F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 25,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 15,
  },
  inputFocused: {
    borderColor: GOLD,
    backgroundColor: '#FFFFFF',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgot: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '700',
    marginBottom: 8,
  },
  loginBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  signupGrey: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  signupGold: { color: GOLD, fontSize: 13, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  errorIconText: {
    color: GOLD,
    fontSize: 32,
    fontWeight: '900',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: GOLD,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
