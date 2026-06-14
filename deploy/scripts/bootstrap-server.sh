#!/usr/bin/env bash
# Show Terra Air — First-time VPS bootstrap (Ubuntu 22.04/24.04 on Hostinger)
# Run as root on a fresh VPS:
#   curl -fsSL ... | bash   OR   sudo bash deploy/scripts/bootstrap-server.sh
#
# Creates deploy user, installs Node 20, MongoDB, Nginx, PM2, UFW baseline.

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-sta}"
APP_ROOT="${APP_ROOT:-/var/www/show-terra-air}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "==> Show Terra Air server bootstrap"
echo "    Deploy user: $DEPLOY_USER"
echo "    App root:    $APP_ROOT"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx \
  build-essential gnupg ca-certificates unzip logrotate mongodb-database-tools

# Deploy user
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo "Created user $DEPLOY_USER — set password: passwd $DEPLOY_USER"
fi
usermod -aG sudo "$DEPLOY_USER" 2>/dev/null || true

# Node.js via NodeSource
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y nodejs
npm install -g pm2

# MongoDB 7.x (official repo)
if ! command -v mongod &>/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update
  apt-get install -y mongodb-org
  systemctl enable mongod
  systemctl start mongod
fi

# App directories
mkdir -p "$APP_ROOT" /var/log/show-terra-air /var/www/certbot
mkdir -p "$APP_ROOT/backend/uploads/backups"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT" /var/log/show-terra-air

# UFW baseline
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true
ufw status

# Logrotate
if [[ -f "$APP_ROOT/deploy/logrotate/show-terra-air" ]]; then
  cp "$APP_ROOT/deploy/logrotate/show-terra-air" /etc/logrotate.d/show-terra-air
fi

# PM2 startup for deploy user (run after first pm2 start as $DEPLOY_USER)
echo ""
echo "==> Bootstrap complete."
echo "Next steps:"
echo "  1. Clone repo to $APP_ROOT as $DEPLOY_USER"
echo "  2. Copy deploy/env/backend.production.env.example → backend/.env and edit"
echo "  3. Run deploy/scripts/deploy.sh"
echo "  4. Configure Nginx + Certbot (see docs/DEPLOYMENT.md)"
echo "  5. As $DEPLOY_USER: pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER"
