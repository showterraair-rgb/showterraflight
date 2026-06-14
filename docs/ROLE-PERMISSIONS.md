# Role Permission Matrix

## Roles

| Role | Label | Description |
|------|-------|-------------|
| `admin` | Administrator | Full system access including users, backups, CMS, settings |
| `accountant` | Accountant | Financial operations, reports, payments, expenses — no user/CMS management |
| `executive` | Executive | Sales operations: orders, bookings, customers, suppliers, follow-ups |

---

## Permission Keys

Defined in `backend/src/config/permissions.js`.

| Permission | Description |
|------------|-------------|
| `dashboard:view` | Dashboard KPIs and summaries |
| `orders:view` | View orders |
| `orders:create` | Create manual orders |
| `orders:update` | Edit orders, status, follow-ups |
| `orders:delete` | Cancel/delete orders |
| `orders:import` | Import website booking requests |
| `bookings:view` | View bookings |
| `bookings:create` | Create bookings from orders |
| `bookings:update` | Edit booking, ticket, pricing |
| `bookings:delete` | Delete draft bookings |
| `customers:view` | View customers |
| `customers:create` | Add customers |
| `customers:update` | Edit customers, notes, tags |
| `customers:delete` | Archive customers |
| `suppliers:view` | View suppliers |
| `suppliers:create` | Add suppliers |
| `suppliers:update` | Edit suppliers |
| `suppliers:delete` | Archive suppliers |
| `accounts:view` | View balances and statements |
| `accounts:manage` | Opening balance, adjustments |
| `payments:customer` | Record customer payments |
| `payments:supplier` | Record supplier payments |
| `transfers:create` | Inter-account transfers |
| `expenses:view` | View expenses |
| `expenses:create` | Add expenses |
| `expenses:update` | Edit expenses |
| `expenses:delete` | Delete expenses |
| `expenses:recurring` | Recurring expense templates |
| `reminders:view` | View reminders |
| `reminders:manage` | Create/complete/dismiss reminders |
| `reports:view` | View reports |
| `reports:export` | PDF/CSV export |
| `cms:view` | Read CMS content in admin |
| `cms:manage` | Edit pages, notices, logo, SEO |
| `users:view` | View staff list |
| `users:manage` | Create/edit/deactivate users |
| `audit:view` | Audit and login logs |
| `backup:manage` | Trigger and download backups |
| `settings:manage` | Company settings |

---

## Matrix

| Permission | Admin | Accountant | Executive |
|------------|:-----:|:----------:|:---------:|
| `dashboard:view` | ✅ | ✅ | ✅ |
| `orders:view` | ✅ | ✅ | ✅ |
| `orders:create` | ✅ | ❌ | ✅ |
| `orders:update` | ✅ | ✅ | ✅ |
| `orders:delete` | ✅ | ❌ | ❌ |
| `orders:import` | ✅ | ❌ | ✅ |
| `bookings:view` | ✅ | ✅ | ✅ |
| `bookings:create` | ✅ | ❌ | ✅ |
| `bookings:update` | ✅ | ✅ | ✅ |
| `bookings:delete` | ✅ | ❌ | ❌ |
| `customers:view` | ✅ | ✅ | ✅ |
| `customers:create` | ✅ | ✅ | ✅ |
| `customers:update` | ✅ | ✅ | ✅ |
| `customers:delete` | ✅ | ❌ | ❌ |
| `suppliers:view` | ✅ | ✅ | ✅ |
| `suppliers:create` | ✅ | ✅ | ✅ |
| `suppliers:update` | ✅ | ✅ | ✅ |
| `suppliers:delete` | ✅ | ❌ | ❌ |
| `accounts:view` | ✅ | ✅ | ❌ |
| `accounts:manage` | ✅ | ✅ | ❌ |
| `payments:customer` | ✅ | ✅ | ❌ |
| `payments:supplier` | ✅ | ✅ | ❌ |
| `transfers:create` | ✅ | ✅ | ❌ |
| `expenses:view` | ✅ | ✅ | ❌ |
| `expenses:create` | ✅ | ✅ | ❌ |
| `expenses:update` | ✅ | ✅ | ❌ |
| `expenses:delete` | ✅ | ❌ | ❌ |
| `expenses:recurring` | ✅ | ✅ | ❌ |
| `reminders:view` | ✅ | ✅ | ✅ |
| `reminders:manage` | ✅ | ✅ | ✅ |
| `reports:view` | ✅ | ✅ | ❌ |
| `reports:export` | ✅ | ✅ | ❌ |
| `cms:view` | ✅ | ✅ | ✅ |
| `cms:manage` | ✅ | ❌ | ❌ |
| `users:view` | ✅ | ❌ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ |
| `audit:view` | ✅ | ✅ | ❌ |
| `backup:manage` | ✅ | ❌ | ❌ |
| `settings:manage` | ✅ | ❌ | ❌ |

> Admin has wildcard `*` — all permissions granted.

---

## Admin Sidebar Visibility by Role

| Menu Item | Admin | Accountant | Executive |
|-----------|:-----:|:----------:|:---------:|
| Dashboard | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Suppliers | ✅ | ✅ | ✅ |
| Accounts | ✅ | ✅ | ❌ |
| Customer Payments | ✅ | ✅ | ❌ |
| Supplier Payments | ✅ | ✅ | ❌ |
| Transfers | ✅ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ |
| Reminders | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| CMS | ✅ | 👁 view | 👁 view |
| Users | ✅ | ❌ | ❌ |
| Backups | ✅ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ |
| Settings | ✅ | ❌ | ❌ |

---

## Implementation Notes (Phase 2)

```javascript
// middlewares/authorize.js
import { hasPermission } from '../config/permissions.js';

export function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const allowed = requiredPermissions.some((p) =>
      hasPermission(req.user.role, p)
    );
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
```

JWT payload includes: `{ userId, role, email }` — permissions resolved server-side from role, not embedded in token (allows permission updates without re-login).

---

## Business Rules by Role

| Action | Who Can Do It |
|--------|---------------|
| Delete financial records | Admin only |
| Adjust opening balance | Admin, Accountant |
| Record customer/supplier payment | Admin, Accountant |
| Create manual order | Admin, Executive |
| Import website booking | Admin, Executive |
| Upload ticket copy | Admin, Accountant, Executive |
| Edit CMS / logo | Admin only |
| Trigger database backup | Admin only |
| View profit reports | Admin, Accountant |
