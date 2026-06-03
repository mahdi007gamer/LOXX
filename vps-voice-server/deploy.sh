#!/bin/bash

# Ensure /usr/local/bin and standard node path is loaded even inside secure_path sudo
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# --- Argument Parsing ---
VERBOSE=false
for arg in "$@"; do
  case $arg in
    -v|--verbose)
      VERBOSE=true
      ;;
  esac
done

# --- Colorized Logger ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}        LOXX ULTRA-LOW LATENCY VOICE SFU INITIALIZATION        ${NC}"
if [ "$VERBOSE" = true ]; then
  echo -e "${YELLOW}        [ VERBOSE LOGGING ENABLED ]                            ${NC}"
fi
echo -e "${GREEN}================================================================${NC}"

# Check if user is root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (use sudo).${NC}"
  exit 1
fi

# 1. Update APT Repository
echo -e "\n${YELLOW}[1/6] Updating system repositories...${NC}"
if [ "$VERBOSE" = true ]; then
  apt-get update -y
else
  apt-get update -y > /dev/null
fi

# 2. Install Mediasoup build dependencies (C++ compilers, Python, etc.)
# Mediasoup compiles C++ binaries during installation, requiring build-essential, python3, and make.
echo -e "\n${YELLOW}[2/6] Installing C++ build dependencies, Make & Python3...${NC}"
if [ "$VERBOSE" = true ]; then
  apt-get install -y build-essential python3 python3-pip make cmake gcc g++ git
else
  apt-get install -y build-essential python3 python3-pip make cmake gcc g++ git > /dev/null
fi

# 3. Install Node.js & NPM if not already present
if ! command -v node &> /dev/null; then
    echo -e "\n${YELLOW}[3/6] Node.js not found. Installing Node.js LTS (v20)...${NC}"
    if [ "$VERBOSE" = true ]; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    else
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
      apt-get install -y nodejs > /dev/null
    fi
else
    echo -e "\n${GREEN}[3/6] Node.js already installed: $(node -v)${NC}"
fi

# 4. Install PM2 globally for production execution
if ! command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}[4/6] Installing PM2 process manager在全球...${NC}"
    if [ "$VERBOSE" = true ]; then
      npm install -g pm2
    else
      npm install -g pm2 > /dev/null
    fi
else
    echo -e "\n${GREEN}[4/6] PM2 already installed: $(pm2 -v)${NC}"
fi

# 5. Open firewall ports for WebRTC (UDP/TCP 40000-49999 & Signaling TCP 4000)
# Mediasoup routes real-time UDP streams through these ports.
echo -e "\n${YELLOW}[5/6] Configuring VPS Firewall (UFW) rules...${NC}"
if command -v ufw &> /dev/null; then
    echo -e "Enabling UFW rules for LOXX Voice Engine..."
    if [ "$VERBOSE" = true ]; then
      ufw allow 4000/tcp comment 'LOXX Voice signaling WebSockets'
      ufw allow 40000:49999/udp comment 'LOXX WebRTC Mediasoup UDP media channels'
      ufw allow 40000:49999/tcp comment 'LOXX WebRTC Mediasoup TCP media fallback'
      ufw reload
    else
      ufw allow 4000/tcp comment 'LOXX Voice signaling WebSockets' > /dev/null
      ufw allow 40000:49999/udp comment 'LOXX WebRTC Mediasoup UDP media channels' > /dev/null
      ufw allow 40000:49999/tcp comment 'LOXX WebRTC Mediasoup TCP media fallback' > /dev/null
      ufw reload > /dev/null
    fi
    echo -e "${GREEN}Firewall updated successfully via UFW.${NC}"
else
    echo -e "${YELLOW}UFW was not found. Setting up standard iptables rules instead...${NC}"
    if [ "$VERBOSE" = true ]; then
      iptables -A INPUT -p tcp --dport 4000 -j ACCEPT -m comment --comment "LOXX Voice Signaling"
      iptables -A INPUT -p udp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC UDP RTP"
      iptables -A INPUT -p tcp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC TCP fallback"
    else
      iptables -A INPUT -p tcp --dport 4000 -j ACCEPT -m comment --comment "LOXX Voice Signaling" > /dev/null 2>&1
      iptables -A INPUT -p udp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC UDP RTP" > /dev/null 2>&1
      iptables -A INPUT -p tcp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC TCP fallback" > /dev/null 2>&1
    fi
    echo -e "${GREEN}Firewall updated successfully via iptables.${NC}"
