import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from './utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused, color }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
  </View>
);

const screenOptions = (bgColor, titleColor = COLORS.textInverse) => ({
  headerStyle: {
    backgroundColor: bgColor,
  },
  headerTintColor: titleColor,
  headerTitleStyle: {
    fontWeight: FONTS.semibold,
  },
  headerShadowVisible: false,
});

const SOSStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.primary)}>
    <Stack.Screen
      name="SOSMain"
      component={SOSScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const TripStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen
      name="StartTrip"
      component={StartTripScreen}
      options={{ title: 'Start Trip', headerShown: false }}
    />
    <Stack.Screen
      name="ActiveTrip"
      component={ActiveTripScreen}
      options={{ title: 'Active Trip', headerShown: false }}
    />
    <Stack.Screen
      name="TripHistory"
      component={TripHistoryScreen}
      options={{ title: 'Trip History' }}
    />
  </Stack.Navigator>
);

const RideStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.info)}>
    <Stack.Screen
      name="RideEntry"
      component={RideEntryScreen}
      options={{ title: 'Ride Verification', headerShown: false }}
    />
    <Stack.Screen
      name="RideHistory"
      component={RideHistoryScreen}
      options={{ title: 'Ride History' }}
    />
  </Stack.Navigator>
);

const CommunityStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.secondary)}>
    <Stack.Screen
      name="CommunityAlerts"
      component={CommunityAlertsScreen}
      options={{ title: 'Community Alerts', headerShown: false }}
    />
  </Stack.Navigator>
);

const BuddyStack = () => (
  <Stack.Navigator screenOptions={screenOptions('#8B5CF6')}>
    <Stack.Screen
      name="FindBuddy"
      component={BuddyScreen}
      options={{ title: 'Find Buddy', headerShown: false }}
    />
    <Stack.Screen
      name="BuddyMatches"
      component={BuddyMatchesScreen}
      options={{ title: 'Buddy Matches' }}
    />
    <Stack.Screen
      name="MyMatches"
      component={MyMatchesScreen}
      options={{ title: 'My Matches' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

const SafeRouteStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen
      name="SafeRouteMain"
      component={SafeRouteScreen}
      options={{ title: 'Safe Routes', headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={screenOptions(COLORS.accent)}>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: 'My Profile', headerShown: false }}
    />
  </Stack.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            paddingBottom: SPACING.xs,
            paddingTop: SPACING.xs,
            height: 65,
            ...SHADOWS.md,
          },
          tabBarLabelStyle: {
            fontSize: FONTS.xs,
            fontWeight: FONTS.medium,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="SOS"
          component={SOSStack}
          options={{
            tabBarLabel: 'SOS',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🆘" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Trip"
          component={TripStack}
          options={{
            tabBarLabel: 'Trip',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🚗" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Ride"
          component={RideStack}
          options={{
            tabBarLabel: 'Ride',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🚕" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityStack}
          options={{
            tabBarLabel: 'Alerts',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⚠️" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Buddy"
          component={BuddyStack}
          options={{
            tabBarLabel: 'Buddy',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="👥" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="SafeRoute"
          component={SafeRouteStack}
          options={{
            tabBarLabel: 'Routes',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🗺️" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="👤" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
});
