#!/bin/bash
# Gym Unity Suite / Rep Club - Stripe Products Setup Script
# Run this script on Linux/Mac after installing Stripe CLI
#
# Prerequisites:
# 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Login to Stripe: stripe login
# 3. Run this script: ./setup-stripe-products.sh
#
# Options:
#   --live    Create products in live mode (default: test mode)
#   --dry-run Show commands without executing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

LIVE_MODE=false
DRY_RUN=false
MODE_FLAG=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --live) LIVE_MODE=true; MODE_FLAG="--live" ;;
        --dry-run) DRY_RUN=true ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Gym Unity Suite - Stripe Products Setup  ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}ERROR: Stripe CLI not found. Please install it first:${NC}"
    echo -e "${YELLOW}  https://stripe.com/docs/stripe-cli${NC}"
    exit 1
fi

STRIPE_VERSION=$(stripe --version)
echo -e "${GREEN}Stripe CLI found: $STRIPE_VERSION${NC}"

# Determine mode
if [ "$LIVE_MODE" = true ]; then
    echo -e "${RED}Mode: LIVE (Production)${NC}"
    echo -e "${RED}WARNING: This will create real products in your live Stripe account!${NC}"
    read -p "Type 'YES' to confirm: " confirmation
    if [ "$confirmation" != "YES" ]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}Mode: TEST (Default)${NC}"
    echo -e "${GRAY}Use --live flag to create products in live mode${NC}"
fi

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}DRY RUN: Commands will be displayed but not executed${NC}"
fi

echo ""

# Function to run Stripe commands
run_stripe() {
    local cmd="$1"

    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${GRAY}[DRY RUN] stripe $cmd${NC}"
        echo '{"id": "dry_run_id"}'
        return
    fi

    echo -e "  ${GRAY}Running: stripe $cmd $MODE_FLAG${NC}"
    stripe $cmd $MODE_FLAG
}

# Function to extract ID from JSON
get_id() {
    local json="$1"
    echo "$json" | grep -o '"id": "[^"]*"' | head -1 | sed 's/"id": "\([^"]*\)"/\1/'
}

# ============================================
# CREATE PRODUCTS
# ============================================

echo -e "${CYAN}Creating Products...${NC}"
echo ""

# Product 1: Studio
echo -e "1. Creating Studio product..."
STUDIO_PRODUCT=$(run_stripe 'products create --name="Rep Club Studio" --description="Complete gym management for single studios. Up to 500 members, 5 team members. Includes member management, class scheduling, mobile check-in, automated billing, basic reporting, email & SMS notifications, member mobile app, and standard support." --metadata[tier]=studio --metadata[member_limit]=500 --metadata[team_limit]=5')
STUDIO_PRODUCT_ID=$(get_id "$STUDIO_PRODUCT")
echo -e "  ${GREEN}Studio Product ID: $STUDIO_PRODUCT_ID${NC}"

# Product 2: Professional
echo -e "2. Creating Professional product..."
PRO_PRODUCT=$(run_stripe 'products create --name="Rep Club Professional" --description="Advanced gym management for growing businesses. Up to 2,000 members, 15 team members. Everything in Studio plus advanced analytics, marketing automation, equipment management, staff scheduling & payroll, multi-location support (up to 3), custom branding, and priority support." --metadata[tier]=professional --metadata[member_limit]=2000 --metadata[team_limit]=15')
PRO_PRODUCT_ID=$(get_id "$PRO_PRODUCT")
echo -e "  ${GREEN}Professional Product ID: $PRO_PRODUCT_ID${NC}"

# Product 3: Enterprise
echo -e "3. Creating Enterprise product..."
ENT_PRODUCT=$(run_stripe 'products create --name="Rep Club Enterprise" --description="Enterprise-grade gym management with unlimited scale. Unlimited members and team members. Everything in Professional plus unlimited locations, advanced CRM & lead management, custom integrations & API access, white-label solutions, dedicated success manager, 24/7 premium support, and custom training & onboarding." --metadata[tier]=enterprise --metadata[member_limit]=unlimited --metadata[team_limit]=unlimited')
ENT_PRODUCT_ID=$(get_id "$ENT_PRODUCT")
echo -e "  ${GREEN}Enterprise Product ID: $ENT_PRODUCT_ID${NC}"

echo ""

# ============================================
# CREATE PRICES
# ============================================

echo -e "${CYAN}Creating Prices...${NC}"
echo ""

# Price 1: Studio - $149/month
echo -e "1. Creating Studio monthly price (\$149/month)..."
STUDIO_PRICE=$(run_stripe "prices create --product=$STUDIO_PRODUCT_ID --unit-amount=14900 --currency=usd --recurring[interval]=month --metadata[plan]=studio_monthly")
STUDIO_PRICE_ID=$(get_id "$STUDIO_PRICE")
echo -e "  ${GREEN}Studio Price ID: $STUDIO_PRICE_ID${NC}"

# Price 2: Professional - $349/month
echo -e "2. Creating Professional monthly price (\$349/month)..."
PRO_PRICE=$(run_stripe "prices create --product=$PRO_PRODUCT_ID --unit-amount=34900 --currency=usd --recurring[interval]=month --metadata[plan]=professional_monthly")
PRO_PRICE_ID=$(get_id "$PRO_PRICE")
echo -e "  ${GREEN}Professional Price ID: $PRO_PRICE_ID${NC}"

# Price 3: Enterprise - $649/month
echo -e "3. Creating Enterprise monthly price (\$649/month)..."
ENT_PRICE=$(run_stripe "prices create --product=$ENT_PRODUCT_ID --unit-amount=64900 --currency=usd --recurring[interval]=month --metadata[plan]=enterprise_monthly")
ENT_PRICE_ID=$(get_id "$ENT_PRICE")
echo -e "  ${GREEN}Enterprise Price ID: $ENT_PRICE_ID${NC}"

