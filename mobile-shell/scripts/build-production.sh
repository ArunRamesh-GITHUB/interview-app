#!/bin/bash

# Production Build Script for Android AAB
# This script builds a signed Android App Bundle (AAB) for Google Play Store

set -e

echo "🚀 Starting production build for Android..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing..."
    npm install -g @expo/eas-cli
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "⚠️  Please log in to your Expo account:"
    eas login
fi

# Verify environment variables are set
echo "🔍 Checking environment variables..."
if [ -z "$REVENUECAT_API_KEY_ANDROID" ]; then
    echo "⚠️  REVENUECAT_API_KEY_ANDROID not set in .env"
fi

# Clean install dependencies
echo "🧹 Cleaning and installing dependencies..."
rm -rf node_modules
npm install

# Run type checking
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit || echo "⚠️  TypeScript errors found - continuing anyway"

# Build production AAB
echo "🔨 Building production AAB..."
eas build --platform android --profile production --non-interactive

echo "✅ Production build complete!"
echo ""
echo "📝 Next steps:"
echo "1. Download the AAB from Expo dashboard"
echo "2. Upload to Google Play Console → Internal Testing"
echo "3. Wait for Google Play processing (~2 hours)"
echo "4. Add test accounts to license testing"
echo "5. Test purchases on device"
echo ""
echo "🔗 Useful links:"
echo "- Expo Dashboard: https://expo.dev/"
echo "- Google Play Console: https://play.google.com/console"
echo "- RevenueCat Dashboard: https://app.revenuecat.com"