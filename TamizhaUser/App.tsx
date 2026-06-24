import 'react-native-gesture-handler';
import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import MainNavigator from './app/navigation/MainNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

const linking = {
  prefixes: ['tamizha://'],
  config: {
    screens: {
      PropertyDetails: 'property/:propertyId',
      Dashboard: 'dashboard',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <MainNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
