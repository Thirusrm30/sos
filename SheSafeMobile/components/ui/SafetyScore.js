import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, getSafetyColor, getSafetyLabel } from '../../utils/constants';

const SafetyScore = ({ score, size = 'medium', showLabel = true, showProgress = true }) => {
  const color = getSafetyColor(score);
  const label = getSafetyLabel(score);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          score: styles.smallScore,
          label: styles.smallLabel,
          barHeight: 6,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          score: styles.largeScore,
          label: styles.largeLabel,
          barHeight: 12,
        };
      default:
        return {
          container: styles.mediumContainer,
          score: styles.mediumScore,
          label: styles.mediumLabel,
          barHeight: 8,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Score</Text>
        {showLabel && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, sizeStyles.score, { color }]}>{score}</Text>
        <Text style={styles.max}>/100</Text>
      </View>
      
      {showProgress && (
        <View style={[styles.progressBar, { height: sizeStyles.barHeight }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${score}%`, backgroundColor: color }
            ]} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    color: COLORS.textInverse,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  score: {
    fontWeight: FONTS.bold,
  },
  max: {
    fontSize: FONTS.md,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  progressBar: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // Sizes
  smallContainer: {
    padding: SPACING.sm,
  },
  smallScore: {
    fontSize: FONTS.xl,
  },
  smallLabel: {
    fontSize: FONTS.xs,
  },
  
  mediumContainer: {},
  mediumScore: {
    fontSize: FONTS['2xl'],
  },
  mediumLabel: {
    fontSize: FONTS.sm,
  },
  
  largeContainer: {
    padding: SPACING.lg,
  },
  largeScore: {
    fontSize: FONTS['4xl'],
  },
  largeLabel: {
    fontSize: FONTS.base,
  },
});

export default SafetyScore;
