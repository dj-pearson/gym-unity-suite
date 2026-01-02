#!/bin/bash

# Git Author Rewrite Script
# Rewrites Git history to change commit authors from Lovable/Claude to specified author

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Default values
NEW_AUTHOR_NAME=""
NEW_AUTHOR_EMAIL=""
DRY_RUN=false
FORCE=false

# Help message
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Rewrite Git history to change commit authors from Lovable/Claude to your author info.

OPTIONS:
    -n, --name NAME       New author name (default: from git config)
    -e, --email EMAIL     New author email (default: from git config)
    -d, --dry-run         Show what would be changed without modifying history
    -f, --force           Skip confirmation prompts
    -h, --help            Show this help message

EXAMPLES:
    $0
    $0 --name "DJ Pearson" --email "dj@example.com"
    $0 --dry-run

WARNING: This rewrites Git history!
    - Always backup your repository first
    - Coordinate with team if repo is shared
    - Will require force push to remote

EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            NEW_AUTHOR_NAME="$2"
            shift 2
            ;;
        -e|--email)
            NEW_AUTHOR_EMAIL="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            ;;
    esac
done

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Git Author Rewrite Script                           ║"
echo "║        Rewrite Lovable/Claude commits to your authorship  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Not in a git repository${NC}"
    echo "  Please run this script from within a git repo."
    exit 1
fi

GIT_ROOT=$(git rev-parse --show-toplevel)
echo -e "${GREEN}✓ Git repository detected: $GIT_ROOT${NC}"

# Get author info from git config if not provided
if [ -z "$NEW_AUTHOR_NAME" ]; then
    NEW_AUTHOR_NAME=$(git config user.name || echo "")
    if [ -z "$NEW_AUTHOR_NAME" ]; then
        echo -e "${RED}✗ Error: No author name provided and git config user.name is not set${NC}"
        echo -e "${YELLOW}  Run: git config user.name 'Your Name'${NC}"
        exit 1
    fi
fi

if [ -z "$NEW_AUTHOR_EMAIL" ]; then
    NEW_AUTHOR_EMAIL=$(git config user.email || echo "")
    if [ -z "$NEW_AUTHOR_EMAIL" ]; then
        echo -e "${RED}✗ Error: No author email provided and git config user.email is not set${NC}"
        echo -e "${YELLOW}  Run: git config user.email 'your.email@example.com'${NC}"
        exit 1
    fi
fi

echo -e "\n${CYAN}New author information:${NC}"
echo "  Name:  $NEW_AUTHOR_NAME"
echo "  Email: $NEW_AUTHOR_EMAIL"
echo ""

# Scan for commits to rewrite
echo -e "${YELLOW}Scanning commit history for Lovable/Claude commits...${NC}\n"

COMMITS_TO_REWRITE=$(git log --all --format="%H|%an|%ae|%s" --no-merges | \
    grep -iE "(lovable|claude|gpt.engineer|assistant\|)" || true)

if [ -z "$COMMITS_TO_REWRITE" ]; then
    echo -e "${GREEN}✓ No Lovable/Claude commits found. Nothing to rewrite!${NC}"
    exit 0
fi

COMMIT_COUNT=$(echo "$COMMITS_TO_REWRITE" | wc -l | tr -d ' ')
echo -e "${YELLOW}Found $COMMIT_COUNT commit(s) to rewrite:${NC}\n"

echo "$COMMITS_TO_REWRITE" | head -20 | while IFS='|' read -r hash author email subject; do
    short_hash="${hash:0:8}"
    echo -e "${GRAY}  [$short_hash] $subject${NC}"
    echo -e "${GRAY}    Author: $author <$email>${NC}"
done

if [ "$COMMIT_COUNT" -gt 20 ]; then
    echo -e "${GRAY}  ... and $((COMMIT_COUNT - 20)) more${NC}"
fi

if [ "$DRY_RUN" = true ]; then
    echo -e "\n${GREEN}✓ Dry run complete. No changes made.${NC}"
    echo -e "${YELLOW}  Run without --dry-run to apply changes.${NC}"
    exit 0
fi

# Warning
echo -e "\n${RED}⚠️  WARNING: This operation will rewrite Git history!${NC}"
echo -e "${YELLOW}   - Creates new commit hashes for all affected commits${NC}"
echo -e "${YELLOW}   - Requires force push if already pushed to remote${NC}"
echo -e "${YELLOW}   - May cause issues for collaborators${NC}"
echo -e "${YELLOW}   - Cannot be easily undone${NC}\n"

if [ "$FORCE" = false ]; then
    read -p "Do you want to continue? Type 'yes' to proceed: " confirmation
    if [ "$confirmation" != "yes" ]; then
        echo -e "\n${RED}✗ Operation cancelled.${NC}"
        exit 0
    fi
fi

# Create backup branch
BACKUP_BRANCH="backup-before-author-rewrite-$(date +%Y%m%d-%H%M%S)"
echo -e "\n${CYAN}Creating backup branch: $BACKUP_BRANCH${NC}"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✓ Backup created${NC}"

# Rewrite history
echo -e "\n${CYAN}Rewriting commit history...${NC}"

export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch --env-filter "
# Lovable/Claude patterns
if [ \"\$GIT_AUTHOR_EMAIL\" = \"lovable-dev[bot]@users.noreply.github.com\" ] || 
   [ \"\$GIT_AUTHOR_NAME\" = \"lovable-dev[bot]\" ] ||
   [ \"\$GIT_AUTHOR_EMAIL\" = \"lovable-gpt-engineer[bot]@users.noreply.github.com\" ] ||
   [ \"\$GIT_AUTHOR_NAME\" = \"lovable-gpt-engineer[bot]\" ] ||
   echo \"\$GIT_AUTHOR_EMAIL\" | grep -qi \"lovable\" ||
   echo \"\$GIT_AUTHOR_NAME\" | grep -qi \"lovable\" ||
   echo \"\$GIT_AUTHOR_EMAIL\" | grep -qi \"claude\" ||
   echo \"\$GIT_AUTHOR_NAME\" | grep -qi \"claude\" ||
   [ \"\$GIT_AUTHOR_NAME\" = \"GPT Engineer\" ] ||
   [ \"\$GIT_AUTHOR_NAME\" = \"assistant\" ]
then
    export GIT_AUTHOR_NAME=\"$NEW_AUTHOR_NAME\"
    export GIT_AUTHOR_EMAIL=\"$NEW_AUTHOR_EMAIL\"
    export GIT_COMMITTER_NAME=\"$NEW_AUTHOR_NAME\"
    export GIT_COMMITTER_EMAIL=\"$NEW_AUTHOR_EMAIL\"
fi
" --tag-name-filter cat -- --all

echo -e "${GREEN}✓ History rewrite complete!${NC}"

# Cleanup
echo -e "\n${CYAN}Cleaning up...${NC}"
git for-each-ref --format="%(refname)" refs/original/ | xargs -r -n 1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now --aggressive 2>/dev/null

echo -e "\n${GREEN}✓ Complete! History has been rewritten.${NC}"
echo -e "\n${CYAN}Next steps:${NC}"
echo "  1. Review the changes with: git log --all --oneline"
echo "  2. If satisfied, force push to remote: git push --force --all origin"
echo "  3. If needed, restore from backup: git reset --hard $BACKUP_BRANCH"
echo -e "\n${YELLOW}⚠️  Remember: All collaborators will need to re-clone or reset their repos!${NC}"
