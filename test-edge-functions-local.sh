#!/bin/bash

# Local Edge Functions Testing Script
# This script helps test edge functions locally before deploying

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Local Edge Functions Server${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    cat > .env << EOF
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional API Keys (only needed for specific functions)
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=

# Runtime Configuration
PORT=8000
DENO_ENV=development
PRELOAD_FUNCTIONS=false
EOF
    echo -e "${YELLOW}📝 Please edit .env file with your actual credentials${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}❌ Deno is not installed${NC}"
    echo "Please install Deno: https://deno.land/#installation"
    exit 1
fi

echo -e "${GREEN}✅ Deno found: $(deno --version | head -n 1)${NC}"
echo ""

# Set up functions path
export FUNCTIONS_PATH="./supabase/functions"
export PORT="${PORT:-8000}"

echo -e "${GREEN}📂 Functions directory: ${FUNCTIONS_PATH}${NC}"
echo -e "${GREEN}🌐 Port: ${PORT}${NC}"
echo ""

# Check if functions directory exists
if [ ! -d "$FUNCTIONS_PATH" ]; then
    echo -e "${RED}❌ Functions directory not found: ${FUNCTIONS_PATH}${NC}"
    exit 1
fi

# Count functions
FUNCTION_COUNT=$(find "$FUNCTIONS_PATH" -type f -name "index.ts" | wc -l)
echo -e "${GREEN}📦 Found ${FUNCTION_COUNT} functions${NC}"
echo ""

# Start the server
echo -e "${GREEN}🚀 Starting edge runtime server...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
echo -e "${GREEN}Test endpoints:${NC}"
echo -e "  Health Check: ${YELLOW}http://localhost:${PORT}/health${NC}"
echo -e "  List Functions: ${YELLOW}http://localhost:${PORT}/${NC}"
echo -e "  Call Function: ${YELLOW}http://localhost:${PORT}/<function-name>${NC}"
echo ""

# Run the server
deno run \
  --allow-net \
  --allow-read \
  --allow-env \
  --unstable \
  edge-runtime-server.ts

