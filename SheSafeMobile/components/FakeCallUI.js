import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Animated, Easing } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const FakeCallUI = () => {
  const { isIncomingCall, callerName, acceptCall, rejectCall } = useFakeCall();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isIncomingCall) {
      // Slide in from bottom
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Pulse ring effect
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
        slideAnim.setValue(height);
      };
    } else {
      slideAnim.setValue(height);
    }
  }, [isIncomingCall]);

  if (!isIncomingCall) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.headerPattern} />
      
      <View style={styles.content}>
        {/* Pulsing ring */}
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.ringEffect, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.ringEffectOuter, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {callerName ? callerName.charAt(0).toUpperCase() : 'M'}
            </Text>
          </View>
        </View>

        <Text style={styles.callerName}>{callerName || 'Mom'}</Text>
        <Text style={styles.incomingText}>Incoming Call...</Text>

        <View style={styles.callActions}>
          <TouchableOpacity 
            style={styles.rejectButton} 
            onPress={rejectCall}
            activeOpacity={0.7}
          >
            <View style={styles.rejectIconContainer}>
              <Text style={styles.actionIcon}>✕</Text>
            </View>
            <Text style={styles.actionText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.acceptButton} 
            onPress={acceptCall}
            activeOpacity={0.7}
          >
            <View style={styles.acceptIconContainer}>
              <Text style={styles.actionIcon}>✓</Text>
            </View>
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBrand}>
        <Text style={styles.brandText}>📱 SheSafe</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
    zIndex: 9999,
    elevation: 9999,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarText: {
    fontSize: FONTS['5xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  ringEffect: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: COLORS.accentLight,
    zIndex: 1,
  },
  ringEffectOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: COLORS.accentLight,
    zIndex: 0,
  },
  callerName: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  incomingText: {
    fontSize: FONTS.lg,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING['3xl'],
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING['3xl'],
    gap: 80,
  },
  rejectButton: {
    alignItems: 'center',
  },
  acceptButton: {
    alignItems: 'center',
  },
  rejectIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  acceptIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionIcon: {
    fontSize: 28,
    color: COLORS.textInverse,
    fontWeight: FONTS.bold,
  },
  actionText: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONTS.medium,
  },
  bottomBrand: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  brandText: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default FakeCallUI;