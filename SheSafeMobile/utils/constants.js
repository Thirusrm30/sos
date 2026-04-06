// API Configuration
import { getApiUrl } from '../config/env';
import THEME_COLORS from '../theme/colors';
export const API_URL = getApiUrl();

// SOS Configuration
export const COUNTDOWN_SECONDS = 5;
export const LOCATION_UPDATE_INTERVAL = 60000;
export const CHECKIN_INTERVAL = 30 * 60 * 1000; // 30 minutes
export const MAX_MISSED_CHECKINS = 2;

// ============================================
// DESIGN SYSTEM - SheSafe Theme
// ============================================

export const COLORS = {
  // Primary Colors (Purple)
  primary: THEME_COLORS.primary,
  primaryLight: THEME_COLORS.primaryLight,
  primaryDark: THEME_COLORS.primaryDark,
  
  // Secondary Colors (Light Purple)
  secondary: THEME_COLORS.secondary,
  secondaryLight: THEME_COLORS.secondaryLight,
  secondaryDark: THEME_COLORS.secondaryDark,
  
  // Accent Colors (Purple)
  accent: THEME_COLORS.accent,
  accentLight: THEME_COLORS.accentLight,
  accentDark: THEME_COLORS.accentDark,
  
  // Warning / Caution
  warning: THEME_COLORS.warning,
  warningLight: THEME_COLORS.warningLight,
  warningDark: THEME_COLORS.warningDark,
  
  // Neutral Colors
  background: THEME_COLORS.background,
  backgroundDark: THEME_COLORS.backgroundDark,
  surface: THEME_COLORS.surface,
  surfaceSecondary: THEME_COLORS.surfaceSecondary,
  
  // Text Colors
  text: THEME_COLORS.text,
  textSecondary: THEME_COLORS.textSecondary,
  textMuted: THEME_COLORS.textMuted,
  textInverse: THEME_COLORS.textInverse,
  
  // Border Colors
  border: THEME_COLORS.border,
  borderLight: THEME_COLORS.borderLight,
  
  // Status Colors
  danger: THEME_COLORS.danger,
  success: THEME_COLORS.success,
  info: THEME_COLORS.info,
  warningStatus: THEME_COLORS.warning,
  
  // Incident Colors (for map)
  incidentHarassment: THEME_COLORS.incidentHarassment,
  incidentLighting: THEME_COLORS.incidentLighting,
  incidentRoad: THEME_COLORS.incidentRoad,
  incidentSuspicious: THEME_COLORS.incidentSuspicious,
  incidentOther: THEME_COLORS.incidentOther,
  
  // Overlay
  overlay: THEME_COLORS.overlay,
  overlayLight: THEME_COLORS.overlayLight,
};

// ============================================
// TYPOGRAPHY
// ============================================

export const FONTS = {
  // Font Sizes
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  
  // Font Weights
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// ============================================
// SPACING
// ============================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

// ============================================
// BORDER RADIUS
// ============================================

export const RADIUS = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  sos: {
    shadowColor: THEME_COLORS.sosPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
};

// ============================================
// COMPONENT STYLES
// ============================================

export const BUTTON_STYLES = {
  // Primary Button
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Secondary Button
  secondary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Success Button
  success: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Outline Button
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Ghost Button
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// ============================================
// INPUT STYLES
// ============================================

export const INPUT_STYLES = {
  default: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: 14,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  
  focused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
  },
  
  error: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.surface,
  },
};

// ============================================
// CARD STYLES
// ============================================

export const CARD_STYLES = {
  default: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    ...SHADOWS.base,
  },
  
  elevated: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  
  flat: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
  },
};

// ============================================
// ANIMATION
// ============================================

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ============================================
// INCIDENT COLORS MAP
// ============================================

export const INCIDENT_COLORS = {
  'Harassment': COLORS.incidentHarassment,
  'Poor Lighting': COLORS.incidentLighting,
  'Unsafe Road': COLORS.incidentRoad,
  'Suspicious Activity': COLORS.incidentSuspicious,
  'Other': COLORS.incidentOther,
};

// ============================================
// SAFETY SCORE HELPERS
// ============================================

export const getSafetyColor = (score) => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warningLight;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
};

export const getSafetyLabel = (score) => {
  if (score >= 80) return 'Very Safe';
  if (score >= 60) return 'Safe';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Caution';
  return 'High Risk';
};

// ============================================
// VEHICLE TYPES
// ============================================

export const VEHICLE_TYPES = {
  Cab: { icon: '🚕', label: 'Cab' },
  Auto: { icon: '🛺', label: 'Auto' },
  Bus: { icon: '🚌', label: 'Bus' },
  Other: { icon: '🚗', label: 'Other' },
};

// ============================================
// EXPORT DEFAULT THEME OBJECT
// ============================================

export const THEME = {
  colors: COLORS,
  fonts: FONTS,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  buttons: BUTTON_STYLES,
  inputs: INPUT_STYLES,
  cards: CARD_STYLES,
  animation: ANIMATION,
  incidentColors: INCIDENT_COLORS,
  getSafetyColor,
  getSafetyLabel,
  vehicleTypes: VEHICLE_TYPES,
};

export default THEME;
