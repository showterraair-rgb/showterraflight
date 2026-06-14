# Phase 4 API Routes — Accounting & Finance

All routes require JWT authentication.

## Accounts `/api/v1/accounts`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | accounts:view | List all accounts with balances |
| GET | `/summary` | accounts:view | Accounts + total balance |
| GET | `/transfers` | accounts:view | List transfers (paginated) |
| POST | `/transfers` | transfers:create | Transfer between accounts |
| GET | `/:id` | accounts:view | Account detail |
| GET | `/:id/statement` | accounts:view | Ledger statement (date range, pagination) |
| PUT | `/:id/opening-balance` | accounts:manage | Set opening balance + adjustment entry |

## Customer Payments `/api/v1/payments/customers`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | payments:customer |
| POST | `/` | payments:customer |
| GET | `/:id` | payments:customer |

Query: `page`, `limit`, `customerId`, `bookingId`, `dateFrom`, `dateTo`, `search`

## Supplier Payments `/api/v1/payments/suppliers`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | payments:supplier |
| POST | `/` | payments:supplier |
| GET | `/:id` | payments:supplier |

## Expenses `/api/v1/expenses`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/categories` | expenses:view |
| GET | `/` | expenses:view |
| POST | `/` | expenses:create |
| GET | `/:id` | expenses:view |

**Note:** Posted financial records cannot be deleted or amount-edited (reversal-ready via `isVoided` field for Phase 5+).
