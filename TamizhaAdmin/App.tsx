import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Alert, BackHandler, PanResponder, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearToken } from './src/services/api';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import LeadChatScreen from './src/screens/LeadChatScreen';
import SiteVisitsScreen from './src/screens/SiteVisitsScreen';
import ReportsScreen from './src/screens/ReportsScreen';

type Screen = 'Splash' | 'Login' | 'Home' | 'Properties' | 'Leads' | 'Profile' | 'PropertyDetail' | 'AddProperty' | 'LeadChat' | 'SiteVisits' | 'Reports';

export default function App() {
  const [screen, setScreen] = useState<Screen>('Splash');
  const [params, setParams] = useState<any>({});
  const [history, setHistory] = useState<{ screen: Screen; params: any }[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [newVisitsBadge, setNewVisitsBadge] = useState(0);

  const screenRef = useRef(screen);
  const paramsRef = useRef(params);
  const historyRef = useRef(history);
  screenRef.current = screen;
  paramsRef.current = params;
  historyRef.current = history;

  const toggleTheme = (val: boolean) => {
    setIsDark(val);
    AsyncStorage.setItem('admin_dark_theme', val ? 'true' : 'false').catch(() => {});
  };

  // Restore theme preference
  useEffect(() => {
    AsyncStorage.getItem('admin_dark_theme').then(val => {
      if (val === 'true') setIsDark(true);
    }).catch(() => {});
  }, []);

  const activeNotifs = notifs.filter(n => !clearedNotifIds.includes(n.id));
  const clearAllNotifs = () => {
    setClearedNotifIds(notifs.map(n => n.id));
  };

  const navigation = useMemo(() => ({
    replace: (s: Screen, p?: any) => {
      if (s === 'Login' || s === 'Splash') setHistory([]);
      setParams(p || {});
      setScreen(s);
    },
    navigate: (s: Screen, p?: any) => {
      if (s === 'Login' || s === 'Splash') {
        setHistory([]);
      } else {
        setHistory(prev => [...prev, { screen: screenRef.current, params: paramsRef.current }]);
      }
      setParams(p || {});
      setScreen(s);
    },
    goBack: () => {
      const hist = historyRef.current;
      if (hist.length > 0) {
        const lastItem = hist[hist.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setParams(lastItem.params || {});
        setScreen(lastItem.screen);
      } else {
        setParams({});
        setScreen('Home');
      }
    },
  }), []);

  // Android hardware back button
  useEffect(() => {
    const backAction = () => {
      const currentScreen = screenRef.current;
      const hist = historyRef.current;
      // After logout, Login/Splash have no back destination — exit the app.
      if (currentScreen === 'Login' || currentScreen === 'Splash') {
        BackHandler.exitApp();
        return true;
      }
      if (currentScreen === 'Home') {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      if (hist.length > 0) {
        navigation.goBack();
      } else {
        navigation.replace('Home');
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [navigation]);

  const route = { params };

  // Screens where swipe-back should work
  const swipeBackScreens: Screen[] = ['PropertyDetail', 'AddProperty', 'LeadChat', 'SiteVisits', 'Reports', 'Properties', 'Leads', 'Profile'];

  const swipePan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const canSwipe = (swipeBackScreens as string[]).includes(screenRef.current);
        return canSwipe && g.dx > 15 && Math.abs(g.dy) < 60 && g.x0 < 60;
      },
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) swipePan.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) {
          Animated.timing(swipePan, { toValue: 400, duration: 180, useNativeDriver: true }).start(() => {
            swipePan.setValue(0);
            navigation.goBack();
          });
        } else {
          Animated.spring(swipePan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipePan, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const renderScreen = () => {
    switch (screen) {
      case 'Splash': return <SplashScreen navigation={navigation} />;
      case 'Login': return <LoginScreen navigation={navigation} />;
      case 'Home': return <HomeScreen navigation={navigation} activeNotifs={activeNotifs} clearAllNotifs={clearAllNotifs} isDark={isDark} newVisitsBadge={newVisitsBadge} clearVisitsBadge={() => setNewVisitsBadge(0)} />;
      case 'Properties': return <PropertiesScreen navigation={navigation} route={route} activeNotifs={activeNotifs} clearAllNotifs={clearAllNotifs} isDark={isDark} />;
      case 'Leads': return <LeadsScreen navigation={navigation} activeNotifs={activeNotifs} clearAllNotifs={clearAllNotifs} isDark={isDark} />;
      case 'Profile': return <ProfileScreen navigation={navigation} activeNotifs={activeNotifs} clearAllNotifs={clearAllNotifs} isDark={isDark} toggleTheme={toggleTheme} />;
      case 'PropertyDetail': return <PropertyDetailScreen navigation={navigation} route={route} isDark={isDark} />;
      case 'AddProperty': return <AddPropertyScreen navigation={navigation} isDark={isDark} />;
      case 'LeadChat': return <LeadChatScreen navigation={navigation} route={route} isDark={isDark} />;
      case 'SiteVisits': return <SiteVisitsScreen navigation={navigation} route={route} isDark={isDark} />;
      case 'Reports': return <ReportsScreen navigation={navigation} route={route} isDark={isDark} />;
      default: return <LoginScreen navigation={navigation} />;
    }
  };

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: '#E0AD4D', transform: [{ translateX: swipePan }] }}
      {...panResponder.panHandlers}
    >
      {renderScreen()}
    </Animated.View>
  );
}
