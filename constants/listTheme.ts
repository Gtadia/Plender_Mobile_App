import { colorTheme } from "@/constants/Colors";

type Palette = typeof colorTheme.catppuccin.latte;

export const getListTheme = (palette: Palette, isDark: boolean) => ({
  colors: {
    card: isDark ? palette.surface0 : "#ffffff",
    row: isDark ? palette.surface1 : palette.mantle,
    divider: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    subtleText: palette.subtext0,
    secondaryText: palette.subtext1,
    emptyText: palette.subtext0,
    text: palette.text,
    iconButton: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
  },
  spacing: {
    containerPadding: 12,
    sectionGap: 16,
    sectionPadding: 12,
    headerHorizontal: 6,
    headerVertical: 4,
    rowHorizontal: 6,
    rowVertical: 12,
    iconGap: 12,
  },
  radii: {
    section: 18,
    inner: 12,
    iconButton: 18,
  },
  sizes: {
    iconButton: 36,
  },
  typography: {
    sectionTitleSize: 18,
    sectionTitleWeight: "700",
    sectionPercentSize: 16,
    sectionPercentWeight: "700",
    sectionTotalsSize: 15,
    sectionTotalsWeight: "700",
    rowTitleSize: 16,
    rowTitleWeight: "700",
    rowSubSize: 13,
    rowTimeSize: 15,
    rowTimeWeight: "700",
    taskGoalSize: 14,
    taskGoalWeight: "600",
    rowPercentSize: 12,
    emptySize: 16,
  },
  shadow: {
    shadowOpacity: isDark ? 0.2 : 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
