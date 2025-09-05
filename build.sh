#!/bin/bash
set -e

echo "Installing server dependencies..."
npm install

echo "Installing web dependencies..."
cd web
npm install

echo "Building React app..."
npm run build

echo "Build completed successfully!"
ls -la dist/