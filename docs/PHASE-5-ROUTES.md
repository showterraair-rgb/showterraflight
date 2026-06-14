# Phase 5 — Routes & Operations

## Reminders (`/api/v1/reminders`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | reminders:view | List reminders (filters: status, type, priority, customerId, supplierId, from, to) |
| GET | `/:id` | reminders:view | Reminder detail |
| POST | `/` | reminders:manage | Create manual task reminder |
| PATCH | `/:id/status` | reminders:manage | Update status (pending, sent, failed, completed, dismissed) |
| POST | `/jobs/generate` | reminders:manage | Run all reminder generators manually |
| POST | `/jobs/send` | reminders:manage | Send pending reminders via notification service |

## Reports (`/api/v1/reports`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | reports:view | List available report keys |
| GET | `/:reportKey` | reports:view | Run report (JSON, export-ready shape) |
| GET | `/:reportKey/export/csv` | reports:export | Download CSV |

Report keys: `booking-profit`, `customer-due`, `supplier-payable`, `expense-category`, `account-statement`, `income-vs-expense`, `account-balance`, `monthly-summary`

## CMS (`/api/v1/cms`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/pages` | cms:view | List CMS pages |
| GET | `/pages/:pageKey` | cms:view | Get page (home, about, services, contact, faq, booking) |
| PUT | `/pages/:pageKey` | cms:manage | Update page content, sections, SEO |
| GET | `/notices` | cms:view | List notices/offers/FAQ items |
| POST | `/notices` | cms:manage | Create notice |
| PUT | `/notices/:id` | cms:manage | Update notice |
| DELETE | `/notices/:id` | cms:manage | Delete notice |
| GET | `/settings` | cms:view | Company contact & logo settings |
| PUT | `/settings` | cms:manage | Update company/contact info |
| PUT | `/logo` | cms:manage | Update logo path placeholder |

## Backup (`/api/v1/backups`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | backup:manage | Backup history |
| GET | `/strategy` | backup:manage | Schedule & restore metadata |
| GET | `/:id` | backup:manage | Backup log detail |
| POST | `/trigger` | backup:manage | Manual backup |

## Audit (`/api/v1/audit`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/login-logs` | audit:view | Login activity (alias via security) |
| GET | `/logs` | audit:view | Audit trail |
| GET | `/overview` | audit:view | Security overview stats |

## Security (`/api/v1/security`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/login-logs` | audit:view | Failed/successful login logs |
| GET | `/overview` | audit:view | 24h login stats + recent audit |
| GET | `/settings` | settings:manage | Password/session security policy |
| PUT | `/settings` | settings:manage | Update security policy |
| POST | `/mfa/prepare` | settings:manage | MFA-ready placeholder for admin |

## Cron schedules (Asia/Dhaka)

| Job | Schedule | Action |
|-----|----------|--------|
| Reminder generators | `0 9 * * *` daily | Customer due, travel (3d & 1d), supplier payable, recurring expense |
| Supplier payable emphasis | `0 9 * * 1` Monday | Regenerate supplier payable reminders |
| Send pending | `0 * * * *` hourly | Deliver pending reminders via notification abstraction |
| MongoDB backup | `0 2 * * *` daily (configurable via `BACKUP_CRON`) | Scheduled backup |

## Schema changes (Phase 5)

- **Reminder**: `sentAt`, `failedAt`, `failureReason`, `deliveryChannel`, `attemptCount`
- **REMINDER_STATUSES**: added `failed`
- **User**: `mfaEnabled`, `mfaSecret`, `mfaPending`
- **BackupLog**: `restoreNotes`, `offsitePath`, `checksum`
- **SecuritySetting** (new collection): password policy, session, MFA flags
