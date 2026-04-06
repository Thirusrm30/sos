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
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getTripHistory } from '../services/tripService';

const TripHistoryScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const result = await getTripHistory();
      if (result.success) {
        setTrips(result.trips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
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

  const getStatusBadge = (status, isMarkedSafe) => {
    if (isMarkedSafe) {
      return { text: '✅ Safe', color: COLORS.success, bg: '#DCFCE7' };
    }
    if (status === 'alerted') {
      return { text: '🚨 Alert', color: COLORS.danger, bg: '#FEE2E2' };
    }
    if (status === 'active') {
      return { text: '🟢 Active', color: COLORS.success, bg: '#DCFCE7' };
    }
    return { text: '❌ Completed', color: COLORS.textMuted, bg: COLORS.surfaceSecondary };
  };

  const getDuration = (startedAt, endedAt) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = Math.floor((end - start) / (1000 * 60));
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const renderTripItem = ({ item }) => {
    const badge = getStatusBadge(item.status, item.isMarkedSafe);

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => {
          if (item.status === 'active') {
            Alert.alert(
              'Active Trip',
              'This trip is currently active. Go to Active Trip screen?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go',
                  onPress: () => navigation.navigate('ActiveTrip', {
                    tripId: item.tripId,
                    trackingLink: `http://localhost:3001/track/${item.tripId}`,
                    destination: item.destination?.address || 'Unknown',
                  }),
                },
              ]
            );
          }
        }}
      >
        <View style={styles.tripHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
          <Text style={styles.duration}>{getDuration(item.startedAt, item.endedAt)}</Text>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🚗</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationText}>
                {item.origin?.address || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🏁</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationText}>
                {item.destination?.address || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Started</Text>
            <Text style={styles.footerValue}>{formatDate(item.startedAt)}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Ended</Text>
            <Text style={styles.footerValue}>{formatDate(item.endedAt)}</Text>
          </View>
        </View>

        <View style={styles.tripIdRow}>
          <Text style={styles.tripIdLabel}>Trip ID:</Text>
          <Text style={styles.tripIdValue}>{item.tripId.substring(0, 8)}...</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'} recorded
        </Text>
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.tripId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No trips recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Start your first trip to see it here
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.newTripButton}
        onPress={() => navigation.navigate('StartTrip')}
      >
        <Text style={styles.newTripButtonText}>+ Start New Trip</Text>
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
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.base,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  duration: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  tripDetails: {
    marginBottom: SPACING.base,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  locationText: {
    fontSize: FONTS.sm,
    color: COLORS.text,
    fontWeight: FONTS.medium,
  },
  tripFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.base,
    marginBottom: SPACING.sm,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: FONTS.sm,
    color: COLORS.text,
  },
  tripIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIdLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  tripIdValue: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
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
  },
  newTripButton: {
    backgroundColor: COLORS.accent,
    margin: SPACING.lg,
    marginTop: 0,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.base,
  },
  newTripButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
});

export default TripHistoryScreen;
