#!/bin/bash
# Deploy manual en el VPS. Uso (dentro de /var/www/treegold):
#   ./deploy.sh
# Trae los últimos cambios de GitHub, reinstala dependencias si cambiaron,
# regenera Prisma, compila y reinicia la app en PM2. No toca Nginx ni el .env.
set -e

echo "==> git pull"
git pull

# `npm ci` y no `npm install`: instala EXACTAMENTE las versiones de
# package-lock.json sin reescribirlo. Con `npm install` el servidor modificaba
# ese archivo por su cuenta y el siguiente `git pull` abortaba por conflicto
# ("Your local changes would be overwritten by merge"). Además garantiza que
# en producción quedan las mismas versiones que se probaron antes de subir.
echo "==> npm ci"
npm ci

echo "==> prisma generate"
npx prisma generate

echo "==> npm run build"
npm run build

echo "==> pm2 restart treegold"
pm2 restart treegold

echo "==> listo. Verifica con: pm2 status"
