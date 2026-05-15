#!/bin/bash
# Script to fix sharp on VPS
echo "Fixing sharp for linux-x64..."
npm install --platform=linux --arch=x64 sharp
echo "Sharp installation fixed. Please restart your PM2 process."
