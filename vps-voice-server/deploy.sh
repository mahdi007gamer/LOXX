#!/bin/bash

# Ensure /usr/local/bin and standard node path is loaded even inside secure_path sudo
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# --- Colorized Logger ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}        LOXX ULTRA-LOW LATENCY VOICE SFU INITIALIZATION        ${NC}"
echo -e "${GREEN}================================================================${NC}"

# Check if user is root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (use sudo).${NC}"
  exit 1
fi

# 1. Update APT Repository
echo -e "\n${YELLOW}[1/6] Updating system repositories...${NC}"
apt-get update -y

# 2. Install Mediasoup build dependencies (C++ compilers, Python, etc.)
# Mediasoup compiles C++ binaries during installation, requiring build-essential, python3, and make.
echo -e "\n${YELLOW}[2/6] Installing C++ build dependencies, Make & Python3...${NC}"
apt-get install -y build-essential python3 python3-pip make cmake gcc g++ git

# 3. Install Node.js & NPM if not already present
if ! command -v node &> /dev/null; then
    echo -e "\n${YELLOW}[3/6] Node.js not found. Installing Node.js LTS (v20)...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "\n${GREEN}[3/6] Node.js already installed: $(node -v)${NC}"
fi

# 4. Install PM2 globally for production execution
if ! command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}[4/6] Installing PM2 process manager在全球...${NC}"
    npm install -g pm2
else
    echo -e "\n${GREEN}[4/6] PM2 already installed: $(pm2 -v)${NC}"
fi

# 5. Open firewall ports for WebRTC (UDP/TCP 40000-49999 & Signaling TCP 4000)
# Mediasoup routes real-time UDP streams through these ports.
echo -e "\n${YELLOW}[5/6] Configuring VPS Firewall (UFW) rules...${NC}"
if command -v ufw &> /dev/null; then
    echo -e "Enabling UFW rules for LOXX Voice Engine..."
    ufw allow 4000/tcp comment 'LOXX Voice signaling WebSockets'
    ufw allow 40000:49999/udp comment 'LOXX WebRTC Mediasoup UDP media channels'
    ufw allow 40000:49999/tcp comment 'LOXX WebRTC Mediasoup TCP media fallback'
    ufw reload
    echo -e "${GREEN}Firewall updated successfully via UFW.${NC}"
else
    echo -e "${YELLOW}UFW was not found. Setting up standard iptables rules instead...${NC}"
    iptables -A INPUT -p tcp --dport 4000 -j ACCEPT -m comment --comment "LOXX Voice Signaling"
    iptables -A INPUT -p udp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC UDP RTP"
    iptables -A INPUT -p tcp --match multiport --dports 40000:49999 -j ACCEPT -m comment --comment "LOXX WebRTC TCP fallback"
    echo -e "${GREEN}Firewall updated successfully via iptables.${NC}"
fi

# 6. Install NPM packages, Compile TypeScript, and Launch
echo -e "\n${YELLOW}[6/6] Installing local dependencies and compiling SFU package (This may take 2-4 minutes)...${NC}"
npm install

echo -e "\n${YELLOW}Building/Rebuilding native mediasoup binaries for the target VPS architecture...${NC}"
npm rebuild mediasoup

echo -e "\n${YELLOW}Compiling TypeScript down to native CommonJS...${NC}"
npm run build

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
