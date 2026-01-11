import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { observer } from '@legendapp/state/react';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { settings$, styling$, themeTokens$ } from '@/utils/stateManager';
import { themeOptions } from '@/constants/themes';
import { ScreenHeader } from '@/components/ScreenHeader';
import { globalTheme } from '@/constants/globalThemeVar';
import { getListTheme } from '@/constants/listTheme';
import { SettingsCard } from '@/components/SettingsCard';
import { createSettingsListStyles } from '@/constants/listStyles';

const withOpacity = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const SettingsScreen = observer(() => {
  const router = useRouter();
  const themeKey = settings$.personalization.theme.get();
  const { palette, colors, isDark } = themeTokens$.get();
  const accent = colors.accent;
  const blurEnabled = styling$.tabBarBlurEnabled.get();
  const themeLabel = themeOptions.find((option) => option.key === themeKey)?.label ?? "Light";

  const subtext0 = colors.subtext0;
  const subtext1 = colors.subtext1;
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;

  const RowIcon = ({ name }: { name: React.ComponentProps<typeof FontAwesome6>["name"] }) => (
    <View style={[listStyles.iconBadge, { backgroundColor: withOpacity(accent, 0.14) }]}>
      <FontAwesome6 name={name} size={14} color={accent} />
    </View>
  );
  const MaterialRowIcon = ({ name }: { name: React.ComponentProps<typeof MaterialIcons>["name"] }) => (
    <View style={[listStyles.iconBadge, { backgroundColor: withOpacity(accent, 0.14) }]}>
      <MaterialIcons name={name} size={14} color={accent} />
    </View>
  );

  const openInfo = (title: string, body: string) => {
    router.push({ pathname: "/(overlays)/settingsInfoSheet", params: { title, body } });
  };

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            General
          </Text>
          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Date &amp; Time</Text>
            <Pressable style={listStyles.row} onPress={() => router.push('/settingsWeekStartSelect')}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="calendar" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Start Week On
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Text style={[listStyles.rowValue, { color: subtext0 }]}>
                  {settings$.general.startWeekOn.get()}
                </Text>
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Tasks</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="bolt" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Allow "Quick Tasks"
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Quick Tasks",
                      "Quick Tasks can be created with no title or time goal. They run only today, default to General, and can be assigned to any category.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <FontAwesome6 name="circle-info" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.general.allowQuickTasks.get()}
                  onValueChange={(value) => settings$.general.allowQuickTasks.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={settings$.general.allowQuickTasks.get() ? accent : palette.surface0}
                />
              </View>
            </View>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={listStyles.row}
              onPress={() => router.push('/(settings)/settingsCategories')}
            >
              <View style={listStyles.rowLeft}>
                <RowIcon name="tags" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Modify Categories
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={listStyles.row}
              onPress={() => router.push('/(settings)/settingsCategoryReassign')}
            >
              <View style={listStyles.rowLeft}>
                <RowIcon name="right-left" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Reassign Category Tasks
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Behavior</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="gauge" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Cap Category Completion
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Cap Category Completion",
                      "Counts completion per task up to its time goal. Example: two 1‑hour tasks means the category reaches 50% when one task hits 1 hour, even if you keep working on it.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <FontAwesome6 name="circle-info" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.productivity.capCategoryCompletion.get()}
                  onValueChange={(value) => settings$.productivity.capCategoryCompletion.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={
                    settings$.productivity.capCategoryCompletion.get() ? accent : palette.surface0
                  }
                />
              </View>
            </View>
          </SettingsCard>
        </View>

        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Personalization
          </Text>
          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Theme</Text>
            <Pressable style={listStyles.row} onPress={() => router.push('/settingsThemeSelect')}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="paintbrush" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Select Theme
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Text style={[listStyles.rowValue, { color: subtext0 }]}>{themeLabel}</Text>
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable style={listStyles.row} onPress={() => router.push('/settingsAccentSelect')}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="palette" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Accent Color
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <View
                  style={[listStyles.accentPreview, { backgroundColor: accent, borderColor: dividerColor }]}
                />
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>

            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="square" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Apply Tint to Banner
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Banner Tint",
                      "Adds a subtle tint overlay to the home banner for better readability.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <FontAwesome6 name="circle-info" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.personalization.bannerTintEnabled.get()}
                  onValueChange={(value) => settings$.personalization.bannerTintEnabled.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={
                    settings$.personalization.bannerTintEnabled.get() ? accent : palette.surface0
                  }
                />
              </View>
            </View>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="circle" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Apply Tint to Buttons
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Button Tint",
                      "Uses a high-contrast icon color for circular accent buttons like the create button, submit button, and header check buttons.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <FontAwesome6 name="circle-info" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.personalization.buttonTintEnabled.get()}
                  onValueChange={(value) => settings$.personalization.buttonTintEnabled.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={
                    settings$.personalization.buttonTintEnabled.get() ? accent : palette.surface0
                  }
                />
              </View>
            </View>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Layout</Text>
            <Pressable style={listStyles.row} onPress={() => router.push('/(settings)/settingsCreateActionOrder')}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="bars-staggered" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Reorder Create Buttons
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Reorder Create Buttons",
                      "Customize the order of the Date, Time Goal, Category, and Quick Task buttons in the create sheet.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <FontAwesome6 name="circle-info" size={14} color={subtext0} />
                </Pressable>
                <FontAwesome6 name="chevron-right" size={12} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Extra Features</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="wand-magic-sparkles" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Blur Backgrounds
                </Text>
              </View>
              <Switch
                value={blurEnabled}
                onValueChange={(value) => styling$.tabBarBlurEnabled.set(value)}
                trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                thumbColor={blurEnabled ? accent : palette.surface0}
              />
            </View>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="mug-hot" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Show Support Page
                </Text>
              </View>
              <Switch
                value={settings$.general.showSupportPage.get()}
                onValueChange={(value) => settings$.general.showSupportPage.set(value)}
                trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                thumbColor={settings$.general.showSupportPage.get() ? accent : palette.surface0}
              />
            </View>
          </SettingsCard>

        </View>

        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Productivity
          </Text>
          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Notifications</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <MaterialRowIcon name="notifications-none" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Notifications coming soon!
                </Text>
              </View>
            </View>
          </SettingsCard>
        </View>

        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>

    </ScreenView>
  );
});

export default SettingsScreen;

const styles = StyleSheet.create({
  infoButton: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  wrapLabel: {
    flexShrink: 1,
    flexWrap: "wrap",
  },
});
