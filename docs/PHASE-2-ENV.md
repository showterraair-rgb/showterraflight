# Show Terra Air — Phase 2 Environment Variables

## Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` or `production` | development |
| `PORT` | API server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | **required** |
| `JWT_SECRET` | Secret for signing JWT tokens | **required** |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `8h`, `1d`) | 8h |
| `JWT_COOKIE_NAME` | httpOnly cookie name | sta_token |
| `COOKIE_SECURE` | Set `true` in production (HTTPS only) | false |
| `COOKIE_SAME_SITE` | Cookie SameSite policy (`lax`, `strict`, `none`) | lax |
| `CLIENT_PUBLIC_URL` | Public website origin for CORS | http://localhost:5173 |
| `CLIENT_ADMIN_URL` | Admin panel origin for CORS | http://localhost:5174 |
| `INACTIVITY_TIMEOUT_MINUTES` | Auto-logout after inactivity | 30 |
| `SEED_ADMIN_EMAIL` | Admin email for seed script | admin@showterraair.com |
| `SEED_ADMIN_PASSWORD` | Admin password for seed script | Admin@123456 |

## Production cookie settings

When deploying behind HTTPS (Nginx + Let's Encrypt):

```
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
NODE_ENV=production
```

## Frontend

No `.env` required for local dev — Vite proxies `/api` to `http://localhost:5000`.

For production builds, set API URL via reverse proxy (Nginx routes `/api` to backend).
