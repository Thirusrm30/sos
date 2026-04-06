import axios from 'axios';
import { API_URL } from '../utils/constants';

// POST /route/suggest - Get safest and fastest routes
export const suggestRoutes = async (origin, destination) => {
  try {
    const response = await axios.post(`${API_URL}/route/suggest`, {
      origin,
      destination
    });
    return response.data;
  } catch (error) {
    console.error('Error suggesting routes:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get routes'
    };
  }
};

// Get safety score color
export const getSafetyColor = (score) => {
  if (score >= 80) return '#22C55E'; // Green
  if (score >= 60) return '#F59E0B'; // Orange
  if (score >= 40) return '#EF4444'; // Red
  return '#DC2626'; // Dark Red
};

// Get safety label
export const getSafetyLabel = (score) => {
  if (score >= 80) return 'Safe';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Caution';
  return 'Dangerous';
};