echo ""

# ============================================
# CREATE PAYMENT LINKS
# ============================================

echo -e "${CYAN}Creating Payment Links...${NC}"
echo ""

# Payment Link 1: Studio
echo -e "1. Creating Studio payment link..."
STUDIO_LINK=$(run_stripe "payment_links create --line-items[0][price]=$STUDIO_PRICE_ID --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]=https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}")
STUDIO_LINK_ID=$(get_id "$STUDIO_LINK")
echo -e "  ${GREEN}Studio Payment Link ID: $STUDIO_LINK_ID${NC}"

# Payment Link 2: Professional
echo -e "2. Creating Professional payment link..."
PRO_LINK=$(run_stripe "payment_links create --line-items[0][price]=$PRO_PRICE_ID --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]=https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}")
PRO_LINK_ID=$(get_id "$PRO_LINK")
echo -e "  ${GREEN}Professional Payment Link ID: $PRO_LINK_ID${NC}"

# Payment Link 3: Enterprise
echo -e "3. Creating Enterprise payment link..."
ENT_LINK=$(run_stripe "payment_links create --line-items[0][price]=$ENT_PRICE_ID --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]=https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}")
ENT_LINK_ID=$(get_id "$ENT_LINK")
echo -e "  ${GREEN}Enterprise Payment Link ID: $ENT_LINK_ID${NC}"

echo ""

# ============================================
# SUMMARY OUTPUT
# ============================================

echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}           SETUP COMPLETE!                 ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

echo -e "${YELLOW}PRODUCT IDs:${NC}"
echo "  Studio:       $STUDIO_PRODUCT_ID"
echo "  Professional: $PRO_PRODUCT_ID"
echo "  Enterprise:   $ENT_PRODUCT_ID"
echo ""

echo -e "${YELLOW}PRICE IDs:${NC}"
echo "  Studio Monthly:       $STUDIO_PRICE_ID"
echo "  Professional Monthly: $PRO_PRICE_ID"
echo "  Enterprise Monthly:   $ENT_PRICE_ID"
echo ""

echo -e "${YELLOW}PAYMENT LINK IDs:${NC}"
echo "  Studio:       $STUDIO_LINK_ID"
echo "  Professional: $PRO_LINK_ID"
echo "  Enterprise:   $ENT_LINK_ID"
echo ""

# Get full payment link URLs
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}PAYMENT LINK URLs:${NC}"

    STUDIO_URL=$(stripe payment_links retrieve $STUDIO_LINK_ID $MODE_FLAG --format json | grep -o '"url": "[^"]*"' | sed 's/"url": "\([^"]*\)"/\1/')
    echo "  Studio:       $STUDIO_URL"

    PRO_URL=$(stripe payment_links retrieve $PRO_LINK_ID $MODE_FLAG --format json | grep -o '"url": "[^"]*"' | sed 's/"url": "\([^"]*\)"/\1/')
    echo "  Professional: $PRO_URL"

    ENT_URL=$(stripe payment_links retrieve $ENT_LINK_ID $MODE_FLAG --format json | grep -o '"url": "[^"]*"' | sed 's/"url": "\([^"]*\)"/\1/')
    echo "  Enterprise:   $ENT_URL"
    echo ""
fi

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Environment Variables for Application    ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${YELLOW}Add these to your environment configuration:${NC}"
echo ""
echo "# Stripe Product IDs"
echo "VITE_STRIPE_PRODUCT_STUDIO=$STUDIO_PRODUCT_ID"
echo "VITE_STRIPE_PRODUCT_PROFESSIONAL=$PRO_PRODUCT_ID"
echo "VITE_STRIPE_PRODUCT_ENTERPRISE=$ENT_PRODUCT_ID"
echo ""
echo "# Stripe Price IDs"
echo "VITE_STRIPE_PRICE_STUDIO_MONTHLY=$STUDIO_PRICE_ID"
echo "VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY=$PRO_PRICE_ID"
echo "VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=$ENT_PRICE_ID"
echo ""
echo "# Stripe Payment Link IDs"
echo "VITE_STRIPE_LINK_STUDIO=$STUDIO_LINK_ID"
echo "VITE_STRIPE_LINK_PROFESSIONAL=$PRO_LINK_ID"
echo "VITE_STRIPE_LINK_ENTERPRISE=$ENT_LINK_ID"
echo ""

# Save to file
OUTPUT_FILE="stripe-config-output.json"
if [ "$LIVE_MODE" = true ]; then
    MODE_STR="live"
else
    MODE_STR="test"
fi

cat > "$OUTPUT_FILE" << EOF
{
  "created_at": "$(date '+%Y-%m-%d %H:%M:%S')",
  "mode": "$MODE_STR",
  "products": {
    "studio": "$STUDIO_PRODUCT_ID",
    "professional": "$PRO_PRODUCT_ID",
    "enterprise": "$ENT_PRODUCT_ID"
  },
  "prices": {
    "studio_monthly": "$STUDIO_PRICE_ID",
    "professional_monthly": "$PRO_PRICE_ID",
    "enterprise_monthly": "$ENT_PRICE_ID"
  },
  "payment_links": {
    "studio": "$STUDIO_LINK_ID",
    "professional": "$PRO_LINK_ID",
    "enterprise": "$ENT_LINK_ID"
  }
}
EOF

echo -e "${GREEN}Configuration saved to: $OUTPUT_FILE${NC}"
echo ""
echo -e "${GREEN}Done!${NC}"
