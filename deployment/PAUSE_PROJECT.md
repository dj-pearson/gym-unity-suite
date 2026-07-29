# Pause / Teardown Checklist

How to safely delete this project from Coolify to free server resources, and how to bring it
back later. Written while the project is **pre-launch with zero users** — the only thing worth
preserving is configuration, not data.

**Read this top to bottom before deleting anything in Coolify.**

---

## ⚠️ The One Thing That Isn't in Git

The repo's `.env` is **byte-identical to `.env.example`** — it's the template, not real config.
Every production value exists **only in Coolify's environment variables**. Delete the project
without exporting them and they are unrecoverable.

Everything else (schema, functions, deploy scripts) is in git and replayable.

---

## 📤 Phase 1: Export Before You Delete

### 1. Secrets → password manager (REQUIRED)

In Coolify, open each resource → **Environment Variables** → copy the values for:

| Variable | Where it lives | Notes |
|----------|----------------|-------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Supabase stack | Postgres connection |
| `SUPABASE_URL` | Supabase stack | Public API URL |
| `SUPABASE_ANON_KEY` | Supabase stack | Derived from JWT secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase stack | **Secret** — full DB bypass |
| `JWT_SECRET` | Supabase stack | Anon + service keys are signed with this |
| `EDGE_FUNCTIONS_URL` | Edge functions app | Kong route |
| `STRIPE_SECRET_KEY` | Edge functions app | **Secret** |
| `STRIPE_WEBHOOK_SECRET` | Edge functions app | **Secret** — tied to the webhook endpoint |
| SMTP / email vars | Supabase stack | If inbound/outbound email was configured |
| OAuth client ID + secret | Edge functions app | Used by the `oauth-proxy` function |

> Store these **outside this repo**. `.env` is gitignored, but a plaintext file on disk is still
> a bad home for a service role key. Use a password manager entry named `Rep Club — Coolify (paused)`.

### 2. Schema dump (REQUIRED)

The newest backup in `backup/` is from **15 Dec 2025** and predates recent migrations. Take a
current schema-only dump as ground truth to diff against if the migration chain ever fails to
replay cleanly from scratch. No data dump needed — there are no users.

```bash
ssh root@209.145.59.219

# Find the Postgres container
docker ps | grep postgres

# Schema-only dump (replace container name with the one from above)
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww \
  pg_dump -U postgres -d postgres --schema-only > /tmp/repclub-schema-final.sql

# Also capture roles/grants, which pg_dump --schema-only omits
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww \
  pg_dumpall -U postgres --roles-only > /tmp/repclub-roles-final.sql
```

Pull them down:

```powershell
scp root@209.145.59.219:/tmp/repclub-schema-final.sql ./backup/
scp root@209.145.59.219:/tmp/repclub-roles-final.sql ./backup/
```

### 3. Storage buckets (REQUIRED — not covered by migrations)

Zero of the 98 migration files reference `storage.buckets`. Any bucket created through the
Supabase dashboard will **not** come back from git.

```bash
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww \
  psql -U postgres -d postgres -c "SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;"

# Bucket access policies
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww \
  psql -U postgres -d postgres -c "SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = 'storage';"
```

Record the output below (or write "none — no buckets existed"):

```
BUCKETS AS OF TEARDOWN:
  (paste here)
```

### 4. Note the external wiring

Things outside Coolify that point *at* Coolify and will dangle:

- [ ] **Stripe webhook endpoint** — note the URL and which events it subscribes to
      (Stripe Dashboard → Developers → Webhooks). It will 404 after teardown; disable it.
- [ ] **DNS records** — whatever `api.*` / `functions.*` subdomains point to `209.145.59.219`
- [ ] **Cloudflare Pages** — the frontend deployment and its env vars
- [ ] **OAuth redirect URIs** — registered with the provider, pointing at the old functions URL

---

## 🛑 Phase 2: Teardown

1. **Pause the Cloudflare Pages frontend** first. Otherwise the site stays publicly reachable
   but pointed at a dead API — broken rather than simply offline.
2. **Disable the Stripe webhook endpoint** so it stops retrying against a dead URL.
3. In Coolify, delete the **edge functions** application.
4. In Coolify, delete the **Supabase stack**.
   - Confirm you're also removing its volumes if you want the disk space actually freed —
     Coolify can leave orphaned volumes behind.
5. Verify the space was reclaimed:
   ```bash
   ssh root@209.145.59.219
   docker system df
   docker volume ls          # look for orphaned supabase-* volumes
   df -h
   ```

> **Note:** deleting the Supabase stack destroys its `JWT_SECRET`. A future redeploy generates a
> **new** secret, so the old `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` become permanently
> invalid. That's fine here (nothing is live), but it means restore = "issue new keys and update
> every consumer," not "paste the old keys back."

---

## 🔁 Phase 3: Bringing It Back

The full path already exists in this folder — see `README.md` and `QUICK_START.md`. Sequence:

1. **Redeploy a Supabase stack** in Coolify (one-click). It generates a fresh `JWT_SECRET`,
   `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Fill in `.env`** from `deployment/env.template` using the *new* keys plus the preserved
   Stripe/OAuth/SMTP secrets from your password manager:
   ```powershell
   Copy-Item deployment/env.template .env
   # then edit .env
   ```
3. **Apply migrations** — this rebuilds all ~243 tables from the 98 files in `supabase/migrations/`:
   ```powershell
   cd deployment
   .\deploy-migrations.ps1
   ```
4. **Recreate storage buckets** from the notes captured in Phase 1 §3.
5. **Deploy edge functions** (all 20, including `oauth-proxy`):
   ```powershell
   .\deploy-edge-functions-coolify.ps1
   ```
6. **Re-point external services:**
   - New Stripe webhook endpoint → new functions URL → save the new `STRIPE_WEBHOOK_SECRET`
   - OAuth redirect URIs → new functions URL
   - DNS records → new server IP if it changed
   - Cloudflare Pages env vars → new `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
     `VITE_SUPABASE_FUNCTIONS_URL`
7. **Verify:**
   ```powershell
   .\verify-deployment.ps1
   ```
   Then sanity-check the table count matches expectations:
   ```bash
   docker exec -i <db-container> psql -U postgres -d postgres \
     -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
   ```
   If it's materially below ~243, diff against `backup/repclub-schema-final.sql` to find what
   the migration chain failed to reproduce.

---

## ✅ Pre-Delete Sign-Off

Don't touch Coolify until every box is checked:

- [ ] All secrets from the Phase 1 §1 table saved to password manager
- [ ] `backup/repclub-schema-final.sql` exists locally and is non-empty
- [ ] `backup/repclub-roles-final.sql` exists locally
- [ ] Storage bucket list recorded above (or confirmed "none")
- [ ] Stripe webhook URL + subscribed events noted, endpoint disabled
- [ ] DNS records and OAuth redirect URIs noted
- [ ] Cloudflare Pages deployment paused
- [ ] This file committed to git

**Paused on:** _________________
**Paused by:** _________________
