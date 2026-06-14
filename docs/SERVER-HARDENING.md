# Server Hardening — Show Terra Air VPS

Apply after [DEPLOYMENT.md](DEPLOYMENT.md) bootstrap. Target: Hostinger Ubuntu VPS.

---

## 1. Non-root deploy user

- Run application as `sta` (created by `bootstrap-server.sh`).
- Do **not** run PM2/Node as root.
- Limit sudo: `sta` needs sudo only for `nginx -t`, `systemctl reload nginx` — consider `/etc/sudoers.d/sta-nginx`:

```
sta ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl status nginx
```

---

## 2. UFW firewall

Already configured by bootstrap:

```bash
sudo ufw status verbose
# Expected: 22/tcp, 80/tcp, 443/tcp allowed; default deny incoming
```

Do **not** expose MongoDB port 27017 publicly.

Optional — restrict SSH to office IP:

```bash
sudo ufw delete allow OpenSSH
sudo ufw allow from YOUR_OFFICE_IP to any port 22 proto tcp
sudo ufw reload
```

---

## 3. MongoDB network restriction

Bind MongoDB to localhost only.

Edit `/etc/mongod.conf`:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

Restart: `sudo systemctl restart mongod`

### Enable authentication (recommended)

```bash
mongosh
use admin
db.createUser({
  user: "staAdmin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "root", db: "admin" } ]
})
```

Enable auth in `/etc/mongod.conf`:

```yaml
security:
  authorization: enabled
```

Update `backend/.env`:

```
MONGODB_URI=mongodb://staAdmin:STRONG_PASSWORD_HERE@127.0.0.1:27017/show_terra_air?authSource=admin
```

Restart MongoDB and PM2.

---

## 4. Fail2ban (SSH brute-force protection)

```bash
sudo apt install -y fail2ban
sudo cp /var/www/show-terra-air/deploy/fail2ban/jail.local.example /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
```

Optional: add custom filter for repeated 401s on admin login (advanced — monitor Nginx logs).

---

## 5. Backup directory permissions

```bash
sudo chown -R sta:sta /var/www/show-terra-air/backend/uploads
chmod 750 /var/www/show-terra-air/backend/uploads
chmod 750 /var/www/show-terra-air/backend/uploads/backups
```

Backups contain full DB dumps — restrict read access.

---

## 6. Log rotation

Install logrotate config (bootstrap copies if repo present):

```bash
sudo cp /var/www/show-terra-air/deploy/logrotate/show-terra-air /etc/logrotate.d/show-terra-air
sudo logrotate -d /etc/logrotate.d/show-terra-air
```

Rotates PM2 logs daily (14 days) and backup archives weekly (8 weeks).

---

## 7. SSH hardening

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no   # after SSH keys work
MaxAuthTries 3
```

Add your SSH public key to `/home/sta/.ssh/authorized_keys` before disabling passwords.

`sudo systemctl reload sshd`

---

## 8. System updates

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 9. Nginx / TLS

- Full config includes security headers and gzip — see `deploy/nginx/show-terra-air.conf`.
- Keep Certbot auto-renewal: `systemctl status certbot.timer`
- Use TLS 1.2+ only (Let's Encrypt `options-ssl-nginx.conf` handles this).

---

## 10. Application security reminders

- Rotate `JWT_SECRET` if compromised (invalidates all sessions).
- Change default admin password immediately after seed.
- Review Admin → Security → login logs weekly.
- Keep `NODE_ENV=production`.
- Do not commit `backend/.env` to git.

---

## 11. Monitoring (minimal)

```bash
pm2 monit
pm2 status
df -h
free -h
```

Consider external uptime check on `https://api.showterraair.com/api/v1/health`.
