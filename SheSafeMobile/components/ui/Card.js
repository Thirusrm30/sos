import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../utils/constants';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  variant = 'default', // default, elevated, flat, highlighted
  style,
  titleStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'flat':
        return styles.flat;
      case 'highlighted':
        return styles.highlighted;
      default:
        return styles.default;
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), style]}>
      {(title || icon) && (
        <View style={styles.header}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <View style={styles.titleContainer}>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...SHADOWS.base,
  },
  default: {},
  elevated: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  flat: {
    backgroundColor: COLORS.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  highlighted: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default Card;
