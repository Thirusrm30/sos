import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_SOS_KEY = 'pending_sos_events';

export const storePendingSOS = async (lat, lng, timestamp = Date.now()) => {
  try {
    const existing = await getPendingSOSEvents();
    const newEvent = {
      id: `sos_${timestamp}`,
      lat,
      lng,
      timestamp,
      synced: false,
    };
    
    const updated = [...existing, newEvent];
    await AsyncStorage.setItem(PENDING_SOS_KEY, JSON.stringify(updated));
    console.log('Pending SOS stored:', newEvent);
    return true;
  } catch (error) {
    console.error('Error storing pending SOS:', error);
    return false;
  }
};

export const getPendingSOSEvents = async () => {
  try {
    const stored = await AsyncStorage.getItem(PENDING_SOS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error getting pending SOS events:', error);
    return [];
  }
};

export const markSOSAsSynced = async (sosId) => {
  try {
    const events = await getPendingSOSEvents();
    const updated = events.map(event => 
      event.id === sosId ? { ...event, synced: true } : event
    );
    await AsyncStorage.setItem(PENDING_SOS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error marking SOS as synced:', error);
    return false;
  }
};

export const clearSyncedSOSEvents = async () => {
  try {
    const events = await getPendingSOSEvents();
    const unsynced = events.filter(event => !event.synced);
    await AsyncStorage.setItem(PENDING_SOS_KEY, JSON.stringify(unsynced));
    console.log('Cleared synced SOS events');
    return true;
  } catch (error) {
    console.error('Error clearing synced SOS events:', error);
    return false;
  }
};

export const getUnsyncedSOSCount = async () => {
  try {
    const events = await getPendingSOSEvents();
    return events.filter(event => !event.synced).length;
  } catch (error) {
    console.error('Error getting unsynced SOS count:', error);
    return 0;
  }
};