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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, VEHICLE_TYPES } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { addRide } from '../services/rideService';

const RideEntryScreen = ({ navigation }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Cab');
  const [driverName, setDriverName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter vehicle number');
      return;
    }

    if (vehicleNumber.length < 4) {
      Alert.alert('Invalid', 'Vehicle number seems too short');
      return;
    }

    setLoading(true);

    try {
      const location = await getCurrentLocation();

      if (!location) {
        Alert.alert('Location Error', 'Unable to get your location. Please enable GPS.');
        setLoading(false);
        return;
      }

      const result = await addRide(
        vehicleNumber.trim().toUpperCase(),
        vehicleType,
        driverName.trim() || 'Unknown',
        location.lat,
        location.lng
      );

      if (result.success) {
        Alert.alert(
          '✅ Ride Shared!',
          `Your ride details have been shared with emergency contacts.\n\n🚗 Vehicle: ${vehicleNumber.toUpperCase()}\n🚙 Type: ${vehicleType}`,
          [
            {
              text: 'View History',
              onPress: () => navigation.navigate('RideHistory'),
            },
            {
              text: 'Add Another',
              onPress: () => {
                setVehicleNumber('');
                setDriverName('');
              },
            },
          ]
        );
        setVehicleNumber('');
        setDriverName('');
      } else {
        Alert.alert('Error', result.message || 'Failed to add ride');
      }

    } catch (error) {
      console.error('Error adding ride:', error);
      Alert.alert('Error', 'Failed to add ride. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = ['Cab', 'Auto', 'Bus', 'Other'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🚗</Text>
          <Text style={styles.title}>Ride Verification</Text>
          <Text style={styles.subtitle}>
            Share ride details with your emergency contacts
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Vehicle Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., TN01AB1234"
            placeholderTextColor={COLORS.textMuted}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            maxLength={15}
          />

          <Text style={styles.label}>Vehicle Type *</Text>
          <View style={styles.vehicleTypeContainer}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.vehicleTypeButton,
                  vehicleType === type && styles.vehicleTypeSelected,
                ]}
                onPress={() => setVehicleType(type)}
              >
                <Text style={styles.vehicleTypeIcon}>
                  {VEHICLE_TYPES[type]?.icon || '🚗'}
                </Text>
                <Text
                  style={[
                    styles.vehicleTypeText,
                    vehicleType === type && styles.vehicleTypeTextSelected,
                  ]}
                >
                  {VEHICLE_TYPES[type]?.label || type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Driver Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver name"
            placeholderTextColor={COLORS.textMuted}
            value={driverName}
            onChangeText={setDriverName}
          />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text>📱</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Instant Share</Text>
            <Text style={styles.infoText}>
              Your ride details will be immediately shared with your emergency contacts via SMS with your current location.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📤</Text>
              <Text style={styles.buttonText}>Share Ride Details</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('RideHistory')}
        >
          <Text style={styles.linkButtonText}>View Ride History</Text>
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
    color: COLORS.primary,
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
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  vehicleTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleTypeSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: COLORS.accent,
  },
  vehicleTypeIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  vehicleTypeText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
  },
  vehicleTypeTextSelected: {
    color: COLORS.accent,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F1FF',
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
    color: COLORS.primary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.info,
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
    color: COLORS.info,
    fontSize: FONTS.base,
    fontWeight: FONTS.medium,
  },
  linkButtonArrow: {
    color: COLORS.info,
    fontSize: FONTS.base,
    marginLeft: SPACING.xs,
  },
});

export default RideEntryScreen;
