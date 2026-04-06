import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { API_URL } from '../utils/constants';
import { getStoredUserId } from './authService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for notifications not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sos', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('buddy', {
      name: 'Buddy Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Safety Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('checkin', {
      name: 'Safety Check-ins',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  return true;
};

export const registerForPushNotifications = async () => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();

    if (tokenData?.data) {
      const userId = await getStoredUserId();
      try {
        await fetch(`${API_URL}/register-push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            pushToken: tokenData.data,
            platform: Platform.OS,
          }),
        });
      } catch (error) {
        console.log('Failed to register push token with server:', error);
      }
      return tokenData.data;
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
  return null;
};

export const scheduleLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const showSOSNotification = async () => {
  await scheduleLocalNotification(
    '🆘 SOS Alert Sent',
    'Your emergency contacts have been notified with your location.',
    { type: 'sos' }
  );
};

export const showBuddyMatchNotification = async (buddyName) => {
  await scheduleLocalNotification(
    '👥 New Buddy Match!',
    `${buddyName} wants to travel with you. Check your matches!`,
    { type: 'buddy_match' }
  );
};

export const showSafetyAlertNotification = async (alertType, description) => {
  await scheduleLocalNotification(
    `⚠️ ${alertType} Reported`,
    description,
    { type: 'safety_alert' }
  );
};

export const showTripReminderNotification = async () => {
  await scheduleLocalNotification(
    '🚗 Trip Reminder',
    "Don't forget to mark yourself safe after reaching your destination!",
    { type: 'trip_reminder' }
  );
};

export const showCheckInNotification = async (tripId) => {
  await scheduleLocalNotification(
    '🔔 Check-in Required',
    'Are you safe? Tap to confirm your safety.',
    { type: 'checkin', tripId }
  );
};

export const scheduleCheckInReminder = async (tripId, intervalMs = 30 * 60 * 1000) => {
  const checkInId = `checkin-${Date.now()}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Check-in Required',
      body: 'Are you safe? Tap to confirm your safety.',
      data: { type: 'checkin', checkInId, tripId },
      sound: true,
    },
    trigger: {
      seconds: intervalMs / 1000,
      repeats: true,
    },
  });
  return checkInId;
};

export const cancelCheckInReminders = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'checkin') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

export const addNotificationResponseReceivedListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export default {
  requestNotificationPermissions,
  registerForPushNotifications,
  scheduleLocalNotification,
  showSOSNotification,
  showBuddyMatchNotification,
  showSafetyAlertNotification,
  showTripReminderNotification,
  showCheckInNotification,
  scheduleCheckInReminder,
  cancelCheckInReminders,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  cancelAllNotifications,
};
