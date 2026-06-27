# Show Terra Air — Travel ERP Redesign Plan (v2)

> **Status:** Phase 1 applied (sidebar IA + additive schema). Live finance/ticketing logic unchanged.

## 1. Final Information Architecture

```
Dashboard
├── KPIs (bookings, receivable, payable, profit, pending RRV, due collections/payments)
├── Recent activity feed
└── Alerts (overdue dues, failed notifications, backup failures)

Bookings (master ledger — booking_reference is the key)
├── Booking History
├── New Booking
├── Bulk Import
├── Upcoming Flights
└── Partial Payments

Ticket Operations (child ops — append-only history)
├── Voids
├── Refunds
├── Reissues
└── Invoices

Receipts (money IN from customer/agent)
├── Customer Payments
├── Payment History
├── Instant Payment
└── Payment Requests

Supplier Payments (money OUT to supplier)

Parties
├── Customers (+ account ledger)
├── Suppliers (+ account ledger)
├── B2B Agents
├── Agent Bookings
└── Agent Accounting

Reports
├── Business Summary
├── Business Reports (CSV/PDF)
├── Sales / RRV Report
└── Ledger

Notifications
├── Hub & automation rules
├── Templates
├── SMS / Email / WhatsApp settings
└── Reminders

Frontend CMS
├── Pages, Hero, Services, Blog, Testimonials, FAQ
├── Contact / SEO / Footer
└── Inquiry submissions

Administration
├── Users & Roles
├── Currency & company settings
├── Payment accounts & gateways
├── Accounts, Expenses, Transfers
└── Security & audit

Backup & Logs
├── Database backup (auto + manual)
├── Restore points
├── Audit logs
├── Login history
└── Notification delivery logs
```

### Route mapping (existing → new nav — no URL breaks)

| New menu | Existing route |
|----------|----------------|
| Bookings | `/bookings/*` |
| Ticket Operations | `/bookings/voids`, `/refunds`, `/reissues`, `/invoices` |
| Receipts | `/payments/customers`, `/history`, `/instant`, `/requests` |
| Supplier Payments | `/payments/suppliers` |
| Parties | `/customers`, `/suppliers`, `/agents`, `/agent-bookings`, `/agent-accounting` |
| Reports | `/reports/*`, `/finance/ledger` |
| Notifications | `/settings/notifications`, `/sms`, `/email`, `/whatsapp`, `/reminders`, `/settings/notification-templates` |
| Frontend CMS | `/cms` |
| Administration | `/users`, `/roles`, `/settings/currency`, `/settings/payment*`, `/accounts`, `/expenses`, `/transfers`, `/security` |
| Backup & Logs | `/backup`, `/notifications/logs`, `/security` |

---

## 2. Module-by-Module UI Plan

### Dashboard
- **Reuse:** `DashboardPage.jsx`, `dashboard.service.js`
- **Add:** pending reissue/refund KPIs, failed notification count, backup failure badge
- **Layout:** 4×2 KPI grid + 2-column (activity | alerts)

### Bookings
- **Reuse:** `BookingsPage.jsx`, `BookingFormPage.jsx`, `BookingDetailPage.jsx`
- **Evolve table columns:** booking ref, date, passenger, route, PNR, sale BRL/BDT, received, due, supplier cost, supplier paid, supplier due, profit, status
- **Master key:** `bookingNumber` (= booking_reference)

### Ticket Operations
- **Phase 1:** existing list pages + `BookingRrvPanel` on detail
- **Phase 2:** `BookingOperation` timeline component; ops create records in `booking_operations` collection
- **Phase 3:** migrate `voidBooking` / `refundBooking` / `reissueBooking` to write operations + adjust booking totals

### Receipts & Supplier Payments
- **Reuse:** `CustomerPaymentsPage.jsx`, `SupplierPaymentsPage.jsx`, `PartyAccountPage.jsx`
- **Rename labels only** in nav; add attachment field on payments (phase 2)

