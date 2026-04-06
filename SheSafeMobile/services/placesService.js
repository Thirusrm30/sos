import { getGoogleMapsApiKey } from '../config/env';

const API_KEY = getGoogleMapsApiKey();
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export const searchPlaces = async (input, types = 'geocode') => {
  if (!input || input.trim().length < 3) {
    return { success: false, predictions: [] };
  }

  try {
    const url = `${BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&types=${types}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return {
        success: true,
        predictions: data.predictions || [],
      };
    } else {
      console.log('Places API error:', data.status);
      return { success: false, predictions: [], error: data.status };
    }
  } catch (error) {
    console.error('Places search error:', error);
    return { success: false, predictions: [], error: error.message };
  }
};

export const getPlaceDetails = async (placeId) => {
  if (!placeId) {
    return { success: false, message: 'Place ID required' };
  }

  try {
    const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,address_components&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const result = data.result;
      return {
        success: true,
        data: {
          name: result.name,
          address: result.formatted_address,
          placeId: result.place_id,
          types: result.types,
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          components: extractAddressComponents(result.address_components || []),
        },
      };
    } else {
      return { success: false, message: data.status };
    }
  } catch (error) {
    console.error('Place details error:', error);
    return { success: false, message: 'Network error' };
  }
};

const extractAddressComponents = (components) => {
  const extracted = {
    streetNumber: '',
    street: '',
    city: '',
    district: '',
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
    if (types.includes('sublocality_level_1')) {
      extracted.district = component.long_name;
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

export const formatFullAddress = (result) => {
  if (!result) return '';
  
  if (result.formatted_address) {
    return result.formatted_address;
  }
  
  const parts = [];
  const c = result.components;
  
  if (c.streetNumber && c.street) {
    parts.push(`${c.streetNumber} ${c.street}`);
  } else if (c.street) {
    parts.push(c.street);
  }
  
  if (c.district) parts.push(c.district);
  if (c.city) parts.push(c.city);
  if (c.state) parts.push(c.state);
  if (c.postalCode) parts.push(c.postalCode);
  
  return parts.join(', ');
};

export const searchNearbyPlaces = async (lat, lng, type = 'establishment', radius = 1000) => {
  try {
    const url = `${BASE_URL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return {
        success: true,
        places: data.results.map(place => ({
          name: place.name,
          address: place.vicinity,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          rating: place.rating,
          types: place.types,
          placeId: place.place_id,
        })),
      };
    } else {
      return { success: false, places: [], error: data.status };
    }
  } catch (error) {
    console.error('Nearby search error:', error);
    return { success: false, places: [], error: error.message };
  }
};

export default {
  searchPlaces,
  getPlaceDetails,
  formatFullAddress,
  searchNearbyPlaces,
};
