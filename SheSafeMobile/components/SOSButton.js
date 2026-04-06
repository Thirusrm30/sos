import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing, Vibration } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../utils/constants';

const SOSButton = ({ onPress, isActive, isCountdown, countdownValue }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive && !isCountdown) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
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
  }, [isActive, isCountdown]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Vibration.vibrate(100);
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

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={getButtonStyles()}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {isCountdown ? (
            <>
              <Text style={styles.countdownText}>{countdownValue}</Text>
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
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
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
    borderWidth: 6,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 48,
    fontWeight: FONTS.extrabold,
    color: COLORS.textInverse,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: FONTS.extrabold,
    color: COLORS.primary,
  },
  subText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    letterSpacing: 1,
  },
  subTextLight: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    color: COLORS.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
});

export default SOSButton;
