#!/bin/bash
# Deploy manual en el VPS. Uso (dentro de /var/www/treegold):
#   ./deploy.sh
# Trae los últimos cambios de GitHub, reinstala dependencias si cambiaron,
# regenera Prisma, compila y reinicia la app en PM2. No toca Nginx ni el .env.
set -e

echo "==> git pull"
git pull

echo "==> npm install"
npm install

echo "==> prisma generate"
npx prisma generate

echo "==> npm run build"
npm run build

echo "==> pm2 restart treegold"
pm2 restart treegold

echo "==> listo. Verifica con: pm2 status"
