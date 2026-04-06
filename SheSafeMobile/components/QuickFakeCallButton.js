import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING, SHADOWS } from '../utils/constants';

const QuickFakeCallButton = ({ style }) => {
  const { playRingtone, stopRingtone, triggerVibration, setCallerName, setIsIncomingCall } = useFakeCall();

  const handleQuickCall = () => {
    setCallerName('Mom');
    setIsIncomingCall(true);
    playRingtone();
    triggerVibration();
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleQuickCall}>
      <Text style={styles.icon}>📞</Text>
      <Text style={styles.text}>Quick Call</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: SPACING.full,
    ...SHADOWS.base,
  },
  icon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  text: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
});

export default QuickFakeCallButton;