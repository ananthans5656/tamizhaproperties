import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  white: '#FFFFFF',
  primary: '#E2C36D', // Premium Gold accent
  darkBg: '#0E1117',  // Deep Ink Black
  progressTrack: '#1E2530', // Dark track for progress bar background
};

const Shadow = {
  card: {
    shadowColor: '#E2C36D', // Gold glow shadow
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
};

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const fadeTextAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]).start();

    // Staggered text fade in
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(fadeTextAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        navigation.replace(token ? 'Home' : 'Login');
      } catch {
        navigation.replace('Login');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, loadingAnim, fadeTextAnim, navigation]);

  const progressWidth = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/tp_stone_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Animated.View style={{ opacity: fadeTextAnim, alignItems: 'center' }}>
            <Text style={styles.brandTitle}>TAMIZHA PROPERTIES</Text>
            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <Text style={styles.brandSubtitle}>ADMIN DASHBOARD</Text>
              <View style={styles.line} />
            </View>
          </Animated.View>
        </Animated.View>

        <View style={styles.bottomSection}>
          <View style={styles.loadingContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
          </View>
          <Text style={styles.tagline}>A Hub of Tamilnadu Properties</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    ...Shadow.card,
    elevation: 10,
  },
  logo: {
    width: 125,
    height: 125,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E2C36D',
    letterSpacing: 2,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  line: {
    height: 1.5,
    width: 40,
    backgroundColor: '#C5A44E',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginHorizontal: 12,
    letterSpacing: 2.5,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  loadingContainer: {
    width: width * 0.45,
    height: 4,
    marginBottom: 20,
  },
  progressBarBg: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
