import { createTheme } from "@mantine/core";

const ink = [
  "#FAFAFB",
  "#F4F5F6",
  "#EDEEF0",
  "#E5E7EA",
  "#D1D5D9",
  "#A4A9B0",
  "#7A8088",
  "#5A5F66",
  "#3B3F45",
  "#24272B",
];

export const theme = createTheme({
  colors: {
    gray: ink,
  },
  black: "#0E0F11",
  white: "#FFFFFF",

  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, Menlo, monospace",
  headings: {
    fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
  },

  radius: {
    sm: "4px",
    md: "6px",
    lg: "10px",
  },
  defaultRadius: "md",

  shadows: {
    sm: "0 1px 2px rgba(15,17,21,.06), 0 0 0 1px rgba(15,17,21,.04)",
    md: "0 4px 12px rgba(15,17,21,.08), 0 0 0 1px rgba(15,17,21,.04)",
    lg: "0 18px 40px rgba(15,17,21,.16)",
  },
});

// Daily Tracking screen's fixed brand skin (from the original jfb-dot-to-dot PWA).
// Consumed as flat inline-style values, not through Mantine's color/variant props,
// so it's kept separate from `theme.colors`/`theme.fontFamily` above rather than
// forced into Mantine's 10-shade color format.
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
  recoveryBg: '#1a1a2e',
  shiftEndBg: '#0F2744',
  shiftEndAccent: '#1A5CA8',
}

export const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif"

export const CATEGORY_COLORS = [
  '#004682', '#2E8B57', '#4169E1',
  '#20B2AA', '#6B8E23', '#708090', '#5F9EA0',
  '#B44B1C', '#8B4513', '#6A5ACD', '#2F4F4F',
  '#D2691E', '#556B2F', '#8B0000', '#483D8B',
  '#008B8B', '#B8860B', '#4682B4', '#9932CC',
  '#3CB371', '#CD5C5C', '#4B0082', '#DC143C',
  '#00CED1',
]
