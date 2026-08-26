#!/usr/bin/env bash
set -euo pipefail

# Usage: from repo root, after `az login`
#   ./infra/deploy.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RG="${RG:-rg-raya-pay}"
LOC="${LOC:-centralindia}"
SUFFIX="${SUFFIX:-da26}"
PG_USER="${PG_USER:-rayadmin}"
export PG_PASS_RAW="${PG_PASS:-RayaPay$(openssl rand -hex 6)Aa1}"
PG_PASS_ENC="$(python3 - <<'PY'
import os, urllib.parse
print(urllib.parse.quote_plus(os.environ["PG_PASS_RAW"]))
PY
)"
PG_NAME="raya-pg-${SUFFIX}"
API_APP="raya-api-${SUFFIX}"
WEB_APP="raya-web-${SUFFIX}"
PLAN="raya-plan-${SUFFIX}"
DB_NAME="raya"

echo "Resource group $RG ($LOC)"
az group create -n "$RG" -l "$LOC" -o none

echo "PostgreSQL Flexible Server $PG_NAME (this can take several minutes)"
az postgres flexible-server create \
  --resource-group "$RG" \
  --name "$PG_NAME" \
  --location "$LOC" \
  --admin-user "$PG_USER" \
  --admin-password "$PG_PASS_RAW" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0 \
  --yes \
  -o none

az postgres flexible-server db create -g "$RG" --server-name "$PG_NAME" --name "$DB_NAME" -o none || true
az postgres flexible-server firewall-rule create -g "$RG" --server-name "$PG_NAME" \
  --name AllowAzure --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 -o none || true
MYIP="$(curl -4 -s https://api.ipify.org || true)"
if [[ -n "$MYIP" ]]; then
  az postgres flexible-server firewall-rule create -g "$RG" --server-name "$PG_NAME" \
    --name AllowMe --start-ip-address "$MYIP" --end-ip-address "$MYIP" -o none || true
fi

PGHOST="$(az postgres flexible-server show -g "$RG" -n "$PG_NAME" --query fullyQualifiedDomainName -o tsv)"
DATABASE_URL="postgresql+psycopg://${PG_USER}:${PG_PASS_ENC}@${PGHOST}:5432/${DB_NAME}?sslmode=require"

echo "App Service plan"
az appservice plan create -g "$RG" -n "$PLAN" --sku B1 --is-linux -o none

echo "API web app"
az webapp create -g "$RG" -p "$PLAN" -n "$API_APP" --runtime "PYTHON:3.12" -o none
API_URL="https://${API_APP}.azurewebsites.net"
WEB_URL="https://${WEB_APP}.azurewebsites.net"

az webapp config appsettings set -g "$RG" -n "$API_APP" --settings \
  DATABASE_URL="$DATABASE_URL" \
  CORS_ORIGINS="${WEB_URL},http://localhost:3000" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  WEBSITES_PORT=8000 \
  -o none

az webapp config set -g "$RG" -n "$API_APP" \
  --startup-file "gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000" -o none

echo "Deploy API zip"
TMP="$(mktemp -d)"
(cd "$ROOT/backend" && zip -qr "$TMP/api.zip" app scripts data requirements.txt)
az webapp deploy -g "$RG" -n "$API_APP" --src-path "$TMP/api.zip" --type zip -o none

echo "Seed Azure database"
DATABASE_URL="$DATABASE_URL" "$ROOT/backend/.venv/bin/python" "$ROOT/backend/scripts/seed.py"

echo "Frontend web app"
az webapp create -g "$RG" -p "$PLAN" -n "$WEB_APP" --runtime "NODE:22-lts" -o none
az webapp config appsettings set -g "$RG" -n "$WEB_APP" --settings \
  NEXT_PUBLIC_API_URL="$API_URL" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  WEBSITES_PORT=8080 \
  -o none
az webapp config set -g "$RG" -n "$WEB_APP" --startup-file "npx next start -p 8080" -o none

echo "Deploy frontend source (Oryx will npm install && npm run build)"
(
  cd "$ROOT/frontend"
  zip -qr "$TMP/web.zip" . -x "node_modules/*" ".next/*"
)
az webapp deploy -g "$RG" -n "$WEB_APP" --src-path "$TMP/web.zip" --type zip -o none

{
  echo "API  $API_URL"
  echo "WEB  $WEB_URL"
  echo "PG   $PGHOST"
} | tee "$ROOT/infra/last-urls.txt"
echo "Admin password was generated for this run; it is not written to disk."
