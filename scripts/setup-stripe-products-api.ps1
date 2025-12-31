# Gym Unity Suite / Rep Club - Stripe Products Setup Script (API Version)
# Run this script with PowerShell when Stripe CLI has certificate issues
#
# Prerequisites:
# 1. Set your Stripe API key: $env:STRIPE_API_KEY = "sk_test_..."
# 2. Run this script: .\setup-stripe-products-api.ps1
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

# Skip SSL certificate validation (for networks with DNS filtering)
# WARNING: Only use this for testing with test API keys
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Gym Unity Suite - Stripe Products Setup  " -ForegroundColor Cyan
Write-Host "  (API Direct Version)                     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: SSL certificate validation disabled for DNS filter compatibility" -ForegroundColor Yellow
Write-Host ""

# Check if API key is set
$apiKey = $env:STRIPE_API_KEY
if (-not $apiKey) {
    Write-Host "ERROR: STRIPE_API_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:STRIPE_API_KEY = 'sk_test_...'" -ForegroundColor Yellow
    exit 1
}

# Determine mode
if ($apiKey.StartsWith("sk_live_")) {
    Write-Host "Detected LIVE API key" -ForegroundColor Red
    if (-not $Live) {
        Write-Host "ERROR: You're using a LIVE key but didn't specify -Live flag" -ForegroundColor Red
        exit 1
    }
    Write-Host "Mode: LIVE (Production)" -ForegroundColor Red
    Write-Host "WARNING: This will create real products in your live Stripe account!" -ForegroundColor Red
    $confirmation = Read-Host "Type 'YES' to confirm"
    if ($confirmation -ne "YES") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
} elseif ($apiKey.StartsWith("sk_test_")) {
    Write-Host "Detected TEST API key" -ForegroundColor Green
    Write-Host "Mode: TEST" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Invalid API key format" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "DRY RUN: API calls will be displayed but not executed" -ForegroundColor Magenta
}

Write-Host ""

# Store created IDs
$productIds = @{}
$priceIds = @{}
$paymentLinks = @{}

# Function to make Stripe API calls
function Invoke-StripeAPI {
    param(
        [string]$Method = "POST",
        [string]$Endpoint,
        [hashtable]$Body = @{}
    )

    if ($DryRun) {
        Write-Host "  [DRY RUN] $Method https://api.stripe.com/v1/$Endpoint" -ForegroundColor Gray
        Write-Host "  Body: $($Body | ConvertTo-Json -Compress)" -ForegroundColor Gray
        return @{ id = "dry_run_$(Get-Random)" }
    }

    $uri = "https://api.stripe.com/v1/$Endpoint"
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/x-www-form-urlencoded"
    }

    # Convert hashtable to form data
    $formData = @()
    foreach ($key in $Body.Keys) {
        $value = $Body[$key]
        if ($value -is [hashtable]) {
            foreach ($subKey in $value.Keys) {
                $formData += "$key[$subKey]=$([System.Web.HttpUtility]::UrlEncode($value[$subKey]))"
            }
        } else {
            $formData += "$key=$([System.Web.HttpUtility]::UrlEncode($value))"
        }
    }
    $bodyString = $formData -join "&"

    Write-Host "  Calling: $Method $uri" -ForegroundColor Gray

    try {
        $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $bodyString
        return $response
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        }
        throw
    }
}

# ============================================
# CREATE PRODUCTS
# ============================================

Write-Host "Creating Products..." -ForegroundColor Cyan
Write-Host ""

# Product 1: Studio
Write-Host "1. Creating Studio product..." -ForegroundColor White
$studioProduct = Invoke-StripeAPI -Endpoint "products" -Body @{
    name = "Rep Club Studio"
    description = "Complete gym management for single studios. Up to 500 members, 5 team members. Includes member management, class scheduling, mobile check-in, automated billing, basic reporting, email & SMS notifications, member mobile app, and standard support."
    "metadata[tier]" = "studio"
    "metadata[member_limit]" = "500"
    "metadata[team_limit]" = "5"
}
$productIds["studio"] = $studioProduct.id
Write-Host "  Studio Product ID: $($productIds['studio'])" -ForegroundColor Green

# Product 2: Professional
Write-Host "2. Creating Professional product..." -ForegroundColor White
$proProduct = Invoke-StripeAPI -Endpoint "products" -Body @{
    name = "Rep Club Professional"
    description = "Advanced gym management for growing businesses. Up to 2,000 members, 15 team members. Everything in Studio plus advanced analytics, marketing automation, equipment management, staff scheduling & payroll, multi-location support (up to 3), custom branding, and priority support."
    "metadata[tier]" = "professional"
    "metadata[member_limit]" = "2000"
    "metadata[team_limit]" = "15"
}
$productIds["professional"] = $proProduct.id
Write-Host "  Professional Product ID: $($productIds['professional'])" -ForegroundColor Green

