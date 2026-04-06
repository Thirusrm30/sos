import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import { FakeCallProvider } from './context/FakeCallContext';
import { addNotificationResponseReceivedListener } from './services/notificationService';
import { confirmCheckIn } from './services/checkInService';
import LoginScreen from './screens/LoginScreen';
import SOSScreen from './screens/SOSScreen';
import StartTripScreen from './screens/StartTripScreen';
import ActiveTripScreen from './screens/ActiveTripScreen';
import TripHistoryScreen from './screens/TripHistoryScreen';
import RideEntryScreen from './screens/RideEntryScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';
import CommunityAlertsScreen from './screens/CommunityAlertsScreen';
import BuddyScreen from './screens/BuddyScreen';
import BuddyMatchesScreen, { MyMatchesScreen } from './screens/BuddyMatchesScreen';
import ChatScreen from './screens/ChatScreen';
import SafeRouteScreen from './screens/SafeRouteScreen';
import ProfileScreen from './screens/ProfileScreen';
import FakeCallScreen from './screens/FakeCallScreen';
import FakeCallActiveScreen from './screens/FakeCallActiveScreen';
import FakeCallUI from './components/FakeCallUI';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from './utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.accent,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
  },
};

const TabIcon = ({ icon, focused, label }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
    {focused && (
      <View style={styles.tabIndicator} />
    )}
  </View>
);

const screenOptions = (bgColor, titleColor = COLORS.textInverse) => ({
  headerStyle: { 
    backgroundColor: bgColor,
  },
  headerTintColor: titleColor,
  headerTitleStyle: { 
    fontWeight: FONTS.semibold,
    fontSize: FONTS.base,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: COLORS.background },
});

const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const SOSStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.primary, COLORS.textInverse)}>
    <Stack.Screen 
      name="SOSMain" 
      component={SOSScreen} 
      options={{ 
        headerShown: false,
      }} 
    />
  </Stack.Navigator>
);

const TripStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen 
      name="StartTrip" 
      component={StartTripScreen} 
      options={{ 
        headerShown: false,
        title: 'Start Trip',
      }} 
    />
    <Stack.Screen 
      name="ActiveTrip" 
      component={ActiveTripScreen} 
      options={{ 
        headerShown: false,
        title: 'Active Trip',
      }} 
    />
    <Stack.Screen 
      name="TripHistory" 
      component={TripHistoryScreen} 
      options={{ 
        title: 'Trip History',
        headerShown: true,
      }} 
    />
  </Stack.Navigator>
);

const RideStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.info)}>
    <Stack.Screen 
      name="RideEntry" 
      component={RideEntryScreen} 
      options={{ 
        headerShown: false,
        title: 'Ride Verification',
      }} 
    />
    <Stack.Screen 
      name="RideHistory" 
      component={RideHistoryScreen} 
      options={{ 
        title: 'Ride History',
        headerShown: true,
      }} 
    />
  </Stack.Navigator>
);

const CommunityStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.secondary)}>
    <Stack.Screen 
      name="CommunityAlerts" 
      component={CommunityAlertsScreen} 
      options={{ 
        headerShown: false,
        title: 'Community Alerts',
      }} 
    />
  </Stack.Navigator>
);

const BuddyStack = () => (
  <Stack.Navigator screenOptions={screenOptions('#8B5CF6')}>
    <Stack.Screen 
      name="FindBuddy" 
      component={BuddyScreen} 
      options={{ 
        headerShown: false,
        title: 'Find Buddy',
      }} 
    />
    <Stack.Screen 
      name="BuddyMatches" 
      component={BuddyMatchesScreen} 
      options={{ 
        title: 'Buddy Matches',
        headerShown: true,
      }} 
    />
    <Stack.Screen 
      name="MyMatches" 
      component={MyMatchesScreen} 
      options={{ 
        title: 'My Matches',
        headerShown: true,
      }} 
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={{ 
        title: 'Chat',
        headerShown: true,
      }} 
    />
  </Stack.Navigator>
);

const SafeRouteStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen 
      name="SafeRouteMain" 
      component={SafeRouteScreen} 
      options={{ 
        headerShown: false,
        title: 'Safe Routes',
      }} 
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ 
        headerShown: false,
        title: 'Profile',
      }} 
    />
  </Stack.Navigator>
);

const FakeCallStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.secondary)}>
    <Stack.Screen 
      name="FakeCallMain" 
      component={FakeCallScreen} 
      options={{ 
        headerShown: false,
        title: 'Fake Call',
      }} 
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 0,
        paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xs,
        paddingTop: SPACING.xs,
        height: Platform.OS === 'ios' ? 85 : 65,
        ...SHADOWS.md,
      },
      tabBarLabelStyle: { 
        fontSize: FONTS.xs, 
        fontWeight: FONTS.medium,
        marginTop: 2,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="SOS"
      component={SOSStack}
      options={{
        tabBarLabel: 'SOS',
        tabBarIcon: ({ focused }) => <TabIcon icon="🆘" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Trip"
      component={TripStack}
      options={{
        tabBarLabel: 'Trip',
        tabBarIcon: ({ focused }) => <TabIcon icon="🚗" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Ride"
      component={RideStack}
      options={{
        tabBarLabel: 'Ride',
        tabBarIcon: ({ focused }) => <TabIcon icon="🚕" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Community"
      component={CommunityStack}
      options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: ({ focused }) => <TabIcon icon="⚠️" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Buddy"
      component={BuddyStack}
      options={{
        tabBarLabel: 'Buddy',
        tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="SafeRoute"
      component={SafeRouteStack}
      options={{
        tabBarLabel: 'Routes',
        tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="FakeCall"
      component={FakeCallStack}
      options={{
        tabBarLabel: 'Fake Call',
        tabBarIcon: ({ focused }) => <TabIcon icon="📞" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading SheSafe...</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={theme}>
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      <FakeCallUI />
      <FakeCallActiveScreen />
    </>
  );
};

const App = () => {
  useEffect(() => {
    let subscription;
    
    const setupNotifications = async () => {
      try {
        subscription = addNotificationResponseReceivedListener((response) => {
          try {
            const data = response.notification?.request?.content?.data;
            
            if (data?.type === 'checkin') {
              const tripId = data.tripId;
              confirmCheckIn(tripId || 'unknown').then(() => {
                Alert.alert('✅ Safety Confirmed', 'You have confirmed your safety.');
              }).catch(err => {
                console.log('Check-in confirmation error:', err);
              });
            }
          } catch (error) {
            console.error('Notification error:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <FakeCallProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <AppNavigator />
      </FakeCallProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
});

export default App;
