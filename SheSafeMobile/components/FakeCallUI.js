import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const FakeCallUI = () => {
  const { isIncomingCall, callerName, acceptCall, rejectCall } = useFakeCall();

  if (!isIncomingCall) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.headerPattern} />
      
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {callerName ? callerName.charAt(0).toUpperCase() : 'M'}
            </Text>
          </View>
          <View style={styles.ringEffect} />
        </View>

        <Text style={styles.callerName}>{callerName || 'Mom'}</Text>
        <Text style={styles.incomingText}>Incoming Call...</Text>

        <View style={styles.callActions}>
          <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
            <Text style={styles.rejectIcon}>✕</Text>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
            <Text style={styles.acceptIcon}>✓</Text>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.phoneIcon}>
        <Text style={styles.phoneIconText}>📱</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    marginBottom: SPACING.xl,
    position: 'relative',
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
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.accentLight,
    opacity: 0.5,
  },
  callerName: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
  },
  incomingText: {
    fontSize: FONTS.lg,
    color: COLORS.textMuted,
    marginBottom: SPACING['2xl'],
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING['2xl'],
    gap: SPACING['3xl'],
  },
  rejectButton: {
    alignItems: 'center',
  },
  rejectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.danger,
    textAlign: 'center',
    lineHeight: 60,
    fontSize: FONTS.xl,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
  },
  rejectText: {
    fontSize: FONTS.md,
    color: COLORS.textInverse,
  },
  acceptButton: {
    alignItems: 'center',
  },
  acceptIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.success,
    textAlign: 'center',
    lineHeight: 60,
    fontSize: FONTS.xl,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
  },
  acceptText: {
    fontSize: FONTS.md,
    color: COLORS.textInverse,
  },
  phoneIcon: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  phoneIconText: {
    fontSize: 30,
    opacity: 0.3,
  },
});

export default FakeCallUI;