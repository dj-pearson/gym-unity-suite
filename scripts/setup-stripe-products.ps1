# Gym Unity Suite / Rep Club - Stripe Products Setup Script
# Run this script with PowerShell on Windows after installing Stripe CLI
#
# Prerequisites:
# 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Login to Stripe: stripe login
# 3. Run this script: .\setup-stripe-products.ps1
#
# This script creates:
# - 3 Subscription Products (Studio, Professional, Enterprise)
# - Monthly prices for each product
# - Payment links for each product

param(
    [switch]$Live,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Gym Unity Suite - Stripe Products Setup  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
try {
    $stripeVersion = stripe --version
    Write-Host "Stripe CLI found: $stripeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Stripe CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
    exit 1
}

# Determine mode
if ($Live) {
    Write-Host "Mode: LIVE (Production)" -ForegroundColor Red
    Write-Host "WARNING: This will create real products in your live Stripe account!" -ForegroundColor Red
    $confirmation = Read-Host "Type 'YES' to confirm"
    if ($confirmation -ne "YES") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
    $modeFlag = "--live"
} else {
    Write-Host "Mode: TEST (Default)" -ForegroundColor Yellow
    Write-Host "Use -Live flag to create products in live mode" -ForegroundColor Gray
    $modeFlag = ""
}

if ($DryRun) {
    Write-Host "DRY RUN: Commands will be displayed but not executed" -ForegroundColor Magenta
}

Write-Host ""

# Store created IDs
$productIds = @{}
$priceIds = @{}
$paymentLinks = @{}

# Function to run Stripe commands
function Invoke-StripeCommand {
    param([string]$Command)

    if ($DryRun) {
        Write-Host "  [DRY RUN] stripe $Command" -ForegroundColor Gray
        return '{"id": "dry_run_id"}'
    }

    $fullCommand = "stripe $Command $modeFlag"
    Write-Host "  Running: $fullCommand" -ForegroundColor Gray

    $result = Invoke-Expression $fullCommand 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: $result" -ForegroundColor Red
        throw "Stripe command failed"
    }
    return $result
}

# Function to extract ID from JSON response
function Get-StripeId {
    param([string]$JsonResponse)

    if ($DryRun) { return "dry_run_id_$(Get-Random)" }

    $parsed = $JsonResponse | ConvertFrom-Json
    return $parsed.id
}

# ============================================
# CREATE PRODUCTS
# ============================================

Write-Host "Creating Products..." -ForegroundColor Cyan
Write-Host ""

# Product 1: Studio
Write-Host "1. Creating Studio product..." -ForegroundColor White
$studioProduct = Invoke-StripeCommand 'products create --name="Rep Club Studio" --description="Complete gym management for single studios. Up to 500 members, 5 team members. Includes member management, class scheduling, mobile check-in, automated billing, basic reporting, email & SMS notifications, member mobile app, and standard support." --metadata[tier]="studio" --metadata[member_limit]="500" --metadata[team_limit]="5"'
$productIds["studio"] = Get-StripeId $studioProduct
Write-Host "  Studio Product ID: $($productIds['studio'])" -ForegroundColor Green

# Product 2: Professional
Write-Host "2. Creating Professional product..." -ForegroundColor White
$proProduct = Invoke-StripeCommand 'products create --name="Rep Club Professional" --description="Advanced gym management for growing businesses. Up to 2,000 members, 15 team members. Everything in Studio plus advanced analytics, marketing automation, equipment management, staff scheduling & payroll, multi-location support (up to 3), custom branding, and priority support." --metadata[tier]="professional" --metadata[member_limit]="2000" --metadata[team_limit]="15"'
$productIds["professional"] = Get-StripeId $proProduct
Write-Host "  Professional Product ID: $($productIds['professional'])" -ForegroundColor Green

