import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import QuickFakeCallButton from '../components/QuickFakeCallButton';
import LocationDisplay from '../components/LocationDisplay';
import { getCurrentLocation } from '../services/locationService';
import { sendSOSAlert } from '../services/apiService';
import { getNetworkState, subscribeToNetworkState, isNetworkAvailable } from '../services/networkService';
import { sendSOSViaSMS } from '../services/smsService';
import { storePendingSOS, getUnsyncedSOSCount, clearSyncedSOSEvents, getPendingSOSEvents, markSOSAsSynced } from '../services/offlineSOSStorage';
import { COLORS, COUNTDOWN_SECONDS, LOCATION_UPDATE_INTERVAL, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';

const SOSScreen = () => {
  const [sosStatus, setSosStatus] = useState('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const countdownIntervalRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const unsubscribeNetRef = useRef(null);

  const checkPendingSOS = useCallback(async () => {
    const count = await getUnsyncedSOSCount();
    setPendingCount(count);
  }, []);

  const syncPendingSOS = useCallback(async () => {
    const { isConnected } = await getNetworkState();
    if (!isConnected) return;

    const pending = await getPendingSOSEvents();
    const unsynced = pending.filter(e => !e.synced);

    for (const event of unsynced) {
      try {
        const result = await sendSOSAlert(event.lat, event.lng);
        if (result.success) {
          await markSOSAsSynced(event.id);
          console.log('Synced pending SOS:', event.id);
        }
      } catch (error) {
        console.error('Error syncing pending SOS:', error);
      }
    }
    
    await clearSyncedSOSEvents();
    await checkPendingSOS();
  }, [checkPendingSOS]);

  useEffect(() => {
    const initNetwork = async () => {
      const state = await getNetworkState();
      setIsOffline(!state.isConnected);
      await checkPendingSOS();
    };
    initNetwork();

    unsubscribeNetRef.current = subscribeToNetworkState((state) => {
      const wasOffline = isOffline;
      setIsOffline(!state.isConnected);
      
      if (wasOffline && state.isConnected) {
        syncPendingSOS();
      }
    });

    return () => {
      if (unsubscribeNetRef.current) {
        unsubscribeNetRef.current();
      }
    };
  }, [isOffline, checkPendingSOS, syncPendingSOS]);

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
      
      const networkState = await getNetworkState();
      const isConnected = networkState.isConnected && networkState.isInternetReachable;

      if (isConnected) {
        setMessage('Sending SOS alert...');
        const result = await sendSOSAlert(lat, lng);

        if (result.success) {
          setMessage('SOS Alert sent successfully!');
          setSosActive(true);
          startLocationUpdates();
        } else {
          await handleOfflineSOS(lat, lng);
        }
      } else {
        await handleOfflineSOS(lat, lng);
      }
    } catch (error) {
      console.error('SOS Error:', error);
      await handleOfflineSOS(lat, lng);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineSOS = async (lat, lng) => {
    setMessage('Offline mode: Sending SMS...');
    
    const smsResult = await sendSOSViaSMS(lat, lng);
    
    if (smsResult.success) {
      await storePendingSOS(lat, lng);
      setMessage('Offline mode: SMS sent without live tracking');
      setSosActive(true);
      startOfflineLocationUpdates();
    } else {
      setMessage('Failed to send SOS. No network or SMS unavailable.');
      Alert.alert('SOS Failed', 'Could not send SOS alert. Please try again or use a phone to call emergency services.');
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
          const networkState = await getNetworkState();
          if (networkState.isConnected) {
            await triggerSOS(pos.lat, pos.lng);
          } else {
            stopLocationUpdates();
            setSosActive(false);
            setMessage('Network lost - SMS mode stopped. Tap to retry.');
          }
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    }, LOCATION_UPDATE_INTERVAL);
  };

  const startOfflineLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        const pos = await getCurrentLocation();
        if (pos) {
          await sendSOSViaSMS(pos.lat, pos.lng);
          await storePendingSOS(pos.lat, pos.lng);
          setMessage('Offline mode: SMS sent without live tracking');
        }
      } catch (error) {
        console.error('Offline location update error:', error);
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

  const getNetworkIndicator = () => {
    if (isOffline) {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineIcon}>📵</Text>
          <Text style={styles.offlineText}>OFFLINE MODE</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>SheSafe</Text>
          <Text style={styles.subtitle}>Women's Safety App</Text>
        </View>

        {getNetworkIndicator()}

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
                  <Text style={styles.sendingIcon}>{isOffline ? '📵' : '📡'}</Text>
                </View>
                <Text style={styles.sendingText}>
                  {isOffline ? 'Sending via SMS...' : 'Sending SOS Alert...'}
                </Text>
              </View>
            )}

            {sosActive && sosStatus !== 'sending' && (
              <View style={[styles.activeSection, isOffline && styles.activeSectionOffline]}>
                <View style={[styles.activeBadge, isOffline && styles.activeBadgeOffline]}>
                  <Text style={styles.activeBadgeIcon}>{isOffline ? '📱' : '✓'}</Text>
                </View>
                <Text style={[styles.activeTitle, isOffline && styles.activeTitleOffline]}>
                  SOS ACTIVE
                </Text>
                <Text style={styles.activeSubtext}>
                  {isOffline 
                    ? 'SMS sent without live tracking'
                    : 'Location updates every 60 seconds'
                  }
                </Text>
              </View>
            )}

            {message && !sosActive && (
              <Text style={[styles.messageText, isOffline && styles.messageTextOffline]}>
                {message}
              </Text>
            )}

            {pendingCount > 0 && isOffline && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>
                  {pendingCount} pending sync
                </Text>
              </View>
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
          <View style={styles.quickActionsRow}>
            <QuickFakeCallButton />
          </View>
        </View>

        <LocationDisplay
          location={location}
          error={locationError}
          onRefresh={fetchLocation}
          loading={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Stay Safe - SheSafe</Text>
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
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  offlineText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: '#92400E',
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
  activeSectionOffline: {
    backgroundColor: '#FEF3C7',
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
  activeBadgeOffline: {
    backgroundColor: '#F59E0B',
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
  activeTitleOffline: {
    color: '#92400E',
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
  messageTextOffline: {
    color: '#92400E',
  },
  pendingBadge: {
    marginTop: SPACING.md,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  pendingText: {
    fontSize: FONTS.sm,
    color: '#4338CA',
    fontWeight: FONTS.medium,
  },
  buttonSection: {
    marginVertical: SPACING.xl,
    alignItems: 'center',
  },
  quickActionsRow: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
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