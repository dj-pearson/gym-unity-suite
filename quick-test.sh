#!/bin/bash
# Quick Test Runner for Navigation & Functionality Fixes
# This script helps verify the three critical test areas

set -e

echo "🧪 Gym Unity Suite - Quick Test Runner"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if navigation fixes are in place
echo "📍 Test 1: Navigation & Routing"
echo "--------------------------------"

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    return 0
  else
    echo -e "${RED}✗${NC} $1 not found"
    return 1
  fi
}

# Check critical files
check_file "src/components/layout/AppSidebar.tsx"
check_file "src/components/members/AddMemberDialog.tsx"
check_file "src/pages/EquipmentPage.tsx"
check_file "src/components/communication/PlaceholderComponents.tsx"

echo ""

# Test 2: Verify AppSidebar has correct routes
echo "📍 Test 2: Sidebar Navigation Routes"
echo "------------------------------------"

if grep -q "href: '/dashboard'" src/components/layout/AppSidebar.tsx; then
  echo -e "${GREEN}✓${NC} Dashboard route fixed (href: '/dashboard')"
else
  echo -e "${RED}✗${NC} Dashboard route not fixed"
fi

if grep -q "name: 'Attribution'" src/components/layout/AppSidebar.tsx; then
  echo -e "${GREEN}✓${NC} Attribution route added"
else
  echo -e "${RED}✗${NC} Attribution route missing"
fi

if grep -q "name: 'Corporate Accounts'" src/components/layout/AppSidebar.tsx; then
  echo -e "${GREEN}✓${NC} Corporate Accounts route added"
else
  echo -e "${RED}✗${NC} Corporate Accounts route missing"
fi

if grep -q "name: 'Support Tickets'" src/components/layout/AppSidebar.tsx; then
  echo -e "${GREEN}✓${NC} Support Tickets route added"
else
  echo -e "${RED}✗${NC} Support Tickets route missing"
fi

echo ""

# Test 3: Verify security fixes
echo "📍 Test 3: Security Fixes (organization_id filters)"
echo "---------------------------------------------------"

if grep -q "eq('organization_id', profile.organization_id)" src/components/communication/PlaceholderComponents.tsx; then
  echo -e "${GREEN}✓${NC} Communication components have organization_id filters"
else
  echo -e "${RED}✗${NC} Communication components missing organization_id filters"
fi

if grep -q "eq('organization_id', profile.organization_id)" src/pages/EquipmentPage.tsx; then
  echo -e "${GREEN}✓${NC} Equipment page has organization_id filters"
else
  echo -e "${RED}✗${NC} Equipment page missing organization_id filters"
fi

if grep -q "leads!inner(organization_id)" src/pages/CRMPage.tsx; then
  echo -e "${GREEN}✓${NC} CRM page uses JOIN for organization filtering"
else
  echo -e "${RED}✗${NC} CRM page missing JOIN optimization"
fi

echo ""

# Test 4: Verify Equipment page uses real data
echo "📍 Test 4: Equipment Page Real Data Queries"
echo "-------------------------------------------"

if grep -q "const \[stats, setStats\] = useState<EquipmentStats>" src/pages/EquipmentPage.tsx; then
  echo -e "${GREEN}✓${NC} Equipment page has stats state"
else
  echo -e "${RED}✗${NC} Equipment page missing stats state"
fi

if grep -q "fetchEquipmentStats" src/pages/EquipmentPage.tsx; then
  echo -e "${GREEN}✓${NC} Equipment page has fetchEquipmentStats function"
else
  echo -e "${RED}✗${NC} Equipment page missing fetchEquipmentStats"
fi

if grep -q "\"127\"" src/pages/EquipmentPage.tsx; then
  echo -e "${RED}✗${NC} WARNING: Hardcoded '127' still found in Equipment page"
else
  echo -e "${GREEN}✓${NC} No hardcoded equipment count found"
fi

echo ""

# Test 5: Verify AddMemberDialog exists and is imported
echo "📍 Test 5: Member Creation Workflow"
echo "-----------------------------------"

if [ -f "src/components/members/AddMemberDialog.tsx" ]; then
  echo -e "${GREEN}✓${NC} AddMemberDialog component exists"

  if grep -q "import { AddMemberDialog }" src/pages/MembersPage.tsx; then
    echo -e "${GREEN}✓${NC} AddMemberDialog imported in MembersPage"
  else
    echo -e "${RED}✗${NC} AddMemberDialog not imported"
  fi

  if grep -q "setIsAddMemberDialogOpen" src/pages/MembersPage.tsx; then
    echo -e "${GREEN}✓${NC} Add Member button handlers implemented"
  else
    echo -e "${RED}✗${NC} Add Member button handlers missing"
  fi
else
  echo -e "${RED}✗${NC} AddMemberDialog component not found"
fi

echo ""

# Test 6: Git status check
echo "📍 Test 6: Git Status"
echo "--------------------"

if [ -d ".git" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "Current branch: ${YELLOW}${BRANCH}${NC}"

  if [ "$BRANCH" = "claude/navigation-and-functionality-st5Zp" ]; then
    echo -e "${GREEN}✓${NC} On correct branch"
  else
    echo -e "${YELLOW}⚠${NC} Not on expected branch (claude/navigation-and-functionality-st5Zp)"
  fi

  # Check for uncommitted changes
  if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓${NC} No uncommitted changes"
  else
    echo -e "${YELLOW}⚠${NC} Uncommitted changes present"
  fi
else
  echo -e "${RED}✗${NC} Not a git repository"
fi

echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start dev server: ${YELLOW}npm run dev${NC}"
echo "2. Open browser to: ${YELLOW}http://localhost:8080${NC}"
echo "3. Follow manual tests in: ${YELLOW}TESTING_GUIDE.md${NC}"
echo ""
echo "SQL verification:"
echo "• Run: ${YELLOW}test-multi-tenant-isolation.sql${NC} in Supabase"
echo "• Run: ${YELLOW}test-equipment-stats.sql${NC} in Supabase"
echo ""
echo "For detailed testing procedures, see:"
echo "📖 ${YELLOW}TESTING_GUIDE.md${NC}"
echo ""
