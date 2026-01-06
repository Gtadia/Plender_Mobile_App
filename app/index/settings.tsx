import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { observer } from '@legendapp/state/react';
import { AntDesign } from '@expo/vector-icons';
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

const resolveSystemTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Timezone';
  } catch (err) {
    return 'Local Timezone';
  }
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
  const systemTimezone = resolveSystemTimezone();
  const timezoneMode = settings$.general.timezoneMode.get();
  const isAutoTimezone = timezoneMode === 'auto';
  const timezoneLabel = isAutoTimezone ? systemTimezone : settings$.general.timezone.get();

  const RowIcon = ({ name }: { name: keyof typeof AntDesign.glyphMap }) => (
    <View style={[listStyles.iconBadge, { backgroundColor: withOpacity(accent, 0.14) }]}>
      <AntDesign name={name} size={16} color={accent} />
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
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="clockcircleo" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Automatic Timezone
                </Text>
              </View>
              <Switch
                value={isAutoTimezone}
                onValueChange={(value) =>
                  settings$.general.timezoneMode.set(value ? 'auto' : 'manual')
                }
                trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                thumbColor={isAutoTimezone ? accent : palette.surface0}
              />
            </View>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={[listStyles.row, isAutoTimezone && listStyles.rowDisabled]}
              onPress={() => {
                if (!isAutoTimezone) router.push('/settingsTimezoneSelect');
              }}
            >
              <View style={listStyles.rowLeft}>
                <RowIcon name="earth" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Timezone
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Text style={[listStyles.rowValue, { color: subtext0 }]}>{timezoneLabel}</Text>
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
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
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Tasks</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="rocket1" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Allow "Quick Tasks"
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Quick Tasks",
                      "Quick Tasks let you start tracking without filling out details. You can add the title, category, and goal later.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <AntDesign name="infocirlceo" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.general.allowQuickTasks.get()}
                  onValueChange={(value) => settings$.general.allowQuickTasks.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={settings$.general.allowQuickTasks.get() ? accent : palette.surface0}
                />
              </View>
            </View>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Behavior</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="piechart" />
                <Text style={[listStyles.rowLabel, styles.wrapLabel]} fontColor="strong">
                  Hide Goal Ring When Complete
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Pressable
                  onPress={() =>
                    openInfo(
                      "Hide Goal Ring When Complete",
                      "When enabled, the goal ring disappears once all category goals for the day are complete.",
                    )
                  }
                  hitSlop={8}
                  style={styles.infoButton}
                >
                  <AntDesign name="infocirlceo" size={14} color={subtext0} />
                </Pressable>
                <Switch
                  value={settings$.productivity.hideGoalRingOnComplete.get()}
                  onValueChange={(value) => settings$.productivity.hideGoalRingOnComplete.set(value)}
                  trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                  thumbColor={
                    settings$.productivity.hideGoalRingOnComplete.get() ? accent : palette.surface0
                  }
                />
              </View>
            </View>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="dashboard" />
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
                  <AntDesign name="infocirlceo" size={14} color={subtext0} />
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
                <RowIcon name="skin" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Select Theme
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <Text style={[listStyles.rowValue, { color: subtext0 }]}>{themeLabel}</Text>
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable style={listStyles.row} onPress={() => router.push('/settingsAccentSelect')}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="star" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Accent Color
                </Text>
              </View>
              <View style={listStyles.rowRight}>
                <View
                  style={[listStyles.accentPreview, { backgroundColor: accent, borderColor: dividerColor }]}
                />
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>

          <SettingsCard style={listStyles.card}>
            <Text style={[listStyles.subsectionTitle, { color: subtext1 }]}>Extra Features</Text>
            <View style={listStyles.row}>
              <View style={listStyles.rowLeft}>
                <RowIcon name="filter" />
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
                <RowIcon name="bells" />
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Enable Notifications
                </Text>
              </View>
              <Switch
                value={settings$.productivity.notificationsEnabled.get()}
                onValueChange={(value) => settings$.productivity.notificationsEnabled.set(value)}
                trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                thumbColor={settings$.productivity.notificationsEnabled.get() ? accent : palette.surface0}
              />
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
