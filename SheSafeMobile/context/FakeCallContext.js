import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';

const FakeCallContext = createContext();

export const useFakeCall = () => {
  const context = useContext(FakeCallContext);
  if (!context) {
    throw new Error('useFakeCall must be used within FakeCallProvider');
  }
  return context;
};

export const FakeCallProvider = ({ children }) => {
  const [isCallScheduled, setIsCallScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [callerName, setCallerName] = useState('');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const timerRef = useRef(null);
  const callTimerRef = useRef(null);
  const soundRef = useRef(null);
  const vibrationIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      stopRingtone();
    };
  }, []);

  const playRingtone = useCallback(async () => {
    try {
      // Stop any existing sound first
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) { /* ignore */ }
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Try to load ringtone, but don't crash if missing
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/ringtone.mp3'),
          {
            isLooping: true,
            volume: 1.0,
          }
        );
        soundRef.current = sound;
        await sound.playAsync();
      } catch (soundError) {
        // Ringtone file not found - fall back to vibration only
        console.log('Ringtone not available, using vibration only');
      }
    } catch (error) {
      console.log('Audio setup error, using vibration only:', error.message);
    }
  }, []);

  const stopRingtone = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      // Silently handle - sound may already be stopped
      soundRef.current = null;
    }
  }, []);

  const triggerVibration = useCallback(() => {
    // Use repeating vibration pattern for incoming call feel
    const pattern = [0, 500, 200, 500, 200, 500];
    Vibration.vibrate(pattern, true); // true = repeat
  }, []);

  const stopVibration = useCallback(() => {
    Vibration.cancel();
  }, []);

  const scheduleFakeCall = useCallback((name, delaySeconds) => {
    // Clear any existing scheduled call
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setCallerName(name || 'Mom');
    setIsCallScheduled(true);
    setScheduledTime(Date.now() + delaySeconds * 1000);

    timerRef.current = setTimeout(() => {
      setIsIncomingCall(true);
      setIsCallScheduled(false);
      setScheduledTime(null);
      playRingtone();
      triggerVibration();
    }, delaySeconds * 1000);
  }, [playRingtone, triggerVibration]);

  const acceptCall = useCallback(() => {
    stopRingtone();
    stopVibration();
    setIsIncomingCall(false);
    setIsCallActive(true);
    setCallDuration(0);

    // Clear any existing call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, [stopRingtone, stopVibration]);

  const rejectCall = useCallback(() => {
    stopRingtone();
    stopVibration();
    setIsIncomingCall(false);
    setCallerName('');
  }, [stopRingtone, stopVibration]);

  const endCall = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setIsCallActive(false);
    setCallDuration(0);
    setCallerName('');
  }, []);

  const cancelScheduledCall = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsCallScheduled(false);
    setScheduledTime(null);
  }, []);

  const value = {
    isCallScheduled,
    scheduledTime,
    callerName,
    isIncomingCall,
    isCallActive,
    callDuration,
    scheduleFakeCall,
    acceptCall,
    rejectCall,
    endCall,
    cancelScheduledCall,
    playRingtone,
    stopRingtone,
    triggerVibration,
    stopVibration,
    setCallerName,
    setIsIncomingCall,
  };

  return (
    <FakeCallContext.Provider value={value}>
      {children}
    </FakeCallContext.Provider>
  );
};

export default FakeCallContext;