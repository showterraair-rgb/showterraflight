# VPS deploy — Show Terra Flight

**App folder on VPS:** `/var/www/showterraflight`  
**Do not modify other projects** under `/var/www/`.

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