fi

# 6. Install NPM packages, Compile TypeScript, and Launch
echo -e "\n${YELLOW}[6/6] Installing local dependencies and compiling SFU package (This may take 2-4 minutes)...${NC}"

# Auto-recovery: If mediasoup directory exists but the worker binary does not, the installation is corrupted (e.g. from a past Ctrl+C). Clean it!
if [ -d "node_modules/mediasoup" ] && [ ! -f "node_modules/mediasoup/worker/out/Release/mediasoup-worker" ]; then
  echo -e "${RED}⚠️ Mediasoup installation is corrupted or incomplete (missing worker binary). Recovering and resetting folders...${NC}"
  rm -rf node_modules/mediasoup
fi

if [ "$VERBOSE" = true ]; then
  npm install --loglevel verbose
else
  npm install
fi

echo -e "\n${YELLOW}========================================================================${NC}"
echo -e "${YELLOW}🚨 IMPORTANT: Building/Rebuilding native WebRTC mediasoup binaries...   ${NC}"
echo -e "${YELLOW}========================================================================${NC}"
echo -e "💡 This step downloads a ~22MB worker executable from GitHub or builds it locally."
echo -e "💡 This process is mostly SILENT and can take ${GREEN}2 to 5 minutes${NC} depending on your connection."
echo -e "💡 ${RED}DO NOT cancel with Ctrl+C (^C).${NC} Let it finish completely."
echo -e "------------------------------------------------------------------------"
echo -e "💡 ${CYAN}توجه مهم: در حال دانلود یا بیلد باینری‌های نیتیو mediasoup در سرور صوتی...${NC}"
echo -e "💡 این پروسه حدود ۲۲ مگابایت دانلود انجام می‌دهد یا به صورت محلی کامپایل می‌کند."
echo -e "💡 این مرحله ممکن است بین ${GREEN}۲ تا ۵ دقیقه${NC} طول بکشد و هیچ خروجی لاگی ندهد (مکث کامل)."
echo -e "💡 ${RED}به هیچ وجه آن را با کلیدهای Ctrl+C قطع نکنید!${NC} بگذارید تا انتها به طور کامل برود."
echo -e "${YELLOW}========================================================================${NC}\n"

if [ "$VERBOSE" = true ]; then
  npm rebuild mediasoup --foreground-scripts --loglevel verbose
else
  npm rebuild mediasoup
fi

echo -e "\n${YELLOW}Compiling TypeScript down to native CommonJS...${NC}"
if [ "$VERBOSE" = true ]; then
  npx tsc --verbose
else
  npm run build
fi

# PM2 runner function to locate pm2 robustly
run_pm2() {
  if command -v pm2 &> /dev/null; then
    pm2 "$@"
  elif [ -f "./node_modules/pm2/bin/pm2" ]; then
    node "./node_modules/pm2/bin/pm2" "$@"
  elif command -v npx &> /dev/null; then
    npx pm2 "$@"
  elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 "$@"
  elif [ -f "/usr/bin/pm2" ]; then
    /usr/bin/pm2 "$@"
  elif [ -f "/root/.npm-global/bin/pm2" ]; then
    /root/.npm-global/bin/pm2 "$@"
  else
    echo -e "${RED}Error: pm2 not found! Attempting direct npx run...${NC}"
    npx pm2 "$@"
  fi
}

# Start or restart PM2 process
echo -e "\n${YELLOW}Launching processes via PM2...${NC}"
run_pm2 delete loxx-voice-sfu &> /dev/null || true
run_pm2 start dist/server.js --name "loxx-voice-sfu" --update-env

# Save PM2 state and configure startup scripts
run_pm2 save
run_pm2 startup | tail -n 1 | bash

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! LOXX VOICE SFU INSTALLED & ACTIVE ON PM2!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "To view live mediasoup signaling log flows, run:"
echo -e "${YELLOW}pm2 logs loxx-voice-sfu${NC}\n"
