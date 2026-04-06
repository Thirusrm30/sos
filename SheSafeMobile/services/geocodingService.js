import { getGoogleMapsApiKey, GOOGLE_MAPS_BASE_URL } from '../config/env';

const API_KEY = getGoogleMapsApiKey();

export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) {
    return { success: false, message: 'Address is required' };
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `${GOOGLE_MAPS_BASE_URL}/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      return {
        success: true,
        data: {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          components: extractAddressComponents(result.address_components),
        },
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return { success: false, message: 'No results found for this address' };
    } else {
      return { success: false, message: data.status || 'Geocoding failed' };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

export const reverseGeocode = async (lat, lng) => {
  if (lat === undefined || lng === undefined) {
    return { success: false, message: 'Coordinates are required' };
  }

  try {
    const url = `${GOOGLE_MAPS_BASE_URL}/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      
      return {
        success: true,
        data: {
          lat: lat,
          lng: lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          components: extractAddressComponents(result.address_components),
        },
      };
    } else {
      return { success: false, message: 'Unable to get address for this location' };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

const extractAddressComponents = (components) => {
  const extracted = {
    streetNumber: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  };

  components.forEach((component) => {
    const types = component.types;

    if (types.includes('street_number')) {
      extracted.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      extracted.street = component.long_name;
    }
    if (types.includes('locality')) {
      extracted.city = component.long_name;
    }
    if (types.includes('administrative_area_level_2')) {
      if (!extracted.city) extracted.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      extracted.state = component.long_name;
    }
    if (types.includes('country')) {
      extracted.country = component.long_name;
    }
    if (types.includes('postal_code')) {
      extracted.postalCode = component.long_name;
    }
  });

  return extracted;
};

export const getCityFromCoordinates = async (lat, lng) => {
  const result = await reverseGeocode(lat, lng);
  if (result.success) {
    return result.data.components.city || result.data.components.state || 'Unknown';
  }
  return 'Unknown';
};

export const formatAddress = (components) => {
  const parts = [];
  if (components.streetNumber && components.street) {
    parts.push(`${components.streetNumber} ${components.street}`);
  } else if (components.street) {
    parts.push(components.street);
  }
  if (components.city) {
    parts.push(components.city);
  }
  if (components.state && components.postalCode) {
    parts.push(`${components.state} ${components.postalCode}`);
  }
  return parts.join(', ');
};

export default {
  geocodeAddress,
  reverseGeocode,
  getCityFromCoordinates,
  formatAddress,
};
