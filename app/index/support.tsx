import React from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ScreenView, Text } from "@/components/Themed";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsCard } from "@/components/SettingsCard";
import { getListTheme } from "@/constants/listTheme";
import { createSettingsListStyles } from "@/constants/listStyles";
import { globalTheme } from "@/constants/globalThemeVar";
import { themeTokens$ } from "@/utils/stateManager";
import { observer } from "@legendapp/state/react";
// import {
//   endConnection,
//   getProducts,
//   initConnection,
//   requestPurchase,
//   type Product,
// } from "react-native-iap";

const SupportScreen = observer(() => {
  const { palette, isDark, colors } = themeTokens$.get();
  const listTheme = getListTheme(palette, isDark);
  const listStyles = createSettingsListStyles(listTheme);
  const accent = colors.accent;
  const showBmac = Platform.OS === "android";

  // const tipTiers = useMemo(
  //   () => [
  //     { sku: "tip_099", thanks: "Thanks for the $0.99 tip!" },
  //     { sku: "tip_299", thanks: "Thanks for the $2.99 tip!" },
  //     { sku: "tip_599", thanks: "Thanks for the $5.99 tip!" },
  //   ],
  //   []
  // );
  // const [products, setProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState(false);
  // const [iapReady, setIapReady] = useState(true);
  // const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // useEffect(() => {
  //   let mounted = true;
  //   const loadProducts = async () => {
  //     setLoading(true);
  //     setErrorMessage(null);
  //     try {
  //       const connected = await initConnection();
  //       if (!connected) {
  //         throw new Error("Store connection unavailable.");
  //       }
  //       const result = await getProducts({ skus: tipTiers.map((tier) => tier.sku) });
  //       if (mounted) {
  //         setProducts(result);
  //       }
  //     } catch (err: any) {
  //       if (mounted) {
  //         setIapReady(false);
  //         setErrorMessage(err?.message ?? "Unable to load in-app products.");
  //       }
  //     } finally {
  //       if (mounted) setLoading(false);
  //     }
  //   };

  //   loadProducts();
  //   return () => {
  //     mounted = false;
  //     void endConnection();
  //   };
  // }, [tipTiers]);

  // const productMap = useMemo(() => {
  //   return products.reduce<Record<string, Product>>((acc, item) => {
  //     acc[item.productId] = item;
  //     return acc;
  //   }, {});
  // }, [products]);

  // const handleTip = async (sku: string, thanks: string) => {
  //   try {
  //     await requestPurchase({ skus: [sku] });
  //     Alert.alert("Thanks!", thanks);
  //   } catch (err: any) {
  //     if (err?.code === "E_USER_CANCELLED") return;
  //     Alert.alert("Purchase failed", "Please try again.");
  //   }
  // };

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
          <Text style={[styles.body, { color: colors.subtext0 }]}>
            In‑app purchases are disabled while running in Expo Go. Build a dev client to enable
            tipping.
          </Text>
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
