import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, VEHICLE_TYPES } from '../utils/constants';
import { getRideHistory, shareRide } from '../services/rideService';

const RideHistoryScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const result = await getRideHistory();
      if (result.success) {
        setRides(result.rides);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const handleShare = async (ride) => {
    Alert.alert(
      'Share Ride',
      `Resend ride details for ${ride.vehicleNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            setSharing(ride._id);
            try {
              const result = await shareRide(ride._id);
              if (result.success) {
                Alert.alert('✅ Sent!', 'Ride details shared with emergency contacts');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to share ride');
            } finally {
              setSharing(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRideItem = ({ item }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleIcon}>
            {VEHICLE_TYPES[item.vehicleType]?.icon || '🚗'}
          </Text>
          <View>
            <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
            <Text style={styles.vehicleType}>{item.vehicleType}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(item.sharedAt)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👤 Driver:</Text>
          <Text style={styles.detailValue}>{item.driverName}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.shareButton, sharing === item._id && styles.shareButtonDisabled]}
        onPress={() => handleShare(item)}
        disabled={sharing === item._id}
        activeOpacity={0.8}
      >
        {sharing === item._id ? (
          <ActivityIndicator color={COLORS.textInverse} size="small" />
        ) : (
          <>
            <Text style={styles.shareButtonIcon}>📤</Text>
            <Text style={styles.shareButtonText}>Share Again</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.info} />
        <Text style={styles.loadingText}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>
          {rides.length} {rides.length === 1 ? 'ride' : 'rides'} recorded
        </Text>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No rides recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first ride to share with emergency contacts
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.newRideButton}
        onPress={() => navigation.navigate('RideEntry')}
      >
        <Text style={styles.newRideButtonText}>+ Add New Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.base,
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
  },
  listContent: {
    padding: SPACING.base,
  },
  rideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  vehicleNumber: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  vehicleType: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.base,
  },
  details: {
    marginBottom: SPACING.base,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: FONTS.sm,
    color: COLORS.text,
    fontWeight: FONTS.medium,
    flex: 1,
  },
  shareButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  shareButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  shareButtonIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  shareButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SPACING.base,
  },
  emptyText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  newRideButton: {
    backgroundColor: COLORS.info,
    margin: SPACING.lg,
    marginTop: 0,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.base,
  },
  newRideButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
});

export default RideHistoryScreen;
