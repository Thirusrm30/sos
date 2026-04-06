import axios from 'axios';
import { API_URL } from '../utils/constants';

// Generate a simple user ID (in production, use proper auth)
export const getUserId = () => {
  let userId = global.userId;
  if (!userId) {
    userId = 'user_' + Date.now();
    global.userId = userId;
  }
  return userId;
};

export const getUserName = () => {
  let userName = global.userName;
  if (!userName) {
    userName = 'User' + Math.floor(Math.random() * 1000);
    global.userName = userName;
  }
  return userName;
};

// POST /buddy/find - Find buddy matches
export const findBuddy = async (origin, destination, departureTime) => {
  try {
    const response = await axios.post(`${API_URL}/buddy/find`, {
      userId: getUserId(),
      userName: getUserName(),
      origin,
      destination,
      departureTime
    });
    return response.data;
  } catch (error) {
    console.error('Error finding buddy:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to find buddy'
    };
  }
};

// POST /buddy/accept - Accept a buddy match
export const acceptBuddy = async (requestId, matchedRequestId) => {
  try {
    const response = await axios.post(`${API_URL}/buddy/accept`, {
      userId: getUserId(),
      userName: getUserName(),
      requestId,
      matchedRequestId
    });
    return response.data;
  } catch (error) {
    console.error('Error accepting buddy:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to accept buddy'
    };
  }
};

// GET /buddy/matches/:userId - Get user's matches
export const getMatches = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/buddy/matches/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch matches'
    };
  }
};

// GET /chat/:matchId - Get chat messages
export const getChatMessages = async (matchId) => {
  try {
    const response = await axios.get(`${API_URL}/chat/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch chat'
    };
  }
};

// POST /chat/send - Send a chat message
export const sendChatMessage = async (matchId, message) => {
  try {
    const response = await axios.post(`${API_URL}/chat/send`, {
      matchId,
      senderId: getUserId(),
      senderName: getUserName(),
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send message'
    };
  }
};