import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

const plans = [
  { id: "starter", price: "£6.99", tokens: 120, blurb: "Light weekly practice" },
  { id: "plus",    price: "£12.99", tokens: 250, blurb: "More practice + exports" },
  { id: "pro",     price: "£29.99", tokens: 480, blurb: "Daily feel; mix usage" },
  { id: "power",   price: "£44.99", tokens: 1000, blurb: "Heavy users" },
];

const bullets = [
  "1 token = 1 minute of Practice.",
  "Realtime = 9 tokens/min (10s rounding).",
  "Practice rounds to 15s (0.25 token).",
  "Realtime session minimum = 5 tokens.",
  "Typed answers: 1 token per scored answer.",
];

export default function PaidPlansScreen() {
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
              style={styles.continueButton}
              onPress={() => {
                // TODO: open native purchase or deeplink to web checkout
                console.log(`Starting checkout for ${p.id}`);
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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