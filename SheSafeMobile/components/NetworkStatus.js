import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getNetworkState, subscribeToNetworkState } from '../services/networkService';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/constants';

const NetworkStatus = ({ 
  position = 'top', 
  showWhenOnline = false,
  style,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const state = await getNetworkState();
        if (mounted) {
          const online = state.isConnected;
          setIsOnline(online);
          
          if (!online && !wasOffline) {
            setWasOffline(true);
          } else if (online && wasOffline) {
            setWasOffline(false);
          }
        }
      } catch (error) {
        console.error('Network check error:', error);
      }
    };

    checkNetwork();

    const unsubscribe = subscribeToNetworkState((state) => {
      if (!mounted) return;
      const online = state.isConnected;
      setIsOnline(online);
      
      if (!online && !wasOffline) {
        setWasOffline(true);
      } else if (online && wasOffline) {
        setWasOffline(false);
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [wasOffline]);

  useEffect(() => {
    if ((!isOnline && !showWhenOnline) || (isOnline && showWhenOnline && wasOffline)) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, wasOffline, showWhenOnline]);

  const shouldShow = showWhenOnline 
    ? (isOnline && wasOffline) 
    : !isOnline;

  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        isOnline ? styles.online : styles.offline,
        { opacity: fadeAnim },
        style,
      ]}
    >
      <Text style={styles.icon}>{isOnline ? '📶' : '📵'}</Text>
      <Text style={[styles.text, isOnline ? styles.onlineText : styles.offlineText]}>
        {isOnline ? 'Back Online' : 'Offline Mode'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offline: {
    backgroundColor: '#FEF3C7',
  },
  online: {
    backgroundColor: '#DCFCE7',
  },
  icon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  text: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },
  offlineText: {
    color: '#92400E',
  },
  onlineText: {
    color: '#166534',
  },
});

export default NetworkStatus;