# Product 3: Enterprise
Write-Host "3. Creating Enterprise product..." -ForegroundColor White
$entProduct = Invoke-StripeCommand 'products create --name="Rep Club Enterprise" --description="Enterprise-grade gym management with unlimited scale. Unlimited members and team members. Everything in Professional plus unlimited locations, advanced CRM & lead management, custom integrations & API access, white-label solutions, dedicated success manager, 24/7 premium support, and custom training & onboarding." --metadata[tier]="enterprise" --metadata[member_limit]="unlimited" --metadata[team_limit]="unlimited"'
$productIds["enterprise"] = Get-StripeId $entProduct
Write-Host "  Enterprise Product ID: $($productIds['enterprise'])" -ForegroundColor Green

Write-Host ""

# ============================================
# CREATE PRICES
# ============================================

Write-Host "Creating Prices..." -ForegroundColor Cyan
Write-Host ""

# Price 1: Studio - $149/month
Write-Host "1. Creating Studio monthly price ($149/month)..." -ForegroundColor White
$studioPrice = Invoke-StripeCommand "prices create --product=$($productIds['studio']) --unit-amount=14900 --currency=usd --recurring[interval]=month --metadata[plan]='studio_monthly'"
$priceIds["studio_monthly"] = Get-StripeId $studioPrice
Write-Host "  Studio Price ID: $($priceIds['studio_monthly'])" -ForegroundColor Green

# Price 2: Professional - $349/month
Write-Host "2. Creating Professional monthly price ($349/month)..." -ForegroundColor White
$proPrice = Invoke-StripeCommand "prices create --product=$($productIds['professional']) --unit-amount=34900 --currency=usd --recurring[interval]=month --metadata[plan]='professional_monthly'"
$priceIds["professional_monthly"] = Get-StripeId $proPrice
Write-Host "  Professional Price ID: $($priceIds['professional_monthly'])" -ForegroundColor Green

# Price 3: Enterprise - $649/month
Write-Host "3. Creating Enterprise monthly price ($649/month)..." -ForegroundColor White
$entPrice = Invoke-StripeCommand "prices create --product=$($productIds['enterprise']) --unit-amount=64900 --currency=usd --recurring[interval]=month --metadata[plan]='enterprise_monthly'"
$priceIds["enterprise_monthly"] = Get-StripeId $entPrice
Write-Host "  Enterprise Price ID: $($priceIds['enterprise_monthly'])" -ForegroundColor Green

Write-Host ""

# ============================================
# CREATE PAYMENT LINKS
# ============================================

Write-Host "Creating Payment Links..." -ForegroundColor Cyan
Write-Host ""

# Payment Link 1: Studio
Write-Host "1. Creating Studio payment link..." -ForegroundColor White
$studioLink = Invoke-StripeCommand "payment_links create --line-items[0][price]=$($priceIds['studio_monthly']) --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]='https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}'"
$paymentLinks["studio"] = Get-StripeId $studioLink
Write-Host "  Studio Payment Link ID: $($paymentLinks['studio'])" -ForegroundColor Green

# Payment Link 2: Professional
Write-Host "2. Creating Professional payment link..." -ForegroundColor White
$proLink = Invoke-StripeCommand "payment_links create --line-items[0][price]=$($priceIds['professional_monthly']) --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]='https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}'"
$paymentLinks["professional"] = Get-StripeId $proLink
Write-Host "  Professional Payment Link ID: $($paymentLinks['professional'])" -ForegroundColor Green

# Payment Link 3: Enterprise
Write-Host "3. Creating Enterprise payment link..." -ForegroundColor White
$entLink = Invoke-StripeCommand "payment_links create --line-items[0][price]=$($priceIds['enterprise_monthly']) --line-items[0][quantity]=1 --after-completion[type]=redirect --after-completion[redirect][url]='https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}'"
$paymentLinks["enterprise"] = Get-StripeId $entLink
Write-Host "  Enterprise Payment Link ID: $($paymentLinks['enterprise'])" -ForegroundColor Green

