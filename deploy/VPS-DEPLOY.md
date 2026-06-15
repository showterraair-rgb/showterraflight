# VPS deploy — Show Terra Flight

**App folder on VPS:** `/var/www/showterraflight`  
**Do not modify other projects** under `/var/www/`.

## DNS setup (fix “site not showing” / NXDOMAIN)

If **admin.showterraflight.com** shows `DNS_PROBE_FINISHED_NXDOMAIN`, or **showterraflight.com** works on some networks but not others, the domain DNS is incomplete or still propagating.

### 1) Get your VPS public IP (on the server)

```bash
curl -4 ifconfig.me
```

Example result: `123.45.67.89` — use this IP in DNS records below.

### 2) Add DNS records at your domain registrar

Log in where you bought **showterraflight.com** (Hostinger, Namecheap, Cloudflare, etc.) → **DNS / DNS Zone**.

Add these **A records** (all pointing to the same VPS IP):

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| A | `@` (or blank) | `YOUR_VPS_IP` | 300–3600 |
| A | `www` | `YOUR_VPS_IP` | 300–3600 |
| A | `admin` | `YOUR_VPS_IP` | 300–3600 |

**Important:** The `admin` record is required for the admin panel. Without it you get **NXDOMAIN** and login will never work.

Optional: if you use Cloudflare, set records to **DNS only** (grey cloud) until SSL on VPS is working, then you can enable proxy (orange cloud).

### 3) Wait for propagation (5 min – 48 hours)

Check from your PC:

```bash
nslookup showterraflight.com
nslookup www.showterraflight.com
nslookup admin.showterraflight.com
```

All three must return your **VPS IP**. If `admin` fails, the A record is missing at the registrar.

Online check: https://dnschecker.org — search `showterraflight.com` and `admin.showterraflight.com`.

### 4) SSL certificate must include admin subdomain (on VPS)

After DNS resolves globally:

```bash
sudo certbot certonly --nginx \
  -d showterraflight.com \
  -d www.showterraflight.com \
  -d admin.showterraflight.com
```

Then reload nginx (update SSL path if certbot used `-0001` suffix):

```bash
cd /var/www/showterraflight
sudo cp deploy/nginx/showterraflight.com.conf /etc/nginx/sites-available/showterraflight.com
sudo ln -sf /etc/nginx/sites-available/showterraflight.com /etc/nginx/sites-enabled/
# If cert path differs, check: sudo certbot certificates
sudo nginx -t && sudo systemctl reload nginx
```

### 5) Why some IPs / networks see the site and others don’t

| Cause | Fix |
|-------|-----|
| DNS not propagated yet | Wait; lower TTL; flush local DNS (`ipconfig /flushdns` on Windows) |
| Missing `admin` A record | Add `admin` → VPS IP at registrar |
| Only `www` works, root `@` missing | Add `@` A record |
| Old wrong IP cached | Update A records to current VPS IP |
| Cloudflare proxy misconfigured | Use DNS-only or correct SSL mode |

---

## Update after Git push

```bash
cd /var/www/showterraflight
git pull --ff-only origin main
bash deploy/scripts/deploy.sh
```

If pull fails due to local edits:

```bash
cd /var/www/showterraflight
git stash push -u -m "vps backup $(date +%F)"
git pull --ff-only origin main
bash deploy/scripts/deploy.sh
```

## Load real photos (first time or reset)

After deploy, copy starter photos to VPS storage and populate CMS:

```bash
cd /var/www/showterraflight/backend
npm run seed:home
pm2 reload sta-api
```

Or in **Admin → CMS → Homepage**, click **Restore default photos & content**.

Photos are stored at `backend/uploads/cms/home/` and served at `https://showterraflight.com/uploads/cms/home/...`

To replace any image: CMS tab → upload new JPG/PNG → Save homepage.


Images live at `frontend-public/dist/images/home/*.svg` after build.

### 1) Confirm build output on VPS

```bash
ls -la /var/www/showterraflight/frontend-public/dist/images/home/
bash deploy/scripts/verify-static-assets.sh
```

### 2) Confirm Nginx serves the correct folder

```bash
grep -n "root " /etc/nginx/sites-enabled/*showterra* 2>/dev/null || grep -n "showterraair" /etc/nginx/sites-enabled/*
```

Public site root **must** be:

```
/var/www/showterraflight/frontend-public/dist
```

Admin site root **must** be:

```
/var/www/showterraflight/frontend-admin/dist
```

If paths still say `/var/www/show-terra-air/`, update **only** the Show Terra nginx file (`showterraflight.com`).

**Do NOT enable `show-terra-air.conf`** — it uses `showterraair.com` SSL certs that do not exist on this VPS.

If you enabled it by mistake:

```bash
sudo rm -f /etc/nginx/sites-enabled/show-terra-air.conf
sudo nginx -t && sudo systemctl reload nginx
```

To refresh the correct config:

```bash
cd /var/www/showterraflight
sudo cp deploy/nginx/showterraflight.com.conf /etc/nginx/sites-available/showterraflight.com
sudo ln -sf /etc/nginx/sites-available/showterraflight.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Adjust SSL certificate paths in the file if needed (`sudo certbot certificates`).

### 3) Test image URL locally on VPS

```bash
curl -I http://127.0.0.1/images/home/hero.svg
# If using domain via nginx:
curl -I https://showterraair.com/images/home/hero.svg
```

Expect `HTTP/2 200` (not 404).

## Verify deploy

```bash
git log -1 --oneline
pm2 status sta-api
bash deploy/scripts/health-check.sh
```

## Login shows 502 / "Login failed"

A **502** on `/api/v1/auth/login` means the **backend API is down** (not wrong password).

Run on VPS:

```bash
cd /var/www/showterraflight
git pull --ff-only origin main
bash deploy/scripts/repair-api.sh
```

Or step by step:

```bash
cd /var/www/showterraflight
pm2 status sta-api
pm2 logs sta-api --lines 50
sudo systemctl status mongod
curl -s http://127.0.0.1:5000/api/v1/health
cd backend && npm run create-admin-user
```

**Main admin:** `admin@showterraair.com` / `Admin@123456`  
**Demo (read-only):** `demo@showterraair.com` / `Demo@123456`

Ensure `backend/.env` has:

```
CLIENT_ADMIN_URL=https://admin.showterraflight.com
CLIENT_PUBLIC_URL=https://showterraflight.com
COOKIE_SECURE=true
```
