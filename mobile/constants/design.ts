/**
 * Design tokens – spacing, radius, typography, shadows.
 * Use these across screens for a consistent, premium feel.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  /** Large hero / screen title */
  display: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  /** Section / card title */
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  /** Subsection */
  titleSmall: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  /** Body text */
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  /** Secondary / muted */
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  /** Labels, captions */
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  /** Button label */
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} as const;

export const Colors = {
  /** Primary brand – amber */
  primary: '#f59e0b',
  primaryDark: '#fbbf24',
  primaryLight: '#451a03',
  /** Surfaces – tuned for dark mode */
  background: '#000', // app background
  surface: '#1c1917', // main cards
  surfaceElevated: '#292524',
  /** Text */
  text: '#f5f5f4',
  textSecondary: '#e7e5e4',
  textMuted: '#a8a29e',
  /** Borders & dividers */
  border: '#44403c',
  borderLight: '#292524',
  /** Semantic */
  success: '#22c55e',
  error: '#f97373',
} as const;

/** Subtle card shadow (iOS-style) */
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
