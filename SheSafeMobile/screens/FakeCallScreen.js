import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';

const DELAY_OPTIONS = [
  { label: '10 seconds', value: 10 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
];

const FakeCallScreen = () => {
  const navigation = useNavigation();
  const { scheduleFakeCall, isCallScheduled, scheduledTime, cancelScheduledCall, isIncomingCall } = useFakeCall();
  
  const [callerName, setCallerName] = useState('');
  const [selectedDelay, setSelectedDelay] = useState(30);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let interval;
    if (isCallScheduled && scheduledTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((scheduledTime - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(interval);
  }, [isCallScheduled, scheduledTime]);

  const handleScheduleCall = () => {
    const name = callerName.trim() || 'Mom';
    scheduleFakeCall(name, selectedDelay);
  };

  const handleCancel = () => {
    cancelScheduledCall();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>📞 Fake Call</Text>
          <Text style={styles.subtitle}>
            Schedule a fake incoming call to help you escape uncomfortable situations discreetly
          </Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Caller Name"
            value={callerName}
            onChangeText={setCallerName}
            placeholder="e.g., Mom, Dad, Office"
            helperText="The name that will appear on the fake call"
          />

          <Text style={styles.label}>Delay Time</Text>
          <View style={styles.delayOptions}>
            {DELAY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.delayOption,
                  selectedDelay === option.value && styles.delayOptionSelected,
                ]}
                onPress={() => setSelectedDelay(option.value)}
              >
                <Text
                  style={[
                    styles.delayOptionText,
                    selectedDelay === option.value && styles.delayOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!isCallScheduled ? (
            <Button
              title="Schedule Fake Call"
              onPress={handleScheduleCall}
              variant="primary"
              fullWidth
              style={styles.scheduleButton}
              icon="📅"
            />
          ) : (
            <View style={styles.scheduledContainer}>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>Call incoming in</Text>
                <Text style={styles.countdownTime}>{formatTime(countdown || 0)}</Text>
              </View>
              
              <View style={styles.callerInfo}>
                <Text style={styles.callerLabel}>Caller:</Text>
                <Text style={styles.callerName}>{callerName || 'Mom'}</Text>
              </View>

              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                fullWidth
                style={styles.cancelButton}
              />
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Use a believable caller name like "Mom" or "Office"{'\n'}
            • Set a short delay (10-30 sec) for quick escape{'\n'}
            • You can also trigger an immediate fake call from the home screen
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.base,
  },
  label: {
    fontSize: FONTS.md,
    fontWeight: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  delayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  delayOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  delayOptionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  delayOptionText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  delayOptionTextSelected: {
    color: COLORS.textInverse,
    fontWeight: FONTS.medium,
  },
  scheduleButton: {
    marginTop: SPACING.base,
  },
  scheduledContainer: {
    marginTop: SPACING.base,
  },
  countdownBox: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  countdownLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  countdownTime: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  callerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  callerLabel: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  callerName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  cancelButton: {
    marginTop: SPACING.sm,
  },
  infoCard: {
    marginTop: SPACING.lg,
    padding: SPACING.base,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
  },
  infoTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default FakeCallScreen;