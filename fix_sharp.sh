#!/bin/bash
# Script to fix sharp and prepare for production bundle
echo "Cleaning up dist and node_modules..."
rm -rf dist node_modules package-lock.json

echo "Installing dependencies..."
npm install

echo "Fixing sharp for linux-x64 directly..."
npm install --platform=linux --arch=x64 sharp

echo "Building the application (Frontend + Backend bundle)..."
npm run build

echo "Prisma generate..."
npx prisma generate

echo "Sharp installation fixed and app bundled."
echo "CRITICAL: You should now run the app with: pm2 restart loxx"
echo "Make sure pm2 is configured to run 'npm start' or 'node dist/server.cjs'"
