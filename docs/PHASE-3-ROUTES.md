# Phase 3 API Routes

All routes require authentication. RBAC permissions noted per route.

## Customers `/api/v1/customers`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | customers:view |
| POST | `/` | customers:create |
| GET | `/:id` | customers:view |
| PUT | `/:id` | customers:update |

Query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`, `isActive`

## Suppliers `/api/v1/suppliers`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | suppliers:view |
| POST | `/` | suppliers:create |
| GET | `/:id` | suppliers:view |
| PUT | `/:id` | suppliers:update |

Query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`, `isActive`, `type`

## Orders `/api/v1/orders`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | orders:view |
| POST | `/` | orders:create |
| GET | `/:id` | orders:view |
| PUT | `/:id` | orders:update |
| PATCH | `/:id/status` | orders:update |
| POST | `/:id/follow-up` | orders:update |
| POST | `/:id/link-customer` | orders:update |

Query params: `page`, `limit`, `search`, `status`, `source`, `dateFrom`, `dateTo`, `isFromWebsite`, `sortBy`, `sortOrder`

## Bookings `/api/v1/bookings`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | bookings:view |
| POST | `/` | bookings:create |
| POST | `/from-order/:orderId` | bookings:create |
| GET | `/:id` | bookings:view |
| PUT | `/:id` | bookings:update |
| PATCH | `/:id/status` | bookings:update |
| POST | `/:id/notes` | bookings:update |
| GET | `/:id/timeline` | bookings:view |

Query params: `page`, `limit`, `search`, `status`, `customerId`, `supplierId`, `orderId`, `dateFrom`, `dateTo`

Response includes computed: `profit`, `customerDue`, `supplierPayable`
