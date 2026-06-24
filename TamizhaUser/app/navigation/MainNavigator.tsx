import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FilterScreen from '../screens/FilterScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ChatScreen from '../screens/ChatScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SavedPropertiesScreen from '../screens/SavedPropertiesScreen';
import AllListingsScreen from '../screens/AllListingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      gestureEnabled: false,
      animationEnabled: true,
    }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      {/* Detail screens — swipe back OK */}
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="Explore" component={ExploreScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="Filter" component={FilterScreen} options={{ presentation: 'modal', gestureEnabled: true }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="SavedProperties" component={SavedPropertiesScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="AllListings" component={AllListingsScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ gestureEnabled: true, gestureResponseDistance: 80 }} />
    </Stack.Navigator>
  );
}
