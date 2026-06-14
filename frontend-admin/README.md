# Frontend Admin — Show Terra Air

Private admin panel with role-based access control.

## Modules (Phases 2–5)

| Route | Module | Min Role |
|-------|--------|----------|
| `/dashboard` | Dashboard | All |
| `/orders` | Orders | All |
| `/bookings` | Bookings | All |
| `/customers` | Customers | All |
| `/suppliers` | Suppliers | All |
| `/accounts` | Accounts & Ledgers | Accountant+ |
| `/payments/customers` | Customer Payments | Accountant+ |
| `/payments/suppliers` | Supplier Payments | Accountant+ |
| `/transfers` | Account Transfers | Accountant+ |
| `/expenses` | Expenses | Accountant+ |
| `/reminders` | Reminders | All |
| `/reports/*` | Reports | Accountant+ |
| `/cms/*` | CMS Management | Admin |
| `/users` | User Management | Admin |
| `/settings/*` | Backups, Audit | Admin |

## Structure

```
src/
├── components/
│   ├── common/       # DataTable, StatCard, Modal, DateRangeFilter
│   ├── layout/       # Sidebar, Topbar, ProtectedRoute
│   └── dashboard/    # Widget components
├── pages/            # One file/folder per module
├── context/          # AuthContext
├── store/            # Redux Toolkit (auth slice, ui slice)
├── routes/           # React Router + permission guards
├── hooks/            # useAuth, usePermission
├── services/         # API modules (orders.api.js, etc.)
└── utils/            # currency, dayjs config, export helpers
```

## Dev Server

```bash
npm install
npm run dev    # http://localhost:5174
```

Credentials: see root README (seed admin user).
