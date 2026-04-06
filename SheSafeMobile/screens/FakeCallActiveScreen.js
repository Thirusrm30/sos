import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Easing } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/constants';

const FakeCallActiveScreen = () => {
  const { callerName, callDuration, endCall, isCallActive } = useFakeCall();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCallActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isCallActive]);

  if (!isCallActive) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.headerPattern} />
      
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatar, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.avatarText}>
              {callerName ? callerName.charAt(0).toUpperCase() : 'M'}
            </Text>
          </Animated.View>
        </View>

        <Text style={styles.callerName}>{callerName || 'Mom'}</Text>
        <Text style={styles.callStatus}>{formatDuration(callDuration)}</Text>

        <View style={styles.callInfo}>
          <View style={styles.callBadge}>
            <Text style={styles.callBadgeText}>📞 Connected</Text>
          </View>
        </View>

        <View style={styles.muteOptions}>
          <TouchableOpacity style={styles.muteButton} activeOpacity={0.7}>
            <View style={styles.muteIconContainer}>
              <Text style={styles.muteIcon}>🔇</Text>
            </View>
            <Text style={styles.muteText}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.muteButton} activeOpacity={0.7}>
            <View style={styles.muteIconContainer}>
              <Text style={styles.muteIcon}>🔊</Text>
            </View>
            <Text style={styles.muteText}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.muteButton} activeOpacity={0.7}>
            <View style={styles.muteIconContainer}>
              <Text style={styles.muteIcon}>⏸️</Text>
            </View>
            <Text style={styles.muteText}>Hold</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.endCallButton} 
          onPress={endCall}
          activeOpacity={0.7}
        >
          <View style={styles.endCallButtonInner}>
            <Text style={styles.endCallIcon}>📵</Text>
          </View>
          <Text style={styles.endCallText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    height: 200,
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS['4xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  callerName: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  callStatus: {
    fontSize: FONTS['2xl'],
    color: COLORS.success,
    marginBottom: SPACING.base,
    fontWeight: FONTS.medium,
    fontVariant: ['tabular-nums'],
  },
  callInfo: {
    marginBottom: SPACING.xl,
  },
  callBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  callBadgeText: {
    fontSize: FONTS.base,
    color: COLORS.success,
    fontWeight: FONTS.medium,
  },
  muteOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING['3xl'],
    marginBottom: SPACING['3xl'],
  },
  muteButton: {
    alignItems: 'center',
  },
  muteIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  muteIcon: {
    fontSize: 24,
  },
  muteText: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FONTS.medium,
  },
  endCallButton: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  endCallButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  endCallIcon: {
    fontSize: 30,
  },
  endCallText: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONTS.medium,
  },
});

export default FakeCallActiveScreen;