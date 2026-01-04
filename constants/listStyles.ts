import { StyleSheet } from "react-native";
import { horizontalPadding } from "@/constants/globalThemeVar";
import { getListTheme } from "@/constants/listTheme";

type ListTheme = ReturnType<typeof getListTheme>;

export const createSettingsListStyles = (listTheme: ListTheme) => {
  const { settings } = listTheme.layout;
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: settings.scrollPaddingVertical,
      paddingHorizontal: horizontalPadding,
      gap: settings.scrollGap,
    },
    section: {
      gap: settings.sectionGap,
    },
    sectionTitle: {
      fontSize: settings.sectionTitleSize,
      fontWeight: settings.sectionTitleWeight as "700",
    },
    card: {
      borderRadius: settings.cardRadius,
      paddingVertical: settings.cardPaddingVertical,
      paddingHorizontal: settings.cardPaddingHorizontal,
      gap: settings.cardGap,
    },
    subsectionTitle: {
      fontSize: settings.subsectionTitleSize,
      fontWeight: settings.subsectionTitleWeight as "700",
      letterSpacing: settings.subsectionLetterSpacing,
      paddingHorizontal: settings.subsectionPaddingHorizontal,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: settings.rowPaddingVertical,
      gap: settings.rowGap,
      paddingHorizontal: settings.rowPaddingHorizontal,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: settings.rowLeftGap,
      flex: 1,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: settings.rowRightGap,
    },
    rowLabel: {
      fontSize: settings.rowLabelSize,
      fontWeight: settings.rowLabelWeight as "600",
    },
    rowValue: {
      fontSize: settings.rowValueSize,
      fontWeight: settings.rowValueWeight as "600",
    },
    rowDisabled: {
      opacity: 0.45,
    },
    divider: {
      height: 1,
      marginHorizontal: settings.dividerMarginHorizontal,
    },
    groupDivider: {
      height: 1,
      marginVertical: settings.groupDividerMarginVertical,
      marginHorizontal: settings.dividerMarginHorizontal,
    },
    accentPreview: {
      width: settings.accentPreviewSize,
      height: settings.accentPreviewSize,
      borderRadius: settings.accentPreviewRadius,
      borderWidth: 1,
    },
    iconBadge: {
      width: settings.iconBadgeSize,
      height: settings.iconBadgeSize,
      borderRadius: settings.iconBadgeRadius,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};

export const createSelectListStyles = (listTheme: ListTheme) => {
  const { select } = listTheme.layout;
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: horizontalPadding,
      paddingVertical: select.scrollPaddingVertical,
      paddingBottom: select.scrollPaddingBottom,
    },
    card: {
      borderRadius: select.cardRadius,
      paddingVertical: select.cardPaddingVertical,
      paddingHorizontal: select.cardPaddingHorizontal,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: select.rowPaddingVertical,
      paddingHorizontal: select.rowPaddingHorizontal,
      gap: select.rowGap,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: select.rowLeftGap,
    },
    rowLabel: {
      fontSize: select.rowLabelSize,
      fontWeight: select.rowLabelWeight as "600",
    },
    rowDivider: {
      borderBottomWidth: 1,
    },
    swatch: {
      width: select.swatchSize,
      height: select.swatchSize,
      borderRadius: select.swatchRadius,
      borderWidth: select.swatchBorderWidth,
    },
  });
};

export const createListSheetStyles = (listTheme: ListTheme) => {
  const { sheet } = listTheme.layout;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    background: {
      backgroundColor: "transparent",
      flex: 1,
    },
    container: {
      padding: sheet.containerPadding,
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: sheet.headerMarginBottom,
    },
    title: {
      fontWeight: sheet.titleWeight as "500",
      fontSize: sheet.titleSize,
    },
    subMenuContainer: {
      paddingHorizontal: sheet.subMenuPaddingHorizontal,
    },
    subMenu: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: sheet.subMenuPaddingVertical,
      marginTop: sheet.subMenuMarginTop,
    },
    subMenuText: {
      paddingLeft: sheet.subMenuTextPaddingLeft,
    },
    subMenuTextEnd: {
      paddingLeft: sheet.subMenuTextPaddingLeft,
      paddingRight: sheet.subMenuTextEndPaddingRight,
    },
    subMenuSquare: {
      borderRadius: sheet.subMenuRadius,
      marginBottom: sheet.subMenuMarginBottom,
    },
    subMenuSquarePadding: {
      paddingHorizontal: sheet.subMenuPaddingHorizontal,
      paddingVertical: sheet.subMenuPaddingVertical,
    },
    subMenuBar: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
    },
    menuText: {
      fontWeight: sheet.menuTextWeight as "500",
      fontSize: sheet.menuTextSize,
    },
    menuTextEnd: {
      fontWeight: sheet.menuTextSecondaryWeight as "300",
      fontSize: sheet.menuTextSize,
    },
    button: {},
    textInput: {
      fontSize: sheet.textInputSize,
      fontWeight: sheet.textInputWeight as "500",
    },
    paletteSwatch: {
      width: sheet.paletteSwatchSize,
      height: sheet.paletteSwatchSize,
      borderRadius: sheet.paletteSwatchRadius,
    },
  });
};
