// Exact values pulled from jfb-dot-to-dot's own css/styles.css and js/app.js —
// this page intentionally matches the *source* app's look, not the shell's
// existing Mantine theme (src/theme/index.js is untouched; this is scoped
// entirely to DailyTrackingPage and its subcomponents).
export const COLORS = {
  primaryBlue: '#004682',
  primaryBlueDark: '#003366',
  secondaryGreen: '#007846',
  accentRed: '#B42828',
  lightGray: '#F5F5FA',
  mediumGray: '#E8E8ED',
  borderGray: '#DCDCE2',
  textDark: '#212121',
  textMedium: '#666666',
  textLight: '#999999',
  white: '#FFFFFF',
  warningBg: '#FFF3CD',
  warningBorder: '#FFE69C',
  warningText: '#856404',
  successGreen: '#28A745',
  recoveryBg: '#1a1a2e', // session-interrupted screen
  shiftEndBg: '#0F2744', // end-of-day screen
  shiftEndAccent: '#1A5CA8', // end-of-day "Confirm Shift End" button
}

export const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif"

// Same rotation jfb-dot-to-dot uses for delay-code category tiles
// (DotToDotApp.defaultColors in js/app.js).
export const CATEGORY_COLORS = [
  '#004682', '#2E8B57', '#4169E1',
  '#20B2AA', '#6B8E23', '#708090', '#5F9EA0',
  '#B44B1C', '#8B4513', '#6A5ACD', '#2F4F4F',
  '#D2691E', '#556B2F', '#8B0000', '#483D8B',
  '#008B8B', '#B8860B', '#4682B4', '#9932CC',
  '#3CB371', '#CD5C5C', '#4B0082', '#DC143C',
  '#00CED1',
]
