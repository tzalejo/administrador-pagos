#!/usr/bin/env bash
set -e

BASE="http://localhost:3000/api"
EMAIL="admin@pagos.local"
PASSWORD="admin1234"

echo "→ Login..."
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: no se pudo obtener token. Verificá que el backend esté corriendo."
  exit 1
fi

echo "✓ Token obtenido"

auth() { echo "-H \"Authorization: Bearer $TOKEN\""; }

post() {
  curl -s -X POST "$BASE$1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$2"
}

patch() {
  curl -s -X PATCH "$BASE$1" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$2"
}

# ── Crear períodos ──────────────────────────────────────────────────────────
echo "→ Creando período Marzo 2026..."
MARZO=$(post "/periods" '{"periodDate":"2026-03-01","label":"Marzo 2026"}')
MARZO_ID=$(echo "$MARZO" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "✓ Marzo 2026 (id=$MARZO_ID)"

echo "→ Clonando templates en Marzo..."
post "/periods/$MARZO_ID/clone-templates" '{}' > /dev/null
echo "✓ Templates clonados en Marzo"

echo "→ Creando período Abril 2026..."
ABRIL=$(post "/periods" '{"periodDate":"2026-04-01","label":"Abril 2026"}')
ABRIL_ID=$(echo "$ABRIL" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "✓ Abril 2026 (id=$ABRIL_ID)"

echo "→ Clonando templates en Abril..."
post "/periods/$ABRIL_ID/clone-templates" '{}' > /dev/null
echo "✓ Templates clonados en Abril"

# ── Cargar entradas de Marzo ────────────────────────────────────────────────
echo "→ Cargando datos de Marzo 2026..."

ENTRIES_MARZO=$(curl -s "$BASE/periods/$MARZO_ID" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*,"serviceName":"[^"]*"' )

update_entry() {
  local PERIOD_ID=$1
  local SERVICE=$2
  local DATA=$3

  ENTRY_ID=$(curl -s "$BASE/periods/$PERIOD_ID" \
    -H "Authorization: Bearer $TOKEN" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data.get('entries', []):
    if e['serviceName'].lower() == '$SERVICE'.lower():
        print(e['id'])
        break
" 2>/dev/null)

  if [ -n "$ENTRY_ID" ]; then
    patch "/entries/$ENTRY_ID" "$DATA" > /dev/null
    echo "  ✓ $SERVICE"
  else
    echo "  ✗ No encontrado: $SERVICE"
  fi
}

# Marzo 2026
update_entry "$MARZO_ID" "BPN masterC"     '{"amountArs":180000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "seguro"          '{"amountArs":95000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "naranja"         '{"amountArs":320000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "francés"         '{"amountArs":210000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "celu"            '{"amountArs":18500,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "celu-noelia"     '{"amountArs":18500,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "internet"        '{"amountArs":22000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "gas"             '{"amountArs":35000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "afip"            '{"amountArs":48000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "binance"         '{"amountUsd":50,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "mama"            '{"amountArs":80000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "MAI"             '{"amountArs":15000,"status":"paid","paymentMethod":"efectivo"}'
update_entry "$MARZO_ID" "ATE"             '{"amountArs":8000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$MARZO_ID" "Alquiler"        '{"amountArs":450000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "ingles (china)"  '{"amountArs":60000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "terapia Caball"  '{"amountArs":75000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "contadora"       '{"amountArs":55000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$MARZO_ID" "terapias"        '{"amountArs":90000,"status":"paid","paymentMethod":"transferencia"}'

# Abril 2026
echo "→ Cargando datos de Abril 2026..."
update_entry "$ABRIL_ID" "BPN masterC"     '{"amountArs":195000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "seguro"          '{"amountArs":95000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "naranja"         '{"amountArs":280000,"status":"pending","paymentMethod":"transferencia","dueDate":"2026-04-20"}'
update_entry "$ABRIL_ID" "francés"         '{"amountArs":230000,"status":"pending","paymentMethod":"transferencia","dueDate":"2026-04-25"}'
update_entry "$ABRIL_ID" "celu"            '{"amountArs":19500,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "celu-noelia"     '{"amountArs":19500,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "internet"        '{"amountArs":24000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "gas"             '{"amountArs":41000,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "afip"            '{"amountArs":52000,"status":"pending","paymentMethod":"transferencia","dueDate":"2026-04-30"}'
update_entry "$ABRIL_ID" "binance"         '{"amountUsd":50,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$ABRIL_ID" "mama"            '{"amountArs":80000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$ABRIL_ID" "MAI"             '{"amountArs":15000,"status":"pending","paymentMethod":"efectivo"}'
update_entry "$ABRIL_ID" "ATE"             '{"amountArs":8500,"status":"paid","paymentMethod":"debit_auto"}'
update_entry "$ABRIL_ID" "Alquiler"        '{"amountArs":480000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$ABRIL_ID" "ingles (china)"  '{"amountArs":65000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$ABRIL_ID" "terapia Caball"  '{"amountArs":75000,"status":"pending","paymentMethod":"transferencia","dueDate":"2026-04-28"}'
update_entry "$ABRIL_ID" "contadora"       '{"amountArs":55000,"status":"paid","paymentMethod":"transferencia"}'
update_entry "$ABRIL_ID" "terapias"        '{"amountArs":95000,"status":"paid","paymentMethod":"transferencia"}'

echo ""
echo "✓ Listo. Períodos creados:"
echo "  - Marzo 2026 (id=$MARZO_ID): todos pagados"
echo "  - Abril 2026 (id=$ABRIL_ID): algunos pendientes"
