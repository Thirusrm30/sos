import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, INCIDENT_COLORS } from '../utils/constants';
import { getCurrentLocation } from '../services/locationService';
import { addAlert, getAllAlerts, upvoteAlert } from '../services/alertService';

const INCIDENT_TYPES = [
  { key: 'Harassment', label: 'Harassment', color: COLORS.incidentHarassment },
  { key: 'Poor Lighting', label: 'Poor Lighting', color: COLORS.incidentLighting },
  { key: 'Unsafe Road', label: 'Unsafe Road', color: COLORS.incidentRoad },
  { key: 'Suspicious Activity', label: 'Suspicious Activity', color: COLORS.incidentSuspicious },
  { key: 'Other', label: 'Other', color: COLORS.incidentOther },
];

// Default region (India center) so map shows immediately
const DEFAULT_REGION = {
  latitude: 13.0827,
  longitude: 80.2707,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const CommunityAlertsScreen = () => {
  const mapRef = useRef(null);
  const mountedRef = useRef(true);
  const [userLocation, setUserLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false); // Start false so UI shows instantly
  const [mapReady, setMapReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [incidentType, setIncidentType] = useState('Harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [upvoting, setUpvoting] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Show screen immediately, fetch data in background
    fetchDataInBackground();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDataInBackground = useCallback(async () => {
    // Fetch alerts and location in parallel - non-blocking
    const [alertsPromise, locationPromise] = [
      fetchAlerts(),
      getCurrentLocation().catch(() => null),
    ];

    const location = await locationPromise;
    if (location && mountedRef.current) {
      setUserLocation(location);
      // Animate map to user location after it's ready
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
    }

    await alertsPromise;
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const result = await getAllAlerts();
      if (result.success && mountedRef.current) {
        setAlerts(result.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      if (mountedRef.current) {
        setAlertsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    // If we already have user location, animate to it
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 300);
    }
  }, [userLocation]);

  const handleMapPress = useCallback((event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setModalVisible(true);
  }, []);

  const handleSubmitAlert = useCallback(async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      const result = await addAlert(
        incidentType,
        description.trim(),
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      if (result.success) {
        Alert.alert('✅ Alert Reported!', 'Thank you for making the community safer.');
        setModalVisible(false);
        setSelectedLocation(null);
        setDescription('');
        setIncidentType('Harassment');
        fetchAlerts(); // Refresh in background
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error submitting alert:', error);
      Alert.alert('Error', 'Failed to report incident');
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [selectedLocation, description, incidentType, fetchAlerts]);

  const handleUpvote = useCallback(async (alert) => {
    Alert.alert(
      'Confirm Alert',
      `Confirm this ${alert.type} alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpvoting(alert._id);
            try {
              const result = await upvoteAlert(alert._id);
              if (result.success) {
                Alert.alert('✅ Confirmed!', 'Alert has been confirmed');
                fetchAlerts(); // Refresh in background
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm');
            } finally {
              if (mountedRef.current) setUpvoting(null);
            }
          },
        },
      ]
    );
  }, [fetchAlerts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts();
  }, [fetchAlerts]);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 300);
    }
  }, [userLocation]);

  const getMarkerColor = useCallback((type) => {
    return INCIDENT_COLORS[type] || COLORS.incidentOther;
  }, []);

  const getIncidentLabel = useCallback((key) => {
    const type = INCIDENT_TYPES.find(t => t.key === key);
    return type?.label || key;
  }, []);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        showsMyLocationButton={true}
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.accent}
      >
        {alerts.map((alert) => (
          <Marker
            key={alert._id}
            coordinate={{
              latitude: alert.location.lat,
              longitude: alert.location.lng,
            }}
            pinColor={getMarkerColor(alert.type)}
            onPress={() => setSelectedAlert(alert)}
          >
            <View style={[styles.marker, { backgroundColor: getMarkerColor(alert.type) }]}>
              <Text style={styles.markerText}>
                {alert.upvotes > 1 ? alert.upvotes : '!'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay for alerts */}
      {alertsLoading && (
        <View style={styles.alertsLoadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.alertsLoadingText}>Loading alerts...</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.locationButton} 
        onPress={centerOnUserLocation}
        activeOpacity={0.7}
      >
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          {INCIDENT_TYPES.map((type) => (
            <View key={type.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: type.color }]} />
              <Text style={styles.legendText}>{type.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{alerts.length}</Text>
            <Text style={styles.statsLabel}>Active Alerts</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={styles.refreshButtonText}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsText}>
          👆 Tap anywhere on the map to report an incident
        </Text>
      </View>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>⚠️ Report Incident</Text>

              <Text style={styles.label}>Incident Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={incidentType}
                  onValueChange={setIncidentType}
                  style={styles.picker}
                >
                  {INCIDENT_TYPES.map((type) => (
                    <Picker.Item key={type.key} label={type.label} value={type.key} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the incident..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {selectedLocation && (
                <View style={styles.locationPreview}>
                  <Text style={styles.locationText}>
                    📍 {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                  </Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedLocation(null);
                    setDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.buttonDisabled]}
                  onPress={handleSubmitAlert}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alert Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedAlert}
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertDetailModal}>
            {selectedAlert && (
              <>
                <View
                  style={[
                    styles.alertTypeBadge,
                    { backgroundColor: getMarkerColor(selectedAlert.type) },
                  ]}
                >
                  <Text style={styles.alertTypeText}>{getIncidentLabel(selectedAlert.type)}</Text>
                </View>

                <Text style={styles.alertDescription}>{selectedAlert.description}</Text>

                <View style={styles.alertInfo}>
                  <Text style={styles.alertInfoText}>
                    📍 {selectedAlert.location.lat.toFixed(5)}, {selectedAlert.location.lng.toFixed(5)}
                  </Text>
                  <Text style={styles.alertInfoText}>
                    👍 {selectedAlert.upvotes} confirmations
                  </Text>
                  <Text style={styles.alertInfoText}>
                    🕐 {new Date(selectedAlert.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.confirmButton, upvoting === selectedAlert._id && styles.buttonDisabled]}
                  onPress={() => handleUpvote(selectedAlert)}
                  disabled={upvoting === selectedAlert._id}
                >
                  {upvoting === selectedAlert._id ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>👍 Confirm Alert</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedAlert(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  map: {
    flex: 1,
  },
  alertsLoadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  alertsLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  locationButtonText: {
    fontSize: 22,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.base,
  },
  markerText: {
    color: 'white',
    fontWeight: FONTS.bold,
    fontSize: 12,
  },
  legendCard: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  legendTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  legendItems: {},
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  legendText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
  },
  statsCard: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsItem: {
    marginRight: SPACING.base,
  },
  statsValue: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  statsLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    padding: SPACING.xs,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
  },
  instructionsCard: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.text,
    opacity: 0.9,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
  },
  instructionsText: {
    color: COLORS.textInverse,
    fontSize: FONTS.sm,
    textAlign: 'center',
    fontWeight: FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  pickerContainer: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    height: 100,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  locationPreview: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    marginTop: SPACING.base,
  },
  locationText: {
    fontSize: FONTS.sm,
    color: '#92400E',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.base,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  alertDetailModal: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.lg,
  },
  alertTypeBadge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  alertTypeText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  alertDescription: {
    fontSize: FONTS.base,
    color: COLORS.text,
    marginBottom: SPACING.base,
    textAlign: 'center',
  },
  alertInfo: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.base,
  },
  alertInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  closeButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
});

export default CommunityAlertsScreen;
