import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useFakeCall } from '../context/FakeCallContext';
import { COLORS, FONTS, SPACING } from '../utils/constants';

const FakeCallActiveScreen = () => {
  const { callerName, callDuration, endCall, isCallActive } = useFakeCall();

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {callerName ? callerName.charAt(0).toUpperCase() : 'M'}
            </Text>
          </View>
        </View>

        <Text style={styles.callerName}>{callerName || 'Mom'}</Text>
        <Text style={styles.callStatus}>00:{formatDuration(callDuration)}</Text>

        <View style={styles.callInfo}>
          <Text style={styles.callInfoText}>📞 Calling...</Text>
        </View>

        <View style={styles.muteOptions}>
          <TouchableOpacity style={styles.muteButton}>
            <Text style={styles.muteIcon}>🔇</Text>
            <Text style={styles.muteText}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.muteButton}>
            <Text style={styles.muteIcon}>🔊</Text>
            <Text style={styles.muteText}>Speaker</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  avatarContainer: {
    marginBottom: SPACING.lg,
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
    fontWeight: FONTS.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  callStatus: {
    fontSize: FONTS.lg,
    color: COLORS.success,
    marginBottom: SPACING.base,
  },
  callInfo: {
    marginBottom: SPACING.xl,
  },
  callInfoText: {
    fontSize: FONTS.base,
    color: COLORS.textMuted,
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
  muteIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  muteText: {
    fontSize: FONTS.sm,
    color: COLORS.textInverse,
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
    color: COLORS.textInverse,
  },
});

export default FakeCallActiveScreen;