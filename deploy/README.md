# Deployment — Show Terra Air (Phase 6)

Production deployment artifacts for **Hostinger VPS** (Ubuntu, Nginx, PM2, Let's Encrypt).

## Quick start

1. Read **[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)** — full step-by-step guide
2. Run **`scripts/bootstrap-server.sh`** on fresh VPS (as root)
3. Configure **`env/backend.production.env.example`** → `backend/.env`
4. Run **`scripts/build-release.sh`** then **`scripts/deploy.sh`**
5. Configure Nginx + SSL (see below)
6. Complete **[docs/GO-LIVE-CHECKLIST.md](../docs/GO-LIVE-CHECKLIST.md)**

## File index

| Path | Purpose |
|------|---------|
| `ecosystem.config.cjs` | PM2 process definition for `sta-api` |
| `nginx/show-terra-air.conf` | Production HTTPS — public, admin, API |
| `nginx/show-terra-air.pre-ssl.conf` | Temporary HTTP-only for first boot + Certbot |
| `env/backend.production.env.example` | Production backend `.env` template |
| `env/frontend-*.production.env.example` | Vite build env templates |
| `scripts/bootstrap-server.sh` | First-time VPS setup |
| `scripts/build-release.sh` | Build both frontends + backend prod deps |
| `scripts/deploy.sh` | Pull, build, PM2 reload, health check |
| `scripts/health-check.sh` | Verify `/api/v1/health` |
| `scripts/backup-mongodb.sh` | Standalone `mongodump` backup |
| `scripts/rollback.sh` | Git checkout + redeploy |
| `logrotate/show-terra-air` | PM2 + backup log rotation |
| `fail2ban/jail.local.example` | SSH protection snippet |

## Related documentation

- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) — DNS, env, SSL, redeploy, rollback
- [SERVER-HARDENING.md](../docs/SERVER-HARDENING.md) — UFW, MongoDB, fail2ban
- [GO-LIVE-CHECKLIST.md](../docs/GO-LIVE-CHECKLIST.md) — pre-launch verification

## Domains

| URL | Content |
|-----|---------|
| `https://showterraair.com` | Public website |
| `https://admin.showterraair.com` | Admin panel |
| `https://api.showterraair.com` | Backend API |

## Assumptions

- App root on server: `/var/www/show-terra-air`
- Deploy user: `sta`
- Backend port: `5000` (localhost only, not public)
- MongoDB on same VPS, localhost only
