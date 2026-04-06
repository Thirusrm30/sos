import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';

const DELAY_OPTIONS = [
  { label: '10 sec', value: 10 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

const FakeCallScreen = () => {
  const { scheduleFakeCall, isCallScheduled, scheduledTime, cancelScheduledCall } = useFakeCall();
  
  const [callerName, setCallerName] = useState('');
  const [selectedDelay, setSelectedDelay] = useState(30);
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isCallScheduled && scheduledTime) {
      // Set initial countdown immediately
      const remaining = Math.max(0, Math.floor((scheduledTime - Date.now()) / 1000));
      setCountdown(remaining);

      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        const rem = Math.max(0, Math.floor((scheduledTime - Date.now()) / 1000));
        setCountdown(rem);
        if (rem <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCallScheduled, scheduledTime]);

  const handleScheduleCall = () => {
    const name = callerName.trim() || 'Mom';
    scheduleFakeCall(name, selectedDelay);
  };

  const handleCancel = () => {
    cancelScheduledCall();
    setCountdown(null);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerIcon}>📞</Text>
            <Text style={styles.title}>Fake Call</Text>
            <Text style={styles.subtitle}>
              Schedule a fake incoming call to help you escape uncomfortable situations discreetly
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Caller Name"
              value={callerName}
              onChangeText={setCallerName}
              placeholder='e.g., Mom, Dad, Office'
              helperText="Leave empty for default (Mom)"
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
                  activeOpacity={0.7}
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
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={handleScheduleCall}
                activeOpacity={0.8}
              >
                <Text style={styles.scheduleButtonIcon}>📅</Text>
                <Text style={styles.scheduleButtonText}>Schedule Fake Call</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.scheduledContainer}>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownLabel}>Call incoming in</Text>
                  <Text style={styles.countdownTime}>{formatTime(countdown)}</Text>
                </View>
                
                <View style={styles.callerInfo}>
                  <Text style={styles.callerLabel}>Caller:</Text>
                  <Text style={styles.callerNameDisplay}>{callerName || 'Mom'}</Text>
                </View>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>✕ Cancel Scheduled Call</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Tips</Text>
            <Text style={styles.infoText}>
              • Use a believable caller name like "Mom" or "Office"{'\n'}
              • Set a short delay (10-30 sec) for quick escape{'\n'}
              • You can also trigger an immediate fake call from the SOS screen{'\n'}
              • The call screen will look like a real incoming call
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.base,
  },
  label: {
    fontSize: FONTS.md,
    fontWeight: FONTS.semibold,
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
    minWidth: 80,
    alignItems: 'center',
  },
  delayOptionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  delayOptionText: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.medium,
  },
  delayOptionTextSelected: {
    color: COLORS.textInverse,
    fontWeight: FONTS.semibold,
  },
  scheduleButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.base,
    minHeight: 56,
    ...SHADOWS.base,
  },
  scheduleButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  scheduleButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
  },
  scheduledContainer: {
    marginTop: SPACING.base,
  },
  countdownBox: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.base,
  },
  countdownLabel: {
    fontSize: FONTS.base,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  countdownTime: {
    fontSize: FONTS['4xl'],
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
    fontVariant: ['tabular-nums'],
  },
  callerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
  },
  callerLabel: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  callerNameDisplay: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.danger,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  infoCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.lg,
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
    lineHeight: 24,
  },
});

export default FakeCallScreen;