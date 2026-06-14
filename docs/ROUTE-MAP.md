# API Route Map

Base URL: `/api/v1`

Legend: 🔓 Public | 🔐 Auth required | 🛡 Permission required

---

## Health

| Method | Path | Access | Phase |
|--------|------|--------|-------|
| GET | `/health` | 🔓 | 1 |

---

## Public (`/public`)

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| GET | `/public/settings/company` | Company info, logo URL, contact | 2 |
| GET | `/public/cms/pages/:pageKey` | CMS page content + SEO | 2 |
| GET | `/public/cms/notices` | Published notices, FAQ, offers | 2 |
| GET | `/public/cms/notices/:id` | Single notice/FAQ | 2 |
| POST | `/public/booking-requests` | Website booking form → creates Order | 2 |

### POST `/public/booking-requests` Body

```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "journeyType": "one_way | round_trip | multi_city",
  "fromDestination": "string",
  "toDestination": "string",
  "journeyDate": "ISO date",
  "returnDate": "ISO date (optional)",
  "passengerCount": 1,
  "travelClass": "economy | premium_economy | business | first",
  "requestNotes": "string"
}
```

Auto-sets: `source: website`, `status: inquiry`, `isFromWebsite: true`

---

## Auth (`/auth`)

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| POST | `/auth/login` | Email + password → JWT cookie | 2 |
| POST | `/auth/logout` | Clear cookie | 2 |
| GET | `/auth/me` | Current user profile + permissions | 2 |
| POST | `/auth/refresh` | Refresh token / extend session | 2 |
| PUT | `/auth/change-password` | Change own password | 2 |

---

## Dashboard (`/dashboard`) 🛡 `dashboard:view`

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| GET | `/dashboard/summary` | KPI cards (orders, dues, profit, balances) | 2 |
| GET | `/dashboard/recent-activity` | Latest orders, payments, bookings | 2 |
| GET | `/dashboard/alerts` | Pending reminders, follow-ups | 2 |
| GET | `/dashboard/account-balances` | Cash, bank, bKash, Nagad balances | 2 |

---

## Orders (`/orders`) 🛡 `orders:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/orders` | view | 3 |
| GET | `/orders/:id` | view | 3 |
| POST | `/orders` | create | 3 |
| PUT | `/orders/:id` | update | 3 |
| PATCH | `/orders/:id/status` | update | 3 |
| POST | `/orders/:id/follow-up` | update | 3 |
| POST | `/orders/import-website` | import | 3 |
| DELETE | `/orders/:id` | delete | 3 |

Query params: `status`, `source`, `dateFrom`, `dateTo`, `search`, `assignedTo`, `page`, `limit`

---

## Bookings (`/bookings`) 🛡 `bookings:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/bookings` | view | 3 |
| GET | `/bookings/:id` | view | 3 |
| POST | `/bookings` | create | 3 |
| PUT | `/bookings/:id` | update | 3 |
| PATCH | `/bookings/:id/status` | update | 3 |
| POST | `/bookings/:id/ticket` | update | 3 |
| DELETE | `/bookings/:id/ticket` | update | 3 |
| GET | `/bookings/:id/timeline` | view | 3 |

---

## Customers (`/customers`) 🛡 `customers:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/customers` | view | 3 |
| GET | `/customers/:id` | view | 3 |
| POST | `/customers` | create | 3 |
| PUT | `/customers/:id` | update | 3 |
| GET | `/customers/:id/ledger` | view | 4 |
| GET | `/customers/:id/payments` | view | 4 |
| GET | `/customers/:id/bookings` | view | 3 |
| DELETE | `/customers/:id` | delete | 3 |

---

## Suppliers (`/suppliers`) 🛡 `suppliers:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/suppliers` | view | 3 |
| GET | `/suppliers/:id` | view | 3 |
| POST | `/suppliers` | create | 3 |
| PUT | `/suppliers/:id` | update | 3 |
| GET | `/suppliers/:id/ledger` | view | 4 |
| GET | `/suppliers/:id/payments` | view | 4 |
| DELETE | `/suppliers/:id` | delete | 3 |

---

## Accounts (`/accounts`) 🛡 `accounts:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/accounts` | view | 4 |
| GET | `/accounts/:id` | view | 4 |
| GET | `/accounts/:id/statement` | view | 4 |
| GET | `/accounts/:id/daily-closing` | view | 4 |
| PUT | `/accounts/:id/opening-balance` | manage | 4 |
| POST | `/accounts/transfers` | transfers:create | 4 |
| GET | `/accounts/transfers` | view | 4 |

Query for statement: `dateFrom`, `dateTo`

---