### Parties
- **Reuse:** `CustomersPage`, `SuppliersPage`, `AgentsPage`, `PartyAccountPage`
- Unified ledger pattern: booking-wise paid/due + remind buttons (done)

### Reports
- **Reuse:** `ReportsPage`, `SalesReportPage`, `BusinessSummaryPage`, `report.service.js`
- **Add report keys:** `agent-due`, `refund-report`, `reissue-report`, `void-report`, `brl-bdt-daily` (phase 3)

### Notifications
- **Reuse:** full stack exists
- **Add events:** `reissue_done`, `void_done`, `refund_requested`, `refund_approved`, `refund_paid`, `upcoming_flight`
- **Add:** failed log retry button on `NotificationLogsPage`

### Frontend CMS
- **Reuse:** `CmsPage.jsx`, `HomeCmsEditor.jsx`
- **Expand sections:** hero sliders, services, blog, testimonials, FAQ, SEO, footer (phase 4 — extend `CmsPage` model or add `CmsBlock` collection)

### Backup & Logs
- **Reuse:** `BackupPage.jsx`, `SecurityPage.jsx`, `NotificationLogsPage.jsx`
- **Add:** restore API (read-only download + manual restore script phase 2)

### Administration
- Consolidated settings nav; no new pages in phase 1

### Dark mode (phase 5)
- `tailwind.config.js`: `darkMode: 'class'`
- `ThemeContext` + toggle in `Header.jsx`
- Semantic tokens: `bg-surface`, `text-primary`, `border-default`

---

## 3. Normalized Database Schema

### Existing collections (keep — map to v2 names)

| v2 field | Existing Booking field | Notes |
|----------|------------------------|-------|
| booking_reference | bookingNumber | unique |
| booking_date | createdAt | |
| passenger_name | passengerName **new** or passengers[0].fullName | denormalized |
| route | route | |
| PNR | pnr | |
| ticket_number | ticketNumber | |
| supplier_id | supplier | |
| sale_type | saleType **new** | direct_customer \| agent |
| customer_id | customer | nullable when agent sale (phase 2) |
| agent_id | agent **new** | ref Agent |
| supplier_cost_brl | purchasePriceBRL + directCostsBRL | BRL canonical |
| sale_amount_brl | salePriceBRL | |
| received_amount_brl | amountPaid (converted) | sync via financialSync |
| supplier_paid_brl | supplierPaid (converted) | |
| exchange_rate_brl_to_bdt | bdtRateAtBooking | per booking |
| booking_status | status | |
| customer_due_brl | customerDue | computed |
| supplier_due_brl | supplierPayable | computed |
| profit_brl | profit | computed |

### New collection: `booking_operations` (Phase 1 model added)

```js
{
  operationNumber,      // auto-generated
  booking,              // ref Booking — master key link
  operationType,        // ISSUE | REISSUE | VOID | REFUND | CANCEL_REFUND
  operationDate,
  oldTicketNumber,
  newTicketNumber,
  supplierAdjustmentBRL,
  saleAdjustmentBRL,
  penaltyBRL,
  serviceChargeBRL,
  refundAmountBRL,
  receivedAdjustmentBRL,
  payableAdjustmentBRL,
  exchangeRateBrlToBdt,
  remarks,
  status,               // draft | pending | approved | completed | cancelled
  legacyChildBooking,   // link to existing reissue/refund child booking during migration
  financialApplied,
  createdBy,
  timestamps
}
```

### Payments (unchanged structure)

- `customer_payments` → Receipts
- `supplier_payments` → Supplier Payments
- Both link via `booking` ref (= booking_reference)

---

## 4. API Endpoint Structure

### Existing (keep)
- `/api/v1/bookings`, `/customers`, `/suppliers`, `/payments`, `/reports`, `/notifications`, `/cms`, `/backups`, `/audit`, `/security`

### New (phase 2+)
```
GET    /bookings/:id/operations          List operation timeline
POST   /bookings/:id/operations          Create operation (void/refund/reissue)
PATCH  /bookings/:id/operations/:opId    Update status

GET    /dashboard/v2/summary             Extended KPIs
POST   /notifications/logs/:id/retry     Retry failed delivery

POST   /backups/:id/restore-request      Request restore (admin approval)
```

