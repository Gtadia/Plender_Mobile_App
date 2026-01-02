import { colorTheme } from "@/constants/Colors";

const palette = colorTheme.catppuccin.latte;

export const listTheme = {
  colors: {
    card: "#ffffff",
    row: "#f7f7fb",
    divider: "rgba(0,0,0,0.08)",
    subtleText: palette.subtext0,
    secondaryText: palette.subtext1,
    emptyText: palette.subtext0,
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
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
