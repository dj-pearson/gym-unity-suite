#!/bin/bash
# Check Edge Functions Setup on Coolify
# Run this ON the server via SSH

echo "========================================="
echo "SUPABASE EDGE FUNCTIONS DISCOVERY"
echo "========================================="
echo ""

echo "1. Checking Docker Containers..."
echo "---------------------------------"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -E "supabase|deno"
echo ""

echo "2. Checking for Edge Functions Container..."
echo "-------------------------------------------"
if docker ps | grep -q "functions\|edge-functions\|deno"; then
    FUNCTIONS_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "functions|edge-functions|deno" | head -1)
    echo "✅ Found functions container: $FUNCTIONS_CONTAINER"
    echo ""
    echo "Container details:"
    docker inspect $FUNCTIONS_CONTAINER --format '
  Image: {{.Config.Image}}
  Status: {{.State.Status}}
  Ports: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}} {{end}}
  Mounts: {{range .Mounts}}
    - {{.Source}} -> {{.Destination}}{{end}}
  Environment:{{range .Config.Env}}
    - {{.}}{{end}}
'
else
    echo "❌ No edge functions container found"
    echo ""
    echo "Need to set up edge functions manually."
fi
echo ""

echo "3. Checking Coolify Service Directories..."
echo "------------------------------------------"
if [ -d "/data/coolify/services" ]; then
    echo "Coolify services found:"
    ls -la /data/coolify/services | grep supabase
    echo ""
    
    # Look for functions volumes
    echo "Looking for function volumes..."
    find /data/coolify/services -type d -name "*function*" 2>/dev/null | head -10
else
    echo "No /data/coolify/services directory found"
fi
echo ""

echo "4. Checking Docker Networks..."
echo "------------------------------"
docker network ls | grep supabase
echo ""

echo "5. Checking Kong (API Gateway) Configuration..."
echo "-----------------------------------------------"
KONG_CONTAINER=$(docker ps --format "{{.Names}}" | grep kong | head -1)
if [ ! -z "$KONG_CONTAINER" ]; then
    echo "✅ Found Kong container: $KONG_CONTAINER"
    echo ""
    echo "Checking Kong services for functions route..."
    docker exec $KONG_CONTAINER kong config db_export /tmp/kong.yml 2>/dev/null
    docker exec $KONG_CONTAINER cat /tmp/kong.yml 2>/dev/null | grep -A 5 "functions" || echo "No functions route found in Kong"
else
    echo "❌ No Kong container found"
fi
echo ""

echo "6. Testing Database Connection from Host..."
echo "-------------------------------------------"
docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"
echo ""

echo "7. Summary & Recommendations"
echo "============================"
echo ""

if docker ps | grep -q "functions\|edge-functions\|deno"; then
    echo "✅ Edge functions container exists"
    echo "   → Use Method 1: Deploy via Coolify"
    echo "   → Update functions in the container's mounted volume"
else
    echo "❌ No edge functions container found"
    echo "   → Use Method 2: Manual Docker Deployment"
    echo "   → Create new container for edge functions"
fi
echo ""
echo "========================================="