## Payments (`/payments`) 🛡 `payments:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/payments/customers` | customer | 4 |
| POST | `/payments/customers` | customer | 4 |
| GET | `/payments/customers/:id` | customer | 4 |
| GET | `/payments/suppliers` | supplier | 4 |
| POST | `/payments/suppliers` | supplier | 4 |
| GET | `/payments/suppliers/:id` | supplier | 4 |

---

## Expenses (`/expenses`) 🛡 `expenses:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/expenses` | view | 4 |
| GET | `/expenses/:id` | view | 4 |
| POST | `/expenses` | create | 4 |
| PUT | `/expenses/:id` | update | 4 |
| DELETE | `/expenses/:id` | delete | 4 |
| GET | `/expenses/categories` | view | 4 |
| POST | `/expenses/recurring` | recurring | 4 |
| GET | `/expenses/summary/monthly` | view | 4 |
| GET | `/expenses/report/by-category` | view | 4 |

---

## Reminders (`/reminders`) 🛡 `reminders:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/reminders` | view | 5 |
| GET | `/reminders/:id` | view | 5 |
| POST | `/reminders` | manage | 5 |
| PATCH | `/reminders/:id/complete` | manage | 5 |
| PATCH | `/reminders/:id/dismiss` | manage | 5 |
| DELETE | `/reminders/:id` | manage | 5 |

---

## Reports (`/reports`) 🛡 `reports:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/reports/sales` | view | 5 |
| GET | `/reports/purchases` | view | 5 |
| GET | `/reports/profit-by-booking` | view | 5 |
| GET | `/reports/customer-dues` | view | 5 |
| GET | `/reports/supplier-payables` | view | 5 |
| GET | `/reports/expenses` | view | 5 |
| GET | `/reports/account-ledger` | view | 5 |
| GET | `/reports/daily-cash-summary` | view | 5 |
| GET | `/reports/income-vs-expense` | view | 5 |
| GET | `/reports/:type/export/pdf` | export | 5 |
| GET | `/reports/:type/export/csv` | export | 5 |

Query params (common): `dateFrom`, `dateTo`, `accountId`, `customerId`, `supplierId`

---

## CMS Admin (`/cms`) 🛡 `cms:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/cms/pages` | view | 5 |
| GET | `/cms/pages/:pageKey` | view | 5 |
| PUT | `/cms/pages/:pageKey` | manage | 5 |
| GET | `/cms/notices` | view | 5 |
| POST | `/cms/notices` | manage | 5 |
| PUT | `/cms/notices/:id` | manage | 5 |
| DELETE | `/cms/notices/:id` | manage | 5 |
| POST | `/cms/logo` | manage | 5 |
| PUT | `/cms/settings` | manage | 5 |

---

## Users (`/users`) 🛡 `users:*`

| Method | Path | Permission | Phase |
|--------|------|------------|-------|
| GET | `/users` | view | 5 |
| GET | `/users/:id` | view | 5 |
| POST | `/users` | manage | 5 |
| PUT | `/users/:id` | manage | 5 |
| PATCH | `/users/:id/deactivate` | manage | 5 |

---

## Backups (`/backups`) 🛡 `backup:manage`

| Method | Path | Phase |
|--------|------|-------|
| GET | `/backups` | 5 |
| POST | `/backups/trigger` | 5 |
| GET | `/backups/:id/download` | 5 |

---

## Audit (`/audit`) 🛡 `audit:view`

| Method | Path | Phase |
|--------|------|-------|
| GET | `/audit/logs` | 5 |
| GET | `/audit/login-logs` | 5 |

---

## Standard Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Human readable error",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

## Frontend Route Mapping

| Admin UI Path | API Base |
|---------------|----------|
| `/login` | `/auth/*` |
| `/dashboard` | `/dashboard/*` |
| `/orders` | `/orders/*` |
| `/bookings` | `/bookings/*` |
| `/customers` | `/customers/*` |
| `/suppliers` | `/suppliers/*` |
| `/accounts` | `/accounts/*` |
| `/payments/customers` | `/payments/customers/*` |
| `/payments/suppliers` | `/payments/suppliers/*` |
| `/expenses` | `/expenses/*` |
| `/reminders` | `/reminders/*` |
| `/reports/*` | `/reports/*` |
| `/cms/*` | `/cms/*` |
| `/users` | `/users/*` |
| `/settings/backups` | `/backups/*` |
| `/settings/audit` | `/audit/*` |

| Public UI Path | API |
|----------------|-----|
| `/` | `/public/cms/pages/home` |
| `/about` | `/public/cms/pages/about` |
| `/services` | `/public/cms/pages/services` |
| `/booking` | POST `/public/booking-requests` |
| `/contact` | `/public/cms/pages/contact` |
| `/faq` | `/public/cms/notices?type=faq` |
