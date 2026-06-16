# BRL Currency Support

BDT is the **base currency**. BRL is supported with an admin-configurable exchange rate (default: **1 BRL = 22.50 BDT**).

## New files

**Backend**
- `backend/src/config/currencies.js`
- `backend/src/utils/currencyUtils.js`
- `backend/src/services/currency.service.js`
- `backend/src/controllers/currency.controller.js`
- `backend/src/routes/settings.routes.js`
- `backend/src/validators/currency.validator.js`

**Frontend**
- `frontend-agent/src/hooks/useCurrency.js`
- `frontend-agent/src/components/CurrencySelector.jsx`
- `frontend-agent/src/components/DualCurrencyAmount.jsx`
- `frontend-admin/src/hooks/useCurrency.js`
- `frontend-admin/src/components/common/CurrencySelector.jsx`
- `frontend-admin/src/components/common/DualCurrencyAmount.jsx`
- `frontend-admin/src/services/currency.api.js`
- `frontend-admin/src/pages/CurrencySettingsPage.jsx`
- `frontend-public/src/hooks/useCurrency.js`

## Modified files

- `backend/src/models/Setting.js` — `currencies`, `currenciesUpdatedAt`
- `backend/src/models/AgentBooking.js` — dual-currency price fields + snapshot rate
- `backend/src/models/Booking.js` — BDT + original currency fields
- `backend/src/models/Order.js` — `preferredCurrency`
- `backend/src/services/agentBooking.service.js` — conversion on create, BDT totals in reports
- `backend/src/services/agentReport.service.js` — revenue sums use `totalFareBDT`
- `backend/src/services/public.service.js` — store preferred currency on website orders
- `backend/src/services/pdf.service.js` — BRL symbol
- `backend/src/validators/agent.validator.js` — BDT/BRL
- `backend/src/validators/public.validator.js` — preferredCurrency
- `backend/src/routes/index.js`, `public.routes.js`
- `backend/src/seeds/index.js`
- Agent/admin/public pages: New Booking, Dashboard, Reports, public Booking form, admin nav/routes

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/public/currencies` | Public |
| GET | `/api/v1/admin/settings/currencies` | Admin |
| PATCH | `/api/v1/admin/settings/currencies` | Admin |

PATCH body:
```json
{ "BRL": { "rateToBase": 22.50 } }
```

## Update BRL rate (admin)

1. Log in at **admin.showterraflight.com**
2. Sidebar → **Currency Settings**
3. Set **1 BRL = ৳ [rate]**
4. Click **Save Rate** (confirm dialog explains existing bookings keep their snapshot rate)

## Rate snapshots on bookings

When an agent creates a booking in BRL, the system stores:

- `originalCurrency`, `originalTotalFare`, etc. (amounts entered)
- `totalFareBDT`, `baseFareBDT`, … (converted to BDT)
- `exchangeRateAtBooking` (rate at submission time)

Invoices and booking detail views use **booking-time rate**, not the current admin rate. Dashboard/report display conversion uses the **current** rate for BDT balances.

## Environment variables

No new env vars required. Optional: none added.

## Deploy

```bash
cd /var/www/showterraflight
git pull origin main
bash deploy/scripts/deploy.sh
pm2 reload sta-api --update-env
```

Existing bookings without currency fields are normalized at read time (treated as BDT, rate = 1).
