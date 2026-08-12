import { createTheme } from "@mantine/core";

const brandRed = [
  "#FDEDEE",
  "#FBDBDD",
  "#F7B7BB",
  "#F09499",
  "#E86B72",
  "#DE4249",
  "#D32129",
  "#B81C23",
  "#A8181F",
  "#7A1015",
];

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

const status = {
  pass: { fg: "#1E7A3D", bg: "#E6F4EC", border: "#B7DDC4" },
  warn: { fg: "#B5740A", bg: "#FBF1DD", border: "#E6CB87" },
  fail: { fg: "#D32129", bg: "#FBE6E7", border: "#EDB8BB" },
  review: { fg: "#1F4FA3", bg: "#E5EDFA", border: "#B7C8E6" },
  na: { fg: "#6B7177", bg: "#EEF0F2", border: "#E5E7EA" },
};


export const theme = createTheme({
  primaryColor: "brandRed",
  primaryShade: { light: 6, dark: 6 },
  colors: {
    brandRed,
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

  other: {
    status,
  },
});
