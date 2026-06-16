# B2B Agent Portal — Implementation & Deployment

## Overview

The agent portal is a separate Vite React app at `frontend-agent/`, served at **https://agent.showterraflight.com**. It uses its own JWT cookie (`sta_agent_token`) and API namespace `/api/v1/agent/*`. B2B agents are **not** the same as suppliers in the admin panel.

---

## New files created

### Backend
- `backend/src/models/Agent.js`
- `backend/src/models/AgentBooking.js`
- `backend/src/models/AgentTransaction.js`
- `backend/src/models/AgentNotification.js`
- `backend/src/config/agentConstants.js`
- `backend/src/middlewares/authAgent.js`
- `backend/src/middlewares/parseAgentBookingBody.js`
- `backend/src/validators/agent.validator.js`
- `backend/src/services/agentAuth.service.js`
- `backend/src/services/agentBooking.service.js`
- `backend/src/services/adminAgent.service.js`
- `backend/src/services/agentReport.service.js`
- `backend/src/services/agentNotification.service.js`
- `backend/src/controllers/agent.controller.js`
- `backend/src/controllers/adminAgent.controller.js`
- `backend/src/routes/agent/auth.routes.js`
- `backend/src/routes/agent/index.js`
- `backend/src/routes/adminAgent.routes.js`
- `backend/scripts/createAgentUser.js`

### Frontend — Agent portal (`frontend-agent/`)
- Full Vite app: auth, dashboard, bookings, reports, statement, profile, notifications

### Frontend — Admin extensions
- `frontend-admin/src/services/agents.api.js`
- `frontend-admin/src/pages/AgentsPage.jsx`
- `frontend-admin/src/pages/AgentDetailPage.jsx`
- `frontend-admin/src/pages/AgentBookingsPage.jsx`
- `frontend-admin/src/pages/AgentBookingDetailPage.jsx`
- `frontend-admin/src/pages/AgentAccountingPage.jsx`

### Deploy / docs
- `deploy/env/frontend-agent.production.env.example`
- `docs/AGENT-PORTAL.md` (this file)

---

## Modified files

- `backend/src/models/index.js`
- `backend/src/config/env.js`
- `backend/src/config/permissions.js`
- `backend/src/app.js` (CORS for agent URL)
- `backend/src/routes/index.js`
- `backend/src/services/numberGenerator.service.js`
- `backend/src/middlewares/upload.js`
- `frontend-admin/src/routes/AppRoutes.jsx`
- `frontend-admin/src/utils/permissions.js`
- `frontend-admin/src/pages/SuppliersPage.jsx`
- `deploy/scripts/build-release.sh`
- `deploy/nginx/showterraflight.com.conf`
- `deploy/env/backend.production.env.example`

---

## Nginx — agent subdomain

Add the `agent.showterraflight.com` server block from `deploy/nginx/showterraflight.com.conf`, then:

```bash
sudo cp deploy/nginx/showterraflight.com.conf /etc/nginx/sites-available/showterraflight.com
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d agent.showterraflight.com
```

Pre-SSL HTTP-only block (if cert not yet issued):

```nginx
server {
    listen 80;
    server_name agent.showterraflight.com;
    client_max_body_size 50M;
    root /var/www/showterraflight/frontend-agent/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## First deploy on VPS

```bash
cd /var/www/showterraflight
git pull origin main

# Backend env — add agent URL + cookie name
nano backend/.env
# CLIENT_AGENT_URL=https://agent.showterraflight.com
# JWT_AGENT_COOKIE_NAME=sta_agent_token

bash deploy/scripts/deploy.sh
# build-release.sh now builds frontend-agent automatically

# Update nginx (see above), then certbot for agent subdomain
sudo certbot --nginx -d agent.showterraflight.com

pm2 reload sta-api --update-env
```

Optional demo agent seed:

```bash
cd backend && node scripts/createAgentUser.js
```

---

## How admin creates agent accounts

1. Log in at **https://admin.showterraflight.com** (admin role).
2. Sidebar → **B2B Agents** → **Agents**.
3. Click **Add Agent** and fill:
   - Company Name, Contact Person, Email, Phone (required)
   - Address, City, Country, Agent Type, Credit Limit, Initial Balance
   - Password (set manually — agents cannot self-register)
   - Internal notes, Active toggle
4. Save — system assigns **Agent ID** (e.g. `STA-0001`).
5. Share login URL **https://agent.showterraflight.com/login** and credentials with the agent.
6. Agent submits bookings via **New Booking**; admin processes under **Agent Bookings**.

---

## Environment variables added

| Variable | Where | Purpose |
|----------|-------|---------|
| `CLIENT_AGENT_URL` | backend `.env` | CORS + password-reset links |
| `JWT_AGENT_COOKIE_NAME` | backend `.env` | Agent JWT cookie name (default `sta_agent_token`) |
| `VITE_API_BASE_URL` | frontend-agent `.env.production` | API base (use `/api/v1` behind nginx) |
| `SEED_AGENT_EMAIL` | optional, seed script | Demo agent email |
| `SEED_AGENT_PASSWORD` | optional, seed script | Demo agent password |

---

## API summary

**Agent (JWT `sta_agent_token`):** `/api/v1/agent/auth/*`, `/api/v1/agent/bookings`, reports, statement, profile, notifications

**Admin:** `/api/v1/admin/agents`, `/api/v1/admin/agent-bookings`, `/api/v1/admin/agent-accounting/:agentId`

Admin and agent auth are fully separate — agents cannot call admin routes and vice versa.
