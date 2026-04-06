import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { acceptBuddy, getMatches, getUserId } from '../services/buddyService';

const BuddyMatchesScreen = ({ navigation, route }) => {
  const { requestId, matches, origin, destination } = route.params;
  const [loading, setLoading] = useState(false);

  const handleConnect = async (matchedRequestId, matchedUserName) => {
    setLoading(true);
    try {
      const result = await acceptBuddy(requestId, matchedRequestId);

      if (result.success) {
        Alert.alert(
          '🎉 Match Accepted!',
          `You are now connected with ${matchedUserName}. Start chatting!`,
          [
            {
              text: 'Start Chat',
              onPress: () => {
                navigation.navigate('Chat', {
                  matchId: result.matchId,
                  partnerName: matchedUserName
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to connect');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect with buddy');
    } finally {
      setLoading(false);
    }
  };

  const renderMatchItem = ({ item }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{item.userName}</Text>
          <View style={styles.matchDetails}>
            <Text style={styles.matchDetail}>
              📍 {item.originDistance} km away
            </Text>
            <Text style={styles.matchDetail}>
              🎯 {item.destinationDistance} km to dest
            </Text>
          </View>
        </View>
        <View style={styles.matchScore}>
          <Text style={styles.matchPercentage}>{item.matchPercentage}%</Text>
          <Text style={styles.matchLabel}>Match</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routePoint}>
          <Text style={styles.routeLabel}>From:</Text>
          <Text style={styles.routeAddress} numberOfLines={1}>
            {item.origin?.address || 'Origin'}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Text style={styles.routeLabel}>To:</Text>
          <Text style={styles.routeAddress} numberOfLines={1}>
            {item.destination?.address || 'Destination'}
          </Text>
        </View>
        <View style={styles.routeTime}>
          <Text style={styles.routeTimeLabel}>Departure:</Text>
          <Text style={styles.routeTimeValue}>
            {new Date(item.departureTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.connectButton, loading && styles.connectButtonDisabled]}
        onPress={() => handleConnect(item.requestId, item.userName)}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.connectButtonText}>🤝 Connect</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buddy Matches</Text>
        <Text style={styles.headerSubtitle}>
          Found {matches.length} potential buddy{matches.length !== 1 ? 'ies' : ''}
        </Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.requestId}
        renderItem={renderMatchItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your route or departure time
            </Text>
          </View>
        }
      />
    </View>
  );
};

export const MyMatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const result = await getMatches(getUserId());
      if (result.success) {
        setMatches(result.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMatchItem = ({ item }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.partnerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{item.partnerName}</Text>
          <Text style={styles.matchDetail}>
            🕐 Departure:{' '}
            {new Date(item.departureTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <Text style={styles.routeLabel}>Route:</Text>
        <Text style={styles.routeAddress} numberOfLines={1}>
          {item.origin?.address || 'Origin'} → {item.destination?.address || 'Destination'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() =>
          navigation.navigate('Chat', {
            matchId: item.matchId,
            partnerName: item.partnerName,
          })
        }
        activeOpacity={0.8}
      >
        <Text style={styles.connectButtonText}>💬 Chat</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} active buddy{matches.length !== 1 ? 'ies' : ''}
        </Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.matchId}
        renderItem={renderMatchItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>
              Find a buddy to start traveling together safely
            </Text>
          </View>
        }
      />
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
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.base,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  matchDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  matchDetail: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.base,
  },
  matchScore: {
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
  },
  matchPercentage: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: '#03543F',
  },
  matchLabel: {
    fontSize: FONTS.xs,
    color: '#03543F',
  },
  routeInfo: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  routePoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  routeLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
    width: 60,
  },
  routeAddress: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.text,
  },
  routeTime: {
    flexDirection: 'row',
    marginTop: 4,
  },
  routeTimeLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
    width: 80,
  },
  routeTimeValue: {
    fontSize: FONTS.sm,
    color: COLORS.text,
    fontWeight: FONTS.semibold,
  },
  connectButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  connectButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  connectButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  emptyContainer: {
    padding: SPACING['3xl'],
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.base,
  },
  emptyText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default BuddyMatchesScreen;
