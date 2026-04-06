// API Configuration
import { getApiUrl } from '../config/env';
export const API_URL = getApiUrl();

// SOS Configuration
export const COUNTDOWN_SECONDS = 5;
export const LOCATION_UPDATE_INTERVAL = 60000;

// ============================================
// DESIGN SYSTEM - SheSafe Theme
// ============================================

export const COLORS = {
  // Primary Colors
  primary: '#DC2626', // Red - SOS / Emergency
  primaryLight: '#EF4444',
  primaryDark: '#B91C1C',
  
  // Secondary Colors
  secondary: '#16A34A', // Green - Safe / Success
  secondaryLight: '#22C55E',
  secondaryDark: '#15803D',
  
  // Accent Colors
  accent: '#667EEA', // Indigo - Primary actions
  accentLight: '#818CF8',
  accentDark: '#4F46E5',
  
  // Warning / Caution
  warning: '#F59E0B', // Yellow/Orange
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  // Neutral Colors
  background: '#F8FAFC', // Light background
  backgroundDark: '#1E293B', // Dark mode (future)
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  
  // Text Colors
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Status Colors
  danger: '#EF4444',
  success: '#22C55E',
  info: '#3B82F6',
  warningStatus: '#F59E0B',
  
  // Incident Colors (for map)
  incidentHarassment: '#DC2626',
  incidentLighting: '#F59E0B',
  incidentRoad: '#F97316',
  incidentSuspicious: '#8B5CF6',
  incidentOther: '#6B7280',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
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
    shadowColor: '#DC2626',
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
