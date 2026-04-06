import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../utils/constants';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, success, danger, outline, ghost
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
        };
      case 'success':
        return {
          button: styles.successButton,
          text: styles.successText,
        };
      case 'danger':
        return {
          button: styles.dangerButton,
          text: styles.dangerText,
        };
      case 'outline':
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
        };
      case 'ghost':
        return {
          button: styles.ghostButton,
          text: styles.ghostText,
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: styles.smallButton,
          text: styles.smallText,
        };
      case 'large':
        return {
          button: styles.largeButton,
          text: styles.largeText,
        };
      default:
        return {
          button: styles.mediumButton,
          text: styles.mediumText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? COLORS.accent : COLORS.textInverse} 
          size="small" 
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Text style={[styles.icon, styles.iconLeft]}>{icon}</Text>
          )}
          <Text 
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Text style={[styles.icon, styles.iconRight]}>{icon}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.base,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONTS.semibold,
  },
  icon: {
    fontSize: 18,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },

  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.textInverse,
  },
  
  secondaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryText: {
    color: COLORS.textInverse,
  },
  
  successButton: {
    backgroundColor: COLORS.success,
  },
  successText: {
    color: COLORS.textInverse,
  },
  
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  dangerText: {
    color: COLORS.textInverse,
  },
  
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineText: {
    color: COLORS.accent,
  },
  
  ghostButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostText: {
    color: COLORS.accent,
  },

  // Sizes
  smallButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  smallText: {
    fontSize: FONTS.sm,
  },
  
  mediumButton: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  mediumText: {
    fontSize: FONTS.base,
  },
  
  largeButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  largeText: {
    fontSize: FONTS.lg,
  },

  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});

export default Button;
