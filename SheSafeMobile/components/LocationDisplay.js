import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/constants';

const LocationDisplay = ({ location, error, onRefresh, loading }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Your Location</Text>
        {onRefresh && (
          <TouchableOpacity 
            onPress={onRefresh} 
            style={styles.refreshButton}
            disabled={loading}
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
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginTop: SPACING.lg,
    width: '100%',
    maxWidth: 350,
    ...SHADOWS.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  refreshText: {
    fontSize: FONTS.sm,
    color: COLORS.accent,
    fontWeight: FONTS.medium,
  },
  locationContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
  coordBox: {
    flex: 1,
  },
  coordLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  coordValue: {
    fontSize: FONTS.md,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
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
