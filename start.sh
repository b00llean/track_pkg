#!/usr/bin/env bash

# TrackPkg Application Startup Script
# Supports starting local Vite dev server or Docker container

set -e

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}         Package Journey Visualizer (track_pkg)      ${NC}"
echo -e "${CYAN}====================================================${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[!] .env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo 'VITE_17TRACK_API_KEY=""' > .env
    fi
fi

# Extract API key checking multiple env key names
RAW_KEY=$(grep -E '^(VITE_17TRACK_API_KEY|17TRACK_API_KEY|VITE_17TRACK_TOKEN|VITE_17TOKEN|TRACK17_API_KEY)=' .env | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)

# Helper function to check if key is a placeholder
is_placeholder() {
    local k=$(echo "$1" | tr '[:upper:]' '[:lower:]')
    [[ "$k" == "your_17track_key_here" || "$k" == "your_17track_api_key_here" || "$k" == "your_api_key_here" || "$k" == "your_17token_here" || "$k" == "xxxxxxxx" || "$k" == your_* || "$k" == enter_* || "$k" == paste_* || "$k" == change_me* ]]
}

API_KEY=""
if [ -n "$RAW_KEY" ] && ! is_placeholder "$RAW_KEY"; then
    API_KEY="$RAW_KEY"
fi

if [ -n "$API_KEY" ]; then
    echo -e "${GREEN}[✓] 17TRACK API Key detected in .env (${API_KEY:0:6}...)${NC}"
    export VITE_17TRACK_API_KEY="$API_KEY"
elif [ -n "$RAW_KEY" ]; then
    echo -e "${YELLOW}[!] Warning: .env contains placeholder key ("$RAW_KEY").${NC}"
    echo -e "${YELLOW}    Please update .env with your actual 17TRACK 17token.${NC}"
else
    echo -e "${YELLOW}[!] Warning: VITE_17TRACK_API_KEY is blank in .env.${NC}"
    echo -e "${YELLOW}    You can also enter your 17TRACK key inside the app UI.${NC}"
fi

# Write runtime env-config.js for instant browser access
mkdir -p public dist
echo "window.__ENV__ = window.__ENV__ || {}; window.__ENV__.VITE_17TRACK_API_KEY = \"$API_KEY\";" > public/env-config.js
if [ -d "dist" ]; then
    echo "window.__ENV__ = window.__ENV__ || {}; window.__ENV__.VITE_17TRACK_API_KEY = \"$API_KEY\";" > dist/env-config.js
fi

# Parse mode argument or prompt user
MODE="${1:-}"

if [ -z "$MODE" ]; then
    echo ""
    echo "Select startup mode:"
    echo -e "  ${GREEN}1) Development Mode${NC} (npm run dev -> http://localhost:5173)"
    echo -e "  ${BLUE}2) Docker Container Mode${NC} (docker compose -> http://localhost:8080)"
    echo ""
    read -p "Enter choice [1 or 2, default 1]: " CHOICE
    CHOICE=${CHOICE:-1}
    if [ "$CHOICE" = "2" ]; then
        MODE="docker"
    else
        MODE="dev"
    fi
fi

if [ "$MODE" = "docker" ]; then
    echo -e "${BLUE}[*] Starting TrackPkg in Docker container mode...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}[!] Docker is not installed or not in PATH.${NC}"
        exit 1
    fi
    VITE_17TRACK_API_KEY="$API_KEY" docker compose up -d --build
    echo -e "${GREEN}[✓] TrackPkg Docker container running!${NC}"
    echo -e "${GREEN}    Access app at: http://localhost:8080${NC}"
else
    echo -e "${GREEN}[*] Starting TrackPkg in local Vite development mode...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[*] Installing npm dependencies...${NC}"
        npm install
    fi
    echo -e "${CYAN}[*] Starting Vite dev server...${NC}"
    npm run dev
fi
