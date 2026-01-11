import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ScreenView, Text } from "@/components/Themed";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import { globalTheme } from "@/constants/globalThemeVar";
import { themeTokens$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";
import { useIAP, type Product } from "react-native-iap";

const SupportScreen = observer(() => {
  const { palette, isDark, colors } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const accent = colors.accent;
  const showIap = Platform.OS === "ios";
  const showBmac = Platform.OS === "android";

  const tipTiers = useMemo(
    () => [
      { sku: "tip_099", label: "Small tip", thanks: "Thanks for the $0.99 tip!" },
      { sku: "tip_299", label: "Medium tip", thanks: "Thanks for the $2.99 tip!" },
      { sku: "tip_599", label: "Large tip", thanks: "Thanks for the $5.99 tip!" },
    ],
    []
  );
  const tipSkus = useMemo(() => tipTiers.map((tier) => tier.sku), [tipTiers]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: true });
      } catch {
        // Finish failures can be retried by StoreKit; still thank the user.
      }
      const match = tipTiers.find((tier) => tier.sku === purchase.productId);
      Alert.alert("Thanks!", match?.thanks ?? "Thanks for your support!");
    },
    onPurchaseError: (err) => {
      if (err.code === "E_USER_CANCELLED") return;
      Alert.alert("Purchase failed", err.message ?? "Please try again.");
    },
  });

  useEffect(() => {
    if (!showIap || !connected) return;
    let mounted = true;
    const loadProducts = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        await fetchProducts({ skus: tipSkus, type: "in-app" });
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err?.message ?? "Unable to load in-app products.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [connected, fetchProducts, showIap, tipSkus]);

  const productMap = useMemo(() => {
    return products.reduce<Record<string, Product>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [products]);

  const handleTip = useCallback(
    async (sku: string) => {
      try {
        await requestPurchase({ request: { apple: { sku } }, type: "in-app" });
      } catch (err: any) {
        if (err?.code === "E_USER_CANCELLED") return;
        Alert.alert("Purchase failed", err?.message ?? "Please try again.");
      }
    },
    [requestPurchase]
  );

  const openBmac = async () => {
    const url = "https://buymeacoffee.com/yourname";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
    Alert.alert("Unable to open link", "Please check the URL.");
  };

  return (
    <ScreenView style={globalTheme.container}>
      <ScreenHeader title="Support" />
      <ScrollView contentContainerStyle={listStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <SettingsCard style={listStyles.card}>
          <Text style={styles.title} fontColor="strong">
            Support Plender
          </Text>
          <Text style={[styles.body, { color: colors.subtext0 }]}>
            Thanks for using Plender. This page will let you support development and keep the app
            improving.
          </Text>
        </SettingsCard>
        <SettingsCard style={listStyles.card}>
          <Text style={styles.subtitle} fontColor="strong">
            Tip with in‑app purchase
          </Text>
          {showIap ? (
            <>
              <Text style={[styles.body, { color: colors.subtext0 }]}>
                In‑app purchases are disabled while running in Expo Go. Build a dev client to
                enable tipping.
              </Text>
              {errorMessage ? (
                <Text style={[styles.body, { color: colors.subtext0, marginTop: 8 }]}>
                  {errorMessage}
                </Text>
              ) : null}
              {!connected ? (
                <Text style={[styles.body, { color: colors.subtext0, marginTop: 8 }]}>
                  Connecting to the App Store…
                </Text>
              ) : null}
              <View style={styles.tierList}>
                {tipTiers.map((tier) => {
                  const product = productMap[tier.sku];
                  const label = product?.title ?? tier.label;
                  const price = product?.displayPrice ?? "";
                  const disabled = !connected || loading || !product;
                  return (
                    <Pressable
                      key={tier.sku}
                      style={[
                        styles.tierRow,
                        { borderColor: listTheme.colors.divider, opacity: disabled ? 0.6 : 1 },
                      ]}
                      disabled={disabled}
                      onPress={() => handleTip(tier.sku)}
                    >
                      <View>
                        <Text style={styles.tierLabel} fontColor="strong">
                          {label}
                        </Text>
                        <Text style={[styles.tierHint, { color: colors.subtext1 }]}>
                          {product?.description ?? "One‑time tip"}
                        </Text>
                      </View>
                      <Text style={styles.tierLabel} fontColor="strong">
                        {price || "—"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <Text style={[styles.body, { color: colors.subtext0 }]}>
              iOS tips are available through in‑app purchase.
            </Text>
          )}
        </SettingsCard>

        {showBmac ? (
          <SettingsCard style={listStyles.card}>
            <Text style={styles.subtitle} fontColor="strong">
              Buy Me a Coffee
            </Text>
            <Text style={[styles.body, { color: colors.subtext0 }]}>
              Android users can support the project here.
            </Text>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: accent }]}
              onPress={openBmac}
            >
              <Text style={[styles.primaryButtonText, { color: colors.textStrong }]}>
                Open Buy Me a Coffee
              </Text>
            </Pressable>
          </SettingsCard>
        ) : null}
      </ScrollView>
    </ScreenView>
  );
});

export default SupportScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  tierList: {
    marginTop: 6,
  },
  tierRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  tierHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
