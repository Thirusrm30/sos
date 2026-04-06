import axios from 'axios';
import { API_URL } from '../utils/constants';

const TIMEOUT = 10000;

/**
 * Start a new trip
 */
export const startTrip = async (origin, destination, eta) => {
  try {
    const response = await axios.post(
      `${API_URL}/trip/start`,
      {
        origin,
        destination,
        eta: eta.toISOString(),
      },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      tripId: response.data.tripId,
      trackingLink: response.data.trackingLink,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error starting trip:', error);
    return handleError(error);
  }
};

/**
 * Update current location
 */
export const updateTripLocation = async (tripId, lat, lng) => {
  try {
    const response = await axios.post(
      `${API_URL}/trip/update-location`,
      { tripId, lat, lng },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error updating location:', error);
    return handleError(error);
  }
};

/**
 * Mark trip as safe
 */
export const markTripSafe = async (tripId) => {
  try {
    const response = await axios.post(
      `${API_URL}/trip/mark-safe`,
      { tripId },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
      endedAt: response.data.endedAt,
    };
  } catch (error) {
    console.error('Error marking trip safe:', error);
    return handleError(error);
  }
};

/**
 * End trip
 */
export const endTrip = async (tripId) => {
  try {
    const response = await axios.post(
      `${API_URL}/trip/end`,
      { tripId },
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error ending trip:', error);
    return handleError(error);
  }
};

/**
 * Get trip details
 */
export const getTripDetails = async (tripId) => {
  try {
    const response = await axios.get(
      `${API_URL}/trip/${tripId}`,
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      trip: response.data.trip,
    };
  } catch (error) {
    console.error('Error getting trip details:', error);
    return handleError(error);
  }
};

/**
 * Get trip history
 */
export const getTripHistory = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/trip/history`,
      { timeout: TIMEOUT }
    );

    return {
      success: true,
      trips: response.data.trips,
      count: response.data.count,
    };
  } catch (error) {
    console.error('Error getting trip history:', error);
    return handleError(error);
  }
};

/**
 * Handle axios errors
 */
const handleError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
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
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
