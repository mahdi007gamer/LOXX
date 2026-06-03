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

# 2. Detect Kernel version & Determine Suffix Priority
KERNEL=$(uname -r)
echo -e "🐧 System Kernel Version: ${GREEN}${KERNEL}${NC}"

# We will try both suffixes sequentially, starting with the auto-detected one, but falling back resiliently.
if [[ "$KERNEL" =~ ^6\. ]]; then
  SUFFIXES=("kernel6" "kernel5")
  echo -e "🖥️ Auto-detected target architecture: ${CYAN}Linux x64 (Kernel 6)${NC}"
else
  SUFFIXES=("kernel5" "kernel6")
  echo -e "🖥️ Auto-detected target architecture: ${CYAN}Linux x64 (Kernel 5)${NC}"
fi

# 3. Construct Download Function
download_asset() {
  local suffix=$1
  local target="mediasoup-worker-${VERSION}-linux-x64-${suffix}.tgz"
  local url="https://github.com/versatica/mediasoup/releases/download/${VERSION}/${target}"

  echo -e "📥 Attempting to download suffix [${CYAN}${suffix}${NC}]..."
  echo -e "🔗 URL: ${YELLOW}${url}${NC}"

  # Clean any stale file first
  rm -f "$target"

  # 1. Try Direct Download
  wget --timeout=15 --tries=2 "$url" -O "$target"
  if [ $? -eq 0 ] && [ -s "$target" ]; then
    echo -e "${GREEN}✔ Download succeeded directly!${NC}"
    TARGET_FILE="$target"
    return 0
  fi

  # 2. Try with startvpn Local Proxy (Port 2080)
  echo -e "${YELLOW}⚠️ Direct download failed/timed out. Trying via local proxy (http://127.0.0.1:2080)...${NC}"
  export http_proxy="http://127.0.0.1:2080"
  export https_proxy="http://127.0.0.1:2080"
  wget --timeout=15 --tries=2 "$url" -O "$target"
  local status=$?
  unset http_proxy
  unset https_proxy

  if [ $status -eq 0 ] && [ -s "$target" ]; then
    echo -e "${GREEN}✔ Download succeeded via local proxy!${NC}"
    TARGET_FILE="$target"
    return 0
  fi

  # Check if we got a 404/failure
  echo -e "${RED}❌ Failed to download suffix [${suffix}].${NC}"
  rm -f "$target"
  return 1
}

# 4. Try Suffixes
DOWNLOAD_SUCCESS=false
for suffix in "${SUFFIXES[@]}"; do
  if download_asset "$suffix"; then
    DOWNLOAD_SUCCESS=true
    break
  fi
done

if [ "$DOWNLOAD_SUCCESS" = false ]; then
  # Make a last-ditch effort targeting kernel6 specifically since user confirmed it's correct
  echo -e "\n${YELLOW}🚨 All priority downloads failed. Forcing main kernel6 fallback attempt...${NC}"
  if download_asset "kernel6"; then
    DOWNLOAD_SUCCESS=true
  fi
fi

if [ "$DOWNLOAD_SUCCESS" = false ]; then
  echo -e "\n${RED}❌ Error: Failed to retrieve any matched mediasoup-worker prebuilt binary package.${NC}"
  echo -e "💡 Tips: Ensure your VPN proxy is online using: ${CYAN}source /usr/local/bin/startvpn -h 2080${NC}"
  echo -e "💡 Try downloading manually and copying to ${GREEN}node_modules/mediasoup/worker/out/Release/mediasoup-worker${NC}"
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
