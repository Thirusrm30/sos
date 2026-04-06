import axios from 'axios';
import { API_URL } from '../utils/constants';

const TIMEOUT = 10000;

/**
 * Add a new ride
 */
export const addRide = async (vehicleNumber, vehicleType, driverName, lat, lng) => {
  try {
    const response = await axios.post(
      `${API_URL}/ride/add`,
      {
        vehicleNumber,
        vehicleType,
        driverName,
        lat,
        lng,
      },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
      ride: response.data.ride,
    };
  } catch (error) {
    console.error('Error adding ride:', error);
    return handleError(error);
  }
};

/**
 * Get ride history
 */
export const getRideHistory = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/ride/history`,
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      rides: response.data.rides,
      count: response.data.count,
    };
  } catch (error) {
    console.error('Error getting ride history:', error);
    return handleError(error);
  }
};

/**
 * Share a specific ride via SMS
 */
export const shareRide = async (rideId) => {
  try {
    const response = await axios.post(
      `${API_URL}/ride/share`,
      { rideId },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error sharing ride:', error);
    return handleError(error);
  }
};

/**
 * Handle axios errors
 */
const handleError = (error) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'Cannot connect to server. Please check your internet connection.',
    };
  } else {
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
