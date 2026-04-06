import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, getSafetyColor, getSafetyLabel } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { suggestRoutes } from '../services/routeService';
import { reverseGeocode } from '../services/geocodingService';
import AddressSearch from '../components/AddressSearch';

const { width } = Dimensions.get('window');

const SafeRouteScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('fastest');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  useEffect(() => {
    getCurrentLoc();
  }, []);

  const getCurrentLoc = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setOriginCoords({ lat: location.lat, lng: location.lng });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setOriginCoords({ lat: currentLocation.lat, lng: currentLocation.lng });
      setOrigin('Current Location');
    }
  };

  const handleOriginSelect = (data) => {
    if (data && data.lat && data.lng) {
      setOriginCoords({ lat: data.lat, lng: data.lng });
      setOrigin(data.address || data.name || 'Selected Location');
    }
  };

  const handleDestinationSelect = (data) => {
    if (data && data.lat && data.lng) {
      setDestinationCoords({ lat: data.lat, lng: data.lng });
      setDestination(data.address || data.name || 'Selected Location');
    }
  };

  const parseCoordinates = (input) => {
    if (!input) return null;
    
    const trimmed = input.trim();
    
    const commaMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (commaMatch) {
      const lat = parseFloat(commaMatch[1]);
      const lng = parseFloat(commaMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    return null;
  };

  const handleFindRoutes = async () => {
    if (!destination.trim() && !destinationCoords) {
      Alert.alert('Required', 'Please enter a destination');
      return;
    }

    if (!originCoords && !currentLocation) {
      Alert.alert('Error', 'Unable to determine origin. Please use current location.');
      return;
    }

    if (!destinationCoords) {
      Alert.alert('Error', 'Please geocode the destination first by tapping "Search"');
      return;
    }

    setLoading(true);
    try {
      const finalOrigin = originCoords 
        ? { lat: originCoords.lat, lng: originCoords.lng }
        : { lat: currentLocation.lat, lng: currentLocation.lng };

      const result = await suggestRoutes(finalOrigin, destinationCoords);

      if (result.success) {
        setRoutes(result);
        
        if (mapRef.current && result.fastest.points.length > 0) {
          mapRef.current.fitToCoordinates(
            result.fastest.points,
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to get routes');
      }
    } catch (error) {
      console.error('Error finding routes:', error);
      Alert.alert('Error', 'Failed to find routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveRoutePoints = () => {
    if (!routes) return [];
    return selectedRoute === 'fastest' ? routes.fastest.points : routes.safest.points;
  };

  const renderRouteCard = (routeType, routeData, isSelected) => {
    const safetyColor = getSafetyColor(routeData.safetyScore);
    const safetyLabel = getSafetyLabel(routeData.safetyScore);

    return (
      <TouchableOpacity
        style={[styles.routeCard, isSelected && styles.routeCardSelected]}
        onPress={() => setSelectedRoute(routeType)}
        activeOpacity={0.8}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeTypeContainer}>
            <Text style={styles.routeTypeIcon}>
              {routeType === 'fastest' ? '⚡' : '🛡️'}
            </Text>
            <View>
              <Text style={[styles.routeType, isSelected && styles.routeTypeSelected]}>
                {routeType === 'fastest' ? 'Fastest Route' : 'Safest Route'}
              </Text>
              <Text style={styles.routeDistance}>
                {routeData.distance} km • {routeData.duration} min
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: COLORS.accent }]}>
              <Text style={styles.selectedBadgeText}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.safetyContainer}>
          <View style={styles.safetyHeader}>
            <Text style={styles.safetyLabel}>Safety Score</Text>
            <View style={[styles.safetyBadge, { backgroundColor: safetyColor }]}>
              <Text style={styles.safetyScore}>{routeData.safetyScore}</Text>
              <Text style={styles.safetyScoreLabel}>/100</Text>
            </View>
          </View>
          <View style={styles.safetyBar}>
            <View
              style={[
                styles.safetyBarFill,
                { width: `${routeData.safetyScore}%`, backgroundColor: safetyColor },
              ]}
            />
          </View>
          <Text style={[styles.safetyStatus, { color: safetyColor }]}>
            {safetyLabel}
          </Text>
        </View>

        {routeData.safetyAlerts && routeData.safetyAlerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>
              ⚠️ {routeData.safetyAlerts.length} safety alert{routeData.safetyAlerts.length !== 1 ? 's' : ''} nearby
            </Text>
            {routeData.safetyAlerts.slice(0, 2).map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertType}>{alert.type}</Text>
                <Text style={styles.alertDistance}>{alert.distance}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>🗺️</Text>
            <Text style={styles.title}>Safe Route Suggester</Text>
            <Text style={styles.subtitle}>
              Find the safest route based on community alerts
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>Origin</Text>
              {originCoords && (
                <Text style={styles.coordsValid}>✓ Location set</Text>
              )}
            </View>
            <View style={styles.inputRow}>
              <AddressSearch
                style={{ flex: 1 }}
                placeholder="Enter starting point"
                value={origin}
                onChangeText={setOrigin}
                onSelect={handleOriginSelect}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
              >
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputHeader}>
              <Text style={styles.label}>Destination</Text>
              {destinationCoords && (
                <Text style={styles.coordsValid}>✓ Location found</Text>
              )}
            </View>
            <AddressSearch
              placeholder="Enter destination"
              value={destination}
              onChangeText={setDestination}
              onSelect={handleDestinationSelect}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button, 
              (loading || !destinationCoords) && styles.buttonDisabled
            ]}
            onPress={handleFindRoutes}
            disabled={loading || !destinationCoords}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🛡️</Text>
                <Text style={styles.buttonText}>
                  {!destinationCoords ? 'Search Destination First' : 'Find Routes'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {routes && (
            <View style={styles.routesContainer}>
              <Text style={styles.routesTitle}>Available Routes</Text>
              {renderRouteCard('fastest', routes.fastest, selectedRoute === 'fastest')}
              {renderRouteCard('safest', routes.safest, selectedRoute === 'safest')}
            </View>
          )}
        </View>
      </ScrollView>

      {routes && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: (originCoords?.lat || currentLocation?.lat) || 12.9,
              longitude: (originCoords?.lng || currentLocation?.lng) || 77.6,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {(originCoords || currentLocation) && (
              <Marker
                coordinate={{ 
                  latitude: originCoords?.lat || currentLocation?.lat, 
                  longitude: originCoords?.lng || currentLocation?.lng 
                }}
                title="Start"
                description={origin}
              >
                <View style={styles.markerStart}>
                  <Text style={styles.markerText}>A</Text>
                </View>
              </Marker>
            )}
            
            {destinationCoords && (
              <Marker
                coordinate={{ 
                  latitude: destinationCoords.lat, 
                  longitude: destinationCoords.lng 
                }}
                title="Destination"
                description={destination}
              >
                <View style={[styles.markerStart, { backgroundColor: COLORS.danger }]}>
                  <Text style={styles.markerText}>B</Text>
                </View>
              </Marker>
            )}
            
            <Polyline
              coordinates={getActiveRoutePoints()}
              strokeColor={selectedRoute === 'fastest' ? COLORS.accent : COLORS.success}
              strokeWidth={4}
            />
          </MapView>

          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Fastest</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Safest</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  inputHeader: {
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  coordsValid: {
    fontSize: FONTS.xs,
    color: COLORS.success,
    fontWeight: FONTS.medium,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  formattedAddress: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.base,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  locationButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
  },
  locationButtonText: {
    fontSize: 20,
  },
  searchButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  searchButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.base,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
  },
  routesContainer: {
    marginTop: SPACING.base,
  },
  routesTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.base,
  },
  routeCardSelected: {
    borderColor: COLORS.accent,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  routeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTypeIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  routeType: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  routeTypeSelected: {
    color: COLORS.accent,
  },
  routeDistance: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  selectedBadgeText: {
    color: COLORS.textInverse,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
  },
  safetyContainer: {
    marginBottom: SPACING.sm,
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  safetyLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.text,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  safetyScore: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  safetyScoreLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textInverse,
    marginLeft: 2,
  },
  safetyBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  safetyBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  safetyStatus: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  alertsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
  },
  alertsTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: '#92400E',
    marginBottom: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  alertType: {
    fontSize: FONTS.xs,
    color: '#78350F',
  },
  alertDistance: {
    fontSize: FONTS.xs,
    color: '#78350F',
  },
  mapContainer: {
    height: 280,
    margin: SPACING.base,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerStart: {
    backgroundColor: COLORS.accent,
    padding: 8,
    borderRadius: 20,
  },
  markerText: {
    color: COLORS.textInverse,
    fontWeight: FONTS.bold,
  },
  mapLegend: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
    ...SHADOWS.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  legendLine: {
    width: 16,
    height: 4,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.medium,
  },
});

export default SafeRouteScreen;