---

## 5. React Component / Page Structure

```
frontend-admin/src/
├── components/
│   ├── layout/          Sidebar, Header, ThemeToggle (phase 5)
│   ├── bookings/        BookingRrvPanel → BookingOperationTimeline (phase 2)
│   ├── finance/         DualCurrencyAmount, MoneyAmount (tabular-nums)
│   └── common/          ReminderChannelButtons, DataTable, StatCard
├── pages/
│   ├── DashboardPage.jsx
│   ├── BookingsPage.jsx
│   ├── PartyAccountPage.jsx
│   ├── TicketingListPages.jsx
│   ├── CustomerPaymentsPage.jsx   (Receipts)
│   ├── SupplierPaymentsPage.jsx
│   ├── CmsPage.jsx
│   ├── BackupPage.jsx
│   └── settings/*                 (Administration)
└── utils/
    └── permissions.js             NAV_GROUPS (IA source of truth)
```

---

## 6. Notification Event Architecture

```
Event → NotificationAutomationRule → NotificationTemplate → Orchestrator
                                              ↓
                                    SMS | Email | WhatsApp
                                              ↓
                                    NotificationLog (dedupe + retry)
```

### Event catalog

| Event | Status | Trigger point |
|-------|--------|---------------|
| booking_created | EXISTS (manual_order_created) | createBooking |
| booking_confirmed | PARTIAL (approval_approved) | approval flow |
| payment_received | EXISTS | customerPayment |
| due_reminder | EXISTS (payment_due_reminder) | manual + cron |
| upcoming_flight | PARTIAL (booking_travel reminder) | reminder job |
| reissue_done | NEW | operation complete |
| void_done | NEW | operation complete |
| refund_requested | NEW | operation draft |
| refund_approved | NEW | operation approved |
| refund_paid | NEW | refund payment |

Phase 2: add templates + rules for NEW events; wire from `BookingOperation` service.

---

## 7. Backup Architecture

```
backup.job.js (cron 02:00 Dhaka)
    → backup.service.js (mongodump + gzip + checksum)
    → BackupLog collection
    → Admin BackupPage (list, manual trigger, strategy)

Phase 2:
    → Optional S3/rsync offsite
    → Restore: download bundle + runbook script on VPS
    → Alert on failure → dashboard + notification
```

---

## 8. Migration-Safe Implementation Order

| Phase | Scope | Risk |
|-------|-------|------|
| **1 ✅** | Sidebar IA refactor; `BookingOperation` model; optional Booking fields (`saleType`, `agent`, `passengerName`) | Low — additive only |
| **2** | Dashboard KPI expansion; surface CMS/Backup in nav (done in 1); operation timeline read API | Low |
| **3** | Write path: void/refund/reissue → `BookingOperation` + keep legacy child booking sync | Medium — dual-write |
| **4** | CMS sections expansion; report keys; notification events | Low |
| **5** | Dark mode; dense table CSS; tabular-nums global | Low |
| **6** | Backup restore API; offsite sync | Medium — ops only |
| **7** | Deprecate RRV fields on Booking when ops fully migrated | High — post validation |

### Data backfill script (phase 2)
- For each booking with `bookingType !== standard`, create matching `BookingOperation` from `parentBooking` / `rrv*` fields
- Set `passengerName` from `passengers[0].fullName`
- Infer `saleType` from linked agent order if any

---

## Changed files (Phase 1)

- `frontend-admin/src/utils/permissions.js` — new NAV_GROUPS
- `frontend-admin/src/components/layout/AdminLayout.jsx` — page titles
- `frontend-admin/src/components/layout/Sidebar.jsx` — icons
- `backend/src/models/BookingOperation.js` — new
- `backend/src/models/Booking.js` — optional fields
- `backend/src/config/constants.js` — operation enums
- `backend/src/models/index.js` — export
