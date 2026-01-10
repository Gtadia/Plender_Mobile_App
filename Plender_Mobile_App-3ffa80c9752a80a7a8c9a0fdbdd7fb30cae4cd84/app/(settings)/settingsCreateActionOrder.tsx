import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, ScreenView } from "@/components/Themed";
import { observer } from "@legendapp/state/react";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import { settings$, themeTokens$ } from "@/utils/stateManager";

type ActionKey = "date" | "time" | "category" | "quick";

const actionLabels: Record<ActionKey, string> = {
  date: "Date",
  time: "Time Goal",
  category: "Category",
  quick: "Quick Task",
};

const defaultOrder: ActionKey[] = ["date", "time", "category", "quick"];

const normalizeOrder = (order: string[] | undefined): ActionKey[] => {
  const normalized = (order ?? []).filter((item): item is ActionKey =>
    Object.prototype.hasOwnProperty.call(actionLabels, item)
  );
  const missing = defaultOrder.filter((item) => !normalized.includes(item));
  return [...normalized, ...missing];
};

const SettingsCreateActionOrderScreen = observer(() => {
  const router = useRouter();
  const { palette, colors, isDark } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const dividerColor = listTheme.colors.divider;
  const subtext0 = colors.subtext0;

  const order = normalizeOrder(settings$.personalization.createActionOrder.get());

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    settings$.personalization.createActionOrder.set(next);
  };

  return (
    <ScreenView style={listStyles.container}>
      <ScreenHeader title="Create Button Order" size="secondary" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle} fontColor="strong">
            Order
          </Text>
          <SettingsCard style={listStyles.card}>
            {order.map((item, index) => (
              <React.Fragment key={item}>
                <View style={listStyles.row}>
                  <View style={listStyles.rowLeft}>
                    <Text style={listStyles.rowLabel} fontColor="strong">
                      {actionLabels[item]}
                    </Text>
                  </View>
                  <View style={styles.orderControls}>
                    <Pressable
                      onPress={() => moveItem(index, -1)}
                      disabled={index === 0}
                      hitSlop={8}
                      style={styles.orderButton}
                    >
                      <FontAwesome6
                        name="chevron-up"
                        size={12}
                        color={index === 0 ? subtext0 : colors.text}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveItem(index, 1)}
                      disabled={index === order.length - 1}
                      hitSlop={8}
                      style={styles.orderButton}
                    >
                      <FontAwesome6
                        name="chevron-down"
                        size={12}
                        color={index === order.length - 1 ? subtext0 : colors.text}
                      />
                    </Pressable>
                  </View>
                </View>
                {index < order.length - 1 ? (
                  <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
                ) : null}
              </React.Fragment>
            ))}
            <View style={[listStyles.divider, { backgroundColor: dividerColor }]} />
            <Pressable
              style={listStyles.row}
              onPress={() => settings$.personalization.createActionOrder.set([...defaultOrder])}
            >
              <View style={listStyles.rowLeft}>
                <Text style={listStyles.rowLabel} fontColor="strong">
                  Reset Order
                </Text>
              </View>
              <View style={styles.orderControls}>
                <FontAwesome6 name="rotate-right" size={14} color={subtext0} />
              </View>
            </Pressable>
          </SettingsCard>
        </View>
      </ScrollView>
    </ScreenView>
  );
});

export default SettingsCreateActionOrderScreen;

const styles = StyleSheet.create({
  orderControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
