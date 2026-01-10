import { colorTheme } from "@/constants/Colors";

const latte = colorTheme.catppuccin.latte;
const darkerLightPalette = {
  ...latte,
  theme: "catppuccin-latte-darker",
  base: latte.mantle,
  mantle: latte.crust,
  surface0: latte.surface1,
  surface1: latte.surface2,
  surface2: latte.overlay0,
  overlay0: latte.overlay1,
  overlay1: latte.overlay2,
  overlay2: latte.overlay2,
};

export const themeOptions = [
  { key: "dark", label: "Dark", palette: colorTheme.catppuccin.mocha, isDark: true },
  { key: "lighterDark", label: "Lighter Dark", palette: colorTheme.catppuccin.macchiato, isDark: true },
  { key: "light", label: "Light", palette: colorTheme.catppuccin.latte, isDark: false },
  { key: "darkerLight", label: "Darker Light", palette: darkerLightPalette, isDark: false },
] as const;

export type ThemeKey = (typeof themeOptions)[number]["key"];

export const accentKeys = [
  "rosewater",
  "flamingo",
  "pink",
  "mauve",
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "sky",
  "sapphire",
  "blue",
  "lavender",
] as const;

export type AccentKey = (typeof accentKeys)[number];

export const accentOpposites: Record<AccentKey, AccentKey> = {
  rosewater: "blue",
  flamingo: "sapphire",
  pink: "sky",
  mauve: "green",
  red: "teal",
  maroon: "yellow",
  peach: "lavender",
  yellow: "maroon",
  green: "mauve",
  teal: "red",
  sky: "pink",
  sapphire: "flamingo",
  blue: "rosewater",
  lavender: "peach",
};

export const getThemeTokens = (themeKey: ThemeKey, accentKey: AccentKey) => {
  const theme = themeOptions.find((option) => option.key === themeKey) ?? themeOptions[2];
  const palette = theme.palette;
  const accent = (palette as Record<string, string>)[accentKey] ?? palette.peach;
  const textStrong = theme.isDark ? "#ffffff" : "#000000";
  return { theme, palette, accent, textStrong };
};