# Product 3: Enterprise
Write-Host "3. Creating Enterprise product..." -ForegroundColor White
$entProduct = Invoke-StripeAPI -Endpoint "products" -Body @{
    name = "Rep Club Enterprise"
    description = "Enterprise-grade gym management with unlimited scale. Unlimited members and team members. Everything in Professional plus unlimited locations, advanced CRM & lead management, custom integrations & API access, white-label solutions, dedicated success manager, 24/7 premium support, and custom training & onboarding."
    "metadata[tier]" = "enterprise"
    "metadata[member_limit]" = "unlimited"
    "metadata[team_limit]" = "unlimited"
}
$productIds["enterprise"] = $entProduct.id
Write-Host "  Enterprise Product ID: $($productIds['enterprise'])" -ForegroundColor Green

Write-Host ""

# ============================================
# CREATE PRICES
# ============================================

Write-Host "Creating Prices..." -ForegroundColor Cyan
Write-Host ""

# Price 1: Studio - $149/month
Write-Host "1. Creating Studio monthly price (`$149/month)..." -ForegroundColor White
$studioPrice = Invoke-StripeAPI -Endpoint "prices" -Body @{
    product = $productIds['studio']
    unit_amount = 14900
    currency = "usd"
    "recurring[interval]" = "month"
    "metadata[plan]" = "studio_monthly"
}
$priceIds["studio_monthly"] = $studioPrice.id
Write-Host "  Studio Price ID: $($priceIds['studio_monthly'])" -ForegroundColor Green

# Price 2: Professional - $349/month
Write-Host "2. Creating Professional monthly price (`$349/month)..." -ForegroundColor White
$proPrice = Invoke-StripeAPI -Endpoint "prices" -Body @{
    product = $productIds['professional']
    unit_amount = 34900
    currency = "usd"
    "recurring[interval]" = "month"
    "metadata[plan]" = "professional_monthly"
}
$priceIds["professional_monthly"] = $proPrice.id
Write-Host "  Professional Price ID: $($priceIds['professional_monthly'])" -ForegroundColor Green

# Price 3: Enterprise - $649/month
Write-Host "3. Creating Enterprise monthly price (`$649/month)..." -ForegroundColor White
$entPrice = Invoke-StripeAPI -Endpoint "prices" -Body @{
    product = $productIds['enterprise']
    unit_amount = 64900
    currency = "usd"
    "recurring[interval]" = "month"
    "metadata[plan]" = "enterprise_monthly"
}
$priceIds["enterprise_monthly"] = $entPrice.id
Write-Host "  Enterprise Price ID: $($priceIds['enterprise_monthly'])" -ForegroundColor Green

Write-Host ""

# ============================================
# CREATE PAYMENT LINKS
# ============================================

Write-Host "Creating Payment Links..." -ForegroundColor Cyan
Write-Host ""

# Payment Link 1: Studio
Write-Host "1. Creating Studio payment link..." -ForegroundColor White
$studioLink = Invoke-StripeAPI -Endpoint "payment_links" -Body @{
    "line_items[0][price]" = $priceIds['studio_monthly']
    "line_items[0][quantity]" = 1
    "after_completion[type]" = "redirect"
    "after_completion[redirect][url]" = "https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}"
}
$paymentLinks["studio"] = $studioLink.id
Write-Host "  Studio Payment Link ID: $($paymentLinks['studio'])" -ForegroundColor Green

# Payment Link 2: Professional
Write-Host "2. Creating Professional payment link..." -ForegroundColor White
$proLink = Invoke-StripeAPI -Endpoint "payment_links" -Body @{
    "line_items[0][price]" = $priceIds['professional_monthly']
    "line_items[0][quantity]" = 1
    "after_completion[type]" = "redirect"
    "after_completion[redirect][url]" = "https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}"
}
$paymentLinks["professional"] = $proLink.id
Write-Host "  Professional Payment Link ID: $($paymentLinks['professional'])" -ForegroundColor Green

# Payment Link 3: Enterprise
Write-Host "3. Creating Enterprise payment link..." -ForegroundColor White
$entLink = Invoke-StripeAPI -Endpoint "payment_links" -Body @{
    "line_items[0][price]" = $priceIds['enterprise_monthly']
    "line_items[0][quantity]" = 1
    "after_completion[type]" = "redirect"
    "after_completion[redirect][url]" = "https://gymunitysuite.com/membership-success?session_id={CHECKOUT_SESSION_ID}"
}
$paymentLinks["enterprise"] = $entLink.id
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

    $studioLinkData = Invoke-StripeAPI -Method "GET" -Endpoint "payment_links/$($paymentLinks['studio'])"
    Write-Host "  Studio:       $($studioLinkData.url)"

    $proLinkData = Invoke-StripeAPI -Method "GET" -Endpoint "payment_links/$($paymentLinks['professional'])"
    Write-Host "  Professional: $($proLinkData.url)"

    $entLinkData = Invoke-StripeAPI -Method "GET" -Endpoint "payment_links/$($paymentLinks['enterprise'])"
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
    mode = if ($apiKey.StartsWith("sk_live_")) { "live" } else { "test" }
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
