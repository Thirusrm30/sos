import axios from 'axios';
import { API_URL } from '../utils/constants';

/**
 * Send SOS alert to backend server
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{success: boolean, message: string, data?: object}>}
 */
export const sendSOSAlert = async (lat, lng) => {
  try {
    console.log('Sending SOS alert to:', `${API_URL}/send-sos`);
    console.log('Payload:', { lat, lng });

    const response = await axios.post(`${API_URL}/send-sos`, {
      lat,
      lng,
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('SOS Response:', response.data);

    return {
      success: true,
      message: response.data.message || 'SOS Alert sent successfully',
      data: response.data.data,
    };
  } catch (error) {
    console.error('SOS Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        message: error.response.data.message || 'Server error occurred',
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Cannot connect to server. Please check your internet connection.',
      };
    } else {
      // Error in request setup
      return {
        success: false,
        message: 'Failed to send SOS alert. Please try again.',
      };
    }
  }
};

/**
 * Check if backend server is reachable
 * @returns {Promise<boolean>}
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
    });
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};
