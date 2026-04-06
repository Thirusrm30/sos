import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING, SHADOWS, RADIUS } from '../utils/constants';

const QuickFakeCallButton = ({ style }) => {
  const { setCallerName, setIsIncomingCall, playRingtone, triggerVibration } = useFakeCall();

  const handleQuickCall = useCallback(() => {
    try {
      setCallerName('Mom');
      setIsIncomingCall(true);
      // Fire and forget - don't let async errors crash the UI
      playRingtone().catch(() => {});
      triggerVibration();
    } catch (error) {
      console.log('Quick call error:', error);
      // Still try to show the call screen even if sound fails
      setIsIncomingCall(true);
    }
  }, [setCallerName, setIsIncomingCall, playRingtone, triggerVibration]);

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handleQuickCall}
      activeOpacity={0.7}
      accessibilityLabel="Quick fake call"
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📞</Text>
      </View>
      <Text style={styles.text}>Quick Call</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: RADIUS.full,
    minHeight: 52,
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    letterSpacing: 0.5,
  },
});

export default QuickFakeCallButton;