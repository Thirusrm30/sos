import NetInfo from '@react-native-community/netinfo';

export const NETWORK_STATES = {
  UNKNOWN: 'unknown',
  NONE: 'none',
  WIFI: 'wifi',
  CELLULAR: 'cellular',
};

export const getNetworkState = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable ?? false,
    };
  } catch (error) {
    console.error('Error fetching network state:', error);
    return {
      isConnected: false,
      type: NETWORK_STATES.UNKNOWN,
      isInternetReachable: false,
    };
  }
};

export const subscribeToNetworkState = (callback) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback({
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable ?? false,
    });
  });
  return unsubscribe;
};

export const isNetworkAvailable = async () => {
  const state = await getNetworkState();
  return state.isConnected && state.isInternetReachable;
};