Write-Host ""

# ============================================
# SUMMARY OUTPUT
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "           SETUP COMPLETE!                 " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PRODUCT IDs:" -ForegroundColor Yellow
Write-Host "  Studio:       $($productIds['studio'])"
Write-Host "  Professional: $($productIds['professional'])"
Write-Host "  Enterprise:   $($productIds['enterprise'])"
Write-Host ""

Write-Host "PRICE IDs:" -ForegroundColor Yellow
Write-Host "  Studio Monthly:       $($priceIds['studio_monthly'])"
Write-Host "  Professional Monthly: $($priceIds['professional_monthly'])"
Write-Host "  Enterprise Monthly:   $($priceIds['enterprise_monthly'])"
Write-Host ""

Write-Host "PAYMENT LINK IDs:" -ForegroundColor Yellow
Write-Host "  Studio:       $($paymentLinks['studio'])"
Write-Host "  Professional: $($paymentLinks['professional'])"
Write-Host "  Enterprise:   $($paymentLinks['enterprise'])"
Write-Host ""

# Get full payment link URLs
if (-not $DryRun) {
    Write-Host "PAYMENT LINK URLs:" -ForegroundColor Yellow

    $studioLinkData = Invoke-StripeCommand "payment_links retrieve $($paymentLinks['studio'])" | ConvertFrom-Json
    Write-Host "  Studio:       $($studioLinkData.url)"

    $proLinkData = Invoke-StripeCommand "payment_links retrieve $($paymentLinks['professional'])" | ConvertFrom-Json
    Write-Host "  Professional: $($proLinkData.url)"

    $entLinkData = Invoke-StripeCommand "payment_links retrieve $($paymentLinks['enterprise'])" | ConvertFrom-Json
    Write-Host "  Enterprise:   $($entLinkData.url)"
    Write-Host ""
}

# Generate environment variables for the application
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Environment Variables for Application    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add these to your environment configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Stripe Product IDs"
Write-Host "VITE_STRIPE_PRODUCT_STUDIO=$($productIds['studio'])"
Write-Host "VITE_STRIPE_PRODUCT_PROFESSIONAL=$($productIds['professional'])"
Write-Host "VITE_STRIPE_PRODUCT_ENTERPRISE=$($productIds['enterprise'])"
Write-Host ""
Write-Host "# Stripe Price IDs"
Write-Host "VITE_STRIPE_PRICE_STUDIO_MONTHLY=$($priceIds['studio_monthly'])"
Write-Host "VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY=$($priceIds['professional_monthly'])"
Write-Host "VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=$($priceIds['enterprise_monthly'])"
Write-Host ""
Write-Host "# Stripe Payment Link IDs"
Write-Host "VITE_STRIPE_LINK_STUDIO=$($paymentLinks['studio'])"
Write-Host "VITE_STRIPE_LINK_PROFESSIONAL=$($paymentLinks['professional'])"
Write-Host "VITE_STRIPE_LINK_ENTERPRISE=$($paymentLinks['enterprise'])"
Write-Host ""

# Save to file
$outputFile = "stripe-config-output.json"
$config = @{
    created_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    mode = if ($Live) { "live" } else { "test" }
    products = @{
        studio = $productIds['studio']
        professional = $productIds['professional']
        enterprise = $productIds['enterprise']
    }
    prices = @{
        studio_monthly = $priceIds['studio_monthly']
        professional_monthly = $priceIds['professional_monthly']
        enterprise_monthly = $priceIds['enterprise_monthly']
    }
    payment_links = @{
        studio = $paymentLinks['studio']
        professional = $paymentLinks['professional']
        enterprise = $paymentLinks['enterprise']
    }
}

$config | ConvertTo-Json -Depth 4 | Out-File -FilePath $outputFile -Encoding utf8
Write-Host "Configuration saved to: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
