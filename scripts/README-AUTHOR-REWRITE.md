# Git Author Rewrite Scripts

These scripts rewrite Git commit history to change author information from Lovable GPT Engineer or Claude AI to your own authorship.

## ⚠️ Important Warnings

**This operation rewrites Git history!**
- Creates new commit hashes for all rewritten commits
- Requires force push to remote repositories
- Can cause issues for collaborators who have cloned the repo
- **Cannot be easily undone** (except from backup branch)

**Always:**
1. Backup your repository before running
2. Coordinate with your team if this is a shared repository
3. Review changes before force pushing

## Files

- **`rewrite-git-authors.ps1`** - PowerShell version (Windows)
- **`rewrite-git-authors.sh`** - Bash version (Linux/Mac/Git Bash on Windows)

## Prerequisites

- Git installed and configured
- Repository must have commits from Lovable or Claude
- Git config must have `user.name` and `user.email` set (or provide via parameters)

## Usage

### PowerShell (Windows)

```powershell
# From repository root
cd C:\path\to\your\repo

# Use git config author info
.\scripts\rewrite-git-authors.ps1

# Specify custom author
.\scripts\rewrite-git-authors.ps1 -NewAuthorName "Your Name" -NewAuthorEmail "you@example.com"

# Dry run (preview changes)
.\scripts\rewrite-git-authors.ps1 -DryRun

# Skip confirmation prompts
.\scripts\rewrite-git-authors.ps1 -Force
```

### Bash (Linux/Mac/Git Bash)

```bash
# From repository root
cd /path/to/your/repo

# Make executable (first time only)
chmod +x scripts/rewrite-git-authors.sh

# Use git config author info
./scripts/rewrite-git-authors.sh

# Specify custom author
./scripts/rewrite-git-authors.sh --name "Your Name" --email "you@example.com"

# Dry run (preview changes)
./scripts/rewrite-git-authors.sh --dry-run

# Skip confirmation prompts
./scripts/rewrite-git-authors.sh --force
```

## What Gets Rewritten

The script identifies and rewrites commits from these authors:

- **lovable-dev[bot]**
- **lovable-gpt-engineer[bot]**
- Any author name or email containing "lovable" (case-insensitive)
- Any author name or email containing "claude" (case-insensitive)
- **GPT Engineer**
- **assistant**

## How It Works

1. **Scans** all commits in the repository
2. **Identifies** commits from Lovable/Claude authors
3. **Creates** a backup branch automatically
4. **Rewrites** matching commits with your author information
5. **Preserves** commit messages, dates, and file changes
6. **Cleans up** refs and garbage collects

## Workflow

### Step 1: Dry Run (Recommended)

```bash
./scripts/rewrite-git-authors.sh --dry-run
```

This shows what will be changed without modifying anything.

### Step 2: Review Current Config

```bash
git config user.name
git config user.email
```

Set if needed:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 3: Run the Script

```bash
./scripts/rewrite-git-authors.sh
```

Type `yes` when prompted to proceed.

### Step 4: Review Changes

```bash
# View rewritten history
git log --all --oneline --graph

# Compare with backup
git log --oneline backup-before-author-rewrite-*
```

### Step 5: Push to Remote

**Only if you're satisfied with the changes:**

```bash
# Force push all branches
git push --force --all origin

# Force push all tags
git push --force --tags origin
```

### Step 6: Notify Collaborators

All team members must either:

**Option A: Re-clone (Safest)**
```bash
cd ..
rm -rf old-repo
git clone <repo-url> new-repo
```

**Option B: Reset Local Repo**
```bash
git fetch origin
git reset --hard origin/main  # for each branch
git clean -fdx
```

## Recovery

If something goes wrong, restore from the backup branch:

```bash
# Find backup branch name
git branch | grep backup-before-author-rewrite

# Reset to backup
git reset --hard backup-before-author-rewrite-20260101-120000

# Force push to restore remote
git push --force --all origin
```

## Using in Other Projects

These scripts are completely portable! Just copy them to any Git repository:

```bash
# Copy to another project (creates scripts/ directory if needed)
mkdir -p /path/to/other/project/scripts
cp scripts/rewrite-git-authors.* /path/to/other/project/scripts/

# Run from that project root
cd /path/to/other/project
./scripts/rewrite-git-authors.sh
```

The script automatically:
- Detects the current repository
- Uses that repo's git config
- Works with any commit history

## Troubleshooting

### "Not a git repository"
Make sure you're running the script from inside a Git repository.

### "git config user.name is not set"
Set your git config:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Force push fails
You may need to disable branch protection or contact your repo admin.

### Some commits weren't rewritten
The script uses pattern matching. Check the patterns in the script and add more if needed.

## Technical Details

The scripts use `git filter-branch --env-filter` to:
- Iterate through all commits
- Check author name and email against patterns
- Replace matching commits with new author info
- Update both author and committer information
- Maintain commit integrity (hashes change, but content is preserved)

## License

These scripts are provided as-is for modifying your own repositories. Use at your own risk.
