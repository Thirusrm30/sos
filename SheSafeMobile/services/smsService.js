import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMERGENCY_CONTACTS_KEY = 'emergency_contacts';
const FALLBACK_EMERGENCY_NUMBER = '911';

export const saveEmergencyContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
    console.log('Emergency contacts saved locally');
    return true;
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
    return false;
  }
};

export const getEmergencyContacts = async () => {
  try {
    const stored = await AsyncStorage.getItem(EMERGENCY_CONTACTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error getting emergency contacts:', error);
    return [];
  }
};

export const buildSOSMessage = (lat, lng) => {
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  return `HELP! I may be in danger.\n\nMy location: ${mapLink}`;
};

export const sendSOSViaSMS = async (lat, lng) => {
  try {
    const contacts = await getEmergencyContacts();
    const phoneNumbers = contacts.map(c => c.phone);
    
    if (phoneNumbers.length === 0) {
      console.log('No emergency contacts found, using fallback');
      phoneNumbers.push(FALLBACK_EMERGENCY_NUMBER);
    }

    const message = buildSOSMessage(lat, lng);
    
    console.log('Sending SOS SMS to:', phoneNumbers);
    console.log('Message:', message);

    const isAvailable = await SMS.isAvailableAsync();
    
    if (isAvailable) {
      const result = await SMS.sendSMSAsync(phoneNumbers, message);
      console.log('SMS Result:', result);
      return {
        success: true,
        message: 'SMS composer opened',
        result: result,
      };
    } else {
      return {
        success: false,
        message: 'SMS not available on this device',
      };
    }
  } catch (error) {
    console.error('Error sending SOS SMS:', error);
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
    };
  }
};

export const isSMSAvailable = async () => {
  try {
    return await SMS.isAvailableAsync();
  } catch (error) {
    console.error('Error checking SMS availability:', error);
    return false;
  }
};