#!/bin/bash

# Manual deployment script for GitHub Pages
# Run this script to manually deploy to GitHub Pages

set -e

echo "🔄 Installing dependencies..."
npm ci

echo "🧪 Running tests..."
npm test -- --watchAll=false

echo "🏗️ Building application..."
npm run build

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://ohmrefresh.github.io/thai-qr-extractor"