import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { findBuddy } from '../services/buddyService';
import { geocodeAddress, reverseGeocode } from '../services/geocodingService';

const BuddyScreen = ({ navigation }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureHour, setDepartureHour] = useState('9');
  const [departureMinute, setDepartureMinute] = useState('0');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);
  const [geocodingDestination, setGeocodingDestination] = useState(false);
  const [resolvedDestination, setResolvedDestination] = useState(null);

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

  const handleUseCurrentLocation = useCallback(async () => {
    setGeocodingOrigin(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setOriginCoords({ lat: location.lat, lng: location.lng });
        
        // Try to get address but don't block
        reverseGeocode(location.lat, location.lng)
          .then(addressResult => {
            if (addressResult.success) {
              setOrigin(addressResult.data.formattedAddress);
            } else {
              setOrigin(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
            }
          })
          .catch(() => {
            setOrigin(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
          });
      } else {
        Alert.alert('Error', 'Unable to get current location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setGeocodingOrigin(false);
    }
  }, []);

  const handleOriginChange = useCallback((text) => {
    setOrigin(text);
    const coords = parseCoordinates(text);
    setOriginCoords(coords);
  }, []);

  const handleDestinationChange = useCallback((text) => {
    setDestination(text);
    // Reset resolved state when user modifies text
    setResolvedDestination(null);
    setDestinationCoords(null);
    const coords = parseCoordinates(text);
    if (coords) {
      setDestinationCoords(coords);
      setResolvedDestination(text);
    }
  }, []);

  const handleSearchDestination = useCallback(async () => {
    if (!destination.trim()) {
      Alert.alert('Required', 'Please enter a destination');
      return;
    }

    if (destinationCoords) return;

    setGeocodingDestination(true);
    try {
      const result = await geocodeAddress(destination);

      if (result.success) {
        setDestination(result.data.formattedAddress);
        setResolvedDestination(result.data.formattedAddress);
        setDestinationCoords({ lat: result.data.lat, lng: result.data.lng });
      } else {
        Alert.alert(
          'Address Not Found', 
          `Could not find "${destination}".\n\nTry something like "Avadi, Chennai" or "Ayapakkam, Tamil Nadu".`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search address. Check your connection.');
    } finally {
      setGeocodingDestination(false);
    }
  }, [destination, destinationCoords]);

  const handleFindBuddy = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Required', 'Please enter origin and destination');
      return;
    }

    // Auto-geocode origin if needed
    let finalOriginCoords = originCoords;
    if (!finalOriginCoords && !currentLocation) {
      // Try using current location automatically
      try {
        const location = await getCurrentLocation();
        if (location) {
          finalOriginCoords = { lat: location.lat, lng: location.lng };
          setOriginCoords(finalOriginCoords);
          setCurrentLocation(location);
        }
      } catch (e) { /* ignore */ }
    }
    if (!finalOriginCoords && currentLocation) {
      finalOriginCoords = { lat: currentLocation.lat, lng: currentLocation.lng };
    }
    if (!finalOriginCoords) {
      Alert.alert('Error', 'Please set your origin using the 📍 button');
      return;
    }

    // Auto-geocode destination if needed
    let finalDestCoords = destinationCoords;
    if (!finalDestCoords) {
      setGeocodingDestination(true);
      try {
        const geoResult = await geocodeAddress(destination);
        if (geoResult.success) {
          finalDestCoords = { lat: geoResult.data.lat, lng: geoResult.data.lng };
          setDestinationCoords(finalDestCoords);
          setResolvedDestination(geoResult.data.formattedAddress);
          setDestination(geoResult.data.formattedAddress);
        } else {
          Alert.alert(
            'Address Not Found',
            `Could not find "${destination}". Try "Avadi, Chennai" or coordinates.`
          );
          setGeocodingDestination(false);
          return;
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to geocode destination');
        setGeocodingDestination(false);
        return;
      }
      setGeocodingDestination(false);
    }

    setLoading(true);

    try {
      const departureTime = new Date();
      departureTime.setHours(parseInt(departureHour), parseInt(departureMinute), 0, 0);

      const result = await findBuddy(
        { lat: finalOriginCoords.lat, lng: finalOriginCoords.lng, address: origin },
        { lat: finalDestCoords.lat, lng: finalDestCoords.lng, address: destination },
        departureTime.toISOString()
      );

      if (result.success) {
        if (result.matches && result.matches.length > 0) {
          navigation.navigate('BuddyMatches', {
            requestId: result.requestId,
            matches: result.matches,
            origin: { lat: finalOriginCoords.lat, lng: finalOriginCoords.lng, address: origin },
            destination: { lat: finalDestCoords.lat, lng: finalDestCoords.lng, address: destination }
          });
        } else {
          Alert.alert(
            'No Matches Found',
            'No buddy matches found for your route. Try again later or adjust your route/time.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to find buddy');
      }
    } catch (error) {
      console.error('Error finding buddy:', error);
      Alert.alert('Error', 'Failed to find buddy. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, originCoords, destinationCoords, currentLocation, departureHour, departureMinute, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>👥</Text>
            <Text style={styles.title}>Find a Buddy</Text>
            <Text style={styles.subtitle}>
              Find someone traveling the same route for added safety
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>Origin</Text>
              {originCoords && <Text style={styles.coordsValid}>✓ Set</Text>}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Enter starting point"
                placeholderTextColor={COLORS.textMuted}
                value={origin}
                onChangeText={handleOriginChange}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
                disabled={geocodingOrigin}
                activeOpacity={0.7}
              >
                {geocodingOrigin ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.locationButtonText}>📍</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputHeader}>
              <Text style={styles.label}>Destination</Text>
              {destinationCoords && <Text style={styles.coordsValid}>✓ Found</Text>}
            </View>
            <TextInput
              style={[
                styles.input,
                destinationCoords && styles.inputValid,
              ]}
              placeholder='Enter place name (e.g., "Avadi" or "Ayapakkam")'
              placeholderTextColor={COLORS.textMuted}
              value={destination}
              onChangeText={handleDestinationChange}
            />
            
            {/* Show resolved address */}
            {resolvedDestination && destinationCoords && (
              <View style={styles.resolvedContainer}>
                <Text style={styles.resolvedIcon}>✓</Text>
                <Text style={styles.resolvedText} numberOfLines={2}>
                  {resolvedDestination}
                </Text>
              </View>
            )}

            {/* Search button when text entered but not resolved */}
            {!destinationCoords && destination.trim().length > 0 && (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchDestination}
                disabled={geocodingDestination}
                activeOpacity={0.7}
              >
                {geocodingDestination ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.searchButtonText}>🔍 Look Up Address</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.inputHeader}>
              <Text style={styles.label}>Departure Time</Text>
            </View>
            <View style={styles.timeContainer}>
              <View style={styles.timePicker}>
                <Picker
                  selectedValue={departureHour}
                  onValueChange={setDepartureHour}
                  style={styles.picker}
                >
                  {[...Array(24)].map((_, i) => (
                    <Picker.Item key={`hour-${i}`} label={`${i}:00`} value={String(i)} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timePicker}>
                <Picker
                  selectedValue={departureMinute}
                  onValueChange={setDepartureMinute}
                  style={styles.picker}
                >
                  <Picker.Item key="min-0" label="00" value="0" />
                  <Picker.Item key="min-15" label="15" value="15" />
                  <Picker.Item key="min-30" label="30" value="30" />
                  <Picker.Item key="min-45" label="45" value="45" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text>💡</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Enter simple place names like "Avadi" or "Ayapakkam". We'll find the location automatically and match you with travelers within 5km and 30 minutes of your departure.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || geocodingDestination) && styles.buttonDisabled]}
            onPress={handleFindBuddy}
            disabled={loading || geocodingDestination}
            activeOpacity={0.8}
          >
            {loading || geocodingDestination ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🔍</Text>
                <Text style={styles.buttonText}>Find Buddy</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('MyMatches')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>View My Matches</Text>
            <Text style={styles.linkButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: SPACING['3xl'],
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
    marginBottom: SPACING.base,
    color: COLORS.text,
    minHeight: 48,
  },
  inputFlex: {
    flex: 1,
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.base,
  },
  resolvedIcon: {
    fontSize: 14,
    color: COLORS.success,
    marginRight: SPACING.sm,
    fontWeight: FONTS.bold,
  },
  resolvedText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.success,
  },
  locationButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
    minHeight: 48,
  },
  locationButtonText: {
    fontSize: 20,
  },
  searchButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
    minHeight: 48,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.medium,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePicker: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  timeSeparator: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    marginHorizontal: SPACING.sm,
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.base,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: '#92400E',
    marginBottom: 2,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: '#78350F',
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    minHeight: 56,
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
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    minHeight: 48,
  },
  linkButtonText: {
    color: COLORS.accent,
    fontSize: FONTS.base,
    fontWeight: FONTS.medium,
  },
  linkButtonArrow: {
    color: COLORS.accent,
    fontSize: FONTS.base,
    marginLeft: SPACING.xs,
  },
});

export default BuddyScreen;
