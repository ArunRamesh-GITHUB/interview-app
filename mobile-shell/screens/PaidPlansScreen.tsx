import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert, ActivityIndicator } from "react-native";
import { purchaseService } from "../src/lib/purchaseService";
import { TOKEN_PACKS } from "../src/config/purchases";

// Map our internal IDs to the product IDs defined in purchases.ts
// Derived dynamically from the shared configuration
const PRODUCT_IDS = Platform.select({
  ios: {
    starter: TOKEN_PACKS.starter.productIdIOS,
    plus: TOKEN_PACKS.plus.productIdIOS,
    pro: TOKEN_PACKS.pro.productIdIOS,
    power: TOKEN_PACKS.power.productIdIOS,
  },
  android: {
    starter: TOKEN_PACKS.starter.productIdAndroid,
    plus: TOKEN_PACKS.plus.productIdAndroid,
    pro: TOKEN_PACKS.pro.productIdAndroid,
    power: TOKEN_PACKS.power.productIdAndroid,
  }
}) || {
  // Fallback for web or unexpected platform
  starter: TOKEN_PACKS.starter.productIdWeb,
  plus: TOKEN_PACKS.plus.productIdWeb,
  pro: TOKEN_PACKS.pro.productIdWeb,
  power: TOKEN_PACKS.power.productIdWeb,
};

const plans = [
  { id: "starter", price: "£6.99", tokens: 120, blurb: "Light weekly practice" },
  { id: "plus", price: "£12.99", tokens: 250, blurb: "More practice + exports" },
  { id: "pro", price: "£29.99", tokens: 480, blurb: "Daily feel; mix usage" },
  { id: "power", price: "£44.99", tokens: 1000, blurb: "Heavy users" },
];

const bullets = [
  "1 token = 1 minute of Practice.",
  "Realtime = 9 tokens/min (10s rounding).",
  "Practice rounds to 15s (0.25 token).",
  "Realtime session minimum = 5 tokens.",
  "Typed answers: 1 token per scored answer.",
];

export default function PaidPlansScreen() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    // @ts-ignore
    const productId = PRODUCT_IDS[planId];

    if (!productId) {
      Alert.alert("Error", "Product configuration missing for this plan.");
      return;
    }

    try {
      setLoadingId(planId);
      console.log(`Starting purchase for ${planId} (${productId})...`);

      // Initialize if needed (safe to call multiple times)
      await purchaseService.initialize();

      const result = await purchaseService.purchasePackage(productId);

      console.log("Purchase result:", result);

      Alert.alert(
        "Success!",
        `You have successfully purchased the ${planId} pack. tokens will be added shortly.`
      );

    } catch (error: any) {
      console.error("Purchase failed:", error);

      // Don't alert if user just cancelled
      if (error.message?.includes("cancelled") || error.code === 'E_USER_CANCELLED') {
        return;
      }

      Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose your plan</Text>
      <Text style={styles.subtitle}>Tokens let you mix Practice and Realtime however you like.</Text>

      <View style={styles.plansContainer}>
        {plans.map(p => (
          <View key={p.id} style={styles.planCard}>
            <Text style={styles.planName}>{p.id}</Text>
            <Text style={styles.planPrice}>{p.price}<Text style={styles.planPriceUnit}>/mo</Text></Text>
            <Text style={styles.planBlurb}>{p.blurb}</Text>
            <Text style={styles.planTokens}>{p.tokens} tokens</Text>
            <TouchableOpacity
              style={[styles.continueButton, loadingId === p.id && styles.disabledButton]}
              onPress={() => handlePurchase(p.id)}
              disabled={loadingId !== null}
            >
              {loadingId === p.id ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.explanationTitle}>How tokens work</Text>
        {bullets.map((b, i) => (
          <Text key={i} style={styles.explanationBullet}>• {b}</Text>
        ))}
        <Text style={styles.explanationFooter}>
          Pay in-app or on the web. Prices may vary by platform.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 16,
    fontSize: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  planCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#000000',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    color: '#000000',
  },
  planPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  planBlurb: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  planTokens: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  continueButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  explanationCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#ffffff',
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#000000',
  },
  explanationBullet: {
    color: '#374151',
    marginBottom: 4,
    fontSize: 14,
  },
  explanationFooter: {
    color: '#9ca3af',
    marginTop: 6,
    fontSize: 12,
  },
});