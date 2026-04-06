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
  Easing,
  InteractionManager,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const unsubscribeNetRef = useRef(null);
  const locationRef = useRef(null);
  const mountedRef = useRef(true);
  const messageTimerRef = useRef(null);

  const checkPendingSOS = useCallback(async () => {
    try {
      const count = await getUnsyncedSOSCount();
      if (mountedRef.current) setPendingCount(count);
    } catch (error) {
      console.log('Error checking pending SOS:', error);
    }
  }, []);

  const syncPendingSOS = useCallback(async () => {
    try {
      const { isConnected } = await getNetworkState();
      if (!isConnected) return;

      const pending = await getPendingSOSEvents();
      const unsynced = pending.filter(e => !e.synced);

      for (const event of unsynced) {
        try {
          const result = await sendSOSAlert(event.lat, event.lng);
          if (result.success) {
            await markSOSAsSynced(event.id);
          }
        } catch (error) {
          console.error('Error syncing pending SOS:', error);
        }
      }
      
      await clearSyncedSOSEvents();
      await checkPendingSOS();
    } catch (error) {
      console.error('Error in syncPendingSOS:', error);
    }
  }, [checkPendingSOS]);

  // Network initialization - run once
  useEffect(() => {
    mountedRef.current = true;
    let isOfflineLocal = false;

    const initNetwork = async () => {
      try {
        const state = await getNetworkState();
        if (mountedRef.current) {
          isOfflineLocal = !state.isConnected;
          setIsOffline(!state.isConnected);
          await checkPendingSOS();
        }
      } catch (error) {
        console.error('Network init error:', error);
      }
    };
    
    initNetwork();

    unsubscribeNetRef.current = subscribeToNetworkState((state) => {
      if (!mountedRef.current) return;
      const wasOffline = isOfflineLocal;
      isOfflineLocal = !state.isConnected;
      setIsOffline(!state.isConnected);
      
      // Sync when coming back online
      if (wasOffline && state.isConnected) {
        syncPendingSOS();
      }
    });

    return () => {
      mountedRef.current = false;
      if (unsubscribeNetRef.current) {
        unsubscribeNetRef.current();
      }
    };
  }, []); // Empty deps - run once

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const fetchLocation = useCallback(async () => {
    try {
      const pos = await getCurrentLocation();
      if (pos && mountedRef.current) {
        setLocation(pos);
        locationRef.current = pos;
        setLocationError(null);
      } else if (mountedRef.current) {
        setLocationError('Unable to get location. Please enable GPS.');
      }
    } catch (error) {
      if (mountedRef.current) {
        setLocationError('Error getting location');
      }
      console.error('Location error:', error);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const triggerSOS = useCallback(async (lat, lng) => {
    if (!mountedRef.current) return;
    setLoading(true);
    setMessage('Sending SOS alert...');
    
    try {
      const networkState = await getNetworkState();
      const isConnected = networkState.isConnected && networkState.isInternetReachable;

      if (isConnected) {
        const result = await sendSOSAlert(lat, lng);

        if (result.success) {
          if (mountedRef.current) {
            setMessage('SOS Alert sent successfully!');
            setSosActive(true);
            startLocationUpdates();
          }
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
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleOfflineSOS = useCallback(async (lat, lng) => {
    if (!mountedRef.current) return;
    setMessage('Offline mode: Sending SMS...');
    
    try {
      const smsResult = await sendSOSViaSMS(lat, lng);
      
      if (smsResult.success) {
        await storePendingSOS(lat, lng);
        if (mountedRef.current) {
          setMessage('Offline mode: SMS sent without live tracking');
          setSosActive(true);
          startOfflineLocationUpdates();
        }
      } else {
        if (mountedRef.current) {
          setMessage('Failed to send SOS. No network or SMS unavailable.');
          Alert.alert('SOS Failed', 'Could not send SOS alert. Please try again or use a phone to call emergency services.');
        }
      }
    } catch (error) {
      console.error('Offline SOS error:', error);
      if (mountedRef.current) {
        setMessage('Failed to send SOS. Please try again.');
      }
    }
  }, []);

  const startLocationUpdates = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        const pos = await getCurrentLocation();
        if (pos) {
          const networkState = await getNetworkState();
          if (networkState.isConnected) {
            await sendSOSAlert(pos.lat, pos.lng);
          } else {
            if (mountedRef.current) {
              stopLocationUpdates();
              setSosActive(false);
              setMessage('Network lost - SMS mode stopped. Tap to retry.');
            }
          }
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    }, LOCATION_UPDATE_INTERVAL);
  }, []);

  const startOfflineLocationUpdates = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        const pos = await getCurrentLocation();
        if (pos) {
          await sendSOSViaSMS(pos.lat, pos.lng);
          await storePendingSOS(pos.lat, pos.lng);
          if (mountedRef.current) {
            setMessage('Offline mode: SMS sent without live tracking');
          }
        }
      } catch (error) {
        console.error('Offline location update error:', error);
      }
    }, LOCATION_UPDATE_INTERVAL);
  }, []);

  const stopLocationUpdates = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    setSosActive(false);
    setMessage('');
  }, []);

  // ===== KEY FIX: SOS press triggers countdown INSTANTLY =====
  const handleSOSPress = useCallback(() => {
    // Haptic feedback immediately
    Vibration.vibrate(200);

    if (sosActive) {
      stopLocationUpdates();
      setSosStatus('idle');
      setMessage('SOS cancelled');
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setMessage('');
          setCountdown(COUNTDOWN_SECONDS);
        }
      }, 3000);
      return;
    }

    // START COUNTDOWN IMMEDIATELY - don't wait for location
    setSosStatus('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    setMessage('');

    // Fetch location in parallel (non-blocking)
    getCurrentLocation()
      .then((pos) => {
        if (pos && mountedRef.current) {
          locationRef.current = pos;
        }
      })
      .catch(() => {
        // Location fetch failed - will use last known or (0,0)
      });

    // Start countdown timer immediately - no waiting
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setSosStatus('sending');
          
          const loc = locationRef.current;
          if (loc) {
            triggerSOS(loc.lat, loc.lng);
          } else {
            triggerSOS(0, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sosActive, stopLocationUpdates, triggerSOS]);

  const handleCancel = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSosStatus('idle');
    setCountdown(COUNTDOWN_SECONDS);
    setMessage('SOS cancelled');
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setMessage('');
    }, 3000);
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
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
        {/* Header - properly aligned */}
        <View style={styles.header}>
          <Text style={styles.title}>SheSafe</Text>
          <Text style={styles.subtitle}>Women's Safety App</Text>
        </View>

        {getNetworkIndicator()}

        {/* Status section - fixed height to prevent layout jump */}
        <View style={styles.statusContainer}>
          <View style={styles.statusSection}>
            {sosStatus === 'idle' && !sosActive && (
              <Text style={styles.statusText}>{getStatusMessage()}</Text>
            )}

            {sosStatus === 'countdown' && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.countdownSection}>
                  <Text style={styles.countdownLabel}>Sending alert in</Text>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                  <Text style={styles.countdownHint}>Tap CANCEL to stop</Text>
                </View>
              </Animated.View>
            )}

            {(sosStatus === 'sending' || loading) && (
              <View style={styles.sendingSection}>
                <Animated.View 
                  style={[styles.sendingSpinner, { transform: [{ scale: pulseAnim }] }]}
                >
                  <Text style={styles.sendingIcon}>{isOffline ? '📵' : '📡'}</Text>
                </Animated.View>
                <Text style={styles.sendingText}>
                  {isOffline ? 'Sending via SMS...' : 'Sending SOS Alert...'}
                </Text>
              </View>
            )}

            {sosActive && sosStatus !== 'sending' && (
              <Animated.View style={[styles.activeSection, isOffline && styles.activeSectionOffline, { transform: [{ scale: pulseAnim }] }]}>
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
              </Animated.View>
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
        </View>

        {/* SOS Button - centered */}
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
          
          {/* Quick actions - properly aligned below SOS button */}
          <View style={styles.quickActionsRow}>
            <QuickFakeCallButton style={styles.quickCallBtn} />
          </View>
        </View>

        {/* Location display at bottom */}
        <LocationDisplay
          location={location}
          error={locationError}
          onRefresh={fetchLocation}
          loading={loading}
        />
      </View>

      {/* Footer - properly aligned */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Stay Safe — SheSafe</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    width: '100%',
  },
  title: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    alignSelf: 'center',
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
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    width: '100%',
  },
  statusSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: FONTS.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  countdownSection: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  countdownLabel: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.medium,
    color: COLORS.danger,
    marginBottom: SPACING.xs,
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: FONTS.extrabold,
    color: COLORS.danger,
    lineHeight: 100,
  },
  countdownHint: {
    fontSize: FONTS.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sendingSection: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  sendingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sendingIcon: {
    fontSize: 36,
  },
  sendingText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.danger,
  },
  activeSection: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 300,
  },
  activeSectionOffline: {
    backgroundColor: '#FEF3C7',
  },
  activeBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  activeBadgeOffline: {
    backgroundColor: '#F59E0B',
  },
  activeBadgeIcon: {
    fontSize: 28,
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
    marginVertical: SPACING.sm,
    alignItems: 'center',
    width: '100%',
  },
  quickActionsRow: {
    marginTop: SPACING.md,
    alignItems: 'center',
    width: '100%',
  },
  quickCallBtn: {
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  footer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
  },
});

export default SOSScreen;