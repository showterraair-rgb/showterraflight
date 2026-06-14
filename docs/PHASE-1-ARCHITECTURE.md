# Show Terra Air — Phase 1 Architecture

> Travel Agency Management System for a Bangladesh-based air ticket sales company.

## Project Overview

| Item | Value |
|------|-------|
| Company | Show Terra Air |
| Location | Kanaighat, Sylhet-3183, Bangladesh |
| Stack | MERN (React + Vite + Tailwind, Node/Express, MongoDB) |
| Auth | JWT + httpOnly cookies + bcrypt |
| Deployment | Hostinger VPS, Ubuntu, Nginx, PM2, Let's Encrypt |

## Monorepo Structure

```
show-terra-air/
├── backend/                 # Express REST API
├── frontend-public/         # Public marketing + booking website
├── frontend-admin/          # Private admin panel
├── docs/                    # Architecture & API documentation
├── deploy/                  # Nginx, PM2, deployment scripts (Phase 6)
├── README.md
└── .gitignore
```

## Backend Architecture (`backend/`)

```
backend/
├── src/
│   ├── config/              # env, database, constants, permissions
│   ├── models/              # Mongoose schemas (21 collections)
│   ├── routes/              # Express route definitions
│   ├── controllers/         # HTTP handlers (Phase 2+)
│   ├── services/            # Business logic & ledger operations (Phase 2+)
│   ├── middlewares/         # auth, authorize, validate, audit (Phase 2+)
│   ├── validators/          # Zod request schemas (Phase 2+)
│   ├── utils/               # helpers, number generators (Phase 2+)
│   ├── jobs/                # cron: reminders, backup (Phase 5)
│   ├── seeds/               # initial data seed script
│   ├── app.js               # Express app setup
│   └── server.js            # Entry point
├── uploads/                 # Local file storage (tickets, bills, CMS, backups)
├── package.json
└── .env.example
```

### Layer Responsibilities

| Layer | Purpose |
|-------|---------|
| **Routes** | URL mapping, middleware chain, no business logic |
| **Controllers** | Parse request, call service, format response |
| **Services** | Transactions, ledger updates, profit calculation, validations |
| **Models** | Schema, indexes, pre-save hooks |
| **Middlewares** | Cross-cutting: auth, RBAC, rate limit, audit |

## Frontend Public (`frontend-public/`)

```
frontend-public/
├── src/
│   ├── components/          # Reusable UI (Header, Footer, WhatsApp CTA)
│   ├── pages/               # Home, About, Services, Booking, Contact, FAQ
│   ├── layouts/             # PublicLayout with SEO wrapper
│   ├── context/             # CMS content context
│   ├── hooks/               # useCms, useBookingForm
│   ├── services/            # API client for /api/v1/public/*
│   └── utils/               # formatters, constants
├── public/                  # Static assets, favicon
└── package.json
```

## Frontend Admin (`frontend-admin/`)

```
frontend-admin/
├── src/
│   ├── components/
│   │   ├── common/          # DataTable, Modal, DateRangePicker, StatCard
│   │   ├── layout/          # Sidebar, Topbar, ProtectedRoute
│   │   └── dashboard/       # Dashboard widgets
│   ├── pages/               # One folder per module (orders, bookings, etc.)
│   ├── context/             # AuthContext
│   ├── store/               # Redux Toolkit slices (optional)
│   ├── routes/              # React Router config with RBAC guards
│   ├── hooks/               # useAuth, usePermission, useDebounce
│   ├── services/            # API modules per domain
│   └── utils/               # dayjs, currency (BDT), export helpers
├── public/
└── package.json
```

## Entity Relationship Summary

```
Customer ──┬── Order ── Booking ── Ticket
           │              │
           │              ├── CustomerPayment ── AccountTransaction
           │              └── SupplierPayment ── AccountTransaction
           │
Supplier ──┘

Account ── AccountTransaction
       ── Transfer (from/to)
       ── Expense
       ── CustomerPayment / SupplierPayment

User ── AuditLog / LoginLog
Setting / CmsPage / CmsNotice (CMS)
Reminder (links to Customer, Supplier, Booking, Order, Expense)
```

## Core Business Rules (Enforced in Services)

1. **Profit** = `salePrice - purchasePrice - directCosts`
2. **Customer due** = `salePrice - amountPaid` (per booking; aggregated on customer)
3. **Supplier payable** = `purchasePrice + directCosts - supplierPaid`
4. **Customer payment** → selected account balance **increases**
5. **Supplier payment / expense** → selected account balance **decreases**
6. **Transfer** → debit from account, credit to account (two ledger entries)
7. Every financial movement creates an `AccountTransaction` with full audit trail
8. Partial payments update `paymentStatus` to `partial` automatically

## Phase Roadmap

| Phase | Scope |
|-------|-------|
| **1** ✅ | Architecture, schemas, routes plan, permissions, dependencies |
| **2** | Auth, layouts, dashboard shell, public website pages |
| **3** | Orders, bookings, customers, suppliers |
| **4** | Accounting, ledgers, expenses, transfers |
| **5** | Reminders, CMS admin, reports, backup, security |
| **6** | Nginx, PM2, SSL, production checklist |

## Phase 1 Deliverables

- [x] Full folder structure (backend + both frontends + deploy + docs)
- [x] 21 Mongoose models with indexes and hooks
- [x] Route registry with phase stubs
- [x] Role permission matrix (`config/permissions.js`)
- [x] Seed script (roles, accounts, categories, settings, CMS pages, admin)
- [x] Documentation: schema, routes, permissions, dependencies

## Next Step (Phase 2)

```bash
cd C:\Users\DBL\Projects\show-terra-air\backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Then scaffold both Vite frontends and implement authentication.
