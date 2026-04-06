const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
const BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';

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

const getDirections = async (origin, destination, mode = 'driving') => {
  if (!origin || !destination) {
    return { success: false, error: 'Origin and destination required' };
  }

  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;

    const url = `${BASE_URL}?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;

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
          duration: Math.round(leg.duration.value / 60),
          points,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        }
      };
    } else {
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error('Directions API error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getDirections,
  decodePolyline
};
