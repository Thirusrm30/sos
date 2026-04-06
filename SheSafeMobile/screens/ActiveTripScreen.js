import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
  Vibration,
  Animated,
} from 'react-native';
import { COLORS, LOCATION_UPDATE_INTERVAL, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { updateTripLocation, markTripSafe, getTripDetails } from '../services/tripService';
import { confirmCheckIn, sendCheckInStatus } from '../services/checkInService';
import { showCheckInNotification, requestNotificationPermissions, cancelCheckInReminders } from '../services/notificationService';
import { sendSOSAlert } from '../services/apiService';

const LOCATION_UPDATE_INTERVAL_MOBILE = 15000;
const CHECKIN_INTERVAL = 30 * 60 * 1000;
const MAX_MISSED_CHECKINS = 2;

const ActiveTripScreen = ({ route, navigation }) => {
  const { tripId, trackingLink, destination } = route.params;

  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [eta, setEta] = useState(null);
  const [isMarkedSafe, setIsMarkedSafe] = useState(false);
  
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [missedCheckIns, setMissedCheckIns] = useState(0);
  const [nextCheckInTime, setNextCheckInTime] = useState(null);
  const [checkInEnabled, setCheckInEnabled] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationIntervalRef = useRef(null);
  const checkStatusIntervalRef = useRef(null);
  const checkInTimerRef = useRef(null);
  const nextCheckInTimerRef = useRef(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    initializeCheckIn();
    fetchAndUpdateLocation();
    locationIntervalRef.current = setInterval(fetchAndUpdateLocation, LOCATION_UPDATE_INTERVAL_MOBILE);
    checkStatusIntervalRef.current = setInterval(checkTripStatus, 60000);
    fetchTripDetails();

    return () => {
      cleanupTimers();
    };
  }, []);

  const cleanupTimers = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    if (checkStatusIntervalRef.current) clearInterval(checkStatusIntervalRef.current);
    if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    if (nextCheckInTimerRef.current) clearTimeout(nextCheckInTimerRef.current);
  };

  const initializeCheckIn = async () => {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      setCheckInEnabled(true);
      startCheckInTimer();
    }
  };

  const startCheckInTimer = () => {
    const scheduleNextCheckIn = () => {
      setNextCheckInTime(Date.now() + CHECKIN_INTERVAL);
      
      if (nextCheckInTimerRef.current) clearTimeout(nextCheckInTimerRef.current);
      nextCheckInTimerRef.current = setTimeout(() => {
        handleMissedCheckIn();
      }, CHECKIN_INTERVAL);
    };

    showCheckInNotification(tripId);
    scheduleNextCheckIn();

    if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    checkInTimerRef.current = setInterval(() => {
      showCheckInNotification(tripId);
      scheduleNextCheckIn();
    }, CHECKIN_INTERVAL);
  };

  const handleCheckInConfirm = useCallback(async () => {
    try {
      setLastCheckIn(new Date());
      setMissedCheckIns(0);
      
      await confirmCheckIn(tripId);
      
      Alert.alert(
        '✅ Check-in Confirmed',
        'You are safe. Next check-in in 30 minutes.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Check-in confirm error:', error);
    }
  }, [tripId]);

  const handleMissedCheckIn = useCallback(async () => {
    const newMissedCount = missedCheckIns + 1;
    setMissedCheckIns(newMissedCount);
    
    await sendCheckInStatus(tripId, 'missed', newMissedCount);
    
    if (newMissedCount >= MAX_MISSED_CHECKINS) {
      Alert.alert(
        '⚠️ Safety Alert',
        'You have missed 2 check-ins. Sending SOS alert to your emergency contacts.',
        [{ text: 'OK' }]
      );
      
      if (currentLocation) {
        await sendSOSAlert(currentLocation.lat, currentLocation.lng);
      } else {
        await sendSOSAlert(0, 0);
      }
      
      cleanupTimers();
      await cancelCheckInReminders();
    } else {
      Alert.alert(
        '⏰ Check-in Missed',
        `You missed 1 check-in. ${MAX_MISSED_CHECKINS - newMissedCount} more missed check-in(s) will trigger SOS.`,
        [{ text: 'OK' }]
      );
    }
  }, [tripId, missedCheckIns, currentLocation]);

  const fetchTripDetails = async () => {
    try {
      const result = await getTripDetails(tripId);
      if (result.success && result.trip) {
        setEta(new Date(result.trip.eta));
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
    }
  };

  const fetchAndUpdateLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setLocationError(null);
        await updateTripLocation(tripId, location.lat, location.lng);
      } else {
        setLocationError('Unable to get location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationError('Error updating location');
    }
  };

  const checkTripStatus = async () => {
    try {
      const result = await getTripDetails(tripId);
      if (result.success && result.trip) {
        if (result.trip.isMarkedSafe) {
          setIsMarkedSafe(true);
          Alert.alert(
            'Trip Marked Safe',
            'This trip has been marked as safe.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking trip status:', error);
    }
  };

  const handleMarkSafe = async () => {
    Alert.alert(
      '🛡️ Mark as Safe',
      'Are you sure you want to end this trip and mark yourself as safe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I\'m Safe',
          onPress: async () => {
            setLoading(true);
            try {
              cleanupTimers();
              await cancelCheckInReminders();
              
              const result = await markTripSafe(tripId);
              if (result.success) {
                Vibration.vibrate([0, 500, 200, 500]);
                Alert.alert(
                  '✅ Safe!',
                  'You have been marked as safe.\n\nYour contacts have been notified.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Error marking safe:', error);
              Alert.alert('Error', 'Failed to mark as safe. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleManualCheckIn = () => {
    Alert.alert(
      '🔔 Confirm Safety',
      'Tap to confirm you are safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I\'m Safe', onPress: handleCheckInConfirm },
      ]
    );
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `I'm traveling to ${destination}. Track my trip here: ${trackingLink}`,
        title: 'SheSafe Trip Tracking',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenMap = () => {
    if (currentLocation) {
      const url = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
      Linking.openURL(url);
    }
  };

  const getTimeRemaining = () => {
    if (!eta) return 'Calculating...';
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    if (diff <= 0) return 'ETA passed!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes} minutes remaining`;
  };

  const getTimeUntilCheckIn = () => {
    if (!nextCheckInTime) return '--';
    const remaining = nextCheckInTime - Date.now();
    if (remaining <= 0) return 'Now';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCheckInStatusColor = () => {
    if (missedCheckIns === 0) return COLORS.success;
    if (missedCheckIns === 1) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.statusDot}>🟢</Text>
          <Text style={styles.title}>Trip Active</Text>
          <Text style={styles.destination}>To: {destination}</Text>
        </Animated.View>

        <View style={styles.checkInCard}>
          <View style={styles.checkInHeader}>
            <Text style={styles.cardTitle}>🔔 Safe Check-in</Text>
            {checkInEnabled && (
              <TouchableOpacity onPress={handleManualCheckIn}>
                <Text style={styles.checkInButton}>Check In Now</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {checkInEnabled ? (
            <View style={styles.checkInContent}>
              <View style={styles.checkInRow}>
                <View style={styles.checkInItem}>
                  <Text style={styles.checkInLabel}>Next check-in</Text>
                  <Text style={styles.checkInValue}>{getTimeUntilCheckIn()}</Text>
                </View>
                <View style={styles.checkInItem}>
                  <Text style={styles.checkInLabel}>Missed</Text>
                  <Text style={[styles.checkInValue, { color: getCheckInStatusColor() }]}>
                    {missedCheckIns} / {MAX_MISSED_CHECKINS}
                  </Text>
                </View>
              </View>
              
              {lastCheckIn && (
                <Text style={styles.lastCheckInText}>
                  Last confirmed: {lastCheckIn.toLocaleTimeString()}
                </Text>
              )}
              
              {missedCheckIns > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ {missedCheckIns} check-in(s) missed. {MAX_MISSED_CHECKINS - missedCheckIns} more will trigger SOS!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.checkInDisabled}>
              Enable notifications to receive check-in reminders
            </Text>
          )}
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>⏱️</Text>
              <View>
                <Text style={styles.statusLabel}>ETA</Text>
                <Text style={styles.statusValue}>{getTimeRemaining()}</Text>
              </View>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>📍</Text>
              <View>
                <Text style={styles.statusLabel}>Updates</Text>
                <Text style={styles.statusValue}>Every 15s</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.cardTitle}>Your Location</Text>
            <TouchableOpacity onPress={handleOpenMap} style={styles.mapButton}>
              <Text style={styles.mapButtonText}>View Map →</Text>
            </TouchableOpacity>
          </View>
          {locationError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {locationError}</Text>
            </View>
          ) : currentLocation ? (
            <Text style={styles.coordinates}>
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </Text>
          ) : (
            <ActivityIndicator color={COLORS.accent} />
          )}
        </View>

        <View style={styles.shareCard}>
          <Text style={styles.cardTitle}>🔗 Share Tracking Link</Text>
          <Text style={styles.linkText} numberOfLines={1}>
            {trackingLink}
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
            <Text style={styles.shareButtonText}>📤 Share with Contacts</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={styles.safeButtonContainer}>
          <TouchableOpacity
            style={[styles.safeButton, loading && styles.safeButtonDisabled]}
            onPress={handleMarkSafe}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Text style={styles.safeButtonIcon}>✓</Text>
                <Text style={styles.safeButtonText}>Mark Safe & End Trip</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚠️ If you don't check in or mark safe within 1 hour of ETA, an automatic alert will be sent.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.base,
  },
  statusDot: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  destination: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  checkInCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  checkInButton: {
    color: COLORS.accent,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },
  checkInContent: {},
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkInItem: {
    alignItems: 'center',
  },
  checkInLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  checkInValue: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  lastCheckInText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginTop: SPACING.sm,
  },
  warningText: {
    fontSize: FONTS.xs,
    color: '#92400E',
    textAlign: 'center',
  },
  checkInDisabled: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  statusDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statusLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  statusValue: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  locationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mapButton: {
    padding: SPACING.xs,
  },
  mapButtonText: {
    color: COLORS.accent,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },
  coordinates: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
    borderRadius: RADIUS.base,
  },
  errorText: {
    fontSize: FONTS.sm,
    color: COLORS.danger,
  },
  shareCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  linkText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  shareButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.textInverse,
    fontWeight: FONTS.semibold,
  },
  safeButtonContainer: {
    marginVertical: SPACING.base,
  },
  safeButton: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  safeButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  safeButtonIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  safeButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: '#92400E',
    lineHeight: 20,
  },
});

export default ActiveTripScreen;