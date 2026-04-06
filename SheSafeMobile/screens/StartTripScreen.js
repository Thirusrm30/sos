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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { startTrip } from '../services/tripService';

const StartTripScreen = ({ navigation }) => {
  const [destination, setDestination] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleStartTrip = async () => {
    if (!destination.trim()) {
      Alert.alert('Required', 'Please enter a destination');
      return;
    }

    setLoading(true);

    try {
      const location = await getCurrentLocation();

      if (!location) {
        Alert.alert('Location Error', 'Unable to get your current location. Please enable GPS.');
        setLoading(false);
        return;
      }

      const etaHours = parseInt(hours) || 0;
      const etaMinutes = parseInt(minutes) || 0;
      const eta = new Date(Date.now() + (etaHours * 60 + etaMinutes) * 60 * 1000);

      const result = await startTrip(
        { lat: location.lat, lng: location.lng, address: 'Current Location' },
        { lat: 0, lng: 0, address: destination },
        eta
      );

      if (result.success) {
        Alert.alert(
          'Trip Started! 🚗',
          `Your trip to "${destination}" has been started.\n\nShare this link with your contacts:\n${result.trackingLink}`,
          [
            {
              text: 'View Trip',
              onPress: () => {
                navigation.navigate('ActiveTrip', {
                  tripId: result.tripId,
                  trackingLink: result.trackingLink,
                  destination: destination,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to start trip');
      }

    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🚗</Text>
          <Text style={styles.title}>Start a Trip</Text>
          <Text style={styles.subtitle}>
            Share your trip with trusted contacts for safety
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputHeader}>
            <Text style={styles.label}>Where are you going?</Text>
            <Text style={styles.required}>*Required</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g., Home, Office, Friend's place"
            placeholderTextColor={COLORS.textMuted}
            value={destination}
            onChangeText={setDestination}
          />

          <View style={styles.inputHeader}>
            <Text style={styles.label}>Expected Time of Arrival (ETA)</Text>
          </View>
          <View style={styles.etaContainer}>
            <View style={styles.etaPicker}>
              <Picker
                selectedValue={hours}
                onValueChange={setHours}
                style={styles.picker}
              >
                {[...Array(24)].map((_, i) => (
                  <Picker.Item key={`hr-${i}`} label={`${i} hr`} value={String(i)} />
                ))}
              </Picker>
            </View>
            <Text style={styles.etaSeparator}>:</Text>
            <View style={styles.etaPicker}>
              <Picker
                selectedValue={minutes}
                onValueChange={setMinutes}
                style={styles.picker}
              >
                {[...Array(12)].map((_, i) => (
                  <Picker.Item key={`min-${i}`} label={`${i * 5} min`} value={String(i * 5)} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text>ℹ️</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Automatic Alert</Text>
            <Text style={styles.infoText}>
              Your emergency contacts will be notified automatically if you don't mark yourself safe after ETA + 10 minutes.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStartTrip}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🛡️</Text>
              <Text style={styles.buttonText}>Start Trip</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('TripHistory')}
        >
          <Text style={styles.linkButtonText}>View Trip History</Text>
          <Text style={styles.linkButtonArrow}>→</Text>
        </TouchableOpacity>
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
  scrollContent: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  required: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    marginBottom: SPACING.lg,
    color: COLORS.text,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaPicker: {
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
  etaSeparator: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginHorizontal: SPACING.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
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
    color: COLORS.info,
    marginBottom: 2,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
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

export default StartTripScreen;
