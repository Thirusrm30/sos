import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Vibration } from 'react-native';
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

  const playRingtone = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/ringtone.mp3'),
        {
          isLooping: true,
          volume: 1.0,
        }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log('Sound file not found, using vibration only');
    }
  };

  const stopRingtone = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  };

  const triggerVibration = () => {
    const pattern = [0, 500, 200, 500, 200, 500];
    Vibration.vibrate(pattern);
  };

  const scheduleFakeCall = useCallback((name, delaySeconds) => {
    setCallerName(name || 'Mom');
    setIsCallScheduled(true);
    setScheduledTime(Date.now() + delaySeconds * 1000);

    timerRef.current = setTimeout(() => {
      setIsIncomingCall(true);
      setIsCallScheduled(false);
      playRingtone();
      triggerVibration();
    }, delaySeconds * 1000);
  }, []);

  const acceptCall = useCallback(() => {
    stopRingtone();
    setIsIncomingCall(false);
    setIsCallActive(true);
    setCallDuration(0);

    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const rejectCall = useCallback(() => {
    stopRingtone();
    setIsIncomingCall(false);
    Vibration.cancel();
  }, []);

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