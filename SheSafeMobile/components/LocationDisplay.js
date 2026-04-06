import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/constants';
import { reverseGeocode } from '../services/geocodingService';

const LocationDisplay = ({ location, error, onRefresh, loading }) => {
  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Try to reverse geocode when location changes
  useEffect(() => {
    if (location && location.lat && location.lng) {
      setLoadingAddress(true);
      reverseGeocode(location.lat, location.lng)
        .then(result => {
          if (result.success && mountedRef.current) {
            setAddress(result.data.formattedAddress);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mountedRef.current) setLoadingAddress(false);
        });
    }
  }, [location?.lat, location?.lng]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Your Location</Text>
        {onRefresh && (
          <TouchableOpacity 
            onPress={onRefresh} 
            style={styles.refreshButton}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={styles.refreshText}>⟳ Refresh</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : location ? (
        <View>
          {/* Address display */}
          {address && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
            </View>
          )}
          {loadingAddress && !address && (
            <View style={styles.addressLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.textMuted} />
              <Text style={styles.addressLoadingText}>Getting address...</Text>
            </View>
          )}
          {/* Coordinates */}
          <View style={styles.locationContainer}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{location.lat.toFixed(6)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{location.lng.toFixed(6)}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginTop: SPACING.base,
    width: '100%',
    maxWidth: 380,
    ...SHADOWS.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  refreshButton: {
    padding: SPACING.xs,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: FONTS.sm,
    color: COLORS.accent,
    fontWeight: FONTS.medium,
  },
  addressContainer: {
    backgroundColor: '#F0F1FF',
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  addressText: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: FONTS.medium,
    lineHeight: 18,
  },
  addressLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addressLoadingText: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
  },
  coordBox: {
    flex: 1,
  },
  coordLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.danger,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.base,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
});

export default LocationDisplay;
