// ============================================
// SheSafe - Centralized Color Theme
// ============================================
// Calm · Trustworthy · Minimal · Easy to use under stress
// ============================================

const THEME_COLORS = {
  // Brand Colors
  primary: '#6C5CE7',       // Purple - Main brand / Primary actions
  primaryLight: '#A29BFE',  // Secondary purple - Lighter accents
  primaryDark: '#5A4BD1',   // Darker purple for pressed states

  secondary: '#A29BFE',     // Light purple - Secondary actions
  secondaryLight: '#C8C3FF',
  secondaryDark: '#8B83E0',

  // Accent (Pink)
  accent: '#6C5CE7',        // Maps to primary for consistent action buttons
  accentLight: '#A29BFE',
  accentDark: '#5A4BD1',

  // Danger / SOS (Red - Kept for emergencies)
  danger: '#FF3B30',
  dangerLight: '#FF6B61',
  dangerDark: '#D42F26',

  // Success (Green)
  success: '#00C853',
  successLight: '#69F0AE',
  successDark: '#00A344',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',

  // Info
  info: '#6C5CE7',          // Use primary purple for info too

  // SOS-specific
  sosPrimary: '#FF3B30',    // Large SOS button red
  sosGlow: 'rgba(255, 59, 48, 0.4)',

  // Surfaces
  background: '#F8F9FF',    // Soft lavender-white background
  backgroundDark: '#1E1E2C',
  surface: '#FFFFFF',       // Cards
  surfaceSecondary: '#F0F1FF', // Light purple tint for inputs / secondary surfaces

  // Text
  text: '#1E1E2C',
  textSecondary: '#6E6E8D',
  textMuted: '#9E9EB8',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E4E4F0',
  borderLight: '#F0F1FF',
  borderFocused: '#6C5CE7',

  // Incident Colors (for map)
  incidentHarassment: '#FF3B30',
  incidentLighting: '#F59E0B',
  incidentRoad: '#F97316',
  incidentSuspicious: '#6C5CE7',
  incidentOther: '#6E6E8D',

  // Overlay
  overlay: 'rgba(30, 30, 44, 0.5)',
  overlayLight: 'rgba(30, 30, 44, 0.3)',

  // FakeCall screen (dark theme)
  fakeCallBg: '#1E1E2C',
  fakeCallHeader: '#2D2D44',
};

export default THEME_COLORS;
