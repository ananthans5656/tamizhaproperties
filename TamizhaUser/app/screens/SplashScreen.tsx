import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  Text,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const fadeTextAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  const targetScreen = useRef('Login');

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 25,
        useNativeDriver: true,
      }),
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered text
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(fadeTextAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const checkUserStatus = async () => {
      try {
        // Check if app was opened via deep link
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.startsWith('tamizha://property/')) {
          const propertyId = initialUrl.replace('tamizha://property/', '').split('?')[0];
          if (propertyId) {
            await AsyncStorage.setItem('pending_property_id', propertyId);
          }
        }

        const token = await AsyncStorage.getItem('user_auth_token');
        if (token) {
          const pendingId = await AsyncStorage.getItem('pending_property_id');
          if (pendingId) {
            targetScreen.current = 'PropertyDetails';
            await AsyncStorage.removeItem('pending_property_id');
            setTimeout(() => {
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Dashboard' },
                  { name: 'PropertyDetails', params: { propertyId: pendingId } },
                ],
              });
            }, 3300);
            return;
          }
          targetScreen.current = 'Dashboard';
        } else {
          targetScreen.current = 'Login';
        }
      } catch {
        targetScreen.current = 'Login';
      }
    };

    checkUserStatus();

    const timer = setTimeout(() => {
      if (targetScreen.current !== 'PropertyDetails') {
        navigation.reset({
          index: 0,
          routes: [{ name: targetScreen.current }],
        });
      }
    }, 3300);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" translucent={false} />

      {/* Layered background for gradient effect */}
      <View style={styles.bgBottom} />
      <View style={styles.bgTop} />

      {/* Decorative Circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Glow ring behind logo */}
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
          <View style={styles.glowRingInner} />

          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[styles.brandSection, { opacity: fadeTextAnim }]}>
          <Text style={styles.brandTitle}>TAMIZHA PROPERTIES</Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerDot}>◆</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.premiumLabel}>PREMIUM REAL ESTATE</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: subtitleAnim }]}>
          A Hub of Tamilnadu Properties
        </Animated.Text>
      </View>

      {/* Bottom Loading Section */}
      <View style={styles.bottomSection}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingLabel}>Loading secure portal...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  // Two-layer fake gradient
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1628',
    opacity: 0.85,
  },
  bgBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A56DB',
    opacity: 0.5,
  },
  decorCircle1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(26,86,219,0.18)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 100,
    left: -70,
  },
  decorCircle3: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(26,86,219,0.1)',
    top: height * 0.38,
    right: -30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 38,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(26,86,219,0.3)',
  },
  glowRingInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(26,86,219,0.15)',
  },
  logoWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  logo: {
    width: 95,
    height: 95,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dividerLine: {
    width: 50,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dividerDot: {
    color: '#60A5FA',
    fontSize: 8,
    marginHorizontal: 10,
  },
  premiumLabel: {
    fontSize: 10,
    color: '#60A5FA',
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  progressTrack: {
    width: width * 0.45,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 2,
  },
  loadingLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

export default SplashScreen;
