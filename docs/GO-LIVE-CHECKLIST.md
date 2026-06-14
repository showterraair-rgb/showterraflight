# Go-Live Checklist — Show Terra Air

Complete before announcing production to staff/customers.

---

## DNS & SSL

- [ ] A records for `@`, `www`, `admin`, `api` point to VPS IP
- [ ] `dig showterraair.com` returns correct IP
- [ ] HTTPS works on all three subdomains (padlock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] `sudo certbot renew --dry-run` succeeds
- [ ] SSL Labs test grade acceptable (optional)

---

## Security

- [ ] Default admin password **changed** (`admin@showterraair.com` / was `Admin@123456`)
- [ ] Strong unique `JWT_SECRET` in `backend/.env`
- [ ] `COOKIE_SECURE=true` in production `.env`
- [ ] MongoDB bound to `127.0.0.1` only
- [ ] MongoDB authentication enabled (recommended)
- [ ] UFW active — only 22, 80, 443 open
- [ ] SSH key login enabled; root login disabled
- [ ] fail2ban running for SSH
- [ ] No secrets committed to git

---

## Application

- [ ] `curl https://api.showterraair.com/api/v1/health` returns `"success":true,"phase":6`
- [ ] Public homepage loads CMS content
- [ ] Test booking inquiry from public site appears in admin Orders
- [ ] Admin login/logout works (httpOnly cookie)
- [ ] Dashboard metrics load without errors

---

## Roles & access

- [ ] Admin account verified — full access including CMS, Backup, Security
- [ ] Create test Accountant user — finance + reports, no CMS edit
- [ ] Create test Executive user — orders/bookings, no finance posting
- [ ] Confirm sidebar hides unauthorized modules per role

---

## Backups

- [ ] Manual backup triggered (Admin → Backup or `backup-mongodb.sh`)
- [ ] Backup file exists in `backend/uploads/backups/`
- [ ] Backup log shows `success` status
- [ ] Restore procedure documented and tested on **staging** copy (optional but recommended)
- [ ] Offsite copy plan documented (manual download until Phase 6+ automation)

---

## Scheduled jobs (in Node process via PM2)

- [ ] PM2 process `sta-api` running: `pm2 status`
- [ ] PM2 saved and startup configured: `pm2 save`, `pm2 startup`
- [ ] Reminder cron registered — check logs: `pm2 logs sta-api | grep "Reminder cron"`
- [ ] Backup cron registered — check logs: `pm2 logs sta-api | grep "Backup cron"`
- [ ] After 09:00 Asia/Dhaka next day, verify reminders generated (Admin → Reminders)

---

## Operations

- [ ] Log paths known (`/var/log/show-terra-air/`, `/var/log/nginx/`)
- [ ] Logrotate config installed
- [ ] Redeploy procedure tested: `bash deploy/scripts/deploy.sh`
- [ ] Rollback procedure understood: `bash deploy/scripts/rollback.sh <sha>`
- [ ] Company contact info updated in CMS (phone, WhatsApp, address)
- [ ] Director/staff notified of admin URL: `https://admin.showterraair.com`

---

## Post-launch (first week)

- [ ] Monitor `pm2 logs sta-api` for errors
- [ ] Review Security → login logs for failed attempts
- [ ] Confirm nightly backup runs (check Backup history)
- [ ] Verify customer WhatsApp CTA shows correct number on public site

---

**Sign-off**

| Role | Name | Date |
|------|------|------|
| Technical | | |
| Business owner | | |
