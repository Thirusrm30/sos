import axios from 'axios';
import { API_URL } from '../utils/constants';

export const getUserId = () => {
  let userId = global.userId;
  if (!userId) {
    userId = 'user_' + Date.now();
    global.userId = userId;
  }
  return userId;
};

export const registerUser = async (name, phone, emergencyContacts) => {
  try {
    const response = await axios.post(`${API_URL}/user/register`, {
      userId: getUserId(),
      name,
      phone,
      emergencyContacts
    });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to register user'
    };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user/${userId || getUserId()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user'
    };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await axios.put(`${API_URL}/user/${userId || getUserId()}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update user'
    };
  }
};

export const addEmergencyContact = async (userId, contact) => {
  try {
    const response = await axios.post(`${API_URL}/user/${userId || getUserId()}/emergency`, contact);
    return response.data;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to add contact'
    };
  }
};