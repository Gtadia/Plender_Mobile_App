import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { observer } from '@legendapp/state/react';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { settings$, themeTokens$ } from '@/utils/stateManager';
import { themeOptions } from '@/constants/themes';
import { ScreenHeader } from '@/components/ScreenHeader';
import { globalTheme, horizontalPadding } from '@/constants/globalThemeVar';

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
  const themeLabel = themeOptions.find((option) => option.key === themeKey)?.label ?? "Light";

  const subtext0 = colors.subtext0;
  const subtext1 = colors.subtext1;
  const surface0 = colors.surface0;
  const surface2 = palette.surface2;
  const cardTint = isDark
    ? withOpacity(surface2, 0.4)
    : withOpacity(surface0, 0.6);
  const dividerColor = withOpacity(subtext0, 0.18);
  const systemTimezone = resolveSystemTimezone();
  const timezoneMode = settings$.general.timezoneMode.get();
  const isAutoTimezone = timezoneMode === 'auto';
  const timezoneLabel = isAutoTimezone ? systemTimezone : settings$.general.timezone.get();

  const RowIcon = ({ name }: { name: keyof typeof AntDesign.glyphMap }) => (
    <View style={[styles.iconBadge, { backgroundColor: withOpacity(accent, 0.14) }]}>
      <AntDesign name={name} size={16} color={accent} />
    </View>
  );

  return (
    <ScreenView style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} fontColor="strong">
            General
          </Text>
          <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
            <Text style={[styles.subsectionTitle, { color: subtext1 }]}>Date &amp; Time</Text>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <RowIcon name="clockcircleo" />
                <Text style={styles.rowLabel} fontColor="strong">
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
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={[styles.row, isAutoTimezone && styles.rowDisabled]}
              onPress={() => {
                if (!isAutoTimezone) router.push('/settingsTimezoneSelect');
              }}
            >
              <View style={styles.rowLeft}>
                <RowIcon name="earth" />
                <Text style={styles.rowLabel} fontColor="strong">
                  Timezone
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: subtext0 }]}>{timezoneLabel}</Text>
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <Pressable style={styles.row} onPress={() => router.push('/settingsWeekStartSelect')}>
              <View style={styles.rowLeft}>
                <RowIcon name="calendar" />
                <Text style={styles.rowLabel} fontColor="strong">
                  Start Week On
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: subtext0 }]}>
                  {settings$.general.startWeekOn.get()}
                </Text>
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
            <Text style={[styles.subsectionTitle, { color: subtext1 }]}>Tasks</Text>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <RowIcon name="rocket1" />
                <Text style={styles.rowLabel} fontColor="strong">
                  Allow "Quick Tasks"
                </Text>
              </View>
              <Switch
                value={settings$.general.allowQuickTasks.get()}
                onValueChange={(value) => settings$.general.allowQuickTasks.set(value)}
                trackColor={{ false: withOpacity(subtext0, 0.3), true: withOpacity(accent, 0.45) }}
                thumbColor={settings$.general.allowQuickTasks.get() ? accent : palette.surface0}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} fontColor="strong">
            Personalization
          </Text>
          <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
            <Text style={[styles.subsectionTitle, { color: subtext1 }]}>Theme</Text>
            <Pressable style={styles.row} onPress={() => router.push('/settingsThemeSelect')}>
              <View style={styles.rowLeft}>
                <RowIcon name="skin" />
                <Text style={styles.rowLabel} fontColor="strong">
                  Select Theme
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: subtext0 }]}>{themeLabel}</Text>
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <Pressable style={styles.row} onPress={() => router.push('/settingsAccentSelect')}>
              <View style={styles.rowLeft}>
                <RowIcon name="star" />
                <Text style={styles.rowLabel} fontColor="strong">
                  Accent Color
                </Text>
              </View>
              <View style={styles.rowRight}>
                <View
                  style={[styles.accentPreview, { backgroundColor: accent, borderColor: dividerColor }]}
                />
                <AntDesign name="right" size={14} color={subtext0} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} fontColor="strong">
            Productivity
          </Text>
          <View style={[styles.card, { backgroundColor: cardTint, borderColor: dividerColor }]}>
            <Text style={[styles.subsectionTitle, { color: subtext1 }]}>Notifications</Text>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <RowIcon name="bells" />
                <Text style={styles.rowLabel} fontColor="strong">
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
          </View>
        </View>

        <View style={globalTheme.tabBarAvoidingPadding} />
      </ScrollView>
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: horizontalPadding,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
    paddingHorizontal: 6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  divider: {
    height: 1,
    marginHorizontal: 6,
  },
  groupDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 6,
  },
  accentPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingsScreen;
