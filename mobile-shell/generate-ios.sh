#!/bin/bash
# Simple script to generate iOS folder - kills if stuck after 60s

cd "$(dirname "$0")"

echo "🚀 Generating iOS project..."
echo "⏱️  Will timeout after 60 seconds if stuck"

# Start prebuild in background
npx expo prebuild --platform ios --clean --skip-dependency-update > /tmp/ios-gen.log 2>&1 &
PID=$!

# Wait up to 60 seconds
for i in {1..30}; do
    sleep 2
    if [ -d "ios" ]; then
        echo "✅ iOS folder created!"
        kill $PID 2>/dev/null
        wait $PID 2>/dev/null
        exit 0
    fi
    if ! kill -0 $PID 2>/dev/null; then
        # Process finished
        wait $PID
        if [ -d "ios" ]; then
            echo "✅ iOS folder created!"
            exit 0
        else
            echo "❌ Failed - check /tmp/ios-gen.log"
            tail -20 /tmp/ios-gen.log
            exit 1
        fi
    fi
done

# Timeout reached
echo "⏱️  Timeout after 60s - killing process"
kill -9 $PID 2>/dev/null
echo "❌ Generation timed out"
echo "Last 20 lines of log:"
tail -20 /tmp/ios-gen.log
exit 1

