import axios from 'axios';
import { API_URL } from '../utils/constants';

const TIMEOUT = 10000;

/**
 * Add a new alert
 */
export const addAlert = async (type, description, lat, lng, reportedBy = 'Anonymous') => {
  try {
    const response = await axios.post(
      `${API_URL}/alert/add`,
      {
        type,
        description,
        lat,
        lng,
        reportedBy,
      },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
      alert: response.data.alert,
    };
  } catch (error) {
    console.error('Error adding alert:', error);
    return handleError(error);
  }
};

/**
 * Get all active alerts (last 48 hours)
 */
export const getAllAlerts = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/alert/all`,
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      alerts: response.data.alerts,
      count: response.data.count,
    };
  } catch (error) {
    console.error('Error getting alerts:', error);
    return handleError(error);
  }
};

/**
 * Upvote an alert
 */
export const upvoteAlert = async (alertId) => {
  try {
    const response = await axios.post(
      `${API_URL}/alert/upvote`,
      { alertId },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
      upvotes: response.data.upvotes,
    };
  } catch (error) {
    console.error('Error upvoting alert:', error);
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
