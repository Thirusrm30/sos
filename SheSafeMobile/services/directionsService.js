import { getGoogleMapsApiKey } from '../config/env';

const API_KEY = getGoogleMapsApiKey();
const BASE_URL = 'https://maps.googleapis.com/maps/api/directions';

const parseDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
};

const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return poly;
};

export const getDirections = async (origin, destination, mode = 'driving') => {
  if (!origin || !destination) {
    return { success: false, message: 'Origin and destination are required' };
  }

  try {
    const originStr = typeof origin === 'string' 
      ? origin 
      : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' 
      ? destination 
      : `${destination.lat},${destination.lng}`;

    const url = `${BASE_URL}/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=${mode}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      const points = [];
      if (route.overview_polyline && route.overview_polyline.points) {
        points.push(...decodePolyline(route.overview_polyline.points));
      }

      return {
        success: true,
        data: {
          distance: (leg.distance.value / 1000).toFixed(1),
          distanceText: leg.distance.text,
          duration: Math.round(leg.duration.value / 60),
          durationText: leg.duration.text,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          points: points,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text,
            startLocation: step.start_location,
            endLocation: step.end_location
          }))
        }
      };
    } else {
      return { 
        success: false, 
        message: data.status === 'ZERO_RESULTS' 
          ? 'No route found between these locations' 
          : data.status || 'Failed to get directions' 
      };
    }
  } catch (error) {
    console.error('Directions API error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

export const getMultipleRoutes = async (origin, destination) => {
  if (!origin || !destination) {
    return { success: false, message: 'Origin and destination are required' };
  }

  try {
    const originStr = typeof origin === 'string' 
      ? origin 
      : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' 
      ? destination 
      : `${destination.lat},${destination.lng}`;

    const drivingUrl = `${BASE_URL}/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=driving&key=${API_KEY}`;
    const walkingUrl = `${BASE_URL}/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&mode=walking&key=${API_KEY}`;

    const [drivingRes, walkingRes] = await Promise.all([
      fetch(drivingUrl),
      fetch(walkingUrl)
    ]);

    const drivingData = await drivingRes.json();
    const walkingData = await walkingRes.json();

    const parseRoute = (data) => {
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs[0];
      const points = route.overview_polyline?.points 
        ? decodePolyline(route.overview_polyline.points) 
        : [];

      return {
        distance: (leg.distance.value / 1000).toFixed(1),
        duration: Math.round(leg.duration.value / 60),
        points
      };
    };

    const drivingRoute = parseRoute(drivingData);
    const walkingRoute = parseRoute(walkingData);

    if (!drivingRoute && !walkingRoute) {
      return { success: false, message: 'No routes found' };
    }

    const fastest = drivingRoute || walkingRoute;
    const safest = walkingRoute || drivingRoute;

    return {
      success: true,
      fastest: {
        ...fastest,
        mode: drivingRoute ? 'driving' : 'walking'
      },
      safest: {
        ...safest,
        mode: walkingRoute ? 'walking' : 'driving'
      }
    };
  } catch (error) {
    console.error('Multiple routes error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

export const calculateRouteDistance = (points) => {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const R = 6371;
    const dLat = (points[i + 1].lat - points[i].lat) * Math.PI / 180;
    const dLng = (points[i + 1].lng - points[i].lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(points[i].lat * Math.PI / 180) * Math.cos(points[i + 1].lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  return totalDistance.toFixed(1);
};

export default {
  getDirections,
  getMultipleRoutes,
  calculateRouteDistance,
};
