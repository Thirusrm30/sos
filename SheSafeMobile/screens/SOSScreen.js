import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import SOSButton from '../components/SOSButton';
import LocationDisplay from '../components/LocationDisplay';
import { getCurrentLocation } from '../services/locationService';
import { sendSOSAlert } from '../services/apiService';
import { COLORS, COUNTDOWN_SECONDS, LOCATION_UPDATE_INTERVAL, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';

const SOSScreen = () => {
  const [sosStatus, setSosStatus] = useState('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sosActive, setSosActive] = useState(false);

  const countdownIntervalRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchLocation = async () => {
    try {
      const pos = await getCurrentLocation();
      if (pos) {
        setLocation(pos);
        setLocationError(null);
      } else {
        setLocationError('Unable to get location. Please enable GPS.');
      }
    } catch (error) {
      setLocationError('Error getting location');
      console.error('Location error:', error);
    }
  };

  const triggerSOS = async (lat, lng) => {
    try {
      setLoading(true);
      setMessage('Sending SOS alert...');

      const result = await sendSOSAlert(lat, lng);

      if (result.success) {
        setMessage('SOS Alert sent successfully!');
        setSosActive(true);
        startLocationUpdates();
      } else {
        setMessage(result.message || 'Failed to send SOS alert');
        setSosActive(false);
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('SOS Error:', error);
      setMessage('Error: Could not connect to server');
      setSosActive(false);
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        const pos = await getCurrentLocation();
        if (pos) {
          await triggerSOS(pos.lat, pos.lng);
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    }, LOCATION_UPDATE_INTERVAL);
  };

  const stopLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    setSosActive(false);
    setMessage('');
  };

  const handleSOSPress = () => {
    Vibration.vibrate(200);

    if (sosActive) {
      stopLocationUpdates();
      setSosStatus('idle');
      setMessage('SOS cancelled');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSosStatus('countdown');
    setCountdown(COUNTDOWN_SECONDS);

    getCurrentLocation()
      .then((pos) => {
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              setSosStatus('sending');
              if (pos) {
                triggerSOS(pos.lat, pos.lng);
              } else {
                triggerSOS(0, 0);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      })
      .catch(() => {
        setSosStatus('countdown');
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              setSosStatus('sending');
              triggerSOS(0, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      });
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSosStatus('idle');
    setCountdown(COUNTDOWN_SECONDS);
    setMessage('SOS cancelled');
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchLocation();
  }, []);

  const getStatusMessage = () => {
    switch (sosStatus) {
      case 'idle':
        return 'Tap the SOS button to send alert';
      case 'countdown':
        return 'Sending alert in...';
      case 'sending':
        return 'Sending SOS Alert...';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ SheSafe</Text>
          <Text style={styles.subtitle}>Women's Safety App</Text>
        </View>

        <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
          <View style={styles.statusSection}>
            {sosStatus === 'idle' && !sosActive && (
              <Text style={styles.statusText}>{getStatusMessage()}</Text>
            )}

            {sosStatus === 'countdown' && (
              <View style={styles.countdownSection}>
                <Text style={styles.countdownLabel}>Sending alert in</Text>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownHint}>Tap CANCEL to stop</Text>
              </View>
            )}

            {(sosStatus === 'sending' || loading) && (
              <View style={styles.sendingSection}>
                <View style={styles.sendingSpinner}>
                  <Text style={styles.sendingIcon}>📡</Text>
                </View>
                <Text style={styles.sendingText}>Sending SOS Alert...</Text>
              </View>
            )}

            {sosActive && sosStatus !== 'sending' && (
              <View style={styles.activeSection}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeIcon}>✓</Text>
                </View>
                <Text style={styles.activeTitle}>SOS ACTIVE</Text>
                <Text style={styles.activeSubtext}>
                  Location updates every 60 seconds
                </Text>
              </View>
            )}

            {message && !sosActive && (
              <Text style={styles.messageText}>{message}</Text>
            )}
          </View>
        </Animated.View>

        <View style={styles.buttonSection}>
          {sosStatus === 'countdown' ? (
            <SOSButton
              onPress={handleCancel}
              isCountdown={true}
              countdownValue={countdown}
            />
          ) : (
            <SOSButton
              onPress={handleSOSPress}
              isActive={sosActive}
            />
          )}
        </View>

        <LocationDisplay
          location={location}
          error={locationError}
          onRefresh={fetchLocation}
          loading={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Stay Safe • SheSafe</Text>
      </View>
    </SafeAreaView>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.base,
  },
  title: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusContainer: {
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    width: '100%',
  },
  statusSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: FONTS.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  countdownSection: {
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.medium,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: FONTS.extrabold,
    color: COLORS.danger,
    lineHeight: 90,
  },
  countdownHint: {
    fontSize: FONTS.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  sendingSection: {
    alignItems: 'center',
  },
  sendingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sendingIcon: {
    fontSize: 28,
  },
  sendingText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.danger,
  },
  activeSection: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 280,
  },
  activeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeBadgeIcon: {
    fontSize: 24,
    color: COLORS.textInverse,
  },
  activeTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.success,
  },
  activeSubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  messageText: {
    fontSize: FONTS.base,
    fontWeight: FONTS.medium,
    color: COLORS.text,
    marginTop: SPACING.base,
    textAlign: 'center',
  },
  buttonSection: {
    marginVertical: SPACING.xl,
  },
  footer: {
    padding: SPACING.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
});

export default SOSScreen;
