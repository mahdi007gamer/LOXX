#!/bin/bash

# =================================================================
#    LOXX MEDIASOUP NATIVE WORKER BINARY HELP RETRIEVER & FIXER
# =================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}      LOXX MEDIASOUP WORKER AUTOMATIC GETTER & STRUCT FIXER      ${NC}"
echo -e "${GREEN}================================================================${NC}"

# Check if node_modules/mediasoup exists
if [ ! -d "node_modules/mediasoup" ]; then
  echo -e "${YELLOW}node_modules/mediasoup not found. Running npm install first...${NC}"
  npm install
fi

# 1. Detect Mediasoup version
VERSION=$(node -e "try { console.log(require('./node_modules/mediasoup/package.json').version); } catch(e) { console.log(''); }")

if [ -z "$VERSION" ]; then
  echo -e "${RED}Error: Could not detect Mediasoup version. Make sure 'npm install' runs successfully and creates node_modules/${NC}"
  exit 1
fi

echo -e "📦 Installed Mediasoup Version: ${GREEN}${VERSION}${NC}"

# 2. Detect Kernel version
KERNEL=$(uname -r)
echo -e "🐧 System Kernel Version: ${GREEN}${KERNEL}${NC}"

if [[ "$KERNEL" =~ ^6\. ]]; then
  KERNEL_SUFFIX="kernel6"
  echo -e "🖥️ Auto-detected target architecture: ${CYAN}Linux x64 (Kernel 6)${NC}"
else
  KERNEL_SUFFIX="kernel5"
  echo -e "🖥️ Auto-detected target architecture: ${CYAN}Linux x64 (Kernel 5)${NC}"
fi

# 3. Construct File Name & URL
TARGET_FILE="mediasoup-worker-${VERSION}-linux-x64-${KERNEL_SUFFIX}.tgz"
DOWNLOAD_URL="https://github.com/versatica/mediasoup/releases/download/${VERSION}/${TARGET_FILE}"

echo -e "🔗 GitHub Release Asset URL: ${YELLOW}${DOWNLOAD_URL}${NC}"

# 4. Clean previous manual downloads & download clean
echo -e "\n${YELLOW}📥 Downloading prebuilt binary pack...${NC}"
rm -f "$TARGET_FILE" mediasoup-worker

# Attempt with existing environment proxy first
wget --timeout=15 --tries=3 "$DOWNLOAD_URL" -O "$TARGET_FILE"

if [ $? -ne 0 ]; then
  echo -e "\n${YELLOW}⚠️ Direct download timed out or was blocked. Trying local startvpn proxy on port 2080...${NC}"
  export http_proxy="http://127.0.0.1:2080"
  export https_proxy="http://127.0.0.1:2080"
  wget --timeout=20 --tries=3 "$DOWNLOAD_URL" -O "$TARGET_FILE"
fi

if [ $? -ne 0 ]; then
  echo -e "\n${RED}❌ Error: Failed to download the prebuilt binary pack.${NC}"
  echo -e "💡 Try launching your VPN proxy manually first: ${CYAN}source /usr/local/bin/startvpn -h 2080${NC}"
  echo -e "💡 Then run this script again: ${CYAN}bash get-worker.sh${NC}"
  exit 1
fi

echo -e "${GREEN}✔ Download completed successfully! [${TARGET_FILE}]${NC}"

# 5. Extracting and staging
echo -e "\n${YELLOW}📦 Recreating directory structure and extracting worker binary...${NC}"
mkdir -p node_modules/mediasoup/worker/out/Release

tar -xzf "$TARGET_FILE"

if [ ! -f "mediasoup-worker" ]; then
  echo -e "${RED}❌ Extraction failed or binary file format is mismatching.${NC}"
  exit 1
fi

# Move it to target
cp -f mediasoup-worker node_modules/mediasoup/worker/out/Release/mediasoup-worker
chmod +x node_modules/mediasoup/worker/out/Release/mediasoup-worker

# Double verification
if [ -f "node_modules/mediasoup/worker/out/Release/mediasoup-worker" ]; then
  echo -e "${GREEN}✔ Mediasoup worker placed successfully inside Release folder!${NC}"
  echo -e "${GREEN}✔ Executable permissions configured for worker binary.${NC}"
  
  # Clean download files
  rm -f "$TARGET_FILE" mediasoup-worker
  
  echo -e "\n${GREEN}================================================================${NC}"
  echo -e "🎉 SUCCESS! You can now compile the app and restart the service:${NC}"
  echo -e "👉 ${YELLOW}npm run build${NC}"
  echo -e "👉 ${YELLOW}pm2 restart loxx-voice-sfu${NC}"
  echo -e "${GREEN}================================================================${NC}\n"
else
  echo -e "${RED}❌ Error copying worker binary to target folder.${NC}"
fi
