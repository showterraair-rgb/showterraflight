# Show Terra Air — Travel Agency Management System

Production-ready MERN stack application for **Show Terra Air**, a Bangladesh-based air ticket sales company in Kanaighat, Sylhet.

## Company Info

| | |
|---|---|
| **Address** | Gasbari Bazar, Ground Floor of BRAC Bank, Kanaighat, Sylhet-3183 |
| **Email** | showterraair@gmail.com |
| **WhatsApp** | 01741148529 |
| **Director** | Kamil Hussen — 01316 160 206 |

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Hook Form, Zod, TanStack Table, Recharts, Day.js
- **Backend:** Node.js, Express, Mongoose, JWT (httpOnly cookies), Multer, node-cron
- **Database:** MongoDB
- **Deploy:** Ubuntu VPS, Nginx, PM2, Let's Encrypt

## Project Structure

```
show-terra-air/
├── backend/              # REST API (Express + Mongoose)
├── frontend-public/      # Public website (booking requests, CMS pages)
├── frontend-admin/       # Admin panel (orders, accounting, reports)
├── docs/                 # Architecture documentation
└── deploy/               # Nginx & deployment scripts (Phase 6)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Phase 1 Architecture](docs/PHASE-1-ARCHITECTURE.md) | Folder structure, layers, roadmap |
| [Database Schema](docs/DATABASE-SCHEMA.md) | All 21 collections with fields & relationships |
| [Route Map](docs/ROUTE-MAP.md) | Complete API endpoint reference |
| [Role Permissions](docs/ROLE-PERMISSIONS.md) | RBAC matrix for Admin, Accountant, Executive |
| [GO-LIVE-CHECKLIST.md](docs/GO-LIVE-CHECKLIST.md) | Pre-launch verification checklist |
| [Phase 5 Routes](docs/PHASE-5-ROUTES.md) | Reminders, CMS, reports, backup, security APIs |
| [Deployment](docs/DEPLOYMENT.md) | Production VPS setup (Phase 6) |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ running locally or remote URI

### 1. Backend

```powershell
cd C:\Users\DBL\Projects\show-terra-air\backend
copy .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

npm install
npm run seed
npm run dev
```

API: `http://localhost:5000/api/v1/health`

### 2. Admin Panel

```powershell
cd C:\Users\DBL\Projects\show-terra-air\frontend-admin
npm install
npm run dev
```

Admin: `http://localhost:5174` — login with seed credentials below.

### 3. Public Website

```powershell
cd C:\Users\DBL\Projects\show-terra-air\frontend-public
npm install
npm run dev
```

Website: `http://localhost:5173`

### Default Admin Credentials

- Email: `admin@showterraair.com`
- Password: `Admin@123456`

Change the password after first login.

See [Phase 2 Environment Variables](docs/PHASE-2-ENV.md) for cookie and CORS settings.

## Production deployment (Phase 6)

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Hostinger VPS setup (Nginx, PM2, SSL, DNS).

Quick sequence on VPS:

```bash
sudo bash deploy/scripts/bootstrap-server.sh
cp deploy/env/backend.production.env.example backend/.env   # edit secrets
bash deploy/scripts/build-release.sh
cd backend && node src/seeds/index.js && cd ..
pm2 start deploy/ecosystem.config.cjs --env production
# Configure Nginx + certbot — see docs/DEPLOYMENT.md
bash deploy/scripts/health-check.sh
```

Complete [GO-LIVE-CHECKLIST.md](docs/GO-LIVE-CHECKLIST.md) before launch.

## Development Phases

| Phase | Status | Scope |
|-------|--------|-------|
| 1 | ✅ Complete | Architecture, schemas, routes, permissions |
| 2 | ✅ Complete | Auth, layouts, dashboard, public website |
| 3 | ✅ Complete | Orders, bookings, customers, suppliers |
| 4 | ✅ Complete | Accounting, ledgers, expenses, transfers |
| 5 | ✅ Complete | Reminders, CMS admin, reports, backup, security |
| 6 | ✅ Complete | Hostinger VPS deployment configs & docs |

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full system — users, CMS, backups, all modules |
| **Accountant** | Finance, payments, expenses, reports — no sales creation |
| **Executive** | Orders, bookings, customers, suppliers, follow-ups |

## License

Proprietary — Show Terra Air. All rights reserved.
