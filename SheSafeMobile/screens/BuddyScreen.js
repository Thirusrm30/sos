import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { findBuddy } from '../services/buddyService';

const BuddyScreen = ({ navigation }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureHour, setDepartureHour] = useState('9');
  const [departureMinute, setDepartureMinute] = useState('0');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setOrigin(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        Alert.alert('Location Set', 'Current location set as origin');
      } else {
        Alert.alert('Error', 'Unable to get current location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleFindBuddy = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Required', 'Please enter origin and destination');
      return;
    }

    setLoading(true);

    try {
      const originCoords = currentLocation
        ? { lat: currentLocation.lat, lng: currentLocation.lng, address: origin }
        : { lat: 0, lng: 0, address: origin };

      const destCoords = { lat: 0, lng: 0, address: destination };

      const departureTime = new Date();
      departureTime.setHours(parseInt(departureHour), parseInt(departureMinute), 0, 0);

      const result = await findBuddy(originCoords, destCoords, departureTime.toISOString());

      if (result.success) {
        if (result.matches && result.matches.length > 0) {
          navigation.navigate('BuddyMatches', {
            requestId: result.requestId,
            matches: result.matches,
            origin: originCoords,
            destination: destCoords
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
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter starting point"
              placeholderTextColor={COLORS.textMuted}
              value={origin}
              onChangeText={setOrigin}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <Text style={styles.locationButtonText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputHeader}>
            <Text style={styles.label}>Destination</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            placeholderTextColor={COLORS.textMuted}
            value={destination}
            onChangeText={setDestination}
          />

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
              We'll match you with travelers within 5km of your route and 30 minutes of your departure time.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFindBuddy}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
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
        >
          <Text style={styles.linkButtonText}>View My Matches</Text>
          <Text style={styles.linkButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
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
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.base,
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
