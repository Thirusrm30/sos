import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing, Vibration, View, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../utils/constants';

const SOSButton = ({ onPress, isActive, isCountdown, countdownValue }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive && !isCountdown) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, isCountdown, pulseAnim]);

  useEffect(() => {
    if (isCountdown && countdownValue > 0) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isCountdown, countdownValue, rotateAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    Vibration.vibrate(50);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Vibration.vibrate(150);
    onPress();
  };

  const getButtonStyles = () => {
    if (isCountdown) {
      return [styles.button, styles.countdownButton];
    }
    if (isActive) {
      return [styles.button, styles.activeButton];
    }
    return [styles.button, styles.idleButton];
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Animated.View 
        style={[
          { transform: [{ scale: scaleAnim }] },
          isCountdown && countdownValue > 0 && { transform: [{ rotate: spin }] }
        ]}
      >
        <TouchableOpacity
          style={getButtonStyles()}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={isActive ? 'Stop SOS' : 'Activate SOS'}
          accessibilityRole="button"
        >
          {isCountdown ? (
            <>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{countdownValue}</Text>
              </View>
              <Text style={styles.subTextLight}>TAP TO CANCEL</Text>
            </>
          ) : (
            <>
              <Text style={styles.buttonText}>
                {isActive ? '✓' : 'SOS'}
              </Text>
              <Text style={styles.subText}>
                {isActive ? 'TAP TO STOP' : 'TAP FOR HELP'}
              </Text>
              {!isActive && (
                <View style={styles.ringIndicator} />
              )}
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sos,
  },
  idleButton: {
    backgroundColor: COLORS.primary,
  },
  activeButton: {
    backgroundColor: COLORS.success,
  },
  countdownButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 8,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 56,
    fontWeight: FONTS.extrabold,
    color: COLORS.textInverse,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: FONTS.extrabold,
    color: COLORS.primary,
  },
  subText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subTextLight: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ringIndicator: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default SOSButton;
