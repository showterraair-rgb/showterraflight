# Phase 6 — Deployment Summary

Phase 6 adds production deployment artifacts only — no business logic changes.

## Deliverables

| Category | Location |
|----------|----------|
| Main guide | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Hardening | [SERVER-HARDENING.md](SERVER-HARDENING.md) |
| Go-live checklist | [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md) |
| Deploy file index | [../deploy/README.md](../deploy/README.md) |

## Target stack

- Hostinger VPS, Ubuntu 22.04/24.04
- MongoDB 7.x (localhost)
- Node.js 20 + PM2
- Nginx reverse proxy + static SPA hosting
- Let's Encrypt SSL

## Subdomains

| Domain | Role |
|--------|------|
| `showterraair.com` | Public Vite build |
| `admin.showterraair.com` | Admin Vite build |
| `api.showterraair.com` | API proxy |

Public and admin Nginx configs proxy `/api` and `/uploads` to the backend so frontends keep using relative `/api/v1` paths.

## Assumptions

1. Single VPS runs MongoDB, API, and serves static frontends.
2. Deploy user `sta` owns `/var/www/show-terra-air`.
3. DNS A records configured in Hostinger before SSL.
4. `mongodb-database-tools` installed on VPS for reliable backups (`mongodump`/`mongorestore`).
5. Git deploy from `main` branch; tarball deploy also supported.
