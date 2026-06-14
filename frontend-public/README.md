# Frontend Public — Show Terra Air

Public marketing website with CMS-driven content and booking request form.

## Pages (Phase 2)

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About Us |
| `/services` | Services |
| `/booking` | Booking Request Form |
| `/contact` | Contact |
| `/faq` | FAQ & Notices |

## Structure

```
src/
├── components/     # Header, Footer, WhatsAppButton, Hero, ServiceCard
├── pages/          # Route pages
├── layouts/        # PublicLayout with SEO (react-helmet-async)
├── context/        # CmsContext — company settings & page content
├── hooks/          # useCms, useCompanySettings
├── services/       # api.js — axios client for /api/v1/public/*
└── utils/          # constants, formatPhone
```

## Dev Server

```bash
npm install
npm run dev    # http://localhost:5173
```

API proxy configured in `vite.config.js` → `http://localhost:5000`
