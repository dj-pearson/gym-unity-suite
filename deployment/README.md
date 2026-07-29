# Deployment Toolkit

Reusable deployment scripts for Supabase projects with self-hosted infrastructure.

## 📁 Folder Structure

```
deployment/
├── README.md                      # This file
├── QUICK_START.md                 # Quick start guide
├── PAUSE_PROJECT.md               # Safe teardown + restore checklist
├── env.template                   # Environment variables template
│
├── LOCAL SCRIPTS (Windows PowerShell):
├── deploy-all.ps1                 # Complete deployment from local
├── deploy-migrations.ps1          # Deploy migrations from local
├── deploy-functions.ps1           # Deploy via git push
├── deploy-functions-direct.ps1    # Deploy via SSH/SCP
├── restore-database.ps1           # Restore database from backup
├── import-data.ps1                # Import data from backups (legacy)
├── verify-deployment.ps1          # Verify all services
│
└── REMOTE SCRIPTS (Linux Bash):
    ├── deploy-all-remote.sh       # Complete deployment on server
    └── deploy-migrations-remote.sh # Deploy migrations on server
```

## 🎯 Two Ways to Deploy

### Option 1: From Your Local Windows Machine
Uses PowerShell (`.ps1`) scripts that SSH into your server.

```powershell
cd deployment
.\deploy-all.ps1
```

### Option 2: While SSH'd Into the Server
Uses Bash (`.sh`) scripts that run directly on the server.

```bash
# On your local machine, copy the deployment folder to server
scp -r deployment/ root@209.145.59.219:/root/deployment/

# SSH into server
ssh root@209.145.59.219

# Run deployment
cd /root/deployment
chmod +x *.sh
./deploy-all-remote.sh
```

## 🚀 Quick Setup

1. **Copy `.env` template**:
   ```powershell
   Copy-Item deployment/env.template .env
   ```

2. **Edit `.env`** with your credentials

3. **Choose your method**:
   - Local: `.\deployment\deploy-all.ps1`
   - Remote: Upload folder, SSH in, run `./deploy-all-remote.sh`

## 📋 Scripts Reference

### Local Scripts (PowerShell)

#### `deploy-all.ps1`
Complete deployment from local machine.
```powershell
.\deploy-all.ps1                    # Deploy everything
.\deploy-all.ps1 -SkipMigrations    # Skip migrations
.\deploy-all.ps1 -SkipFunctions     # Skip functions
.\deploy-all.ps1 -DirectDeploy      # Use SSH instead of git
```

#### `deploy-migrations.ps1`
Deploy database migrations only.
```powershell
.\deploy-migrations.ps1
.\deploy-migrations.ps1 -EnvFile "../.env.production"
```

#### `deploy-functions.ps1`
Deploy edge functions via git push (triggers Coolify).
```powershell
.\deploy-functions.ps1
.\deploy-functions.ps1 -CommitMessage "feat: new function"
```

#### `deploy-functions-direct.ps1`
Deploy edge functions via direct SSH/SCP (bypasses git).
```powershell
.\deploy-functions-direct.ps1
```

#### `restore-database.ps1`
Restore complete database from backup (recommended for migrations).
```powershell
.\restore-database.ps1 -BackupFile "../backup/your-backup.sql"
.\restore-database.ps1 -BackupFile "../backup.sql" -SkipVerification
```

Automatically:
- Uploads backup to server via SCP
- Imports via Docker container
- Verifies tables and row counts
- Cleans up temporary files

See [RESTORE_DATABASE.md](RESTORE_DATABASE.md) for detailed guide.

#### `import-data.ps1`
Import data from SQL backup (legacy method).
```powershell
.\import-data.ps1 -BackupFile "../backup.sql"
```

#### `verify-deployment.ps1`
Verify all services are healthy.
```powershell
.\verify-deployment.ps1
```

### Remote Scripts (Bash)

#### `deploy-all-remote.sh`
Complete deployment while on the server.
```bash
./deploy-all-remote.sh
```

#### `deploy-migrations-remote.sh`
Deploy migrations while on the server.
```bash
./deploy-migrations-remote.sh
```

## 📝 .env Configuration

Copy `env.template` to your project root as `.env`:

```env
# Database
DB_HOST=209.145.59.219
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_CONTAINER=supabase-db-xxxxx  # Optional, for Docker

# Server Access
SERVER_HOST=209.145.59.219
SERVER_USER=root

# Edge Functions
EDGE_FUNCTIONS_URL=https://functions.yourdomain.com
EDGE_FUNCTIONS_CONTAINER=container-name
FUNCTIONS_PATH=/data/coolify/services/xxx/volumes/functions

# Supabase
SUPABASE_URL=https://api.yourdomain.com
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## 🔄 Typical Workflows

### New Project Setup:
```powershell
# 1. Copy deployment folder
Copy-Item -Recurse deployment/ ../new-project/deployment/

# 2. Configure .env for new database
Copy-Item deployment/env.template ../new-project/.env

# 3. Deploy
cd ../new-project/deployment
.\deploy-all.ps1
```

### Regular Updates:
```powershell
# After making changes
cd deployment
.\deploy-all.ps1
```

### Emergency Hotfix:
```powershell
# Direct deployment without git
.\deploy-functions-direct.ps1
```

### Migrate to New Database:
```powershell
# 1. Update .env with new credentials
# 2. Deploy
.\deploy-all.ps1
```

## Prerequisites

### Local Machine (Windows):
- PowerShell 5.1+ or PowerShell Core
- `psql` - [PostgreSQL Client](https://www.postgresql.org/download/windows/)
- `git`
- `ssh` / `scp` (Windows 10+ built-in)

### Remote Server (Linux):
- Docker
- `psql` (if using remote scripts)
- SSH access configured

## 🎁 Portable Package

The entire `deployment/` folder is **self-contained**:
- ✅ Copy to any project
- ✅ Update `.env`  
- ✅ Run scripts
- ✅ No other dependencies

Perfect for migrating multiple databases! 🚀

## Troubleshooting

### "psql not found"
Install PostgreSQL client tools.

### "Permission denied (SSH)"
Set up SSH keys or ensure password authentication works.

### "Container not found"
Update `EDGE_FUNCTIONS_CONTAINER` in `.env` with correct name.

### Scripts won't run (Linux)
```bash
chmod +x *.sh
```

## Support

See `QUICK_START.md` for step-by-step instructions.
