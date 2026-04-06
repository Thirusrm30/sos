import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

const USER_ID_KEY = '@shesafe_user_id';
const USER_NAME_KEY = '@shesafe_user_name';
const USER_TOKEN_KEY = '@shesafe_user_token';
const IS_LOGGED_IN_KEY = '@shesafe_is_logged_in';

export const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const getStoredUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = generateUserId();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return generateUserId();
  }
};

export const getStoredUserName = async () => {
  try {
    return await AsyncStorage.getItem(USER_NAME_KEY);
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
};

export const setStoredUserName = async (name) => {
  try {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
  } catch (error) {
    console.error('Error saving user name:', error);
  }
};

export const isLoggedIn = async () => {
  try {
    const value = await AsyncStorage.getItem(IS_LOGGED_IN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

export const login = async (name, phone) => {
  try {
    const userId = await getStoredUserId();
    
    const response = await fetch(`${API_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        name,
        phone,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      await AsyncStorage.setItem(IS_LOGGED_IN_KEY, 'true');
      return { success: true, user: data.user };
    } else {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      await AsyncStorage.setItem(IS_LOGGED_IN_KEY, 'true');
      return { success: true, user: { userId, name, phone } };
    }
  } catch (error) {
    console.error('Login error:', error);
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    await AsyncStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    return { success: true, user: { userId: await getStoredUserId(), name, phone } };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.setItem(IS_LOGGED_IN_KEY, 'false');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: 'Network error' };
  }
};

export default {
  generateUserId,
  getStoredUserId,
  getStoredUserName,
  setStoredUserName,
  isLoggedIn,
  login,
  logout,
  getUserProfile,
};
