import * as Location from 'expo-location';

/**
 * Request location permissions from the user
 * @returns {Promise<boolean>} - Returns true if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission denied');
      return false;
    }
    
    console.log('Location permission granted');
    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current GPS location
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const getCurrentLocation = async () => {
  try {
    // Request permission first
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High, // High accuracy for emergency situations
      timeLimit: 10000, // 10 second timeout
    });

    const { latitude, longitude } = location.coords;
    
    console.log('Location obtained:', latitude, longitude);
    
    return {
      lat: latitude,
      lng: longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Start watching location continuously
 * @param {Function} callback - Function to call with new location
 * @returns {Promise<Location.LocationSubscription | null>}
 */
export const startLocationWatch = async (callback) => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      return null;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000, // Update every 60 seconds
        distanceInterval: 10, // Or when user moves 10 meters
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        callback({
          lat: latitude,
          lng: longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
};

/**
 * Stop watching location
 * @param {Location.LocationSubscription} subscription
 */
export const stopLocationWatch = (subscription) => {
  if (subscription) {
    subscription.remove();
    console.log('Location watch stopped');
  }
};
