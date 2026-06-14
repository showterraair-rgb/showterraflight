# Show Terra Air — Production Deployment Guide

Hostinger VPS · Ubuntu 22.04/24.04 · MongoDB · Node.js · PM2 · Nginx · Let's Encrypt

## Architecture

| Subdomain | Purpose | Serves |
|-----------|---------|--------|
| `showterraair.com` | Public website | `frontend-public/dist` + `/api` proxy |
| `admin.showterraair.com` | Admin panel | `frontend-admin/dist` + `/api` proxy |
| `api.showterraair.com` | Direct API | Reverse proxy → Node `:5000` |

**Assumption:** Frontends use relative API path `/api/v1`. Nginx proxies `/api` on public and admin domains so httpOnly JWT cookies stay same-origin (no cross-subdomain cookie config required).

---

## 1. DNS setup (Hostinger)

In Hostinger DNS for `showterraair.com`, add **A records** pointing to your VPS public IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_VPS_IP` | 300 |
| A | `www` | `YOUR_VPS_IP` | 300 |
| A | `admin` | `YOUR_VPS_IP` | 300 |
| A | `api` | `YOUR_VPS_IP` | 300 |

Verify propagation (may take up to 24h, usually minutes):

```bash
dig +short showterraair.com
dig +short admin.showterraair.com
dig +short api.showterraair.com
```

---

## 2. First-time server bootstrap

SSH into VPS as root:

```bash
ssh root@YOUR_VPS_IP
```

Clone the repo (or upload release tarball) to `/var/www/show-terra-air`:

```bash
apt-get update && apt-get install -y git
mkdir -p /var/www
git clone https://github.com/YOUR_ORG/show-terra-air.git /var/www/show-terra-air
# Or: scp release tarball and extract to /var/www/show-terra-air
```

Run bootstrap (installs Node 20, MongoDB, Nginx, PM2, UFW):

```bash
cd /var/www/show-terra-air
chmod +x deploy/scripts/*.sh
sudo bash deploy/scripts/bootstrap-server.sh
```

Create deploy user password and switch user:

```bash
passwd sta
su - sta
cd /var/www/show-terra-air
```

---

## 3. Environment variables

### Backend (required)

```bash
cp deploy/env/backend.production.env.example backend/.env
nano backend/.env
```

**Critical production values:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/show_terra_air` (add auth when hardened) |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `lax` |
| `CLIENT_PUBLIC_URL` | `https://showterraair.com` |
| `CLIENT_ADMIN_URL` | `https://admin.showterraair.com` |

### Frontends (optional — defaults work with Nginx proxy)

```bash
cp deploy/env/frontend-admin.production.env.example frontend-admin/.env.production
cp deploy/env/frontend-public.production.env.example frontend-public/.env.production
```

Only change `VITE_API_BASE_URL` if API is **not** proxied on the same domain.

---

## 4. Build and seed

As deploy user `sta`:

```bash
cd /var/www/show-terra-air
bash deploy/scripts/build-release.sh

# First deploy only — seed database
cd backend && node src/seeds/index.js && cd ..
```

**Immediately change default admin password after seed** (see [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md)).

---

## 5. PM2 — start backend

```bash
cd /var/www/show-terra-air
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u sta --hp /home/sta
# Run the command PM2 prints (sudo env PATH=...)
```

Verify locally:

```bash
bash deploy/scripts/health-check.sh
# OK: API healthy
```

**Log locations:**

| Log | Path |
|-----|------|
| PM2 stdout | `/var/log/show-terra-air/pm2-out.log` |
| PM2 stderr | `/var/log/show-terra-air/pm2-error.log` |
| PM2 combined | `/var/log/show-terra-air/pm2-combined.log` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| MongoDB | `/var/log/mongodb/mongod.log` |

View live logs: `pm2 logs sta-api`

---

## 6. Nginx + SSL

### Step A — Pre-SSL (HTTP only)

```bash
sudo cp /var/www/show-terra-air/deploy/nginx/show-terra-air.pre-ssl.conf \
  /etc/nginx/sites-available/show-terra-air.conf
sudo ln -sf /etc/nginx/sites-available/show-terra-air.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Confirm sites load over HTTP before SSL.

### Step B — Let's Encrypt

```bash
sudo certbot --nginx \
  -d showterraair.com \
  -d www.showterraair.com \
  -d admin.showterraair.com \
  -d api.showterraair.com \
  --email showterraair@gmail.com \
  --agree-tos \
  --redirect
```

### Step C — Full production config (HTTPS, gzip, headers)

```bash
sudo cp /var/www/show-terra-air/deploy/nginx/show-terra-air.conf \
  /etc/nginx/sites-available/show-terra-air.conf
sudo nginx -t && sudo systemctl reload nginx
```

Certbot auto-renewal: `sudo certbot renew --dry-run`

---

## 7. Secure cookies & CORS (production notes)

- **`COOKIE_SECURE=true`** — browser sends cookie only over HTTPS. Required in production.
- **`COOKIE_SAME_SITE=lax`** — works because admin/public call `/api` on the **same** subdomain via Nginx proxy.
- **CORS** — `CLIENT_PUBLIC_URL` and `CLIENT_ADMIN_URL` must exactly match browser origins (scheme + host, no trailing slash).
- **Trust proxy** — Express `trust proxy` is enabled (`app.js`); Nginx must send `X-Forwarded-Proto: https`.
- If you later expose API only on `api.showterraair.com` without proxy on admin, you would need `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and cookie `Domain=.showterraair.com` — not required with current design.

---

## 8. Update / redeploy process

On VPS as `sta`:

```bash
cd /var/www/show-terra-air
git pull origin main
bash deploy/scripts/deploy.sh
```

`deploy.sh` will:

1. Pull latest code (if git repo)
2. `npm ci` + build both frontends
3. `npm ci --omit=dev` in backend
4. `pm2 reload sta-api`
5. Reload Nginx
6. Run health check

Skip rebuild if only env changed: `bash deploy/scripts/deploy.sh --no-build`

### Deploy from local machine (alternative)

Build locally, copy `dist` folders + backend to server:

```powershell
# Windows — build locally
cd C:\Users\DBL\Projects\show-terra-air
bash deploy/scripts/build-release.sh

# Copy to VPS (example with scp)
scp -r frontend-public/dist sta@YOUR_VPS_IP:/var/www/show-terra-air/frontend-public/
scp -r frontend-admin/dist sta@YOUR_VPS_IP:/var/www/show-terra-air/frontend-admin/
ssh sta@YOUR_VPS_IP "cd /var/www/show-terra-air && bash deploy/scripts/deploy.sh --no-build"
```

---

## 9. Rollback

**Application rollback** (previous git commit):

```bash
bash deploy/scripts/rollback.sh abc1234
```

**Database rollback** (manual — destructive):

1. Stop API: `pm2 stop sta-api`
2. List backups: `ls -lh backend/uploads/backups/`
3. Restore (staging first!):

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/show_terra_air" \
  --archive=backend/uploads/backups/sta-backup-YYYY-MM-DD.archive.gz \
  --gzip --drop
```

4. Start API: `pm2 start sta-api`

The in-app backup scheduler and `deploy/scripts/backup-mongodb.sh` both write to `backend/uploads/backups/`. **Always test restore on a staging DB before production.**

---

## 10. Backup restore notes

| Source | Location | Restore tool |
|--------|----------|--------------|
| Scheduled (in-app) | `backend/uploads/backups/*.archive.gz` or `*.json` | `mongorestore` or manual JSON import |
| Manual script | `deploy/scripts/backup-mongodb.sh` | `mongorestore --archive=... --gzip` |
| Offsite (future) | S3/FTP — not configured in Phase 6 | Copy archive to server, then mongorestore |

JSON fallback backups (when `mongodump` unavailable) require manual collection import — prefer installing `mongodb-database-tools` on VPS.

---

## 11. Test live system after deployment

```bash
# API health
curl -s https://api.showterraair.com/api/v1/health | jq

# Public site
curl -I https://showterraair.com

# Admin (expect 200 on index)
curl -I https://admin.showterraair.com

# SSL grade (optional)
# https://www.ssllabs.com/ssltest/

# PM2 status
pm2 status

# Cron jobs (reminder + backup run inside Node process)
pm2 logs sta-api --lines 50 | grep CRON
```

**Browser checks:**

1. Open `https://showterraair.com` — homepage loads, CMS content visible
2. Submit test booking inquiry on public site
3. Login at `https://admin.showterraair.com` with new admin password
4. Dashboard loads; create test customer; verify role permissions
5. Admin → Backup → trigger manual backup → verify log entry
6. Admin → Security → login logs show your session

---

## 12. Related docs

- [SERVER-HARDENING.md](SERVER-HARDENING.md) — UFW, MongoDB, fail2ban, permissions
- [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md) — final pre-launch checklist
- [deploy/README.md](../deploy/README.md) — file index

---

## Assumptions

- Single VPS hosts all services (MongoDB co-located with app).
- Ubuntu 22.04/24.04; MongoDB 7.x from official repo.
- Deploy user `sta` owns `/var/www/show-terra-air`.
- Domain registrar DNS managed in Hostinger.
- `mongodump` / `mongorestore` installed via `mongodb-database-tools` package for reliable backups (`sudo apt install mongodb-database-tools`).
