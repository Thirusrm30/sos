import axios from 'axios';
import { API_URL } from '../utils/constants';

const CHECKIN_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_MISSED_CHECKINS = 2;

export const sendCheckInStatus = async (tripId, status, missedCount = 0) => {
  try {
    const response = await axios.post(`${API_URL}/checkin/status`, {
      tripId,
      status,
      missedCount,
      timestamp: new Date().toISOString(),
    }, {
      timeout: 10000,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Check-in status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send check-in status',
    };
  }
};

export const confirmCheckIn = async (tripId) => {
  return sendCheckInStatus(tripId, 'done', 0);
};

export const getCheckInConfig = () => ({
  interval: CHECKIN_INTERVAL,
  maxMissed: MAX_MISSED_CHECKINS,
});

export default {
  sendCheckInStatus,
  confirmCheckIn,
  getCheckInConfig,
};