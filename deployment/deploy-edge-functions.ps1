# Deploy Edge Functions to Self-Hosted Supabase
# This script handles deployment of all 13 edge functions
param(
    [string]$EnvFile = "../.env",
    [string]$Method = "auto" # auto, coolify, docker, or cli
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "EDGE FUNCTIONS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load .env file
if (Test-Path $EnvFile) {
    Write-Host "Loading configuration from $EnvFile..." -ForegroundColor Green
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
} else {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

# Validate required variables
$required = @("SERVER_HOST", "SERVER_USER")
foreach ($var in $required) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Missing required variable $var in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Server: ${SERVER_USER}@${SERVER_HOST}" -ForegroundColor White
Write-Host ""

# Step 1: Check what's already set up
Write-Host "Step 1: Discovering existing setup..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

$checkScript = Get-Content "check-edge-functions.sh" -Raw
$checkScript | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/check-functions.sh && chmod +x /tmp/check-functions.sh && /tmp/check-functions.sh"

$hasFunctionsContainer = ssh ${SERVER_USER}@${SERVER_HOST} "docker ps | grep -c 'functions\|edge-functions\|deno'" 2>$null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($hasFunctionsContainer -gt 0) {
    Write-Host "✅ Edge Functions container found!" -ForegroundColor Green
    Write-Host "Using Method: Deploy via Coolify" -ForegroundColor White
    $deployMethod = "coolify"
} else {
    Write-Host "❌ No Edge Functions container found" -ForegroundColor Yellow
    Write-Host "Using Method: Manual Docker Deployment" -ForegroundColor White
    $deployMethod = "docker"
}

if ($Method -ne "auto") {
    $deployMethod = $Method
}

Write-Host "========================================`n" -ForegroundColor Cyan

# Step 2: Upload functions to server
Write-Host "Step 2: Uploading edge functions..." -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

$functionsPath = "..\supabase\functions"
$remoteTempPath = "/tmp/supabase-functions"

Write-Host "Uploading 13 functions to server..." -ForegroundColor White
scp -r "$functionsPath" "${SERVER_USER}@${SERVER_HOST}:$remoteTempPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading functions" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Functions uploaded successfully`n" -ForegroundColor Green

# Step 3: Deploy based on method
Write-Host "Step 3: Deploying functions ($deployMethod method)..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Yellow

if ($deployMethod -eq "coolify") {
    # Method 1: Deploy to existing Coolify container
    $deployScript = @'
#!/bin/bash
set -e

echo "Finding functions container..."
FUNCTIONS_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "functions|edge-functions" | head -1)

if [ -z "$FUNCTIONS_CONTAINER" ]; then
    echo "Error: Functions container not found"
    exit 1
fi

echo "Found container: $FUNCTIONS_CONTAINER"

# Find the mounted volume
FUNCTIONS_VOLUME=$(docker inspect $FUNCTIONS_CONTAINER --format '{{range .Mounts}}{{if eq .Destination "/app/functions"}}{{.Source}}{{end}}{{end}}')

if [ -z "$FUNCTIONS_VOLUME" ]; then
    echo "Warning: Could not find /app/functions mount, trying /functions..."
    FUNCTIONS_VOLUME=$(docker inspect $FUNCTIONS_CONTAINER --format '{{range .Mounts}}{{if eq .Destination "/functions"}}{{.Source}}{{end}}{{end}}')
fi

if [ -z "$FUNCTIONS_VOLUME" ]; then
    echo "Error: Could not determine functions volume path"
    exit 1
fi

echo "Functions volume: $FUNCTIONS_VOLUME"

# Backup existing functions
if [ -d "$FUNCTIONS_VOLUME" ]; then
    echo "Backing up existing functions..."
    tar -czf /tmp/functions-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $FUNCTIONS_VOLUME . || true
fi

# Copy new functions
echo "Deploying new functions..."
mkdir -p $FUNCTIONS_VOLUME
cp -r /tmp/supabase-functions/* $FUNCTIONS_VOLUME/

# Restart container
echo "Restarting functions container..."
docker restart $FUNCTIONS_CONTAINER

echo "✅ Functions deployed successfully!"
'@

    $deployScript | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/deploy-functions.sh && chmod +x /tmp/deploy-functions.sh && /tmp/deploy-functions.sh"

} elseif ($deployMethod -eq "docker") {
    # Method 2: Create new Docker container
    
    # First, create the Dockerfile and serve.ts
    Write-Host "Creating Dockerfile and server..." -ForegroundColor White
    
    $dockerfile = @'
FROM denoland/deno:1.38.0

WORKDIR /app

# Copy all functions
COPY . .

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD deno eval "fetch('http://localhost:9000/_internal/health').then(() => Deno.exit(0)).catch(() => Deno.exit(1))"

# Start functions server
CMD ["deno", "run", "--allow-all", "--unstable", "serve.ts"]
'@

    $serveTs = @'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const FUNCTION_ROUTES: Record<string, string> = {
  "/ai-generate": "./ai-generate/index.ts",
  "/check-subscription": "./check-subscription/index.ts",
  "/create-checkout": "./create-checkout/index.ts",
  "/create-one-time-payment": "./create-one-time-payment/index.ts",
  "/customer-portal": "./customer-portal/index.ts",
  "/generate-sitemap": "./generate-sitemap/index.ts",
  "/generate-wallet-pass": "./generate-wallet-pass/index.ts",
  "/get-org-by-domain": "./get-org-by-domain/index.ts",
  "/receive-email": "./receive-email/index.ts",
  "/send-email-response": "./send-email-response/index.ts",
  "/setup-new-user": "./setup-new-user/index.ts",
  "/verify-custom-domain": "./verify-custom-domain/index.ts",
  "/verify-payment": "./verify-payment/index.ts",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  
  if (url.pathname === "/_internal/health") {
    return new Response("OK", { status: 200 });
  }

  const functionPath = FUNCTION_ROUTES[url.pathname];
  
  if (!functionPath) {
    return new Response("Function not found", { status: 404 });
  }

  try {
    const module = await import(functionPath);
    return await module.default(req);
  } catch (error) {
    console.error(`Error in ${url.pathname}:`, error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, { port: 9000 });

console.log("Edge Functions server running on port 9000");
'@

    # Upload Dockerfile and serve.ts
    $dockerfile | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/supabase-functions/Dockerfile"
    $serveTs | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/supabase-functions/serve.ts"

    # Build and run
    $buildScript = @"
#!/bin/bash
set -e

cd /tmp/supabase-functions

echo "Building Docker image..."
docker build -t supabase-edge-functions:latest .

echo "Stopping old container if exists..."
docker stop supabase-functions 2>/dev/null || true
docker rm supabase-functions 2>/dev/null || true

echo "Finding Supabase network..."
SUPABASE_NETWORK=`$(docker network ls --format "{{.Name}}" | grep supabase | head -1)

if [ -z "`$SUPABASE_NETWORK" ]; then
    echo "Creating supabase network..."
    SUPABASE_NETWORK="supabase-network"
    docker network create `$SUPABASE_NETWORK
fi

echo "Starting functions container..."
docker run -d \
  --name supabase-functions \
  --network `$SUPABASE_NETWORK \
  -p 9000:9000 \
  -e SUPABASE_URL="${SUPABASE_URL}" \
  -e SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@supabase-db-${DB_CONTAINER#supabase-db-}:5432/postgres" \
  --restart unless-stopped \
  supabase-edge-functions:latest

echo "✅ Functions container started!"
echo ""
echo "Testing health endpoint..."
sleep 3
curl -f http://localhost:9000/_internal/health && echo "✅ Health check passed!" || echo "❌ Health check failed"
"@

    $buildScript | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/build-functions.sh && chmod +x /tmp/build-functions.sh && /tmp/build-functions.sh"

} else {
    Write-Host "Unknown deployment method: $deployMethod" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Verify deployment
Write-Host "Step 4: Verifying deployment..." -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

$verifyScript = @'
#!/bin/bash
echo "Checking functions container status..."
docker ps | grep -E "functions|edge-functions|deno"
echo ""
echo "Checking container logs (last 20 lines)..."
FUNCTIONS_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "functions|edge-functions|deno" | head -1)
if [ ! -z "$FUNCTIONS_CONTAINER" ]; then
    docker logs --tail 20 $FUNCTIONS_CONTAINER
fi
'@

$verifyScript | ssh ${SERVER_USER}@${SERVER_HOST} "bash"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your 13 edge functions have been deployed." -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test a function: curl http://${SERVER_HOST}:9000/_internal/health" -ForegroundColor White
Write-Host "2. Configure Kong to route /functions/* to the container" -ForegroundColor White
Write-Host "3. Update your app to use: https://api.repclub.net/functions/v1/" -ForegroundColor White
Write-Host ""
