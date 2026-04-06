import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../utils/constants';

const LoadingSpinner = ({ 
  size = 'medium', // small, medium, large
  color = COLORS.accent,
  text,
  fullScreen = false,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();

    return () => rotation.stop();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const sizeValue = getSizeValue();

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <View style={[styles.spinner, { width: sizeValue, height: sizeValue, borderColor: color }]}>
          <Animated.View style={[styles.spinnerInner, { transform: [{ rotate: spin }] }]} />
        </View>
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.spinner, { width: sizeValue, height: sizeValue, borderColor: color }]}>
        <Animated.View style={[styles.spinnerInner, { transform: [{ rotate: spin }] }]} />
      </View>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.base,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  spinner: {
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  text: {
    marginTop: SPACING.base,
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
  },
});

export default LoadingSpinner;
